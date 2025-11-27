import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Id } from "./_generated/dataModel";

export const { auth, signIn, signOut, store } = convexAuth({
    providers: [Password],
});

// Check if email is authorized
export const isEmailAuthorized = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const authorized = await ctx.db
            .query("authorizedEmails")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        return !!authorized;
    },
});

// List all authorized emails
export const listAuthorizedEmails = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("authorizedEmails").collect();
    },
});

// Add authorized email (admin only)
export const addAuthorizedEmail = mutation({
    args: {
        email: v.string(),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const user = await ctx.db.get(userId);
        if (!user?.isAdmin) throw new Error("Admin access required");

        // Check if already exists
        const existing = await ctx.db
            .query("authorizedEmails")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (existing) {
            throw new Error("Email already authorized");
        }

        return await ctx.db.insert("authorizedEmails", {
            email: args.email,
            addedBy: userId,
            addedAt: Date.now(),
            notes: args.notes,
        });
    },
});

// Remove authorized email (admin only)
export const removeAuthorizedEmail = mutation({
    args: { id: v.id("authorizedEmails") },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const user = await ctx.db.get(userId);
        if (!user?.isAdmin) throw new Error("Admin access required");

        await ctx.db.delete(args.id);
    },
});

// Seed initial admin user and authorized email
export const seedAdminUser = mutation({
    args: {},
    handler: async (ctx) => {
        const adminEmail = "tomas@englisch-lehrer.com";

        // Check if admin already exists
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", adminEmail))
            .first();

        if (existingUser) {
            console.log("Admin user already exists");
            return existingUser._id;
        }

        // Create admin user
        const userId = await ctx.db.insert("users", {
            email: adminEmail,
            name: "Tomas",
            isAdmin: true,
            role: "admin",
            createdAt: Date.now(),
        });

        // Add to authorized emails
        const existingAuth = await ctx.db
            .query("authorizedEmails")
            .withIndex("by_email", (q) => q.eq("email", adminEmail))
            .first();

        if (!existingAuth) {
            await ctx.db.insert("authorizedEmails", {
                email: adminEmail,
                addedBy: userId,
                addedAt: Date.now(),
                notes: "Initial admin user",
            });
        }

        console.log("Admin user created:", userId);
        return userId;
    },
});
