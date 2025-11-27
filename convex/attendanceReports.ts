import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create an attendance report
export const createAttendanceReport = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        lessonId: v.id("lessons"),
        customerId: v.id("customers"),
        groupId: v.optional(v.id("studentGroups")),
        studentsPresent: v.array(v.id("students")),
        studentsAbsent: v.array(v.id("students")),
        generalNotes: v.optional(v.string()),
        studentProgress: v.optional(v.array(v.object({
            studentId: v.id("students"),
            progressNotes: v.string(),
            skillLevel: v.optional(v.union(
                v.literal("beginner"),
                v.literal("intermediate"),
                v.literal("advanced"),
                v.literal("proficient")
            )),
        }))),
        createdBy: v.id("users"),
    },
    handler: async (ctx, args) => {
        const reportId = await ctx.db.insert("attendanceReports", {
            workspaceId: args.workspaceId,
            lessonId: args.lessonId,
            customerId: args.customerId,
            groupId: args.groupId,
            studentsPresent: args.studentsPresent,
            studentsAbsent: args.studentsAbsent,
            generalNotes: args.generalNotes,
            studentProgress: args.studentProgress,
            reportDate: Date.now(),
            createdBy: args.createdBy,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return reportId;
    },
});

// Get attendance report for a specific lesson
export const getAttendanceReportByLesson = query({
    args: { lessonId: v.id("lessons") },
    handler: async (ctx, { lessonId }) => {
        return await ctx.db
            .query("attendanceReports")
            .withIndex("by_lesson", (q) => q.eq("lessonId", lessonId))
            .first();
    },
});

// Get all attendance reports for a customer
export const listAttendanceReportsByCustomer = query({
    args: {
        customerId: v.id("customers"),
        from: v.optional(v.number()),
        to: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let reports = await ctx.db
            .query("attendanceReports")
            .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
            .collect();

        if (args.from !== undefined && args.to !== undefined) {
            reports = reports.filter(r => r.reportDate >= args.from! && r.reportDate <= args.to!);
        }

        return reports;
    },
});

// Get all attendance reports for a group
export const listAttendanceReportsByGroup = query({
    args: {
        groupId: v.id("studentGroups"),
        from: v.optional(v.number()),
        to: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let reports = await ctx.db
            .query("attendanceReports")
            .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
            .collect();

        if (args.from !== undefined && args.to !== undefined) {
            reports = reports.filter(r => r.reportDate >= args.from! && r.reportDate <= args.to!);
        }

        return reports;
    },
});

// Update an attendance report
export const updateAttendanceReport = mutation({
    args: {
        reportId: v.id("attendanceReports"),
        studentsPresent: v.optional(v.array(v.id("students"))),
        studentsAbsent: v.optional(v.array(v.id("students"))),
        generalNotes: v.optional(v.string()),
        studentProgress: v.optional(v.array(v.object({
            studentId: v.id("students"),
            progressNotes: v.string(),
            skillLevel: v.optional(v.union(
                v.literal("beginner"),
                v.literal("intermediate"),
                v.literal("advanced"),
                v.literal("proficient")
            )),
        }))),
    },
    handler: async (ctx, args) => {
        const { reportId, ...updates } = args;

        const updateData: any = {
            updatedAt: Date.now(),
        };

        if (updates.studentsPresent !== undefined) updateData.studentsPresent = updates.studentsPresent;
        if (updates.studentsAbsent !== undefined) updateData.studentsAbsent = updates.studentsAbsent;
        if (updates.generalNotes !== undefined) updateData.generalNotes = updates.generalNotes;
        if (updates.studentProgress !== undefined) updateData.studentProgress = updates.studentProgress;

        await ctx.db.patch(reportId, updateData);

        return reportId;
    },
});

// Delete an attendance report
export const deleteAttendanceReport = mutation({
    args: { reportId: v.id("attendanceReports") },
    handler: async (ctx, { reportId }) => {
        await ctx.db.delete(reportId);
        return reportId;
    },
});

// Get enriched report data (with customer, group, and student details)
export const getEnrichedAttendanceReport = query({
    args: { reportId: v.id("attendanceReports") },
    handler: async (ctx, { reportId }) => {
        const report = await ctx.db.get(reportId);
        if (!report) return null;

        // Fetch related data
        const customer = await ctx.db.get(report.customerId);
        const group = report.groupId ? await ctx.db.get(report.groupId) : null;
        const lesson = await ctx.db.get(report.lessonId);

        // Fetch all students (present and absent)
        const allStudentIds = [...report.studentsPresent, ...report.studentsAbsent];
        const students = await Promise.all(
            allStudentIds.map(id => ctx.db.get(id))
        );

        return {
            ...report,
            customer,
            group,
            lesson,
            students: students.filter(Boolean), // Remove nulls
        };
    },
});

// Get reports for multiple lessons (for invoices)
export const getReportsForLessons = query({
    args: { lessonIds: v.array(v.id("lessons")) },
    handler: async (ctx, { lessonIds }) => {
        const reports = await Promise.all(
            lessonIds.map(id =>
                ctx.db.query("attendanceReports")
                    .withIndex("by_lesson", q => q.eq("lessonId", id))
                    .first()
            )
        );
        return reports.filter((r): r is NonNullable<typeof r> => r !== null);
    }
});
