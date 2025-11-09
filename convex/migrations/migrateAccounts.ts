import { internalMutation } from "../_generated/server";

export const migrateAccountsToNewSchema = internalMutation({
  args: {},
  handler: async (ctx) => {
    const accounts = await ctx.db.query("accounts").collect();
    
    let migratedCount = 0;
    let deletedCount = 0;
    
    for (const account of accounts) {
      const accountData = account as any;
      
      if (!accountData.accountCode || !accountData.accountCategory || !accountData.accountName) {
        if (accountData.name && accountData.accountType && (accountData.ownerId || accountData.createdBy)) {
          const accountTypeMap: Record<string, { type: "asset" | "liability" | "equity" | "revenue" | "expense"; category: string; code: string }> = {
            'bank': { type: 'asset' as const, category: 'current_asset', code: '1100' },
            'savings': { type: 'asset' as const, category: 'current_asset', code: '1200' },
            'loan': { type: 'liability' as const, category: 'long_term_liability', code: '2400' },
          };
          
          const mapping = accountTypeMap[accountData.accountType] || { 
            type: 'asset' as const, 
            category: 'current_asset', 
            code: '1000' 
          };
          
          const baseCode = parseInt(mapping.code);
          const existingCodes = accounts
            .filter((a: any) => a.accountCode && a.accountCode.startsWith(mapping.code.substring(0, 2)))
            .map((a: any) => parseInt(a.accountCode || '0'));
          
          const nextCode = existingCodes.length > 0 
            ? Math.max(...existingCodes) + 1 
            : baseCode;
          
          await ctx.db.patch(account._id, {
            accountCode: String(nextCode),
            accountName: accountData.name,
            accountType: mapping.type,
            accountCategory: mapping.category,
            isActive: true,
            createdBy: accountData.createdBy || accountData.ownerId,
          });
          
          migratedCount++;
        } else {
          await ctx.db.delete(account._id);
          deletedCount++;
        }
      }
    }
    
    return {
      migratedCount,
      deletedCount,
      message: `Migrated ${migratedCount} accounts, deleted ${deletedCount} invalid records`,
    };
  },
});
