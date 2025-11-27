import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const deleteTestHouseAsset = mutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const testHouseAsset = await ctx.db
      .query("simpleAssets")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("name"), "Test House"))
      .first();

    if (testHouseAsset) {
      await ctx.db.delete(testHouseAsset._id);
      return { success: true, message: `Deleted 'Test House' asset (ID: ${testHouseAsset._id}).` };
    }

    return { success: false, message: "'Test House' asset not found." };
  },
});
export const clearTimeAllocations = mutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const allocations = await ctx.db
      .query("timeAllocations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    for (const allocation of allocations) {
      await ctx.db.delete(allocation._id);
    }

    return { success: true, message: `Deleted ${allocations.length} time allocations.` };
  },
});