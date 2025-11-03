import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    isAdmin: v.boolean(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  workspaces: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    createdAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  permissions: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    module: v.string(),
    canView: v.boolean(),
    canAdd: v.boolean(),
    canDelete: v.boolean(),
    canEditShared: v.boolean(),
  })
    .index("by_workspace_user", ["workspaceId", "userId"])
    .index("by_user", ["userId"]),

  sharedAccess: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    invitedBy: v.id("users"),
    invitedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"]),

  timeAllocations: defineTable({
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
    taskId: v.optional(v.id("tasks")),
    taskName: v.string(),
    date: v.string(),
    allocatedDuration: v.number(),
    weekNumber: v.number(),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user_date", ["userId", "date"]),

  timeLogged: defineTable({
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
    allocationId: v.optional(v.id("timeAllocations")),
    sessionStart: v.number(),
    sessionEnd: v.number(),
    elapsedTime: v.number(),
    logged: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_allocation", ["allocationId"]),

  accounts: defineTable({
    workspaceId: v.id("workspaces"),
    ownerId: v.id("users"),
    name: v.string(),
    accountType: v.union(v.literal("bank"), v.literal("loan"), v.literal("savings")),
    currentBalance: v.number(),
    isPrivate: v.boolean(),
    isDeleted: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_owner", ["ownerId"]),

  transactions: defineTable({
    workspaceId: v.id("workspaces"),
    accountId: v.id("accounts"),
    amount: v.number(),
    date: v.string(),
    category: v.string(),
    notes: v.optional(v.string()),
    isRecurring: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_account", ["accountId"])
    .index("by_workspace", ["workspaceId"]),

  monthlyProjection: defineTable({
    workspaceId: v.id("workspaces"),
    accountId: v.id("accounts"),
    month: v.string(),
    projectedBalance: v.number(),
    committedExpenses: v.number(),
    createdAt: v.number(),
  })
    .index("by_account_month", ["accountId", "month"])
    .index("by_workspace", ["workspaceId"]),

  assets: defineTable({
    workspaceId: v.id("workspaces"),
    ownerId: v.id("users"),
    name: v.string(),
    type: v.union(v.literal("property"), v.literal("vehicle"), v.literal("investment"), v.literal("other")),
    value: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_owner", ["ownerId"]),

  liabilities: defineTable({
    workspaceId: v.id("workspaces"),
    ownerId: v.id("users"),
    name: v.string(),
    amount: v.number(),
    relatedAssetId: v.optional(v.id("assets")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_owner", ["ownerId"]),

  equityGoals: defineTable({
    workspaceId: v.id("workspaces"),
    ownerId: v.id("users"),
    targetEquity: v.number(),
    targetDate: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_owner", ["ownerId"]),

  subscriptions: defineTable({
    workspaceId: v.id("workspaces"),
    ownerId: v.id("users"),
    name: v.string(),
    cost: v.number(),
    billingCycle: v.union(v.literal("monthly"), v.literal("yearly")),
    nextBillingDate: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_owner", ["ownerId"]),

  ideas: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("new"), v.literal("reviewing"), v.literal("converted"), v.literal("archived")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"]),

  tasks: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    ideaId: v.optional(v.id("ideas")),
    title: v.string(),
    status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("completed")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    dueDate: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_idea", ["ideaId"]),

  recipes: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    name: v.string(),
    instructions: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"]),

  recipeIngredients: defineTable({
    recipeId: v.id("recipes"),
    ingredientName: v.string(),
    quantity: v.optional(v.string()),
    unit: v.optional(v.string()),
  }).index("by_recipe", ["recipeId"]),

  shoppingLists: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    name: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"]),

  shoppingListItems: defineTable({
    shoppingListId: v.id("shoppingLists"),
    ingredientName: v.string(),
    quantity: v.optional(v.string()),
    unit: v.optional(v.string()),
    completed: v.boolean(),
    recipeSourceId: v.optional(v.id("recipes")),
    createdAt: v.number(),
  }).index("by_shopping_list", ["shoppingListId"]),

  calendarSync: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    googleAccessToken: v.string(),
    googleRefreshToken: v.optional(v.string()),
    lastSyncTime: v.number(),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"]),

  calendarEvents: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    googleEventId: v.optional(v.string()),
    title: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_google_event", ["googleEventId"]),
});
