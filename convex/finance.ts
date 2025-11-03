import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Accounts
export const listAccounts = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("accounts")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .collect();
  },
});

export const createAccount = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    ownerId: v.id("users"),
    name: v.string(),
    accountType: v.union(v.literal("bank"), v.literal("loan"), v.literal("savings")),
    currentBalance: v.number(),
    isPrivate: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("accounts", {
      ...args,
      isDeleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateAccount = mutation({
  args: {
    id: v.id("accounts"),
    name: v.optional(v.string()),
    currentBalance: v.optional(v.number()),
    isPrivate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const deleteAccount = mutation({
  args: { id: v.id("accounts") },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      isDeleted: true,
      updatedAt: Date.now(),
    });
  },
});

// Assets
export const listAssets = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assets")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

export const createAsset = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    ownerId: v.id("users"),
    name: v.string(),
    type: v.union(v.literal("property"), v.literal("vehicle"), v.literal("investment"), v.literal("other")),
    value: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("assets", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Liabilities
export const listLiabilities = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("liabilities")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

// Subscriptions
export const listSubscriptions = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

// Equity Goal
export const getEquityGoal = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const goals = await ctx.db
      .query("equityGoals")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
    if (goals.length === 0) return null;
    // Return the most recently updated goal
    goals.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    return goals[0];
  },
});

export const upsertEquityGoal = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    ownerId: v.id("users"),
    targetEquity: v.number(),
    targetDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Permission check: allow owner or users with permissions.canAdd || permissions.canEditShared for finance
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    let allowed = false;
    // Owner can always edit
    if (workspace.ownerId === args.ownerId) {
      allowed = true;
    } else {
      const perm = await ctx.db
        .query("permissions")
        .withIndex("by_workspace_user", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", args.ownerId))
        .first();
      if (perm && perm.module === "finance" && (perm.canAdd || perm.canEditShared)) {
        allowed = true;
      }
    }
    if (!allowed) {
      throw new Error("Not authorized to update equity goal");
    }

    const existing = await ctx.db
      .query("equityGoals")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        targetEquity: args.targetEquity,
        targetDate: args.targetDate,
        updatedAt: Date.now(),
      });
      return existing._id;
    }
    const id = await ctx.db.insert("equityGoals", {
      workspaceId: args.workspaceId,
      ownerId: args.ownerId,
      targetEquity: args.targetEquity,
      targetDate: args.targetDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return id;
  },
});
