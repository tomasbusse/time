import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const setupDefaultData = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "demo@productivity.app"))
      .first();

    if (existingUser) {
      return { userId: existingUser._id, message: "User already exists" };
    }

    // Create default user
    const userId = await ctx.db.insert("users", {
      email: "demo@productivity.app",
      name: "Tomas",
      isAdmin: true,
      createdAt: Date.now(),
    });

    // Create default workspace
    const workspaceId = await ctx.db.insert("workspaces", {
      name: "My Workspace",
      ownerId: userId,
      createdAt: Date.now(),
    });

    // Add sample finance data
    await ctx.db.insert("accounts", {
      workspaceId,
      ownerId: userId,
      name: "Main Checking Account",
      accountType: "bank",
      currentBalance: 5420.50,
      isPrivate: false,
      isDeleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("accounts", {
      workspaceId,
      ownerId: userId,
      name: "Emergency Savings",
      accountType: "savings",
      currentBalance: 12000,
      isPrivate: false,
      isDeleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("accounts", {
      workspaceId,
      ownerId: userId,
      name: "Mortgage",
      accountType: "loan",
      currentBalance: -180000,
      isPrivate: false,
      isDeleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Add equity goal
    await ctx.db.insert("equityGoals", {
      workspaceId,
      ownerId: userId,
      targetEquity: 50000,
      targetDate: "2026-12-31",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Add sample tasks
    await ctx.db.insert("tasks", {
      workspaceId,
      userId,
      title: "Design the Flow mini-app UI",
      status: "in_progress",
      priority: "high",
      dueDate: "2025-12-15",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("tasks", {
      workspaceId,
      userId,
      title: "Develop task creation form",
      status: "todo",
      priority: "medium",
      dueDate: "2025-12-20",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Add sample ideas
    await ctx.db.insert("ideas", {
      workspaceId,
      userId,
      title: "Add dark mode support",
      description: "Implement dark mode toggle for better UX at night",
      status: "new",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      userId,
      workspaceId,
      message: "Default data created successfully",
    };
  },
});

export const getDefaultWorkspace = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "demo@productivity.app"))
      .first();

    if (!user) {
      return null;
    }

    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .first();

    return {
      userId: user._id,
      workspaceId: workspace?._id,
      userName: user.name,
    };
  },
});
