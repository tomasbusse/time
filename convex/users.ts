import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

export const getCurrentUser = query({
  handler: async (ctx): Promise<Doc<"users"> | null> => {
    // Approach 1: Convex built-in auth
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .unique();
      if (user) return user;
    }

    // Approach 2: Most recent OAuth user
    const recentToken = await ctx.db
      .query("userTokens")
      .order("desc")
      .first();

    if (recentToken) {
      const user = await ctx.db.get(recentToken.userId);
      if (user) return user;
    }

    // Approach 3: Fallback - get any existing user (for demo/testing)
    return await ctx.db
      .query("users")
      .order("desc")
      .first();
  },
});
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }): Promise<Doc<"users"> | null> => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
  },
});

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }): Promise<Doc<"users"> | null> => {
    return await ctx.db.get(userId);
  },
});

export const getWorkspaceByOwner = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }): Promise<Doc<"workspaces"> | null> => {
    return await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .first();
  },
});

export const getUserTokens = query({
  handler: async (ctx): Promise<{ access_token: string, refresh_token?: string | null, expiry_date?: number | null } | null> => {
    const user = await ctx.runQuery(api.users.getCurrentUser);

    // Try tokens for the current authenticated user first
    let token = user
      ? await ctx.db
        .query("userTokens")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .first()
      : null;

    // Fallback: use the most recently stored token (useful in dev or after OAuth just completed)
    if (!token) {
      token = await ctx.db.query("userTokens").order("desc").first();
    }

    if (!token) {
      return null;
    }
    return {
      access_token: token.accessToken,
      refresh_token: token.refreshToken,
      expiry_date: token.expiresAt,
    };
  },
});

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

export const createAccount = mutation({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, { email, name }) => {
    // Create a new user
    const userId = await ctx.db.insert("users", {
      email,
      name,
      isAdmin: false,
      createdAt: Date.now(),
    });

    // Create a default workspace for the user
    const workspaceId = await ctx.db.insert("workspaces", {
      name: `${name}'s Workspace`,
      ownerId: userId,
      createdAt: Date.now(),
    });

    // Add permissions for the owner to the workspace
    await ctx.db.insert("permissions", {
      workspaceId,
      userId,
      module: "all", // Default to full access to all modules
      canView: true,
      canAdd: true,
      canDelete: true,
      canEditShared: true,
    });

    return { userId, workspaceId };
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
export const listUsers = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("teacher"), v.null()),
    isAdmin: v.boolean(),
    adminUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let adminUser = null;

    // Try to get admin from auth first
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      adminUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .unique();
    }

    // Fallback to adminUserId if provided
    if (!adminUser && args.adminUserId) {
      adminUser = await ctx.db.get(args.adminUserId);
    }

    if (!adminUser || (!adminUser.isAdmin && adminUser.role !== "admin")) {
      throw new Error("Unauthorized: Only admins can change roles");
    }

    await ctx.db.patch(args.userId, {
      role: args.role === null ? undefined : args.role,
      isAdmin: args.isAdmin,
    });
  },
});

// TODO: Move this to an action in a separate file with "use node"
// export const setUserPassword = mutation({
//   args: {
//     userId: v.id("users"),
//     password: v.string(),
//     adminUserId: v.optional(v.id("users")),
//   },
//   handler: async (ctx, args) => {
//     // ... password setting logic using node:crypto
//   },
// });
