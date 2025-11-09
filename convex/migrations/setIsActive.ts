import { internalMutation } from "../_generated/server";

export const setIsActiveOnAllAccounts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const accounts = await ctx.db.query("accounts").collect();
    
    let updatedCount = 0;
    
    for (const account of accounts) {
      const accountData = account as any;
      if (accountData.isActive === undefined) {
        await ctx.db.patch(account._id, {
          isActive: true,
        });
        updatedCount++;
      }
    }
    
    return {
      updatedCount,
      message: `Set isActive=true on ${updatedCount} accounts`,
    };
  },
});
