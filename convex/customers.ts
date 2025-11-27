import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new customer
export const createCustomer = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        name: v.string(), // Computed display name

        // German Fields
        companyName: v.optional(v.string()),
        salutation: v.optional(v.string()),
        title: v.optional(v.string()),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        supplement1: v.optional(v.string()),
        supplement2: v.optional(v.string()),
        street: v.optional(v.string()),
        zipCode: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        country: v.optional(v.string()),

        // PO Box
        poBox: v.optional(v.string()),
        poBoxZipCode: v.optional(v.string()),
        poBoxCity: v.optional(v.string()),
        poBoxState: v.optional(v.string()),
        poBoxCountry: v.optional(v.string()),

        // Legacy/Compat
        contactPerson: v.optional(v.string()),
        email: v.optional(v.string()),
        emails: v.optional(v.array(v.string())),
        addressLine1: v.optional(v.string()),
        addressLine2: v.optional(v.string()),

        vatId: v.optional(v.string()),
        taxNumber: v.optional(v.string()),
        customerNumber: v.optional(v.string()),
        phone1: v.optional(v.string()),
        phone2: v.optional(v.string()),
        paymentTermsDays: v.number(),
        notes: v.optional(v.string()),

        // Pricing & VAT
        defaultHourlyRate: v.optional(v.number()),
        isVatExempt: v.optional(v.boolean()),
        serviceDescriptions: v.optional(v.array(v.string())),

        // Import tracking
        importBatchId: v.optional(v.string()),

        // Active status
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const customerId = await ctx.db.insert("customers", {
            ...args,
            isActive: args.isActive ?? false, // Default to inactive
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        return customerId;
    },
});

// Batch create customers
export const createCustomerBatch = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        customers: v.array(v.object({
            name: v.string(),
            contactPerson: v.optional(v.string()),
            email: v.optional(v.string()),
            addressLine1: v.string(),
            addressLine2: v.optional(v.string()),
            zipCode: v.string(),
            city: v.string(),
            country: v.string(),
            vatId: v.optional(v.string()),
            taxNumber: v.optional(v.string()),
            paymentTermsDays: v.number(),
            notes: v.optional(v.string()),
        })),
    },
    handler: async (ctx, args) => {
        for (const customer of args.customers) {
            await ctx.db.insert("customers", {
                workspaceId: args.workspaceId,
                ...customer,
                isActive: false, // Default to inactive for batch imports
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        }
    },
});

// Update a customer
export const updateCustomer = mutation({
    args: {
        id: v.id("customers"),
        name: v.optional(v.string()),

        // German Fields
        companyName: v.optional(v.string()),
        salutation: v.optional(v.string()),
        title: v.optional(v.string()),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        supplement1: v.optional(v.string()),
        supplement2: v.optional(v.string()),
        street: v.optional(v.string()),
        zipCode: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        country: v.optional(v.string()),

        // PO Box
        poBox: v.optional(v.string()),
        poBoxZipCode: v.optional(v.string()),
        poBoxCity: v.optional(v.string()),
        poBoxState: v.optional(v.string()),
        poBoxCountry: v.optional(v.string()),

        contactPerson: v.optional(v.string()),
        email: v.optional(v.string()),
        emails: v.optional(v.array(v.string())),
        addressLine1: v.optional(v.string()),
        addressLine2: v.optional(v.string()),
        vatId: v.optional(v.string()),
        taxNumber: v.optional(v.string()),
        customerNumber: v.optional(v.string()),
        phone1: v.optional(v.string()),
        phone2: v.optional(v.string()),
        paymentTermsDays: v.optional(v.number()),
        notes: v.optional(v.string()),

        // Pricing & VAT
        defaultHourlyRate: v.optional(v.number()),
        isVatExempt: v.optional(v.boolean()),
        serviceDescriptions: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

// Toggle customer active status
export const toggleCustomerActive = mutation({
    args: {
        id: v.id("customers"),
    },
    handler: async (ctx, args) => {
        const customer = await ctx.db.get(args.id);
        if (!customer) {
            throw new Error("Customer not found");
        }

        await ctx.db.patch(args.id, {
            isActive: !(customer.isActive ?? true), // Toggle, default to true if undefined
            updatedAt: Date.now(),
        });
    },
});

// Delete a customer
export const deleteCustomer = mutation({
    args: { id: v.id("customers") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

// List customers for a workspace
export const listCustomers = query({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("customers")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();
    },
});

// Get a single customer
export const getCustomer = query({
    args: { id: v.id("customers") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

// Migration: Deactivate all customers
export const deactivateAllCustomers = mutation({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args) => {
        const customers = await ctx.db
            .query("customers")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();

        for (const customer of customers) {
            await ctx.db.patch(customer._id, {
                isActive: false,
                updatedAt: Date.now(),
            });
        }
        return customers.length;
    },
});

// Migration: Deactivate all customers (Global - No args needed)
export const deactivateAllCustomersGlobal = mutation({
    args: {},
    handler: async (ctx) => {
        const customers = await ctx.db.query("customers").collect();

        for (const customer of customers) {
            await ctx.db.patch(customer._id, {
                isActive: false,
                updatedAt: Date.now(),
            });
        }
        return customers.length;
    },
});
