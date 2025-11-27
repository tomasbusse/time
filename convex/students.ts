import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listStudents = query({
    args: {
        workspaceId: v.id("workspaces"),
        customerId: v.optional(v.id("customers")),
        groupId: v.optional(v.id("studentGroups")),
    },
    handler: async (ctx, args) => {
        if (args.customerId) {
            return await ctx.db
                .query("students")
                .withIndex("by_customer", (q) => q.eq("customerId", args.customerId!))
                .collect();
        }
        if (args.groupId) {
            return await ctx.db
                .query("students")
                .withIndex("by_group", (q) => q.eq("groupId", args.groupId!))
                .collect();
        }
        // Fallback to scanning all students in workspace (requires index or filter)
        // For now, we assume this is mostly used within customer/group context.
        // If we need all students, we can filter by workspaceId if we add that index or scan.
        return await ctx.db.query("students").filter(q => q.eq(q.field("workspaceId"), args.workspaceId)).collect();
    },
});

export const createStudent = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        customerId: v.id("customers"),
        groupId: v.optional(v.id("studentGroups")),
        firstName: v.string(),
        lastName: v.string(),
        email: v.string(),
        phone: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("students", {
            workspaceId: args.workspaceId,
            customerId: args.customerId,
            groupId: args.groupId,
            firstName: args.firstName,
            lastName: args.lastName,
            email: args.email,
            phone: args.phone,
            notes: args.notes,
            isActive: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

export const updateStudent = mutation({
    args: {
        studentId: v.id("students"),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        groupId: v.optional(v.id("studentGroups")),
        notes: v.optional(v.string()),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const student = await ctx.db.get(args.studentId);
        if (!student) throw new Error("Student not found");

        await ctx.db.patch(args.studentId, {
            firstName: args.firstName ?? student.firstName,
            lastName: args.lastName ?? student.lastName,
            email: args.email ?? student.email,
            phone: args.phone ?? student.phone,
            groupId: args.groupId !== undefined ? args.groupId : student.groupId,
            notes: args.notes ?? student.notes,
            isActive: args.isActive ?? student.isActive,
            updatedAt: Date.now(),
        });
    },
});

export const deleteStudent = mutation({
    args: {
        studentId: v.id("students"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.studentId);
    },
});
