import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get company settings for a workspace
export const getSettings = query({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("companySettings")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .first();
    },
});

// Initialize or update company settings
export const saveSettings = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        companyName: v.string(),
        ownerName: v.string(),
        addressLine1: v.string(),
        addressLine2: v.optional(v.string()),
        zipCode: v.string(),
        city: v.string(),
        country: v.string(),
        taxNumber: v.optional(v.string()),
        vatId: v.optional(v.string()),
        bankName: v.optional(v.string()),
        iban: v.optional(v.string()),
        bic: v.optional(v.string()),

        invoicePrefix: v.string(),
        nextInvoiceNumber: v.number(),

        defaultPaymentTermsDays: v.number(),
        defaultTaxRate: v.number(),
        defaultHourlyRate: v.optional(v.number()),
        defaultServiceUnit: v.optional(v.string()),

        taxExemptionEnabled: v.optional(v.boolean()),
        taxExemptionLegalBasis: v.optional(v.string()),
        taxExemptionNoticeText: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("companySettings")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                ...args,
                updatedAt: Date.now(),
            });
            return existing._id;
        } else {
            const id = await ctx.db.insert("companySettings", {
                ...args,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            return id;
        }
    },
});

// Helper to get next invoice number (internal use mostly, but exposed for UI preview)
export const getNextInvoiceNumber = query({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args) => {
        const settings = await ctx.db
            .query("companySettings")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .first();

        if (!settings) return null;

        return {
            prefix: settings.invoicePrefix,
            number: settings.nextInvoiceNumber,
            formatted: `${settings.invoicePrefix}${settings.nextInvoiceNumber}`
        };
    },
});
