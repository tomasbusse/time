import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

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
    const checkingAccountId = await ctx.db.insert("accounts", {
      workspaceId,
      accountCode: "1100",
      accountName: "Main Checking Account",
      accountType: "asset",
      accountCategory: "current_asset",
      isActive: true,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("accountBalances", {
      workspaceId,
      accountId: checkingAccountId,
      currentBalance: 5420.50,
      lastUpdated: Date.now(),
      createdAt: Date.now(),
    });

    const savingsAccountId = await ctx.db.insert("accounts", {
      workspaceId,
      accountCode: "1200",
      accountName: "Emergency Savings",
      accountType: "asset",
      accountCategory: "current_asset",
      isActive: true,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("accountBalances", {
      workspaceId,
      accountId: savingsAccountId,
      currentBalance: 12000,
      lastUpdated: Date.now(),
      createdAt: Date.now(),
    });

    const mortgageAccountId = await ctx.db.insert("accounts", {
      workspaceId,
      accountCode: "2500",
      accountName: "Mortgage",
      accountType: "liability",
      accountCategory: "long_term_liability",
      isActive: true,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("accountBalances", {
      workspaceId,
      accountId: mortgageAccountId,
      currentBalance: -180000,
      lastUpdated: Date.now(),
      createdAt: Date.now(),
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
      position: 1,
      estimatedHours: 8,
      timeSpent: 2,
      isArchived: false,
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
      position: 2,
      estimatedHours: 5,
      isArchived: false,
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

export const ensureWorkspaceExists = mutation({
  args: {},
  handler: async (ctx) => {
    // Try multiple approaches to find the authenticated user

    // Approach 1: Convex built-in auth (for non-OAuth users)
    let user = null;
    const identity = await ctx.auth.getUserIdentity();

    if (identity && identity.email) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
    }

    // Approach 2: If no user from Convex auth, get the most recent OAuth user
    if (!user) {
      const recentToken = await ctx.db
        .query("userTokens")
        .order("desc") // Most recent first
        .first();

      if (recentToken) {
        user = await ctx.db.get(recentToken.userId);
      }
    }

    // Approach 3: Fallback - get any existing user (for demo/testing)
    if (!user) {
      user = await ctx.db
        .query("users")
        .order("desc") // Most recent first
        .first();
    }

    if (!user) {
      throw new Error("No user found");
    }

    // Check if workspace exists
    let workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .first();

    // Create workspace if it doesn't exist
    if (!workspace) {
      const workspaceId = await ctx.db.insert("workspaces", {
        name: `${user.name}'s Workspace`,
        ownerId: user._id,
        createdAt: Date.now(),
      });

      // Add default permissions for the owner
      await ctx.db.insert("permissions", {
        workspaceId,
        userId: user._id,
        module: "all",
        canView: true,
        canAdd: true,
        canDelete: true,
        canEditShared: true,
      });

      workspace = await ctx.db.get(workspaceId);
    }

    return {
      userId: user._id,
      workspaceId: workspace!._id,
      userName: user.name,
      workspace: workspace,
    };
  },
});

export const getDefaultWorkspace = query({
  args: {},
  handler: async (ctx) => {
    // Try multiple approaches to find the authenticated user

    // Approach 1: Convex built-in auth (for non-OAuth users)
    let user = null;
    const identity = await ctx.auth.getUserIdentity();

    if (identity && identity.email) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
    }

    // Approach 2: If no user from Convex auth, get the most recent OAuth user
    if (!user) {
      const recentToken = await ctx.db
        .query("userTokens")
        .order("desc") // Most recent first
        .first();

      if (recentToken) {
        user = await ctx.db.get(recentToken.userId);
      }
    }

    // Approach 3: Fallback - get any existing user (for demo/testing)
    if (!user) {
      user = await ctx.db
        .query("users")
        .order("desc") // Most recent first
        .first();
    }

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
      workspace: workspace,
    };
  },
});
