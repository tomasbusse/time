import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    isAdmin: v.boolean(),
    role: v.optional(v.string()),
    emailVerified: v.optional(v.number()),
    image: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  // Convex Auth tables
  authSessions: defineTable({
    userId: v.id("users"),
    expirationTime: v.number(),
  }).index("userId", ["userId"]),

  authAccounts: defineTable({
    userId: v.id("users"),
    provider: v.string(),
    providerAccountId: v.string(),
    secret: v.optional(v.string()), // For password hash
    emailVerified: v.optional(v.string()),
    phoneVerified: v.optional(v.string()),
  })
    .index("userIdAndProvider", ["userId", "provider"])
    .index("providerAndAccountId", ["provider", "providerAccountId"]),

  authRefreshTokens: defineTable({
    sessionId: v.id("authSessions"),
    expirationTime: v.number(),
    firstUsedTime: v.optional(v.number()),
    parentRefreshTokenId: v.optional(v.id("authRefreshTokens")),
  })
    .index("sessionId", ["sessionId"])
    .index("sessionIdAndParentRefreshTokenId", ["sessionId", "parentRefreshTokenId"]),

  authVerificationCodes: defineTable({
    accountId: v.id("authAccounts"),
    provider: v.string(),
    code: v.string(),
    expirationTime: v.number(),
    verifier: v.optional(v.string()),
    emailVerified: v.optional(v.string()),
    phoneVerified: v.optional(v.string()),
  })
    .index("accountId", ["accountId"])
    .index("code", ["code"]),

  authVerifiers: defineTable({
    sessionId: v.optional(v.id("authSessions")),
    signature: v.optional(v.string()),
  }).index("signature", ["signature"]),

  authRateLimits: defineTable({
    identifier: v.string(),
    lastAttemptTime: v.number(),
    attemptsLeft: v.number(),
  }).index("identifier", ["identifier"]),

  // Whitelist for authorized emails
  authorizedEmails: defineTable({
    email: v.string(),
    addedBy: v.id("users"),
    addedAt: v.number(),
    notes: v.optional(v.string()),
  }).index("by_email", ["email"]),

  workspaces: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    createdAt: v.number(),

    activeTimerTaskId: v.optional(v.id("tasks")),
    activeTimerStart: v.optional(v.number()),
  }).index("by_owner", ["ownerId"]),

  permissions: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    module: v.string(),
    canView: v.boolean(),
    canAdd: v.boolean(),
    canDelete: v.boolean(),
    canEditShared: v.boolean(),
  })
    .index("by_workspace_user", ["workspaceId", "userId"])
    .index("by_user", ["userId"]),

  sharedAccess: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    invitedBy: v.id("users"),
    invitedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"]),

  timeAllocations: defineTable({
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
    taskId: v.optional(v.id("tasks")),
    parentAllocationId: v.optional(v.id("timeAllocations")),
    isRecurring: v.optional(v.boolean()),
    recurrenceType: v.optional(v.string()),
    recurrenceInterval: v.optional(v.number()),
    recurrenceEndDate: v.optional(v.string()),
    recurrenceCount: v.optional(v.number()),
    taskName: v.string(),
    date: v.string(),
    allocatedDuration: v.number(),
    timeSpent: v.optional(v.number()),
    weekNumber: v.number(),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user_date", ["userId", "date"]),

  timeLogged: defineTable({
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
    taskId: v.optional(v.id("tasks")),
    allocationId: v.optional(v.id("timeAllocations")),
    sessionStart: v.number(),
    sessionEnd: v.number(),
    elapsedTime: v.number(),
    logged: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_task", ["taskId"])
    .index("by_allocation", ["allocationId"]),

  // New comprehensive accounts system for proper accounting
  accounts: defineTable({
    workspaceId: v.id("workspaces"),
    accountCode: v.string(),
    accountName: v.string(),
    name: v.optional(v.string()),
    accountType: v.union(
      v.literal("asset"),
      v.literal("liability"),
      v.literal("equity"),
      v.literal("revenue"),
      v.literal("expense")
    ),
    accountCategory: v.string(),
    isActive: v.boolean(),
    currentBalance: v.optional(v.number()),
    isPrivate: v.optional(v.boolean()),
    isDeleted: v.optional(v.boolean()),
    ownerId: v.optional(v.id("users")),
    parentAccountId: v.optional(v.id("accounts")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_code", ["accountCode"])
    .index("by_type", ["accountType"])
    .index("by_category", ["accountCategory"])
    .index("by_creation", ["createdAt"]),

  // Account balances - current running balance for each account
  accountBalances: defineTable({
    workspaceId: v.id("workspaces"),
    accountId: v.id("accounts"),
    currentBalance: v.number(), // Current running balance
    lastUpdated: v.number(), // When balance was last updated
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_account", ["accountId"])
    .index("by_last_updated", ["lastUpdated"]),

  // Monthly valuations - historical snapshots for trend analysis
  monthlyValuations: defineTable({
    workspaceId: v.id("workspaces"),
    accountId: v.id("accounts"),
    year: v.number(),
    month: v.number(), // 1-12
    beginningBalance: v.number(), // Balance at start of month
    endingBalance: v.number(), // Balance at end of month
    netTransactions: v.number(), // Net change during month
    notes: v.optional(v.string()), // Optional notes about the valuation
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_account", ["accountId"])
    .index("by_period", ["year", "month"])
    .index("by_account_period", ["accountId", "year", "month"]),

  // Transactions - for tracking all financial movements with proper double-entry support
  transactions: defineTable({
    workspaceId: v.id("workspaces"),
    date: v.number(),
    description: v.string(),
    amount: v.number(), // Transaction amount
    accountId: v.id("accounts"),
    transactionType: v.union(
      v.literal("debit"),
      v.literal("credit")
    ), // Debit or Credit entry
    reference: v.optional(v.string()), // Check number, invoice number, etc.
    category: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_date", ["date"])
    .index("by_account", ["accountId"])
    .index("by_category", ["category"])
    .index("by_creation", ["createdAt"]),

  // Removed monthlyProjection table - replaced by monthlyValuations system

  categoryBudgets: defineTable({
    workspaceId: v.id("workspaces"),
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
    monthlyBudgetLimit: v.number(),
    yearlyBudgetLimit: v.number(),
    alertThreshold: v.union(v.literal("50"), v.literal("75"), v.literal("90"), v.literal("100")),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_workspace_category", ["workspaceId", "category"]),

  // Enhanced assets table - now references account system
  assets: defineTable({
    workspaceId: v.id("workspaces"),
    ownerId: v.id("users"),
    accountId: v.optional(v.id("accounts")),
    name: v.string(),
    type: v.string(),
    purchaseDate: v.optional(v.string()),
    purchasePrice: v.optional(v.number()),
    currentValue: v.optional(v.number()),
    isFixed: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_owner", ["ownerId"])
    .index("by_account", ["accountId"]),

  // Enhanced liabilities table - now references account system
  liabilities: defineTable({
    workspaceId: v.id("workspaces"),
    ownerId: v.id("users"),
    accountId: v.optional(v.id("accounts")),
    name: v.string(),
    type: v.optional(v.string()),
    relatedAssetId: v.optional(v.id("assets")),
    originalAmount: v.optional(v.number()),
    currentBalance: v.optional(v.number()),
    interestRate: v.optional(v.number()),
    dueDate: v.optional(v.string()),
    isFixed: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_owner", ["ownerId"])
    .index("by_account", ["accountId"]),

  equityGoals: defineTable({
    workspaceId: v.id("workspaces"),
    ownerId: v.id("users"),
    targetEquity: v.number(),
    targetDate: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_owner", ["ownerId"]),

  subscriptions: defineTable({
    workspaceId: v.id("workspaces"),
    ownerId: v.id("users"),
    name: v.string(),
    cost: v.number(),
    billingCycle: v.union(v.literal("monthly"), v.literal("yearly")),
    nextBillingDate: v.string(),
    isActive: v.boolean(),
    type: v.optional(v.union(v.literal("subscription"), v.literal("bill"), v.literal("rent"), v.literal("utility"), v.literal("insurance"), v.literal("loan"), v.literal("other"))),
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
    isNecessary: v.optional(v.boolean()),
    yearlyAmount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_owner", ["ownerId"]),

  ideas: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    richDescription: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    attachments: v.optional(v.array(v.object({
      url: v.string(),
      name: v.string(),
      type: v.string(),
    }))),
    status: v.union(v.literal("new"), v.literal("reviewing"), v.literal("converted"), v.literal("archived")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"]),

  tasks: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    ideaId: v.optional(v.id("ideas")),
    title: v.string(),
    status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("completed")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    dueDate: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    position: v.optional(v.number()),
    isArchived: v.optional(v.boolean()),
    isRecurring: v.optional(v.boolean()),
    recurrenceType: v.optional(v.string()),
    recurrenceInterval: v.optional(v.number()),
    recurrenceEndDate: v.optional(v.string()),
    recurrenceCount: v.optional(v.number()),
    parentTaskId: v.optional(v.id("tasks")),
    estimatedHours: v.optional(v.number()),

    // Time allocation fields
    dailyAllocation: v.optional(v.number()),
    weeklyAllocation: v.optional(v.number()),
    monthlyAllocation: v.optional(v.number()),
    yearlyAllocation: v.optional(v.number()),
    timeSpent: v.optional(v.number()),
    currentSessionStart: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_idea", ["ideaId"]),

  recipes: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    name: v.string(),
    instructions: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"]),

  recipeIngredients: defineTable({
    recipeId: v.id("recipes"),
    ingredientName: v.string(),
    quantity: v.optional(v.string()),
    unit: v.optional(v.string()),
  }).index("by_recipe", ["recipeId"]),

  shoppingLists: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    name: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"]),

  shoppingListItems: defineTable({
    shoppingListId: v.id("shoppingLists"),
    ingredientName: v.string(),
    quantity: v.optional(v.string()),
    unit: v.optional(v.string()),
    completed: v.boolean(),
    recipeSourceId: v.optional(v.id("recipes")),
    createdAt: v.number(),
  }).index("by_shopping_list", ["shoppingListId"]),

  calendarSync: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    googleAccessToken: v.string(),
    googleRefreshToken: v.optional(v.string()),
    lastSyncTime: v.number(),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"]),

  calendarEvents: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    googleEventId: v.optional(v.string()),
    title: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_google_event", ["googleEventId"]),

  // Customers table for invoicing
  customers: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),

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

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"]),

  // Asset valuations - now tied to account system for better tracking
  assetValuations: defineTable({
    workspaceId: v.id("workspaces"),
    assetId: v.id("assets"),
    accountId: v.optional(v.id("accounts")),
    ownerId: v.id("users"),
    valuationDate: v.string(),
    amount: v.number(),
    valuationType: v.optional(v.union(
      v.literal("purchase"),
      v.literal("market"),
      v.literal("appraisal"),
      v.literal("book")
    )),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_asset", ["assetId"])
    .index("by_account", ["accountId"])
    .index("by_asset_date", ["assetId", "valuationDate"])
    .index("by_account_date", ["accountId", "valuationDate"]),

  // Liability valuations - now tied to account system
  liabilityValuations: defineTable({
    workspaceId: v.id("workspaces"),
    liabilityId: v.id("liabilities"),
    accountId: v.optional(v.id("accounts")),
    ownerId: v.id("users"),
    valuationDate: v.string(),
    amount: v.number(),
    principalAmount: v.optional(v.number()),
    interestAccrued: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_liability", ["liabilityId"])
    .index("by_account", ["accountId"])
    .index("by_liability_date", ["liabilityId", "valuationDate"])
    .index("by_account_date", ["accountId", "valuationDate"]),

  // Account type valuations for portfolio-level tracking
  accountTypeValuations: defineTable({
    workspaceId: v.id("workspaces"),
    accountType: v.string(), // Type of account (asset, liability, etc.)
    accountCategory: v.string(), // Sub-category
    ownerId: v.id("users"),
    valuationDate: v.string(), // ISO format date (YYYY-MM-DD)
    totalValue: v.number(), // Total value of all accounts of this type
    count: v.number(), // Number of accounts of this type
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_type", ["accountType"])
    .index("by_category", ["accountCategory"])
    .index("by_type_date", ["accountType", "valuationDate"])
    .index("by_category_date", ["accountCategory", "valuationDate"]),

  // Simple assets table
  simpleAssets: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    type: v.string(),
    currentValue: v.number(),
    purchaseValue: v.optional(v.number()),
    purchaseDate: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_workspace", ["workspaceId"]),

  // Simple liabilities table
  simpleLiabilities: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    type: v.string(),
    currentBalance: v.number(),
    originalAmount: v.optional(v.number()),
    interestRate: v.optional(v.number()),
    monthlyPayment: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_workspace", ["workspaceId"]),

  // Simple monthly valuations
  simpleMonthlyValuations: defineTable({
    workspaceId: v.id("workspaces"),
    itemType: v.union(v.literal("asset"), v.literal("liability")),
    itemId: v.string(),
    year: v.number(),
    month: v.number(),
    value: v.number(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_item", ["itemId"])
    .index("by_period", ["year", "month"]),

  // Simple equity accounts
  simpleEquityAccounts: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    type: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_workspace", ["workspaceId"]),

  // Simple equity valuations
  simpleEquityValuations: defineTable({
    workspaceId: v.id("workspaces"),
    equityAccountId: v.id("simpleEquityAccounts"),
    year: v.number(),
    month: v.number(),
    amount: v.number(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_equity_account", ["equityAccountId"])
    .index("by_period", ["year", "month"]),

  // Simple asset monthly balances
  simpleAssetMonthlyBalances: defineTable({
    workspaceId: v.any(),
    assetId: v.any(),
    month: v.any(),
    balance: v.optional(v.number()),
    notes: v.optional(v.any()),
    createdAt: v.optional(v.number()),
    createdBy: v.optional(v.id("users")),
  })
    .index("by_workspace_asset", ["workspaceId", "assetId"])
    .index("by_workspace_month", ["workspaceId", "month"]),

  // Invoices table
  invoices: defineTable({
    workspaceId: v.id("workspaces"),
    customerId: v.id("customers"),
    invoiceNumber: v.string(),
    date: v.number(),
    dueDate: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("paid"),
      v.literal("cancelled"),
      v.literal("archived")
    ),
    subtotal: v.number(),
    taxTotal: v.number(),
    total: v.number(),
    notes: v.optional(v.string()),
    paymentTerms: v.optional(v.string()),
    relatedCalendarEvents: v.optional(v.array(v.string())),
    sentAt: v.optional(v.number()),
    paidAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_customer", ["customerId"])
    .index("by_number", ["invoiceNumber"])
    .index("by_status", ["status"]),

  // Invoice items table
  invoiceItems: defineTable({
    invoiceId: v.id("invoices"),
    productId: v.optional(v.id("products")),
    description: v.string(),
    quantity: v.number(),
    unit: v.string(),
    unitPrice: v.number(),
    taxRate: v.number(),
    total: v.number(),
    serviceDate: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    calendarEventId: v.optional(v.string()),
  })
    .index("by_invoice", ["invoiceId"]),

  // Invoice audit log
  invoiceAuditLog: defineTable({
    workspaceId: v.id("workspaces"),
    invoiceId: v.id("invoices"),
    userId: v.id("users"),
    action: v.string(),
    details: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_invoice", ["invoiceId"]),

  // Company settings
  companySettings: defineTable({
    workspaceId: v.id("workspaces"),
    companyName: v.string(),
    ownerName: v.optional(v.string()),
    addressLine1: v.optional(v.string()),
    addressLine2: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    vatId: v.optional(v.string()),
    taxNumber: v.optional(v.string()),
    bankName: v.optional(v.string()),
    iban: v.optional(v.string()),
    bic: v.optional(v.string()),
    invoicePrefix: v.optional(v.string()),
    nextInvoiceNumber: v.optional(v.number()),
    defaultPaymentTermsDays: v.optional(v.number()),
    defaultTaxRate: v.optional(v.number()),
    defaultHourlyRate: v.optional(v.number()),
    email: v.optional(v.string()),
    phone1: v.optional(v.string()),
    phone2: v.optional(v.string()),
    website: v.optional(v.string()),
    accountHolder: v.optional(v.string()),
    logoStorageId: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    emailSubjectTemplate: v.optional(v.string()),
    emailBodyTemplate: v.optional(v.string()),
    paymentInstructionTemplate: v.optional(v.string()),
    taxExemptionEnabled: v.optional(v.boolean()),
    taxExemptionLegalBasis: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"]),

  // Products table
  products: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    description: v.optional(v.string()),
    unitPrice: v.number(),
    unit: v.string(),
    taxRate: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"]),

  // Lessons table (for invoicing from calendar)
  lessons: defineTable({
    workspaceId: v.id("workspaces"),
    customerId: v.id("customers"),
    studentId: v.optional(v.id("students")),
    title: v.string(),
    start: v.number(),
    end: v.number(),
    rate: v.optional(v.number()),
    isBillable: v.optional(v.boolean()),
    invoiceId: v.optional(v.id("invoices")),
    googleEventId: v.optional(v.string()),
    type: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
    teacherId: v.optional(v.id("users")),
    cancelledAt: v.optional(v.number()),
    cancelledBy: v.optional(v.string()),
    cancellationReason: v.optional(v.string()),
    groupId: v.optional(v.id("studentGroups")),
    meetingLink: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_customer", ["customerId"])
    .index("by_invoice", ["invoiceId"])
    .index("by_teacher", ["teacherId"])
    .index("by_group", ["groupId"]),

  // ========== BUDGET TABLES (Restored and Verified) ==========
  budgetIncome: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    year: v.number(),
    month: v.number(),
    amount: v.number(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace_period", ["workspaceId", "year", "month"])
    .index("by_workspace", ["workspaceId"]),

  budgetOutgoings: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    name: v.string(),
    category: v.string(),
    amount: v.number(),
    isFixed: v.boolean(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"]),

  budgetMonthlyOutgoings: defineTable({
    workspaceId: v.id("workspaces"),
    outgoingId: v.id("budgetOutgoings"),
    year: v.number(),
    month: v.number(),
    amount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace_period", ["workspaceId", "year", "month"])
    .index("by_outgoing_period", ["outgoingId", "year", "month"]),

  // Customer Imports table
  customerImports: defineTable({
    workspaceId: v.id("workspaces"),
    batchId: v.string(),
    fileName: v.string(),
    customerCount: v.number(),
    importedBy: v.id("users"),
    importedAt: v.number(),
    status: v.string(),
    rolledBackAt: v.optional(v.number()),
    rolledBackBy: v.optional(v.id("users")),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_batch_id", ["batchId"]),

  // Auth tokens table
  userTokens: defineTable({
    userId: v.id("users"),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    createdAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"]),
  // Students table
  students: defineTable({
    workspaceId: v.id("workspaces"),
    customerId: v.id("customers"),
    groupId: v.optional(v.id("studentGroups")),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    notes: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_customer", ["customerId"])
    .index("by_group", ["groupId"]),

  // Student Groups table
  studentGroups: defineTable({
    workspaceId: v.id("workspaces"),
    customerId: v.id("customers"),
    name: v.string(),
    defaultTeacherId: v.optional(v.id("users")),
    notes: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_customer", ["customerId"]),

  // Attendance Reports table
  attendanceReports: defineTable({
    workspaceId: v.id("workspaces"),
    lessonId: v.id("lessons"),
    customerId: v.id("customers"),
    groupId: v.optional(v.id("studentGroups")),
    studentsPresent: v.array(v.id("students")),
    studentsAbsent: v.array(v.id("students")),
    generalNotes: v.optional(v.string()),
    studentProgress: v.optional(v.array(v.object({
      studentId: v.id("students"),
      progressNotes: v.string(),
      skillLevel: v.optional(v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced"),
        v.literal("proficient")
      )),
    }))),
    reportDate: v.number(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_lesson", ["lessonId"])
    .index("by_customer", ["customerId"])
    .index("by_group", ["groupId"]),

  // Dashboard Layouts table
  dashboardLayouts: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    layoutName: v.string(),
    layout: v.array(v.object({
      i: v.string(),
      x: v.number(),
      y: v.number(),
      w: v.number(),
      h: v.number(),
      minW: v.optional(v.number()),
      maxW: v.optional(v.number()),
      minH: v.optional(v.number()),
      maxH: v.optional(v.number()),
      isDraggable: v.optional(v.boolean()),
      isResizable: v.optional(v.boolean()),
    })),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace_user", ["workspaceId", "userId"])
    .index("by_workspace_user_name", ["workspaceId", "userId", "layoutName"]),

  // User Invitations table
  userInvitations: defineTable({
    workspaceId: v.id("workspaces"),
    invitedBy: v.id("users"),
    email: v.string(),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("revoked")),
    role: v.union(v.literal("user"), v.literal("admin")),
    invitedAt: v.number(),
    expiresAt: v.number(),
    acceptedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_email", ["email"]),

  // API Keys table
  apiKeys: defineTable({
    userId: v.id("users"),
    serviceName: v.string(),
    apiKey: v.string(), // Encrypted
    isActive: v.boolean(),
    lastTested: v.optional(v.number()),
    testStatus: v.optional(v.union(v.literal("success"), v.literal("failed"), v.literal("untested"))),
    testError: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_service", ["userId", "serviceName"]),

  // Archived Invoices table
  archivedInvoices: defineTable({
    workspaceId: v.id("workspaces"),
    invoiceId: v.id("invoices"),
    invoiceNumber: v.string(),
    pdfStorageId: v.id("_storage"),
    archivedAt: v.number(),
    retentionUntil: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_invoice", ["invoiceId"]),
});
