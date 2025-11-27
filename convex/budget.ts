import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ========== BUDGET INCOME MANAGEMENT ==========

export const getBudgetIncome = query({
    args: {
        workspaceId: v.id("workspaces"),
        year: v.number(),
        month: v.number(),
    },
    handler: async (ctx, args) => {
        const income = await ctx.db
            .query("budgetIncome")
            .withIndex("by_workspace_period", (q: any) =>
                q.eq("workspaceId", args.workspaceId)
                    .eq("year", args.year)
                    .eq("month", args.month)
            )
            .first();

        return income;
    },
});

export const setBudgetIncome = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        userId: v.id("users"),
        year: v.number(),
        month: v.number(),
        amount: v.number(),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("budgetIncome")
            .withIndex("by_workspace_period", (q: any) =>
                q.eq("workspaceId", args.workspaceId)
                    .eq("year", args.year)
                    .eq("month", args.month)
            )
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                amount: args.amount,
                notes: args.notes,
                updatedAt: Date.now(),
            });
            return existing._id;
        } else {
            return await ctx.db.insert("budgetIncome", {
                workspaceId: args.workspaceId,
                userId: args.userId,
                year: args.year,
                month: args.month,
                amount: args.amount,
                notes: args.notes,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        }
    },
});

// ========== BUDGET OUTGOINGS MANAGEMENT ==========

// List budget outgoings with optional monthly overrides
export const listBudgetOutgoings = query({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("budgetOutgoings")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();
    },
});

export const getBudgetOutgoings = query({
    args: {
        workspaceId: v.id("workspaces"),
        year: v.number(),
        month: v.number(),
    },
    handler: async (ctx, args) => {
        const outgoings = await ctx.db
            .query("budgetOutgoings")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();

        // Fetch monthly overrides
        const monthlyOutgoings = await ctx.db
            .query("budgetMonthlyOutgoings")
            .withIndex("by_workspace_period", (q: any) =>
                q.eq("workspaceId", args.workspaceId)
                    .eq("year", args.year)
                    .eq("month", args.month)
            )
            .collect();

        // Create a map for faster lookup
        const monthlyMap = new Map(monthlyOutgoings.map(m => [m.outgoingId, m.amount]));

        // Merge default amounts with monthly overrides
        return outgoings.map(outgoing => ({
            ...outgoing,
            amount: monthlyMap.has(outgoing._id) ? monthlyMap.get(outgoing._id)! : outgoing.amount,
            defaultAmount: outgoing.amount, // Keep track of the default
            isMonthlyOverride: monthlyMap.has(outgoing._id)
        }));
    },
});

export const setBudgetMonthlyOutgoing = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        outgoingId: v.id("budgetOutgoings"),
        year: v.number(),
        month: v.number(),
        amount: v.number(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("budgetMonthlyOutgoings")
            .withIndex("by_outgoing_period", (q: any) =>
                q.eq("outgoingId", args.outgoingId)
                    .eq("year", args.year)
                    .eq("month", args.month)
            )
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                amount: args.amount,
                updatedAt: Date.now(),
            });
            return existing._id;
        } else {
            return await ctx.db.insert("budgetMonthlyOutgoings", {
                workspaceId: args.workspaceId,
                outgoingId: args.outgoingId,
                year: args.year,
                month: args.month,
                amount: args.amount,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        }
    },
});

export const createBudgetOutgoing = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        userId: v.id("users"),
        name: v.string(),
        category: v.string(),
        amount: v.number(),
        isFixed: v.boolean(),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("budgetOutgoings", {
            workspaceId: args.workspaceId,
            userId: args.userId,
            name: args.name,
            category: args.category,
            amount: args.amount,
            isFixed: args.isFixed,
            notes: args.notes,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

export const updateBudgetOutgoing = mutation({
    args: {
        id: v.id("budgetOutgoings"),
        name: v.optional(v.string()),
        category: v.optional(v.string()),
        amount: v.optional(v.number()),
        isFixed: v.optional(v.boolean()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, {
            ...updates,
            updatedAt: Date.now(),
        });
        return id;
    },
});

export const deleteBudgetOutgoing = mutation({
    args: { id: v.id("budgetOutgoings") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
        return args.id;
    },
});

// ========== BUDGET SUMMARY ==========

export const getBudgetSummary = query({
    args: {
        workspaceId: v.id("workspaces"),
        year: v.number(),
        month: v.number(),
    },
    handler: async (ctx, args) => {
        // Get income for the period
        const income = await ctx.db
            .query("budgetIncome")
            .withIndex("by_workspace_period", (q: any) =>
                q.eq("workspaceId", args.workspaceId)
                    .eq("year", args.year)
                    .eq("month", args.month)
            )
            .first();

        // Get all outgoings
        const outgoings = await ctx.db
            .query("budgetOutgoings")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();

        // Get monthly overrides
        const monthlyOutgoings = await ctx.db
            .query("budgetMonthlyOutgoings")
            .withIndex("by_workspace_period", (q: any) =>
                q.eq("workspaceId", args.workspaceId)
                    .eq("year", args.year)
                    .eq("month", args.month)
            )
            .collect();

        const monthlyMap = new Map(monthlyOutgoings.map(m => [m.outgoingId, m.amount]));

        // Calculate total outgoings with overrides
        const totalOutgoings = outgoings.reduce((sum, outgoing) => {
            const amount = monthlyMap.has(outgoing._id) ? monthlyMap.get(outgoing._id)! : outgoing.amount;
            return sum + amount;
        }, 0);

        const totalIncome = income?.amount || 0;
        const surplus = totalIncome - totalOutgoings;
        const isHealthy = surplus >= 0;

        return {
            income: totalIncome,
            outgoings: totalOutgoings,
            surplus,
            isHealthy,
            outgoingsCount: outgoings.length,
            outgoingsByCategory: outgoings.reduce((acc, outgoing) => {
                const amount = monthlyMap.has(outgoing._id) ? monthlyMap.get(outgoing._id)! : outgoing.amount;
                if (!acc[outgoing.category]) {
                    acc[outgoing.category] = 0;
                }
                acc[outgoing.category] += amount;
                return acc;
            }, {} as Record<string, number>),
        };
    },
});

// ========== BUDGET HISTORY ==========

export const getBudgetHistory = query({
    args: {
        workspaceId: v.id("workspaces"),
        monthsBack: v.number(),
    },
    handler: async (ctx, args) => {
        const now = new Date();
        const history = [];

        for (let i = 0; i < args.monthsBack; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;

            const income = await ctx.db
                .query("budgetIncome")
                .withIndex("by_workspace_period", (q: any) =>
                    q.eq("workspaceId", args.workspaceId)
                        .eq("year", year)
                        .eq("month", month)
                )
                .first();

            const outgoings = await ctx.db
                .query("budgetOutgoings")
                .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
                .collect();

            // Get monthly overrides for this specific month in history
            const monthlyOutgoings = await ctx.db
                .query("budgetMonthlyOutgoings")
                .withIndex("by_workspace_period", (q: any) =>
                    q.eq("workspaceId", args.workspaceId)
                        .eq("year", year)
                        .eq("month", month)
                )
                .collect();

            const monthlyMap = new Map(monthlyOutgoings.map(m => [m.outgoingId, m.amount]));

            const totalIncome = income?.amount || 0;
            const totalOutgoings = outgoings.reduce((sum, outgoing) => {
                const amount = monthlyMap.has(outgoing._id) ? monthlyMap.get(outgoing._id)! : outgoing.amount;
                return sum + amount;
            }, 0);

            history.push({
                year,
                month,
                income: totalIncome,
                outgoings: totalOutgoings,
                surplus: totalIncome - totalOutgoings,
            });
        }

        return history.reverse();
    },
});

export const getMonthlyOverrides = query({
    args: {
        workspaceId: v.id("workspaces"),
        year: v.number(),
        month: v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("budgetMonthlyOutgoings")
            .withIndex("by_workspace_period", (q: any) =>
                q.eq("workspaceId", args.workspaceId)
                    .eq("year", args.year)
                    .eq("month", args.month)
            )
            .collect();
    },
});

export const getYearlyBudget = query({
    args: {
        workspaceId: v.id("workspaces"),
        year: v.number(),
    },
    handler: async (ctx, args) => {
        // 1. Get all income for the year
        const incomes = await ctx.db
            .query("budgetIncome")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .filter((q) => q.eq(q.field("year"), args.year))
            .collect();

        const incomeMap = new Map(incomes.map((i) => [i.month, i.amount]));

        // 2. Get all default outgoings
        const defaultOutgoings = await ctx.db
            .query("budgetOutgoings")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();

        // 3. Get all monthly overrides for the year
        const overrides = await ctx.db
            .query("budgetMonthlyOutgoings")
            .withIndex("by_workspace_period", (q: any) =>
                q.eq("workspaceId", args.workspaceId).eq("year", args.year)
            )
            .collect();

        // Map overrides by month -> outgoingId -> amount
        const overridesMap = new Map<number, Map<string, number>>();
        overrides.forEach((o) => {
            if (!overridesMap.has(o.month)) {
                overridesMap.set(o.month, new Map());
            }
            overridesMap.get(o.month)!.set(o.outgoingId, o.amount);
        });

        // 4. Calculate monthly totals
        const months = [];
        let yearlyIncome = 0;
        let yearlyOutgoings = 0;

        for (let month = 1; month <= 12; month++) {
            const monthlyIncome = incomeMap.get(month) || 0;

            let monthlyOutgoingTotal = 0;
            const monthOverrides = overridesMap.get(month);

            defaultOutgoings.forEach((outgoing) => {
                let amount = outgoing.amount;
                if (monthOverrides && monthOverrides.has(outgoing._id)) {
                    amount = monthOverrides.get(outgoing._id)!;
                }
                monthlyOutgoingTotal += amount;
            });

            months.push({
                month,
                income: monthlyIncome,
                outgoings: monthlyOutgoingTotal,
                surplus: monthlyIncome - monthlyOutgoingTotal,
            });

            yearlyIncome += monthlyIncome;
            yearlyOutgoings += monthlyOutgoingTotal;
        }

        return {
            year: args.year,
            months,
            yearlyTotal: {
                income: yearlyIncome,
                outgoings: yearlyOutgoings,
                surplus: yearlyIncome - yearlyOutgoings,
                isHealthy: yearlyIncome >= yearlyOutgoings,
            },
        };
    },
});
