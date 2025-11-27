import { query } from "./_generated/server";
import { v } from "convex/values";

// ========== EQUITY MONITORING FUNCTIONS (CORRECTED) ==========

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
    
    // Get all equity valuations in the date range
    const allEquityValuations = await ctx.db
      .query("simpleEquityValuations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
    
    // Filter valuations in the date range
    const filteredValuations = allEquityValuations.filter((valuation) => {
      const dateKey = valuation.year * 12 + valuation.month;
      const startKey = startYear * 12 + adjustedStartMonth;
      const endKey = endYear * 12 + endMonth;
      return dateKey >= startKey && dateKey <= endKey;
    });
    
    // Get current total equity from latest valuations
    const equitySummary = await ctx.db
      .query("simpleEquityValuations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const currentEquity = equitySummary.reduce((sum, v) => sum + (v.amount || 0), 0);
    
    // Group equity valuations by month
    const monthlyData: { [key: string]: { equity: number } } = {};
    
    // Initialize all months in range
    for (let i = 0; i < monthsToFetch; i++) {
      const month = adjustedStartMonth + i;
      const year = month > 12 ? startYear + 1 : startYear;
      const adjustedMonth = month > 12 ? month - 12 : month;
      const key = `${year}-${adjustedMonth.toString().padStart(2, '0')}`;
      monthlyData[key] = { equity: 0 };
    }
    
    // Process equity valuations
    filteredValuations.forEach(valuation => {
      const key = `${valuation.year}-${valuation.month.toString().padStart(2, '0')}`;
      if (monthlyData[key]) {
        monthlyData[key].equity += valuation.amount;
      }
    });
    
    // Calculate equity history for each month
    const equityHistory = Object.entries(monthlyData).map(([monthYear, data]) => ({
      month: monthYear,
      assets: 0, // Not used for equity monitoring
      liabilities: 0, // Not used for equity monitoring
      netWorth: data.equity, // This is the equity value
    }));
    
    // Sort by date
    equityHistory.sort((a, b) => a.month.localeCompare(b.month));
    
    return {
      currentNetWorth: currentEquity,
      currentAssets: 0, // Not used for equity monitoring
      currentLiabilities: 0, // Not used for equity monitoring
      history: equityHistory,
      lastUpdated: Date.now(),
    };
  },
});