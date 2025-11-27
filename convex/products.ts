import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new product/service
export const createProduct = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        name: v.string(),
        description: v.optional(v.string()),
        price: v.number(), // in cents
        unit: v.string(),
        taxRate: v.number(),
    },
    handler: async (ctx, args) => {
        const { price, ...rest } = args;
        const productId = await ctx.db.insert("products", {
            ...rest,
            unitPrice: price,
            isActive: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        return productId;
    },
});

// Update a product
export const updateProduct = mutation({
    args: {
        id: v.id("products"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        price: v.optional(v.number()),
        unit: v.optional(v.string()),
        taxRate: v.optional(v.number()),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { id, price, ...updates } = args;
        const patch: any = {
            ...updates,
            updatedAt: Date.now(),
        };

        if (price !== undefined) {
            patch.unitPrice = price;
        }

        await ctx.db.patch(id, patch);
    },
});

// Delete a product
export const deleteProduct = mutation({
    args: { id: v.id("products") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

// List products for a workspace
export const listProducts = query({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("products")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();
    },
});

// Get a single product
export const getProduct = query({
    args: { id: v.id("products") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});
