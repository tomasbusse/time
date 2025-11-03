import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Tasks
export const listTasks = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

export const createTask = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    title: v.string(),
    status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("completed")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    dueDate: v.optional(v.string()),
    ideaId: v.optional(v.id("ideas")),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tasks", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.taskId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    dueDate: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { taskId, ...updates } = args as any;
    return await ctx.db.patch(taskId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const deleteTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.taskId);
  },
});

// Ideas
export const listIdeas = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ideas")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

export const createIdea = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("new"), v.literal("reviewing"), v.literal("converted"), v.literal("archived")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ideas", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateIdeaStatus = mutation({
  args: {
    ideaId: v.id("ideas"),
    status: v.union(v.literal("new"), v.literal("reviewing"), v.literal("converted"), v.literal("archived")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.ideaId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const deleteIdea = mutation({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.ideaId);
  },
});
