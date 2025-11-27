import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getSettings = query({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args) => {
        const settings = await ctx.db
            .query("companySettings")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .first();

        if (settings && settings.logoStorageId) {
            const url = await ctx.storage.getUrl(settings.logoStorageId);
            return { ...settings, logoUrl: url };
        }

        return settings;
    },
});

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

export const updateSettings = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        companyName: v.optional(v.string()),
        ownerName: v.optional(v.string()),
        addressLine1: v.optional(v.string()),
        addressLine2: v.optional(v.string()),
        zipCode: v.optional(v.string()),
        city: v.optional(v.string()),
        country: v.optional(v.string()),
        taxNumber: v.optional(v.string()),
        vatId: v.optional(v.string()),
        phone1: v.optional(v.string()),
        phone2: v.optional(v.string()),
        email: v.optional(v.string()),
        website: v.optional(v.string()),
        bankName: v.optional(v.string()),
        iban: v.optional(v.string()),
        bic: v.optional(v.string()),
        invoicePrefix: v.optional(v.string()),
        defaultPaymentTermsDays: v.optional(v.number()),
        defaultTaxRate: v.optional(v.number()),
        defaultHourlyRate: v.optional(v.number()),
        taxExemptionEnabled: v.optional(v.boolean()),
        taxExemptionLegalBasis: v.optional(v.string()),
        paymentInstructionTemplate: v.optional(v.string()),
        logoStorageId: v.optional(v.id("_storage")),
        emailSubjectTemplate: v.optional(v.string()),
        emailBodyTemplate: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { workspaceId, ...updates } = args;

        const existing = await ctx.db
            .query("companySettings")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                ...updates,
                updatedAt: Date.now(),
            });
            return existing._id;
        } else {
            // Create new settings
            return await ctx.db.insert("companySettings", {
                workspaceId,
                companyName: updates.companyName || "My Company",
                ownerName: updates.ownerName || "Owner",
                addressLine1: updates.addressLine1 || "Street 1",
                zipCode: updates.zipCode || "12345",
                city: updates.city || "City",
                country: updates.country || "Germany",
                invoicePrefix: updates.invoicePrefix || "",
                nextInvoiceNumber: 1000,
                defaultPaymentTermsDays: updates.defaultPaymentTermsDays || 14,
                defaultTaxRate: updates.defaultTaxRate || 19,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        }
    },
});
