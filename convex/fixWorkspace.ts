import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listAllWorkspaces = query({
    args: {},
    handler: async (ctx) => {
        // SECURITY WARNING: This allows listing all workspaces. 
        // Intended for debug/recovery only.
        const workspaces = await ctx.db.query("workspaces").collect();

        // Enrich with owner info
        const enriched = await Promise.all(workspaces.map(async (ws) => {
            const owner = await ctx.db.get(ws.ownerId);
            return {
                ...ws,
                ownerEmail: owner?.email,
                ownerName: owner?.name,
            };
        }));

        return enriched;
    },
});

export const grantAccessToWorkspace = mutation({
    args: {
        workspaceId: v.id("workspaces"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || !identity.email) {
            throw new Error("Not authenticated");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user) {
            throw new Error("User record not found. Please ensure you are fully logged in and setup.");
        }

        // Check if permission already exists
        const existing = await ctx.db
            .query("permissions")
            .withIndex("by_workspace_user", (q) =>
                q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
            )
            .first();

        if (existing) {
            return { message: "Access already exists" };
        }

        // Grant permission
        await ctx.db.insert("permissions", {
            workspaceId: args.workspaceId,
            userId: user._id,
            module: "all",
            canView: true,
            canAdd: true,
            canDelete: true,
            canEditShared: true,
        });

        return { message: "Access granted successfully" };
    },
});

export const createWorkspaceForUser = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || !identity.email) {
            throw new Error("Not authenticated");
        }

        let user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user) {
            const userId = await ctx.db.insert("users", {
                email: identity.email,
                name: identity.name || identity.email.split("@")[0],
                isAdmin: false,
                role: "user",
                createdAt: Date.now(),
            });
            user = await ctx.db.get(userId);
        }

        // Check if they already have one to avoid duplicates
        const existing = await ctx.db
            .query("workspaces")
            .withIndex("by_owner", (q) => q.eq("ownerId", user!._id))
            .first();

        if (existing) return existing._id;

        const workspaceId = await ctx.db.insert("workspaces", {
            name: `${user!.name || 'My'}'s Workspace`,
            ownerId: user!._id,
            createdAt: Date.now(),
        });

        // Grant self permission
        await ctx.db.insert("permissions", {
            workspaceId,
            userId: user!._id,
            module: "all",
            canView: true,
            canAdd: true,
            canDelete: true,
            canEditShared: true,
        });

        return workspaceId;
    }
});
