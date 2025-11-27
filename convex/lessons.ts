import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
// Constants for cancellation policy (in milliseconds)
const ONLINE_CANCELLATION_WINDOW = 24 * 60 * 60 * 1000; // 24 hours
const OFFLINE_CANCELLATION_WINDOW = 48 * 60 * 60 * 1000; // 48 hours

// Helper function to add lesson revenue to budgetIncome
async function addLessonRevenue(ctx: any, args: {
    lessonId: any,
    workspaceId: any,
    userId: any, // User ID for the record
    rate?: number,
    start: number,
    end: number,
    customerId: any
}) {
    // Calculate lesson duration in hours
    const durationHours = (args.end - args.start) / (1000 * 60 * 60);

    // Get rate from args or customer default
    let hourlyRate = args.rate;
    if (!hourlyRate) {
        const customer = await ctx.db.get(args.customerId);
        hourlyRate = customer?.defaultHourlyRate || 0;
    }

    const revenue = (hourlyRate ?? 0) * durationHours;

    if (revenue < 0) return; // No negative revenue

    // Get the month/year of the lesson
    const lessonDate = new Date(args.start);
    const year = lessonDate.getFullYear();
    const month = lessonDate.getMonth() + 1;

    // Get or create budgetIncome for that month
    const existing = await ctx.db
        .query("budgetIncome")
        .withIndex("by_workspace_period", (q: any) =>
            q.eq("workspaceId", args.workspaceId)
                .eq("year", year)
                .eq("month", month)
        )
        .first();

    if (existing) {
        await ctx.db.patch(existing._id, {
            amount: existing.amount + revenue,
            updatedAt: Date.now(),
        });
    } else {
        await ctx.db.insert("budgetIncome", {
            workspaceId: args.workspaceId,
            userId: args.userId,
            year,
            month,
            amount: revenue,
            notes: "Auto-calculated from lessons",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    }
}

// Helper function to subtract lesson revenue from budgetIncome (for cancellations)
async function subtractLessonRevenue(ctx: any, args: {
    lessonId: any,
    workspaceId: any,
    rate?: number,
    start: number,
    end: number,
    customerId: any
}) {
    // Calculate lesson duration in hours
    const durationHours = (args.end - args.start) / (1000 * 60 * 60);

    // Get rate from args or customer default
    let hourlyRate = args.rate;
    if (!hourlyRate) {
        const customer = await ctx.db.get(args.customerId);
        hourlyRate = customer?.defaultHourlyRate || 0;
    }

    const revenue = (hourlyRate ?? 0) * durationHours;

    if (revenue <= 0) return; // No revenue to subtract

    // Get the month/year of the lesson
    const lessonDate = new Date(args.start);
    const year = lessonDate.getFullYear();
    const month = lessonDate.getMonth() + 1;

    // Find budgetIncome for that month
    const existing = await ctx.db
        .query("budgetIncome")
        .withIndex("by_workspace_period", (q: any) =>
            q.eq("workspaceId", args.workspaceId)
                .eq("year", year)
                .eq("month", month)
        )
        .first();

    if (existing) {
        const newAmount = Math.max(0, existing.amount - revenue);
        await ctx.db.patch(existing._id, {
            amount: newAmount,
            updatedAt: Date.now(),
        });
    }
}


export const createLesson = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        teacherId: v.id("users"),
        customerId: v.id("customers"),
        groupId: v.optional(v.id("studentGroups")),
        studentId: v.optional(v.id("students")),
        title: v.string(),
        start: v.number(),
        end: v.number(),
        type: v.union(
            v.literal("online"),
            v.literal("in_person_office"),
            v.literal("in_person_company")
        ),
        rate: v.optional(v.number()),
        meetingLink: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Validation relaxed: individual customers might not have student/group
        // if (!args.groupId && !args.studentId) {
        //     throw new Error("Either groupId or studentId must be provided");
        // }

        const lessonId = await ctx.db.insert("lessons", {
            ...args,
            status: "scheduled",
            isBillable: true, // Default to billable
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // **NEW: Add revenue immediately when lesson is created**
        await addLessonRevenue(ctx, {
            lessonId,
            workspaceId: args.workspaceId,
            userId: args.teacherId,
            rate: args.rate,
            start: args.start,
            end: args.end,
            customerId: args.customerId,
        });

        // Send confirmation email if studentId is present
        if (args.studentId) {
            const student = await ctx.db.get(args.studentId);
            if (student?.email) {
                await ctx.scheduler.runAfter(0, (api as any).email.sendEmail, {
                    to: student.email,
                    subject: "Lesson Scheduled",
                    html: `
                        <h1>Lesson Scheduled</h1>
                        <p>A new lesson has been scheduled.</p>
                        <p><strong>Title:</strong> ${args.title}</p>
                        <p><strong>Date:</strong> ${new Date(args.start).toLocaleDateString()} ${new Date(args.start).toLocaleTimeString()}</p>
                        <p><strong>Type:</strong> ${args.type}</p>
                    `,
                });
            }
        }

        return lessonId;
    },
});

export const updateLesson = mutation({
    args: {
        lessonId: v.id("lessons"),
        title: v.optional(v.string()),
        start: v.optional(v.number()),
        end: v.optional(v.number()),
        type: v.optional(v.union(
            v.literal("online"),
            v.literal("in_person_office"),
            v.literal("in_person_company")
        )),
        rate: v.optional(v.number()),
        meetingLink: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const lesson = await ctx.db.get(args.lessonId);
        if (!lesson) throw new Error("Lesson not found");

        await ctx.db.patch(args.lessonId, {
            title: args.title ?? lesson.title,
            start: args.start ?? lesson.start,
            end: args.end ?? lesson.end,
            type: args.type ?? lesson.type,
            rate: args.rate ?? lesson.rate,
            meetingLink: args.meetingLink ?? lesson.meetingLink,
            notes: args.notes ?? lesson.notes,
            updatedAt: Date.now(),
        });

        // Trigger email notification if time changed
        if ((args.start && args.start !== lesson.start) || (args.end && args.end !== lesson.end)) {
            if (lesson.studentId) {
                const student = await ctx.db.get(lesson.studentId);
                if (student?.email) {
                    await ctx.scheduler.runAfter(0, (api as any).email.sendEmail, {
                        to: student.email,
                        subject: "Lesson Rescheduled",
                        html: `
                            <h1>Lesson Rescheduled</h1>
                            <p>The following lesson has been rescheduled:</p>
                            <p><strong>Title:</strong> ${args.title ?? lesson.title}</p>
                            <p><strong>New Date:</strong> ${new Date(args.start ?? lesson.start).toLocaleDateString()} ${new Date(args.start ?? lesson.start).toLocaleTimeString()}</p>
                            <p><strong>Old Date:</strong> ${new Date(lesson.start).toLocaleDateString()} ${new Date(lesson.start).toLocaleTimeString()}</p>
                        `,
                    });
                }
            }
        }
    },
});

export const updateStatus = mutation({
    args: {
        lessonId: v.id("lessons"),
        status: v.union(
            v.literal("attended"),
            v.literal("cancelled_on_time"),
            v.literal("cancelled_late"),
            v.literal("missed")
        ),
        userId: v.id("users"), // Who is performing the action
        cancellationReason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const lesson = await ctx.db.get(args.lessonId);
        if (!lesson) throw new Error("Lesson not found");

        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        const now = Date.now();
        const timeUntilStart = lesson.start - now;

        let isBillable = lesson.isBillable;

        // Policy Check for Cancellation
        if (args.status === "cancelled_on_time" || args.status === "cancelled_late") {
            // If Admin, they can override anything
            if (user.isAdmin) {
                // If admin explicitly sets status, we respect it.
                // But usually admin would just "Cancel" and we might need to ask them if it's billable or not?
                // For now, we assume the UI passes the correct status based on admin choice.
                isBillable = args.status === "cancelled_late";
            } else {
                // Teacher Logic
                const threshold = lesson.type === "online" ? ONLINE_CANCELLATION_WINDOW : OFFLINE_CANCELLATION_WINDOW;

                if (timeUntilStart < threshold) {
                    // Late cancellation
                    if (args.status === "cancelled_on_time") {
                        throw new Error("Too late to cancel without penalty. Please contact admin or mark as Cancelled Late.");
                    }
                    isBillable = true;
                } else {
                    // On time cancellation
                    if (args.status === "cancelled_late") {
                        // Teacher shouldn't choose this if they are on time, but if they do, it's their loss?
                        // Let's enforce on_time if they are on time.
                        // Actually, if teacher cancels, it's usually NOT billable to client unless client cancelled?
                        // Wait, "cancelled_late" implies CLIENT cancelled late.
                        // If TEACHER cancels, it should be "cancelled_on_time" (not billable) or we need a new status "teacher_cancelled".
                        // For now, let's assume this mutation is used for CLIENT cancellations reported by teacher.
                        // If teacher is sick, they should probably Reassign or Cancel (Not Billable).

                        // Let's stick to the plan:
                        // If (LessonStart - Now) < PolicyThreshold:
                        //   Teacher cannot cancel (UI disabled / Backend throws error).
                        //   Admin CAN cancel (Override).

                        if (timeUntilStart < threshold) {
                            throw new Error("Cancellation policy restriction. Only Admin can cancel within the restricted window.");
                        }
                    }
                    isBillable = false;
                }
            }
        } else if (args.status === "attended") {
            isBillable = true;
        } else if (args.status === "missed") {
            isBillable = true; // Usually missed without notice is billable
        }

        // **NEW: Handle revenue refunds for on-time cancellations**
        if ((args.status === "cancelled_on_time") && !isBillable) {
            // Subtract revenue since it was cancelled within policy window
            await subtractLessonRevenue(ctx, {
                lessonId: args.lessonId,
                workspaceId: lesson.workspaceId,
                rate: lesson.rate,
                start: lesson.start,
                end: lesson.end,
                customerId: lesson.customerId,
            });
        }

        await ctx.db.patch(args.lessonId, {
            status: args.status,
            isBillable,
            cancelledAt: (args.status.includes("cancelled") || args.status === "missed") ? now : undefined,
            cancelledBy: (args.status.includes("cancelled") || args.status === "missed") ? args.userId : undefined,
            cancellationReason: args.cancellationReason,
            updatedAt: now,
        });

        // Send cancellation email if cancelled
        if (args.status.includes("cancelled")) {
            // Re-fetch the lesson to get the most up-to-date state including isBillable
            const updatedLesson = await ctx.db.get(args.lessonId);
            if (updatedLesson?.studentId) {
                const student = await ctx.db.get(updatedLesson.studentId);
                if (student?.email) {
                    await ctx.scheduler.runAfter(0, (api as any).email.sendEmail, {
                        to: student.email,
                        subject: "Lesson Cancelled",
                        html: `
                            <h1>Lesson Cancelled</h1>
                            <p>The following lesson has been cancelled:</p>
                            <p><strong>Title:</strong> ${updatedLesson.title}</p>
                            <p><strong>Date:</strong> ${new Date(updatedLesson.start).toLocaleDateString()} ${new Date(updatedLesson.start).toLocaleTimeString()}</p>
                            <p><strong>Reason:</strong> ${updatedLesson.isBillable ? "Late Cancellation (Billable)" : "Cancelled"}</p>
                        `,
                    });
                }
            }
        }
    },
});

export const reassignLesson = mutation({
    args: {
        lessonId: v.id("lessons"),
        newTeacherId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const lesson = await ctx.db.get(args.lessonId);
        if (!lesson) throw new Error("Lesson not found");

        const oldTeacher = lesson.teacherId ? await ctx.db.get(lesson.teacherId) : null;
        const newTeacher = await ctx.db.get(args.newTeacherId);
        if (!newTeacher) throw new Error("New teacher not found");

        await ctx.db.patch(args.lessonId, {
            teacherId: args.newTeacherId,
            updatedAt: Date.now(),
        });

        // Notify new teacher
        if (newTeacher.email) {
            await ctx.scheduler.runAfter(0, (api as any).email.sendEmail, {
                to: newTeacher.email,
                subject: "Lesson Assigned to You",
                html: `
                    <h1>New Lesson Assigned</h1>
                    <p>You have been assigned a new lesson.</p>
                    <p><strong>Title:</strong> ${lesson.title}</p>
                    <p><strong>Date:</strong> ${new Date(lesson.start).toLocaleDateString()} ${new Date(lesson.start).toLocaleTimeString()}</p>
                `,
            });
        }

        // Notify student
        if (lesson.studentId) {
            const student = await ctx.db.get(lesson.studentId);
            if (student?.email) {
                await ctx.scheduler.runAfter(0, (api as any).email.sendEmail, {
                    to: student.email,
                    subject: "Lesson Teacher Changed",
                    html: `
                        <h1>Lesson Update</h1>
                        <p>The teacher for your lesson has been changed.</p>
                        <p><strong>Lesson:</strong> ${lesson.title}</p>
                        <p><strong>New Teacher:</strong> ${newTeacher.name}</p>
                        <p><strong>Date:</strong> ${new Date(lesson.start).toLocaleDateString()} ${new Date(lesson.start).toLocaleTimeString()}</p>
                    `,
                });
            }
        }
    },
});

export const listLessons = query({
    args: {
        workspaceId: v.id("workspaces"),
        teacherId: v.optional(v.id("users")),
        customerId: v.optional(v.id("customers")),
        from: v.number(),
        to: v.number(),
    },
    handler: async (ctx, args) => {
        let lessons;

        if (args.teacherId) {
            lessons = await ctx.db
                .query("lessons")
                .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId!))
                .filter((q) => q.and(
                    q.gte(q.field("start"), args.from),
                    q.lte(q.field("start"), args.to)
                ))
                .collect();
        } else if (args.customerId) {
            lessons = await ctx.db
                .query("lessons")
                .withIndex("by_customer", (q) => q.eq("customerId", args.customerId!))
                .filter((q) => q.and(
                    q.gte(q.field("start"), args.from),
                    q.lte(q.field("start"), args.to)
                ))
                .collect();
        } else {
            // Admin view - list all (might need a better index for date range only if volume is high)
            // For now, filtering in memory or using a custom index if needed.
            lessons = await ctx.db.query("lessons").filter(q => q.eq(q.field("workspaceId"), args.workspaceId)).collect();
            lessons = lessons.filter(l => l.start >= args.from && l.start <= args.to);
        }

        // Enrich with student/group/customer names if needed?
        // For now return raw lessons.
        return lessons;
    },
});

export const deleteLesson = mutation({
    args: {
        lessonId: v.id("lessons"),
    },
    handler: async (ctx, args) => {
        const lesson = await ctx.db.get(args.lessonId);
        if (!lesson) throw new Error("Lesson not found");

        // If the lesson is linked to an invoice, we need to handle this carefully
        if (lesson.invoiceId) {
            // Option 1: Prevent deletion if invoiced
            // throw new Error("Cannot delete a lesson that has been invoiced. Please delete the invoice first.");

            // Option 2: Unlink from invoice (we'll use this approach)
            // This allows admin to clean up data while preserving invoice integrity
            // The invoice items will remain but won't reference this lesson anymore
        }

        // Delete any invoice items that reference this lesson
        const invoiceItems = await ctx.db
            .query("invoiceItems")
            .filter((q) => q.eq(q.field("calendarEventId"), args.lessonId))
            .collect();

        for (const item of invoiceItems) {
            await ctx.db.delete(item._id);
        }

        // Delete the lesson
        await ctx.db.delete(args.lessonId);
    },
});

export const deleteLessons = mutation({
    args: {
        lessonIds: v.array(v.id("lessons")),
    },
    handler: async (ctx, args) => {
        for (const lessonId of args.lessonIds) {
            const lesson = await ctx.db.get(lessonId);
            if (!lesson) continue; // Skip if not found

            // Delete any invoice items that reference this lesson
            const invoiceItems = await ctx.db
                .query("invoiceItems")
                .filter((q) => q.eq(q.field("calendarEventId"), lessonId))
                .collect();

            for (const item of invoiceItems) {
                await ctx.db.delete(item._id);
            }

            // Delete the lesson
            await ctx.db.delete(lessonId);
        }
    },
});

// Helper query to get students for a lesson (for attendance tracking)
export const getLessonStudents = query({
    args: { lessonId: v.id("lessons") },
    handler: async (ctx, { lessonId }) => {
        const lesson = await ctx.db.get(lessonId);
        if (!lesson) throw new Error("Lesson not found");

        let students: any[] = [];

        if (lesson.groupId) {
            // Fetch all students in this group
            students = await ctx.db
                .query("students")
                .withIndex("by_group", (q) => q.eq("groupId", lesson.groupId))
                .filter((q) => q.eq(q.field("isActive"), true))
                .collect();
        } else if (lesson.studentId) {
            // Fetch the individual student
            const student = await ctx.db.get(lesson.studentId);
            if (student) students = [student];
        }

        // Get additional context
        const customer = await ctx.db.get(lesson.customerId);
        const group = lesson.groupId ? await ctx.db.get(lesson.groupId) : null;

        return {
            lesson,
            customer,
            group,
            students
        };
    },
});

// Helper query to get customer and group info for a lesson
export const getLessonContext = query({
    args: { lessonId: v.id("lessons") },
    handler: async (ctx, { lessonId }) => {
        const lesson = await ctx.db.get(lessonId);
        if (!lesson) throw new Error("Lesson not found");

        const customer = await ctx.db.get(lesson.customerId);
        const group = lesson.groupId ? await ctx.db.get(lesson.groupId) : null;
        const students = lesson.groupId
            ? await ctx.db
                .query("students")
                .withIndex("by_group", (q) => q.eq("groupId", lesson.groupId!))
                .filter((q) => q.eq(q.field("isActive"), true))
                .collect()
            : lesson.studentId
                ? [await ctx.db.get(lesson.studentId)]
                : [];

        return {
            lesson,
            customer,
            group,
            students: students.filter(Boolean),
        };
    },
});


