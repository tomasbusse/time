"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Scrypt } from "lucia";
import { Id } from "./_generated/dataModel";

// Node action to hash password with Scrypt (same as Convex Auth Password provider)
export const seedAdmin = internalAction({
    args: {
        password: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<Id<"users">> => {
        const password = args.password || "belladonna";

        // Hash with Scrypt - same as Convex Auth Password provider
        const scrypt = new Scrypt();
        const hashedPassword = await scrypt.hash(password);
        console.log("Password hashed with Scrypt");

        // Store in database using the mutation in auth.ts
        const userId = await ctx.runMutation(internal.auth.storeAdminWithHash, {
            hashedPassword,
        });
        return userId;
    },
});
