import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { GenericDatabaseReader } from "convex/server";

export const storeUserTokens = internalMutation({
    args: {
        userId: v.id("users"),
        accessToken: v.string(),
        refreshToken: v.optional(v.string()),
        expiresAt: v.optional(v.number()),
    },
    handler: async (ctx, { userId, accessToken, refreshToken, expiresAt }) => {
        const existingToken = await ctx.db.query("userTokens").withIndex("by_userId", q => q.eq("userId", userId)).first();
        if (existingToken) {
            await ctx.db.patch(existingToken._id, {
                accessToken,
                refreshToken,
                expiresAt,
            });
        } else {
            await ctx.db.insert("userTokens", {
                userId,
                accessToken,
                refreshToken,
                expiresAt,
            });
        }
    },
});

export const updateApiKey = internalMutation({
    args: {
        apiKeyId: v.id("apiKeys"),
        apiKey: v.string(),
        updatedAt: v.number(),
    },
    handler: async (ctx, { apiKeyId, apiKey, updatedAt }) => {
        await ctx.db.patch(apiKeyId, {
            apiKey: apiKey,
            updatedAt: updatedAt,
            testStatus: "untested",
        });
    },
});

export const insertApiKey = internalMutation({
    args: {
        userId: v.id("users"),
        serviceName: v.string(),
        apiKey: v.string(),
        createdAt: v.number(),
        updatedAt: v.number(),
    },
    handler: async (ctx, { userId, serviceName, apiKey, createdAt, updatedAt }) => {
        await ctx.db.insert("apiKeys", {
            userId: userId,
            serviceName: serviceName,
            apiKey: apiKey,
            isActive: true,
            lastTested: 0,
            testStatus: "untested",
            createdAt: createdAt,
            updatedAt: updatedAt,
        });
    },
});

export const updateTestStatus = internalMutation({
    args: {
        apiKeyId: v.id("apiKeys"),
        testStatus: v.union(v.literal("success"), v.literal("failed"), v.literal("untested")),
        testError: v.optional(v.string()),
        lastTested: v.number(),
    },
    handler: async (ctx, { apiKeyId, testStatus, testError, lastTested }) => {
        await ctx.db.patch(apiKeyId, {
            testStatus: testStatus,
            testError: testError,
            lastTested: lastTested,
        });
    },
});

export const getUserApiKeys = internalQuery({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx: any, { userId }: { userId: string }) => {
        return await ctx.db
            .query("apiKeys")
            .withIndex("by_user_service", (q: any) => q.eq("userId", userId))
            .collect();
    },
});