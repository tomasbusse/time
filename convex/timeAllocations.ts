import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    workspaceId: v.id("workspaces"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const allocations = await ctx.db
      .query("timeAllocations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("date"), args.date))
      .collect();
    return allocations;
  },
});

export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    taskName: v.string(),
    taskId: v.id("tasks"),
    date: v.string(),
    allocatedDuration: v.number(),
    weekNumber: v.number(),
    isRecurring: v.optional(v.boolean()),
    recurrenceType: v.optional(v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("yearly")
    )),
    recurrenceInterval: v.optional(v.number()),
    recurrenceEndDate: v.optional(v.string()),
    recurrenceCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const allocationId = await ctx.db.insert("timeAllocations", {
      userId: args.userId,
      workspaceId: args.workspaceId,
      taskName: args.taskName,
      taskId: args.taskId,
      date: args.date,
      allocatedDuration: args.allocatedDuration,
      weekNumber: args.weekNumber,
      createdAt: Date.now(),
    });
    return allocationId;
  },
});

export const update = mutation({
  args: {
    id: v.id("timeAllocations"),
    taskName: v.optional(v.string()),
    allocatedDuration: v.optional(v.number()),
    isRecurring: v.optional(v.boolean()),
    recurrenceType: v.optional(v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("yearly")
    )),
    recurrenceInterval: v.optional(v.number()),
    recurrenceEndDate: v.optional(v.string()),
    recurrenceCount: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: {
    id: v.id("timeAllocations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const logTime = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    allocationId: v.optional(v.id("timeAllocations")),
    sessionStart: v.number(),
    sessionEnd: v.number(),
    elapsedTime: v.number(),
  },
  handler: async (ctx, args) => {
    const logId = await ctx.db.insert("timeLogged", {
      userId: args.userId,
      workspaceId: args.workspaceId,
      allocationId: args.allocationId,
      sessionStart: args.sessionStart,
      sessionEnd: args.sessionEnd,
      elapsedTime: args.elapsedTime,
      logged: true,
      createdAt: Date.now(),
    });

    // Update the allocation's timeSpent
    if (args.allocationId) {
      const allocation = await ctx.db.get(args.allocationId);
      if (allocation) {
        const currentSpent = allocation.timeSpent || 0;
        await ctx.db.patch(args.allocationId, {
          timeSpent: currentSpent + args.elapsedTime, // elapsedTime is in minutes based on usage in ProductivityApp
        });
      }
    }

    return logId;
  },
});

export const completeAllocation = mutation({
  args: {
    allocationId: v.id("timeAllocations"),
  },
  handler: async (ctx, args) => {
    const allocation = await ctx.db.get(args.allocationId);
    if (!allocation) {
      throw new Error("Time allocation not found");
    }

    if (allocation.isRecurring && allocation.recurrenceType) {
      let nextDate: Date | null = null;
      const currentDueDate = new Date(allocation.date);

      if (allocation.recurrenceType === 'daily') {
        nextDate = new Date(currentDueDate.setDate(currentDueDate.getDate() + (allocation.recurrenceInterval || 1)));
      } else if (allocation.recurrenceType === 'weekly') {
        nextDate = new Date(currentDueDate.setDate(currentDueDate.getDate() + 7 * (allocation.recurrenceInterval || 1)));
      } else if (allocation.recurrenceType === 'monthly') {
        nextDate = new Date(currentDueDate.setMonth(currentDueDate.getMonth() + (allocation.recurrenceInterval || 1)));
      } else if (allocation.recurrenceType === 'yearly') {
        nextDate = new Date(currentDueDate.setFullYear(currentDueDate.getFullYear() + (allocation.recurrenceInterval || 1)));
      }

      if (nextDate) {
        if (allocation.recurrenceEndDate && nextDate > new Date(allocation.recurrenceEndDate)) {
          return; // Stop creating new allocations
        }

        if (allocation.recurrenceCount && allocation.recurrenceCount <= 1) {
          await ctx.db.patch(allocation._id, { isRecurring: false });
          return; // Stop creating new allocations
        }

        const { _id, _creationTime, ...newAllocationData } = allocation;
        await ctx.db.insert("timeAllocations", {
          ...(newAllocationData as any),
          date: nextDate.toISOString().split('T')[0],
          parentAllocationId: allocation.parentAllocationId || allocation._id,
          recurrenceCount: allocation.recurrenceCount ? allocation.recurrenceCount - 1 : undefined,
          timeSpent: 0, // Reset time spent for the new allocation
          createdAt: Date.now(),
        });
      }
    }
  },
});
