import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    isAdmin: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      isAdmin: args.isAdmin ?? false,
      createdAt: Date.now(),
    });
    return userId;
  },
});

export const createWorkspace = mutation({
  args: {
    name: v.string(),
    ownerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const workspaceId = await ctx.db.insert("workspaces", {
      name: args.name,
      ownerId: args.ownerId,
      createdAt: Date.now(),
    });
    return workspaceId;
  },
});
