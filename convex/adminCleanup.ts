import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * ADMIN ONLY: Delete all customers in a workspace
 * WARNING: This is for testing/cleanup purposes only!
 */
export const deleteAllCustomers = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        confirm: v.string(), // Must pass "DELETE_ALL_CUSTOMERS" to confirm
    },
    handler: async (ctx, args) => {
        if (args.confirm !== "DELETE_ALL_CUSTOMERS") {
            throw new Error("Confirmation string does not match");
        }

        const customers = await ctx.db
            .query("customers")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();

        let count = 0;
        for (const customer of customers) {
            // Delete related students
            const students = await ctx.db
                .query("students")
                .withIndex("by_customer", (q) => q.eq("customerId", customer._id))
                .collect();
            for (const student of students) {
                await ctx.db.delete(student._id);
            }

            // Delete related groups
            const groups = await ctx.db
                .query("studentGroups")
                .withIndex("by_customer", (q) => q.eq("customerId", customer._id))
                .collect();
            for (const group of groups) {
                await ctx.db.delete(group._id);
            }

            // Delete the customer
            await ctx.db.delete(customer._id);
            count++;
        }

        return { deletedCount: count };
    },
});
