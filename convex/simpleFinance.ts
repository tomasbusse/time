import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ========== SIMPLE ASSET MANAGEMENT ==========

export const createSimpleAsset = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    type: v.string(),
    currentValue: v.number(),
    purchaseValue: v.optional(v.number()),
    purchaseDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("simpleAssets", {
      workspaceId: args.workspaceId,
      name: args.name,
      type: args.type,
      currentValue: args.currentValue,
      purchaseValue: args.purchaseValue,
      purchaseDate: args.purchaseDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const listSimpleAssets = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("simpleAssets")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

export const updateSimpleAsset = mutation({
  args: {
    id: v.id("simpleAssets"),
    name: v.optional(v.string()),
    type: v.optional(v.string()),
    currentValue: v.optional(v.number()),
    purchaseValue: v.optional(v.number()),
    purchaseDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.id);
    if (!asset) throw new Error("Asset not found");

    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.type !== undefined) updates.type = args.type;
    if (args.currentValue !== undefined) updates.currentValue = args.currentValue;
    if (args.purchaseValue !== undefined) updates.purchaseValue = args.purchaseValue;
    if (args.purchaseDate !== undefined) updates.purchaseDate = args.purchaseDate;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const deleteSimpleAsset = mutation({
  args: { id: v.id("simpleAssets") },
  handler: async (ctx, args) => {
    // First, get the asset to retrieve its workspaceId
    const assetToDelete = await ctx.db.get(args.id);
    if (!assetToDelete) throw new Error("Asset not found");

    // Then, delete all monthly balance records associated with this asset
    const balances = await ctx.db
      .query("simpleAssetMonthlyBalances")
      .withIndex("by_workspace_asset", (q) =>
        q.eq("workspaceId", assetToDelete.workspaceId).eq("assetId", args.id)
      )
      .collect();

    for (const balance of balances) {
      await ctx.db.delete(balance._id);
    }

    // Then delete the asset itself
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const reorderSimpleAssets = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    assetId: v.id("simpleAssets"),
    direction: v.union(v.literal("up"), v.literal("down")),
  },
  handler: async (ctx, args) => {
    // 1. Get all bank accounts sorted by order
    const assets = await ctx.db
      .query("simpleAssets")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("type"), "bank_account"))
      .collect();

    // Ensure they are sorted
    const sorted = assets.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    // 2. Find the current item's index
    const currentIndex = sorted.findIndex(a => a._id === args.assetId);
    if (currentIndex === -1) throw new Error("Asset not found");

    // 3. Determine the neighbor to swap with
    let neighborIndex = -1;
    if (args.direction === "up") {
      neighborIndex = currentIndex - 1;
    } else {
      neighborIndex = currentIndex + 1;
    }

    // 4. Check bounds
    if (neighborIndex < 0 || neighborIndex >= sorted.length) {
      return; // Can't move further
    }

    // 5. Swap sortOrders
    const currentAsset = sorted[currentIndex];
    const neighborAsset = sorted[neighborIndex];

    // Use the neighbor's order for current, and current's order for neighbor
    // If sortOrder is missing, fallback to index
    const currentOrder = currentAsset.sortOrder ?? currentIndex;
    const neighborOrder = neighborAsset.sortOrder ?? neighborIndex;

    await ctx.db.patch(currentAsset._id, { sortOrder: neighborOrder });
    await ctx.db.patch(neighborAsset._id, { sortOrder: currentOrder });

    return args.assetId;
  },
});

// ========== SIMPLE LIABILITY MANAGEMENT ==========

export const createSimpleLiability = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    type: v.string(),
    currentBalance: v.number(),
    originalAmount: v.optional(v.number()),
    interestRate: v.optional(v.number()),
    monthlyPayment: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("simpleLiabilities", {
      workspaceId: args.workspaceId,
      name: args.name,
      type: args.type,
      currentBalance: args.currentBalance,
      originalAmount: args.originalAmount,
      interestRate: args.interestRate,
      monthlyPayment: args.monthlyPayment,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const listSimpleLiabilities = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("simpleLiabilities")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

export const updateSimpleLiability = mutation({
  args: {
    id: v.id("simpleLiabilities"),
    name: v.optional(v.string()),
    type: v.optional(v.string()),
    currentBalance: v.optional(v.number()),
    originalAmount: v.optional(v.number()),
    interestRate: v.optional(v.number()),
    monthlyPayment: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const liability = await ctx.db.get(args.id);
    if (!liability) throw new Error("Liability not found");

    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.type !== undefined) updates.type = args.type;
    if (args.currentBalance !== undefined) updates.currentBalance = args.currentBalance;
    if (args.originalAmount !== undefined) updates.originalAmount = args.originalAmount;
    if (args.interestRate !== undefined) updates.interestRate = args.interestRate;
    if (args.monthlyPayment !== undefined) updates.monthlyPayment = args.monthlyPayment;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const deleteSimpleLiability = mutation({
  args: { id: v.id("simpleLiabilities") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// ========== SIMPLE MONTHLY VALUATIONS ==========

export const createMonthlyValuation = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    itemType: v.union(v.literal("asset"), v.literal("liability")),
    itemId: v.union(v.id("simpleAssets"), v.id("simpleLiabilities")),
    year: v.number(),
    month: v.number(),
    value: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("simpleMonthlyValuations", {
      workspaceId: args.workspaceId,
      itemType: args.itemType,
      itemId: args.itemId,
      year: args.year,
      month: args.month,
      value: args.value,
      notes: args.notes,
      createdAt: Date.now(),
    });
  },
});

export const listMonthlyValuations = query({
  args: {
    workspaceId: v.id("workspaces"),
    itemType: v.optional(v.union(v.literal("asset"), v.literal("liability"))),
    itemId: v.optional(v.union(v.id("simpleAssets"), v.id("simpleLiabilities"))),
    year: v.optional(v.number()),
    month: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const valuations = await ctx.db
      .query("simpleMonthlyValuations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    return valuations
      .filter((valuation) => {
        if (args.itemType && valuation.itemType !== args.itemType) return false;
        if (args.itemId && valuation.itemId !== args.itemId) return false;
        if (args.year && valuation.year !== args.year) return false;
        if (args.month && valuation.month !== args.month) return false;
        return true;
      })
      .sort((a, b) => {
        const aKey = a.year * 12 + a.month;
        const bKey = b.year * 12 + b.month;
        return bKey - aKey;
      });
  },
});

// ========== SIMPLE SUMMARY QUERIES ==========

export const getSimpleNetWorth = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const assets = await ctx.db
      .query("simpleAssets")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const liabilities = await ctx.db
      .query("simpleLiabilities")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const totalAssets = assets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0);
    const totalLiabilities = liabilities.reduce((sum, liability) => sum + (liability.currentBalance || 0), 0);

    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      assetCount: assets.length,
      liabilityCount: liabilities.length,
    };
  },
});

export const getSimpleProgress = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    // Get valuations for current month and previous month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;

    const currentValuations = await ctx.db
      .query("simpleMonthlyValuations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) =>
        q.eq(q.field("year"), currentYear) &&
        q.eq(q.field("month"), currentMonth)
      )
      .collect();

    const previousValuations = await ctx.db
      .query("simpleMonthlyValuations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) =>
        q.eq(q.field("year"), previousYear) &&
        q.eq(q.field("month"), previousMonth)
      )
      .collect();

    // Calculate totals
    const currentTotal = currentValuations.reduce((sum, v) => sum + v.value, 0);
    const previousTotal = previousValuations.reduce((sum, v) => sum + v.value, 0);
    const change = currentTotal - previousTotal;
    const changePercent = previousTotal > 0 ? (change / previousTotal) * 100 : 0;

    return {
      currentMonth: `${currentYear}-${currentMonth.toString().padStart(2, '0')}`,
      previousMonth: `${previousYear}-${previousMonth.toString().padStart(2, '0')}`,
      currentTotal,
      previousTotal,
      change,
      changePercent,
      valuationCount: currentValuations.length,
    };
  },
});

/**
 * ====================================================
 * SIMPLE EQUITY SYSTEM (Standalone from Assets/Liabilities)
 * ====================================================
 */

export const createSimpleEquityAccount = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    type: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("simpleEquityAccounts", {
      workspaceId: args.workspaceId,
      name: args.name,
      type: args.type,
      description: args.description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const listSimpleEquityAccounts = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("simpleEquityAccounts")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

export const updateSimpleEquityAccount = mutation({
  args: {
    id: v.id("simpleEquityAccounts"),
    name: v.optional(v.string()),
    type: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.id);
    if (!account) throw new Error("Equity account not found");

    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.type !== undefined) updates.type = args.type;
    if (args.description !== undefined) updates.description = args.description;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const deleteSimpleEquityAccount = mutation({
  args: { id: v.id("simpleEquityAccounts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const createEquityValuation = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    equityAccountId: v.id("simpleEquityAccounts"),
    year: v.number(),
    month: v.number(),
    amount: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("simpleEquityValuations", {
      workspaceId: args.workspaceId,
      equityAccountId: args.equityAccountId,
      year: args.year,
      month: args.month,
      amount: args.amount,
      notes: args.notes,
      createdAt: Date.now(),
    });
  },
});

export const listEquityValuations = query({
  args: { workspaceId: v.id("workspaces"), equityAccountId: v.optional(v.id("simpleEquityAccounts")) },
  handler: async (ctx, args) => {
    const q = ctx.db
      .query("simpleEquityValuations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId));
    const vals = await q.collect();
    return args.equityAccountId ? vals.filter(v => v.equityAccountId === args.equityAccountId) : vals;
  },
});

// Update existing valuation
export const updateEquityValuation = mutation({
  args: {
    id: v.id("simpleEquityValuations"),
    year: v.optional(v.number()),
    month: v.optional(v.number()),
    amount: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const valuation = await ctx.db.get(args.id);
    if (!valuation) throw new Error("Valuation not found");
    const updates: any = {};
    if (args.year !== undefined) updates.year = args.year;
    if (args.month !== undefined) updates.month = args.month;
    if (args.amount !== undefined) updates.amount = args.amount;
    if (args.notes !== undefined) updates.notes = args.notes;
    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

// Delete valuation
export const deleteEquityValuation = mutation({
  args: {
    id: v.id("simpleEquityValuations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const getEquitySummary = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const accounts = await ctx.db
      .query("simpleEquityAccounts")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const valuations = await ctx.db
      .query("simpleEquityValuations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const totals: { [id: string]: number } = {};
    valuations.forEach(v => {
      const eqId = v.equityAccountId as string;
      totals[eqId] = (totals[eqId] || 0) + v.amount;
    });

    const totalEquity = Object.values(totals).reduce((acc, val) => acc + val, 0);

    return { accounts, totalEquity, count: accounts.length };
  },
});

// ========== EQUITY MONITORING FUNCTIONS ==========

export const getEquityMonitoring = query({
  args: {
    workspaceId: v.id("workspaces"),
    months: v.optional(v.number()) // Default to 12 months
  },
  handler: async (ctx, args) => {
    const monthsToFetch = args.months || 12;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Calculate date range
    const endYear = currentYear;
    const endMonth = currentMonth;
    const startMonth = currentMonth - monthsToFetch + 1;
    const startYear = startMonth > 0 ? currentYear : currentYear - 1;
    const adjustedStartMonth = startMonth > 0 ? startMonth : startMonth + 12;

    // Get all valuations in the date range
    const allValuations = await ctx.db
      .query("simpleMonthlyValuations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Filter valuations in the date range
    const filteredValuations = allValuations.filter((valuation) => {
      const dateKey = valuation.year * 12 + valuation.month;
      const startKey = startYear * 12 + adjustedStartMonth;
      const endKey = endYear * 12 + endMonth;
      return dateKey >= startKey && dateKey <= endKey;
    });

    // Get current net worth
    const assets = await ctx.db
      .query("simpleAssets")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const liabilities = await ctx.db
      .query("simpleLiabilities")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const totalAssets = assets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0);
    const totalLiabilities = liabilities.reduce((sum, liability) => sum + (liability.currentBalance || 0), 0);
    const netWorthData = {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
    };

    // Group valuations by month
    const monthlyData: { [key: string]: { assets: number; liabilities: number; netWorth: number } } = {};

    // Initialize all months in range
    for (let i = 0; i < monthsToFetch; i++) {
      const month = adjustedStartMonth + i;
      const year = month > 12 ? startYear + 1 : startYear;
      const adjustedMonth = month > 12 ? month - 12 : month;
      const key = `${year}-${adjustedMonth.toString().padStart(2, '0')}`;
      monthlyData[key] = { assets: 0, liabilities: 0, netWorth: 0 };
    }

    // Process valuations
    filteredValuations.forEach(valuation => {
      const key = `${valuation.year}-${valuation.month.toString().padStart(2, '0')}`;
      if (monthlyData[key]) {
        if (valuation.itemType === "asset") {
          monthlyData[key].assets += valuation.value;
        } else if (valuation.itemType === "liability") {
          monthlyData[key].liabilities += valuation.value;
        }
      }
    });

    // Calculate net worth for each month
    const equityHistory = Object.entries(monthlyData).map(([monthYear, data]) => ({
      month: monthYear,
      assets: data.assets,
      liabilities: data.liabilities,
      netWorth: data.assets - data.liabilities,
    }));

    // Sort by date
    equityHistory.sort((a, b) => a.month.localeCompare(b.month));

    return {
      currentNetWorth: netWorthData.netWorth,
      currentAssets: netWorthData.totalAssets,
      currentLiabilities: netWorthData.totalLiabilities,
      history: equityHistory,
      lastUpdated: Date.now(),
    };
  },
});

export const createEquitySnapshot = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    year: v.number(),
    month: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Create snapshot for assets
    const assets = await ctx.db
      .query("simpleAssets")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    for (const asset of assets) {
      // Check if snapshot already exists for this asset and period
      const existing = await ctx.db
        .query("simpleMonthlyValuations")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .filter((q) => {
          const record = q.and(
            q.eq(q.field("itemType"), "asset"),
            q.eq(q.field("itemId"), asset._id),
            q.eq(q.field("year"), args.year),
            q.eq(q.field("month"), args.month)
          );
          return record;
        })
        .first();

      if (!existing) {
        await ctx.db.insert("simpleMonthlyValuations", {
          workspaceId: args.workspaceId,
          itemType: "asset",
          itemId: asset._id,
          year: args.year,
          month: args.month,
          value: asset.currentValue,
          notes: args.notes,
          createdAt: Date.now(),
        });
      }
    }

    // Create snapshot for liabilities
    const liabilities = await ctx.db
      .query("simpleLiabilities")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    for (const liability of liabilities) {
      // Check if snapshot already exists for this liability and period
      const existing = await ctx.db
        .query("simpleMonthlyValuations")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .filter((q) => {
          const record = q.and(
            q.eq(q.field("itemType"), "liability"),
            q.eq(q.field("itemId"), liability._id),
            q.eq(q.field("year"), args.year),
            q.eq(q.field("month"), args.month)
          );
          return record;
        })
        .first();

      if (!existing) {
        await ctx.db.insert("simpleMonthlyValuations", {
          workspaceId: args.workspaceId,
          itemType: "liability",
          itemId: liability._id,
          year: args.year,
          month: args.month,
          value: liability.currentBalance,
          notes: args.notes,
          createdAt: Date.now(),
        });
      }
    }

    return {
      success: true,
      snapshotMonth: `${args.year}-${args.month.toString().padStart(2, '0')}`,
      assetsCount: assets.length,
      liabilitiesCount: liabilities.length,
    };
  },
});

export const getEquityGoalProgress = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    // Use standalone equity valuations instead of assets/liabilities for current equity total
    const valuations = await ctx.db
      .query("simpleEquityValuations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const currentEquity = valuations.reduce((sum, v) => sum + (v.amount || 0), 0);

    // Fetch most recent equity goal
    const goals = await ctx.db
      .query("equityGoals")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    if (goals.length === 0) {
      return {
        hasGoal: false,
        currentEquity,
        targetEquity: 0,
        progress: 0,
        remaining: 0,
        targetDate: null,
        daysRemaining: null,
      };
    }

    const goal = goals.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0];
    const targetEquity = goal.targetEquity;
    const progress = targetEquity > 0 ? Math.min((currentEquity / targetEquity) * 100, 100) : 0;
    const remaining = Math.max(targetEquity - currentEquity, 0);

    let daysRemaining = null;
    if (goal.targetDate) {
      const targetDate = new Date(goal.targetDate);
      const now = new Date();
      daysRemaining = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    }

    return {
      hasGoal: true,
      currentEquity,
      targetEquity,
      progress,
      remaining,
      targetDate: goal.targetDate,
      daysRemaining,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    };
  },
});

// ===============================
// EQUITY GOAL CREATION & EDITING
// ===============================

export const upsertEquityGoal = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    ownerId: v.id("users"),
    targetEquity: v.number(),
    targetDate: v.optional(v.string()),
    year: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check existing goal for this workspace and year (if provided)
    const existing = await ctx.db
      .query("equityGoals")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const year = args.year || new Date().getFullYear();

    const match = existing.find((g) => {
      const gYear = g.targetDate ? new Date(g.targetDate).getFullYear() : year;
      return gYear === year;
    });

    if (match) {
      await ctx.db.patch(match._id, {
        targetEquity: args.targetEquity,
        targetDate: args.targetDate,
        updatedAt: Date.now(),
      });
      return match._id;
    }

    const id = await ctx.db.insert("equityGoals", {
      workspaceId: args.workspaceId,
      ownerId: args.ownerId,
      targetEquity: args.targetEquity,
      targetDate: args.targetDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return id;
  },
});

// ========== MONTHLY BALANCE FUNCTIONS ==========

export const recordMonthlyBalance = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    assetId: v.id("simpleAssets"),
    month: v.string(), // "YYYY-MM"
    balance: v.number(),
    notes: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("simpleAssetMonthlyBalances")
      .withIndex("by_workspace_asset", (q: any) =>
        q.eq("workspaceId", args.workspaceId).eq("assetId", args.assetId)
      )
      .filter((q) => q.eq(q.field("month"), args.month))
      .first();

    if (existing) {
      return await ctx.db.patch(existing._id, {
        balance: args.balance,
        notes: args.notes,
      });
    } else {
      return await ctx.db.insert("simpleAssetMonthlyBalances", {
        workspaceId: args.workspaceId,
        assetId: args.assetId,
        month: args.month,
        balance: args.balance,
        notes: args.notes,
        createdAt: Date.now(),
        createdBy: args.userId,
      });
    }
  },
});

export const getMonthlyBalances = query({
  args: {
    workspaceId: v.id("workspaces"),
    month: v.string(), // "YYYY-MM"
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("simpleAssetMonthlyBalances")
      .withIndex("by_workspace_month", (q: any) =>
        q.eq("workspaceId", args.workspaceId).eq("month", args.month)
      )
      .collect();
  },
});

export const getLiquidityHistory = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const balances = await ctx.db
      .query("simpleAssetMonthlyBalances")
      .withIndex("by_workspace_month", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const history: Record<string, number> = {};
    for (const balance of balances) {
      history[balance.month] = (history[balance.month] || 0) + balance.balance;
    }

    return Object.entries(history)
      .map(([month, totalLiquidity]) => ({
        month,
        totalLiquidity,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  },
});

export const deleteMonthlyBalance = mutation({
  args: { id: v.id("simpleAssetMonthlyBalances") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const resetLiquidityHistory = mutation({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db.query("simpleAssetMonthlyBalances").collect();
    for (const r of records) {
      await ctx.db.delete(r._id);
    }
    return { success: true, message: `Deleted ${records.length} liquidity history records.` };
  },
});
