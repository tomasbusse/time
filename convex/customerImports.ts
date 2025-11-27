import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a new import batch record
 */
export const createImportBatch = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        batchId: v.string(),
        fileName: v.string(),
        customerCount: v.number(),
        importedBy: v.id("users"), // Pass from frontend
    },
    handler: async (ctx, args) => {
        const importId = await ctx.db.insert("customerImports", {
            workspaceId: args.workspaceId,
            batchId: args.batchId,
            fileName: args.fileName,
            importedAt: Date.now(),
            importedBy: args.importedBy,
            customerCount: args.customerCount,
            status: "completed",
        });

        return importId;
    },
});

/**
 * Rollback an import batch - deletes all customers from that batch
 */
export const rollbackImportBatch = mutation({
    args: {
        batchId: v.string(),
        rolledBackBy: v.id("users"), // Pass from frontend
    },
    handler: async (ctx, args) => {
        // Find the import batch
        const importBatch = await ctx.db
            .query("customerImports")
            .withIndex("by_batch_id", (q) => q.eq("batchId", args.batchId))
            .unique();

        if (!importBatch) throw new Error("Import batch not found");
        if (importBatch.status === "rolled_back") {
            throw new Error("This import has already been rolled back");
        }

        // Find all customers with this batchId
        const customers = await ctx.db
            .query("customers")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", importBatch.workspaceId))
            .collect();

        const customersToDelete = customers.filter(
            (c) => c.importBatchId === args.batchId
        );

        // Delete all customers from this batch
        for (const customer of customersToDelete) {
            // Also delete related students
            const students = await ctx.db
                .query("students")
                .withIndex("by_customer", (q) => q.eq("customerId", customer._id))
                .collect();

            for (const student of students) {
                await ctx.db.delete(student._id);
            }

            // Also delete related groups
            const groups = await ctx.db
                .query("studentGroups")
                .withIndex("by_customer", (q) => q.eq("customerId", customer._id))
                .collect();

            for (const group of groups) {
                await ctx.db.delete(group._id);
            }

            // Delete the customer
            await ctx.db.delete(customer._id);
        }

        // Update the import batch status
        await ctx.db.patch(importBatch._id, {
            status: "rolled_back",
            rolledBackAt: Date.now(),
            rolledBackBy: args.rolledBackBy,
        });

        return {
            deletedCount: customersToDelete.length,
            batchId: args.batchId,
        };
    },
});

/**
 * List all import batches for a workspace
 */
export const listImportBatches = query({
    args: {
        workspaceId: v.id("workspaces"),
    },
    handler: async (ctx, args) => {
        const batches = await ctx.db
            .query("customerImports")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .order("desc")

            .collect();

        return batches;
    },
});

/**
 * Get details of a specific import batch
 */
export const getImportBatch = query({
    args: {
        batchId: v.string(),
    },
    handler: async (ctx, args) => {
        const batch = await ctx.db
            .query("customerImports")
            .withIndex("by_batch_id", (q) => q.eq("batchId", args.batchId))
            .unique();

        return batch;
    },
});
