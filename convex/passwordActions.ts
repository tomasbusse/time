"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { Scrypt } from "lucia";

export const changePassword = action({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, { currentPassword, newPassword }) => {
    if (newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    const accountData = await ctx.runMutation(internal.passwordMutations.getAccountForPasswordChange, {});

    if (!accountData.success || !accountData.storedHash || !accountData.accountId) {
      throw new Error(accountData.error || "Failed to retrieve account");
    }

    const scrypt = new Scrypt();
    const isValid = await scrypt.verify(accountData.storedHash, currentPassword);

    if (!isValid) {
      throw new Error("Current password is incorrect");
    }

    const hashedPassword = await scrypt.hash(newPassword);

    await ctx.runMutation(internal.passwordMutations.updatePasswordHash, {
      accountId: accountData.accountId,
      hashedPassword,
    });

    return { success: true };
  },
});
