import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createWorkspaceForUser = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        // Check if workspace already exists
        const existingWorkspace = await ctx.db
            .query("workspaces")
            .withIndex("by_owner", (q) => q.eq("ownerId", args.userId))
            .first();

        if (existingWorkspace) {
            return {
                workspaceId: existingWorkspace._id,
                message: "Workspace already exists",
                success: true
            };
        }

        // Get user to get their name
        const user = await ctx.db.get(args.userId);
        if (!user) {
            throw new Error("User not found");
        }

        // Create workspace
        const workspaceId = await ctx.db.insert("workspaces", {
            name: `${user.name}'s Workspace`,
            ownerId: args.userId,
            createdAt: Date.now(),
        });

        return {
            workspaceId,
            message: "Workspace created successfully",
            success: true
        };
    },
});
