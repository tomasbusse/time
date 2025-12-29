import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { auth } from "./auth";

export const getAccountForPasswordChange = internalMutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return { success: false, error: "Not authenticated", accountId: null, storedHash: null };
    }

    const authAccount = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", userId).eq("provider", "password")
      )
      .first();

    if (!authAccount || !authAccount.secret) {
      return { success: false, error: "No password account found", accountId: null, storedHash: null };
    }

    return {
      success: true,
      error: null,
      accountId: authAccount._id,
      storedHash: authAccount.secret,
    };
  },
});

export const updatePasswordHash = internalMutation({
  args: {
    accountId: v.id("authAccounts"),
    hashedPassword: v.string(),
  },
  handler: async (ctx, { accountId, hashedPassword }) => {
    await ctx.db.patch(accountId, {
      secret: hashedPassword,
    });
    return { success: true };
  },
});
