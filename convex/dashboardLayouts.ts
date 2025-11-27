import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Default layout configuration for new workspaces
const DEFAULT_LAYOUT = [
  {
    i: "financial-overview",
    x: 0,
    y: 0,
    w: 8,
    h: 4,
    minW: 4,
    minH: 3,
    isDraggable: true,
    isResizable: true,
  },
  {
    i: "flow-time-dashboard",
    x: 0,
    y: 4,
    w: 8,
    h: 6,
    minW: 4,
    minH: 4,
    isDraggable: true,
    isResizable: true,
  },
  {
    i: "subscriptions",
    x: 8,
    y: 0,
    w: 4,
    h: 3,
    minW: 3,
    minH: 2,
    isDraggable: true,
    isResizable: true,
  },
  {
    i: "shopping-lists",
    x: 8,
    y: 3,
    w: 4,
    h: 4,
    minW: 3,
    minH: 3,
    isDraggable: true,
    isResizable: true,
  },
];

// Get dashboard layout for a user
export const getDashboardLayout = query({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    layoutName: v.optional(v.string()),
  },
  handler: async (ctx, { workspaceId, userId, layoutName = "default" }) => {
    const layout = await ctx.db
      .query("dashboardLayouts")
      .withIndex("by_workspace_user_name", (q: any) =>
        q.eq("workspaceId", workspaceId).eq("userId", userId).eq("layoutName", layoutName)
      )
      .unique();

    if (layout) {
      return layout.layout;
    }

    // Return default layout if no custom layout exists
    return DEFAULT_LAYOUT;
  },
});

// Save dashboard layout
export const saveDashboardLayout = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    layout: v.array(v.object({
      i: v.string(),
      x: v.number(),
      y: v.number(),
      w: v.number(),
      h: v.number(),
      minW: v.optional(v.number()),
      maxW: v.optional(v.number()),
      minH: v.optional(v.number()),
      maxH: v.optional(v.number()),
      isDraggable: v.optional(v.boolean()),
      isResizable: v.optional(v.boolean()),
    })),
    layoutName: v.optional(v.string()),
  },
  handler: async (ctx, { workspaceId, userId, layout, layoutName = "default" }) => {
    const existingLayout = await ctx.db
      .query("dashboardLayouts")
      .withIndex("by_workspace_user_name", (q: any) =>
        q.eq("workspaceId", workspaceId).eq("userId", userId).eq("layoutName", layoutName)
      )
      .unique();

    const now = Date.now();

    if (existingLayout) {
      // Update existing layout
      await ctx.db.patch(existingLayout._id, {
        layout,
        updatedAt: now,
      });
    } else {
      // Create new layout
      await ctx.db.insert("dashboardLayouts", {
        workspaceId,
        userId,
        layoutName,
        layout,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

// Reset dashboard layout to default
export const resetDashboardLayout = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    layoutName: v.optional(v.string()),
  },
  handler: async (ctx, { workspaceId, userId, layoutName = "default" }) => {
    const existingLayout = await ctx.db
      .query("dashboardLayouts")
      .withIndex("by_workspace_user_name", (q: any) =>
        q.eq("workspaceId", workspaceId).eq("userId", userId).eq("layoutName", layoutName)
      )
      .unique();

    if (existingLayout) {
      await ctx.db.delete(existingLayout._id);
    }

    return DEFAULT_LAYOUT;
  },
});

// Get all available layouts for a user
export const getUserLayouts = query({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
  },
  handler: async (ctx, { workspaceId, userId }) => {
    const layouts = await ctx.db
      .query("dashboardLayouts")
      .withIndex("by_workspace_user", (q: any) => q.eq("workspaceId", workspaceId).eq("userId", userId))
      .collect();

    return layouts.map((layout) => ({
      id: layout._id,
      name: layout.layoutName,
      isActive: layout.isActive,
      createdAt: layout.createdAt,
      updatedAt: layout.updatedAt,
    }));
  },
});