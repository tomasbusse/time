import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ========== ACCOUNT MANAGEMENT ==========

export const listAccounts = query({
  args: {
    workspaceId: v.id("workspaces"),
    accountType: v.optional(v.union(
      v.literal("asset"),
      v.literal("liability"),
      v.literal("equity"),
      v.literal("revenue"),
      v.literal("expense")
    )),
  },
  handler: async (ctx, args) => {
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const filtered = args.accountType
      ? accounts.filter((account: any) => account.accountType === args.accountType)
      : accounts;

    return filtered.sort((a: any, b: any) => a.accountCode.localeCompare(b.accountCode));
  },
});

export const getAccountById = query({
  args: { accountId: v.id("accounts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.accountId);
  },
});

export const createAccount = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    accountCode: v.string(),
    accountName: v.string(),
    accountType: v.union(
      v.literal("asset"),
      v.literal("liability"),
      v.literal("equity"),
      v.literal("revenue"),
      v.literal("expense")
    ),
    accountCategory: v.string(),
    isActive: v.boolean(),
    parentAccountId: v.optional(v.id("accounts")),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("accounts")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("accountCode"), args.accountCode))
      .first();

    if (existing) {
      throw new Error("Account code already exists in this workspace");
    }

    const accountId = await ctx.db.insert("accounts", {
      workspaceId: args.workspaceId,
      accountCode: args.accountCode,
      accountName: args.accountName,
      accountType: args.accountType,
      accountCategory: args.accountCategory,
      isActive: args.isActive,
      parentAccountId: args.parentAccountId,
      createdBy: args.createdBy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create initial balance record
    await ctx.db.insert("accountBalances", {
      workspaceId: args.workspaceId,
      accountId,
      currentBalance: 0,
      lastUpdated: Date.now(),
      createdAt: Date.now(),
    });

    return accountId;
  },
});

export const updateAccount = mutation({
  args: {
    accountId: v.id("accounts"),
    accountName: v.optional(v.string()),
    accountCategory: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId);
    if (!account) throw new Error("Account not found");

    await ctx.db.patch(args.accountId, {
      accountName: args.accountName ?? account.accountName,
      accountCategory: args.accountCategory ?? account.accountCategory,
      isActive: args.isActive ?? account.isActive,
      updatedAt: Date.now(),
    });
  },
});

export const deleteAccount = mutation({
  args: { accountId: v.id("accounts") },
  handler: async (ctx, args) => {
    // Check if account has transactions or balances
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_account", (q) => q.eq("accountId", args.accountId))
      .collect();

    const balances = await ctx.db
      .query("accountBalances")
      .withIndex("by_account", (q) => q.eq("accountId", args.accountId))
      .collect();

    if (transactions.length > 0 || balances.length > 0) {
      throw new Error("Cannot delete account with existing transactions or balances");
    }

    await ctx.db.delete(args.accountId);
  },
});

// Initialize default chart of accounts for a workspace
export const initializeDefaultAccounts = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if accounts already exist
    const existingAccounts = await ctx.db
      .query("accounts")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    if (existingAccounts.length > 0) {
      return; // Accounts already initialized
    }

    // Create default chart of accounts
    const defaultAccounts = [
      // Assets (1000-1999)
      { code: "1000", name: "Cash", type: "asset", category: "current_asset" },
      { code: "1100", name: "Checking Account", type: "asset", category: "current_asset" },
      { code: "1200", name: "Savings Account", type: "asset", category: "current_asset" },
      { code: "1300", name: "Investment Account", type: "asset", category: "current_asset" },
      { code: "1400", name: "Accounts Receivable", type: "asset", category: "current_asset" },
      { code: "1500", name: "Inventory", type: "asset", category: "current_asset" },
      { code: "1600", name: "Prepaid Expenses", type: "asset", category: "current_asset" },
      { code: "1700", name: "Equipment", type: "asset", category: "fixed_asset" },
      { code: "1800", name: "Furniture & Fixtures", type: "asset", category: "fixed_asset" },
      { code: "1900", name: "Real Estate", type: "asset", category: "fixed_asset" },

      // Liabilities (2000-2999)
      { code: "2000", name: "Accounts Payable", type: "liability", category: "current_liability" },
      { code: "2100", name: "Credit Cards", type: "liability", category: "current_liability" },
      { code: "2200", name: "Short-term Loans", type: "liability", category: "current_liability" },
      { code: "2300", name: "Accrued Expenses", type: "liability", category: "current_liability" },
      { code: "2400", name: "Long-term Debt", type: "liability", category: "long_term_liability" },
      { code: "2500", name: "Mortgage Payable", type: "liability", category: "long_term_liability" },

      // Equity (3000-3999)
      { code: "3000", name: "Owner's Equity", type: "equity", category: "equity" },
      { code: "3100", name: "Retained Earnings", type: "equity", category: "equity" },

      // Revenue (4000-4999)
      { code: "4000", name: "Sales Revenue", type: "revenue", category: "revenue" },
      { code: "4100", name: "Service Revenue", type: "revenue", category: "revenue" },
      { code: "4200", name: "Investment Income", type: "revenue", category: "revenue" },

      // Expenses (5000-5999)
      { code: "5000", name: "Cost of Goods Sold", type: "expense", category: "expense" },
      { code: "5100", name: "Salaries & Wages", type: "expense", category: "expense" },
      { code: "5200", name: "Rent Expense", type: "expense", category: "expense" },
      { code: "5300", name: "Utilities", type: "expense", category: "expense" },
      { code: "5400", name: "Insurance", type: "expense", category: "expense" },
      { code: "5500", name: "Marketing & Advertising", type: "expense", category: "expense" },
      { code: "5600", name: "Travel & Entertainment", type: "expense", category: "expense" },
      { code: "5700", name: "Office Supplies", type: "expense", category: "expense" },
      { code: "5800", name: "Professional Services", type: "expense", category: "expense" },
      { code: "5900", name: "Other Expenses", type: "expense", category: "expense" },
    ];

    for (const account of defaultAccounts) {
      const accountId = await ctx.db.insert("accounts", {
        workspaceId: args.workspaceId,
        accountCode: account.code,
        accountName: account.name,
        accountType: account.type as any,
        accountCategory: account.category,
        isActive: true,
        createdBy: args.createdBy,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Create initial balance record
      await ctx.db.insert("accountBalances", {
        workspaceId: args.workspaceId,
        accountId,
        currentBalance: 0,
        lastUpdated: Date.now(),
        createdAt: Date.now(),
      });
    }
  },
});

// ========== TRANSACTION MANAGEMENT ==========

export const addTransaction = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    date: v.number(),
    description: v.string(),
    amount: v.number(),
    accountId: v.id("accounts"),
    transactionType: v.union(v.literal("debit"), v.literal("credit")),
    reference: v.optional(v.string()),
    category: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Create the transaction
    const transactionId = await ctx.db.insert("transactions", {
      workspaceId: args.workspaceId,
      date: args.date,
      description: args.description,
      amount: args.amount,
      accountId: args.accountId,
      transactionType: args.transactionType,
      reference: args.reference,
      category: args.category,
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });

    // Update account balance
    await updateAccountBalance(ctx, args.accountId);

    return transactionId;
  },
});

export const listTransactions = query({
  args: {
    workspaceId: v.id("workspaces"),
    accountId: v.optional(v.id("accounts")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    return transactions
      .filter((transaction) => {
        if (args.accountId && transaction.accountId !== args.accountId) return false;
        if (args.startDate !== undefined && transaction.date < args.startDate) return false;
        if (args.endDate !== undefined && transaction.date > args.endDate) return false;
        if (args.category && transaction.category !== args.category) return false;
        return true;
      })
      .sort((a, b) => b.date - a.date);
  },
});

// ========== BALANCE MANAGEMENT ==========

export const getAccountBalances = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const balances = await ctx.db
      .query("accountBalances")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Create a map for quick balance lookup
    const balanceMap = new Map();
    balances.forEach(balance => {
      balanceMap.set(balance.accountId.toString(), balance.currentBalance);
    });

    return accounts.map(account => ({
      ...account,
      currentBalance: balanceMap.get(account._id.toString()) || 0,
    }));
  },
});

export const getNetWorth = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const balances = await ctx.db
      .query("accountBalances")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const balanceMap = new Map();
    balances.forEach(balance => {
      balanceMap.set(balance.accountId.toString(), balance.currentBalance);
    });

    const totalAssets = accounts
      .filter((account: any) => account.accountType === "asset")
      .reduce((sum: number, account: any) => sum + (balanceMap.get(account._id.toString()) || 0), 0);

    const totalLiabilities = accounts
      .filter((account: any) => account.accountType === "liability")
      .reduce((sum: number, account: any) => sum + (balanceMap.get(account._id.toString()) || 0), 0);

    const totalEquity = accounts
      .filter((account: any) => account.accountType === "equity")
      .reduce((sum: number, account: any) => sum + (balanceMap.get(account._id.toString()) || 0), 0);

    return {
      totalAssets,
      totalLiabilities,
      totalEquity,
      netWorth: totalAssets - totalLiabilities,
    };
  },
});

// ========== MONTHLY VALUATIONS ==========

export const createMonthlyValuation = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    accountId: v.id("accounts"),
    year: v.number(),
    month: v.number(),
    beginningBalance: v.number(),
    endingBalance: v.number(),
    netTransactions: v.number(),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if valuation already exists for this period
    const existing = await ctx.db
      .query("monthlyValuations")
      .withIndex("by_account_period", (q) =>
        q.eq("accountId", args.accountId)
          .eq("year", args.year)
          .eq("month", args.month)
      )
      .first();

    if (existing) {
      throw new Error("Monthly valuation already exists for this period");
    }

    const valuationId = await ctx.db.insert("monthlyValuations", {
      workspaceId: args.workspaceId,
      accountId: args.accountId,
      year: args.year,
      month: args.month,
      beginningBalance: args.beginningBalance,
      endingBalance: args.endingBalance,
      netTransactions: args.netTransactions,
      notes: args.notes,
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });

    return valuationId;
  },
});

export const listMonthlyValuations = query({
  args: {
    workspaceId: v.id("workspaces"),
    accountId: v.optional(v.id("accounts")),
    year: v.optional(v.number()),
    month: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const valuations = await ctx.db
      .query("monthlyValuations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    return valuations
      .filter((valuation) => {
        if (args.accountId && valuation.accountId !== args.accountId) return false;
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

export const getValuationHistory = query({
  args: {
    workspaceId: v.id("workspaces"),
    accountId: v.id("accounts"),
    startYear: v.number(),
    startMonth: v.number(),
    endYear: v.number(),
    endMonth: v.number(),
  },
  handler: async (ctx, args) => {
    const valuations = await ctx.db
      .query("monthlyValuations")
      .withIndex("by_account", (q) => q.eq("accountId", args.accountId))
      .collect();

    const startDate = args.startYear * 12 + args.startMonth;
    const endDate = args.endYear * 12 + args.endMonth;

    return valuations
      .filter((valuation) => {
        const valuationDate = valuation.year * 12 + valuation.month;
        return valuationDate >= startDate && valuationDate <= endDate;
      })
      .sort((a, b) => {
        const aKey = a.year * 12 + a.month;
        const bKey = b.year * 12 + b.month;
        return aKey - bKey;
      });
  },
});

// ========== FINANCIAL REPORTS ==========

export const getBalanceSheet = query({
  args: {
    workspaceId: v.id("workspaces"),
    asOfDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const balances = await ctx.db
      .query("accountBalances")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const balanceMap = new Map();
    balances.forEach((balance: any) => {
      balanceMap.set(balance.accountId.toString(), balance.currentBalance);
    });

    const accountsWithBalances = accounts.map((account: any) => ({
      ...account,
      currentBalance: balanceMap.get(account._id.toString()) || 0,
    }));

    const asOfDate = args.asOfDate || Date.now();

    const assets = accountsWithBalances.filter((account: any) => account.accountType === "asset");
    const liabilities = accountsWithBalances.filter((account: any) => account.accountType === "liability");
    const equity = accountsWithBalances.filter((account: any) => account.accountType === "equity");

    return {
      assets: {
        current: assets.filter((acc: any) => acc.accountCategory === "current_asset"),
        fixed: assets.filter((acc: any) => acc.accountCategory === "fixed_asset"),
        total: assets.reduce((sum: number, acc: any) => sum + acc.currentBalance, 0),
      },
      liabilities: {
        current: liabilities.filter((acc: any) => acc.accountCategory === "current_liability"),
        longTerm: liabilities.filter((acc: any) => acc.accountCategory === "long_term_liability"),
        total: liabilities.reduce((sum: number, acc: any) => sum + acc.currentBalance, 0),
      },
      equity: {
        total: equity.reduce((sum: number, acc: any) => sum + acc.currentBalance, 0),
      },
      asOfDate,
    };
  },
});

// ========== HELPER FUNCTIONS ==========

async function updateAccountBalance(ctx: any, accountId: any) {
  const transactions = await ctx.db
    .query("transactions")
    .withIndex("by_account", (q: any) => q.eq("accountId", accountId))
    .collect();

  const account = await ctx.db.get(accountId);
  if (!account) return;

  const currentBalance = transactions.reduce((sum: number, transaction: any) => {
    if (transaction.transactionType === "debit") {
      if (account.accountType === "asset" || account.accountType === "expense") {
        return sum + transaction.amount;
      } else {
        return sum - transaction.amount;
      }
    } else {
      if (account.accountType === "asset" || account.accountType === "expense") {
        return sum - transaction.amount;
      } else {
        return sum + transaction.amount;
      }
    }
  }, 0);

  const existingBalance = await ctx.db
    .query("accountBalances")
    .withIndex("by_account", (q: any) => q.eq("accountId", accountId))
    .first();

  if (existingBalance) {
    await ctx.db.patch(existingBalance._id, {
      currentBalance,
      lastUpdated: Date.now(),
    });
  } else {
    await ctx.db.insert("accountBalances", {
      workspaceId: account.workspaceId,
      accountId,
      currentBalance,
      lastUpdated: Date.now(),
      createdAt: Date.now(),
    });
  }
}

// ========== ENHANCED ASSET MANAGEMENT ==========

export const createAsset = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    ownerId: v.id("users"),
    accountId: v.id("accounts"), // Link to asset account
    name: v.string(),
    type: v.string(),
    purchaseDate: v.optional(v.string()),
    purchasePrice: v.optional(v.number()),
    currentValue: v.optional(v.number()),
    isFixed: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("assets", {
      workspaceId: args.workspaceId,
      ownerId: args.ownerId,
      accountId: args.accountId,
      name: args.name,
      type: args.type,
      purchaseDate: args.purchaseDate,
      purchasePrice: args.purchasePrice,
      currentValue: args.currentValue,
      isFixed: args.isFixed,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});


export const updateAsset = mutation({
  args: {
    id: v.id("assets"),
    name: v.optional(v.string()),
    type: v.optional(v.string()),
    purchaseDate: v.optional(v.string()),
    purchasePrice: v.optional(v.number()),
    currentValue: v.optional(v.number()),
    isFixed: v.optional(v.boolean()),
    ownerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.id);
    if (!asset) throw new Error("Asset not found");
    if (asset.ownerId !== args.ownerId) throw new Error("Unauthorized");

    const { id, ownerId, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
  },
});

export const deleteAsset = mutation({
  args: {
    id: v.id("assets"),
    ownerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.id);
    if (!asset) throw new Error("Asset not found");
    if (asset.ownerId !== args.ownerId) throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
  },
});

export const listAssets = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assets")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

// ========== ENHANCED LIABILITY MANAGEMENT ==========

export const createLiability = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    ownerId: v.id("users"),
    accountId: v.id("accounts"), // Link to liability account
    name: v.string(),
    type: v.string(),
    originalAmount: v.optional(v.number()),
    currentBalance: v.optional(v.number()),
    interestRate: v.optional(v.number()),
    dueDate: v.optional(v.string()),
    isFixed: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("liabilities", {
      workspaceId: args.workspaceId,
      ownerId: args.ownerId,
      accountId: args.accountId,
      name: args.name,
      type: args.type,
      originalAmount: args.originalAmount,
      currentBalance: args.currentBalance,
      interestRate: args.interestRate,
      dueDate: args.dueDate,
      isFixed: args.isFixed,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});


export const updateLiability = mutation({
  args: {
    id: v.id("liabilities"),
    name: v.optional(v.string()),
    type: v.optional(v.string()),
    originalAmount: v.optional(v.number()),
    currentBalance: v.optional(v.number()),
    interestRate: v.optional(v.number()),
    dueDate: v.optional(v.string()),
    isFixed: v.optional(v.boolean()),
    ownerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const liability = await ctx.db.get(args.id);
    if (!liability) throw new Error("Liability not found");
    if (liability.ownerId !== args.ownerId) throw new Error("Unauthorized");

    const { id, ownerId, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
  },
});

export const deleteLiability = mutation({
  args: {
    id: v.id("liabilities"),
    ownerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const liability = await ctx.db.get(args.id);
    if (!liability) throw new Error("Liability not found");
    if (liability.ownerId !== args.ownerId) throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
  },
});

export const listLiabilities = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("liabilities")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

// ========== ENHANCED VALUATION TRACKING ==========

export const createAssetValuation = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    assetId: v.id("assets"),
    accountId: v.id("accounts"),
    ownerId: v.id("users"),
    valuationDate: v.string(),
    amount: v.number(),
    valuationType: v.union(
      v.literal("purchase"),
      v.literal("market"),
      v.literal("appraisal"),
      v.literal("book")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("assetValuations", {
      workspaceId: args.workspaceId,
      assetId: args.assetId,
      accountId: args.accountId,
      ownerId: args.ownerId,
      valuationDate: args.valuationDate,
      amount: args.amount,
      valuationType: args.valuationType,
      notes: args.notes,
      createdAt: Date.now(),
    });
  },
});

export const createLiabilityValuation = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    liabilityId: v.id("liabilities"),
    accountId: v.id("accounts"),
    ownerId: v.id("users"),
    valuationDate: v.string(),
    amount: v.number(),
    principalAmount: v.optional(v.number()),
    interestAccrued: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("liabilityValuations", {
      workspaceId: args.workspaceId,
      liabilityId: args.liabilityId,
      accountId: args.accountId,
      ownerId: args.ownerId,
      valuationDate: args.valuationDate,
      amount: args.amount,
      principalAmount: args.principalAmount,
      interestAccrued: args.interestAccrued,
      notes: args.notes,
      createdAt: Date.now(),
    });
  },
});

// Subscriptions CRUD with permissions
export const createSubscription = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    ownerId: v.id("users"),
    name: v.string(),
    cost: v.number(),
    yearlyAmount: v.optional(v.number()),
    billingCycle: v.union(v.literal("monthly"), v.literal("yearly")),
    nextBillingDate: v.string(),
    isActive: v.boolean(),
    type: v.optional(v.union(v.literal("subscription"), v.literal("bill"), v.literal("rent"), v.literal("utility"), v.literal("insurance"), v.literal("loan"), v.literal("other"))),
    isNecessary: v.optional(v.boolean()),
    classification: v.union(v.literal("business"), v.literal("private")),
    category: v.union(
      v.literal("ai"),
      v.literal("software"),
      v.literal("marketing"),
      v.literal("productivity"),
      v.literal("design"),
      v.literal("communication"),
      v.literal("development"),
      v.literal("analytics"),
      v.literal("security"),
      v.literal("other")
    ),
    subcategory: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Permission: owner or finance editor
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace not found");
    // workspace here is a Workspaces row; compare via query to ensure owner
    const wsOwner = await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .first();
    let allowed = Boolean(wsOwner);
    if (!allowed) {
      const perm = await ctx.db
        .query("permissions")
        .withIndex("by_workspace_user", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", args.ownerId))
        .first();
      if (perm && perm.module === "finance" && (perm.canAdd || perm.canEditShared)) allowed = true;
    }
    if (!allowed) throw new Error("Not authorized to create subscription");

    return await ctx.db.insert("subscriptions", {
      workspaceId: args.workspaceId,
      ownerId: args.ownerId,
      name: args.name,
      cost: args.cost,
      yearlyAmount: args.yearlyAmount,
      billingCycle: args.billingCycle,
      nextBillingDate: args.nextBillingDate,
      isActive: args.isActive,
      type: args.type,
      isNecessary: args.isNecessary ?? true,
      classification: args.classification,
      category: args.category,
      subcategory: args.subcategory,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateSubscription = mutation({
  args: {
    id: v.id("subscriptions"),
    name: v.optional(v.string()),
    cost: v.optional(v.number()),
    yearlyAmount: v.optional(v.number()),
    billingCycle: v.optional(v.union(v.literal("monthly"), v.literal("yearly"))),
    nextBillingDate: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    type: v.optional(v.union(v.literal("subscription"), v.literal("bill"), v.literal("rent"), v.literal("utility"), v.literal("insurance"), v.literal("loan"), v.literal("other"))),
    isNecessary: v.optional(v.boolean()),
    classification: v.optional(v.union(v.literal("business"), v.literal("private"))),
    category: v.optional(v.union(
      v.literal("ai"),
      v.literal("software"),
      v.literal("marketing"),
      v.literal("productivity"),
      v.literal("design"),
      v.literal("communication"),
      v.literal("development"),
      v.literal("analytics"),
      v.literal("security"),
      v.literal("other")
    )),
    subcategory: v.optional(v.string()),
    ownerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db.get(args.id);
    if (!sub) throw new Error("Subscription not found");
    const workspaceId = sub.workspaceId as any;
    const wsOwner = await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .first();
    let allowed = Boolean(wsOwner);
    if (!allowed) {
      const perm = await ctx.db
        .query("permissions")
        .withIndex("by_workspace_user", (q) => q.eq("workspaceId", workspaceId).eq("userId", args.ownerId))
        .first();
      if (perm && perm.module === "finance" && (perm.canAdd || perm.canEditShared)) allowed = true;
    }
    if (!allowed) throw new Error("Not authorized to update subscription");

    const { id, ownerId, ...updates } = args as any;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
    return id;
  },
});

export const deleteSubscription = mutation({
  args: { id: v.id("subscriptions"), ownerId: v.id("users") },
  handler: async (ctx, args) => {
    const sub = await ctx.db.get(args.id);
    if (!sub) throw new Error("Subscription not found");
    const wsOwner = await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .first();
    let allowed = Boolean(wsOwner);
    if (!allowed) {
      const perm = await ctx.db
        .query("permissions")
        .withIndex("by_workspace_user", (q) => q.eq("workspaceId", sub.workspaceId).eq("userId", args.ownerId))
        .first();
      if (perm && perm.module === "finance" && (perm.canDelete || perm.canEditShared)) allowed = true;
    }
    if (!allowed) throw new Error("Not authorized to delete subscription");

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const subscriptionTotals = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
    const active = subs.filter((s) => s.isActive);

    // Calculate totals using both cost and yearlyAmount fields
    const monthlyTotal = active.reduce((sum, s) => {
      const monthlyCost = s.billingCycle === "monthly" ? s.cost : s.cost / 12;
      return sum + monthlyCost;
    }, 0);

    const yearlyTotal = active.reduce((sum, s) => {
      const yearlyCost = s.billingCycle === "yearly" ? s.cost : s.cost * 12;
      // If yearlyAmount is provided, use it instead
      if (s.yearlyAmount !== undefined) {
        return sum + s.yearlyAmount;
      }
      return sum + yearlyCost;
    }, 0);

    // Calculate potential savings from optional subscriptions
    const optionalSubscriptions = active.filter(s => s.isNecessary === false);
    const potentialMonthlySavings = optionalSubscriptions.reduce((sum, s) => {
      const monthlyCost = s.billingCycle === "monthly" ? s.cost : s.cost / 12;
      return sum + monthlyCost;
    }, 0);

    const potentialYearlySavings = optionalSubscriptions.reduce((sum, s) => {
      // If yearlyAmount is provided, use it instead
      if (s.yearlyAmount !== undefined) {
        return sum + s.yearlyAmount;
      }
      const yearlyCost = s.billingCycle === "yearly" ? s.cost : s.cost * 12;
      return sum + yearlyCost;
    }, 0);

    return {
      monthlyTotal,
      yearlyTotal,
      potentialMonthlySavings,
      potentialYearlySavings,
      activeCount: active.length,
      optionalCount: optionalSubscriptions.length
    };
  },
});

export const listSubscriptions = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

export const listCategoryBudgets = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("categoryBudgets")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const getBudgetAnalytics = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const budgets = await ctx.db
      .query("categoryBudgets")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const activeSubs = subscriptions.filter((s: any) => s.isActive);

    const spendingByCategory = activeSubs.reduce((acc: any, sub: any) => {
      const key = `${sub.classification}-${sub.category}`;
      if (!acc[key]) {
        acc[key] = {
          classification: sub.classification,
          category: sub.category,
          subscriptions: [],
          monthlyTotal: 0,
          yearlyTotal: 0
        };
      }
      acc[key].subscriptions.push(sub);
      const monthlyCost = sub.billingCycle === "monthly" ? sub.cost : sub.cost / 12;
      acc[key].monthlyTotal += monthlyCost;
      acc[key].yearlyTotal += monthlyCost * 12;
      return acc;
    }, {} as Record<string, any>);

    const categoryAnalytics = Object.values(spendingByCategory).map((spending: any) => {
      const budget = budgets.find((b: any) =>
        b.classification === spending.classification &&
        b.category === spending.category
      );

      let status = "no-budget" as "under" | "warning" | "over" | "no-budget";
      let usagePercentage = 0;

      if (budget) {
        usagePercentage = budget.monthlyBudgetLimit > 0 ? (spending.monthlyTotal / budget.monthlyBudgetLimit) * 100 : 0;

        if (spending.monthlyTotal > budget.monthlyBudgetLimit) {
          status = "over";
        } else if (usagePercentage >= parseInt(budget.alertThreshold)) {
          status = "warning";
        } else {
          status = "under";
        }
      }

      return {
        ...spending,
        budget: budget ? {
          id: budget._id,
          monthlyLimit: budget.monthlyBudgetLimit,
          yearlyLimit: budget.yearlyBudgetLimit,
          alertThreshold: budget.alertThreshold
        } : null,
        budgetStatus: status,
        usagePercentage: Math.round(usagePercentage)
      };
    });

    const totalMonthlySpending = activeSubs.reduce((sum: number, sub: any) =>
      sum + (sub.billingCycle === "monthly" ? sub.cost : sub.cost / 12), 0
    );

    const totalBudget = budgets.reduce((sum: number, budget: any) => sum + budget.monthlyBudgetLimit, 0);
    const overBudget = categoryAnalytics.filter((c: any) => c.budgetStatus === "over");
    const warning = categoryAnalytics.filter((c: any) => c.budgetStatus === "warning");

    return {
      totalMonthlySpending,
      totalBudget,
      categoryAnalytics,
      budgetAlerts: {
        overBudget: overBudget.map((c: any) => ({
          category: c.category,
          classification: c.classification,
          current: c.monthlyTotal,
          limit: c.budget?.monthlyLimit || 0,
          overage: c.monthlyTotal - (c.budget?.monthlyLimit || 0)
        })),
        warning: warning.map((c: any) => ({
          category: c.category,
          classification: c.classification,
          current: c.monthlyTotal,
          limit: c.budget?.monthlyLimit || 0,
          usage: c.usagePercentage
        }))
      }
    };
  },
});

export const getEquityGoal = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const goals = await ctx.db
      .query("equityGoals")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
    if (goals.length === 0) return null;
    goals.sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    return goals[0];
  },
});

export const upsertEquityGoal = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    ownerId: v.id("users"),
    targetEquity: v.number(),
    targetDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    let allowed = false;
    if (workspace.ownerId === args.ownerId) {
      allowed = true;
    } else {
      const perm = await ctx.db
        .query("permissions")
        .withIndex("by_workspace_user", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", args.ownerId))
        .first();
      if (perm && perm.module === "finance" && (perm.canAdd || perm.canEditShared)) {
        allowed = true;
      }
    }
    if (!allowed) {
      throw new Error("Not authorized to update equity goal");
    }

    const existing = await ctx.db
      .query("equityGoals")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        targetEquity: args.targetEquity,
        targetDate: args.targetDate,
        updatedAt: Date.now(),
      });
      return existing._id;
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
