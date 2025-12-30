import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";

export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const email = identity.email;
  if (!email) return null;

  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .first();

  return user;
}

export async function getOrCreateUser(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const email = identity.email;
  if (!email) return null;

  let user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .first();

  if (!user) {
    const userId = await ctx.db.insert("users", {
      email: email,
      name: identity.name || email.split("@")[0],
      isAdmin: false,
      role: "user",
      createdAt: Date.now(),
    });
    user = await ctx.db.get(userId);
  }

  return user;
}

export const isEmailAuthorized = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const authorized = await ctx.db
      .query("authorizedEmails")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    return !!authorized;
  },
});

export const listAuthorizedEmails = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("authorizedEmails").collect();
  },
});

export const addAuthorizedEmail = mutation({
  args: {
    email: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (!user.isAdmin) throw new Error("Admin access required");

    const existing = await ctx.db
      .query("authorizedEmails")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new Error("Email already authorized");
    }

    return await ctx.db.insert("authorizedEmails", {
      email: args.email,
      addedBy: user._id,
      addedAt: Date.now(),
      notes: args.notes,
    });
  },
});

export const removeAuthorizedEmail = mutation({
  args: { id: v.id("authorizedEmails") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (!user.isAdmin) throw new Error("Admin access required");

    await ctx.db.delete(args.id);
  },
});

export const getCurrentUserInfo = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    };
  },
});
