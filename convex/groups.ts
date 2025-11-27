import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listGroups = query({
    args: {
        workspaceId: v.id("workspaces"),
        customerId: v.optional(v.id("customers")),
    },
    handler: async (ctx, args) => {
        if (args.customerId) {
            return await ctx.db
                .query("studentGroups")
                .withIndex("by_customer", (q) => q.eq("customerId", args.customerId!))
                .collect();
        }
        return await ctx.db.query("studentGroups").filter(q => q.eq(q.field("workspaceId"), args.workspaceId)).collect();
    },
});

export const createGroup = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        customerId: v.id("customers"),
        name: v.string(),
        defaultTeacherId: v.optional(v.id("users")),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("studentGroups", {
            workspaceId: args.workspaceId,
            customerId: args.customerId,
            name: args.name,
            defaultTeacherId: args.defaultTeacherId,
            notes: args.notes,
            isActive: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

export const updateGroup = mutation({
    args: {
        groupId: v.id("studentGroups"),
        name: v.optional(v.string()),
        defaultTeacherId: v.optional(v.id("users")),
        notes: v.optional(v.string()),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const group = await ctx.db.get(args.groupId);
        if (!group) throw new Error("Group not found");

        await ctx.db.patch(args.groupId, {
            name: args.name ?? group.name,
            defaultTeacherId: args.defaultTeacherId !== undefined ? args.defaultTeacherId : group.defaultTeacherId,
            notes: args.notes ?? group.notes,
            isActive: args.isActive ?? group.isActive,
            updatedAt: Date.now(),
        });
    },
});

export const deleteGroup = mutation({
    args: {
        groupId: v.id("studentGroups"),
    },
    handler: async (ctx, args) => {
        // Check if there are students in this group?
        // For now, just delete. Students will have dangling groupId or we should clear it.
        // Ideally we clear it.
        const students = await ctx.db
            .query("students")
            .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
            .collect();

        for (const student of students) {
            await ctx.db.patch(student._id, { groupId: undefined });
        }

        await ctx.db.delete(args.groupId);
    },
});
