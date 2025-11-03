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
      .withIndex("by_user_date", (q) => q.eq("date", args.date))
      .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
      .collect();
    return allocations;
  },
});

export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    taskName: v.string(),
    date: v.string(),
    allocatedDuration: v.number(),
    weekNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const allocationId = await ctx.db.insert("timeAllocations", {
      userId: args.userId,
      workspaceId: args.workspaceId,
      taskName: args.taskName,
      date: args.date,
      allocatedDuration: args.allocatedDuration,
      weekNumber: args.weekNumber,
      createdAt: Date.now(),
    });
    return allocationId;
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
    return logId;
  },
});
