"use client";

import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Resend } from "resend";

// Initialize the Resend client with API key from environment
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.warn("RESEND_API_KEY is not set. Email invitations will not be sent.");
}
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Helper function to send invitation emails
async function sendInvitationEmail(email: string, invitedBy: string, workspaceName: string) {
  if (!resend) {
    console.warn("Resend client not initialized. Skipping email send.");
    return;
  }

  try {
    await resend.emails.send({
      from: "noreply@your-domain.com", // Replace with your verified sender email
      to: email,
      subject: `You've been invited to collaborate on ${workspaceName}`,
      html: `
        <div>
          <h2>You've been invited!</h2>
          <p>${invitedBy} has invited you to collaborate on the workspace: <strong>${workspaceName}</strong></p>
          <p>Click the link below to accept the invitation:</p>
          <a href="https://your-domain.com/invitation/accept" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-align: center; text-decoration: none; display: inline-block;">Accept Invitation</a>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send invitation email:", error);
  }
}

const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;

export const inviteUser = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        email: v.string(),
        role: v.union(v.literal("user"), v.literal("admin")),
    },
    handler: async (ctx, { workspaceId, email, role }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("User not authenticated");
        }
        const inviter = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", identity.email!)).unique();
        if (!inviter) {
            throw new Error("Inviter not found");
        }

        // TODO: Check if inviter has permission to invite to this workspace

        const newInvitation = {
            workspaceId,
            invitedBy: inviter._id,
            email,
            status: "pending" as const,
            role,
            invitedAt: Date.now(),
            expiresAt: Date.now() + SEVEN_DAYS_IN_MS,
        };

        const invitationId = await ctx.db.insert("userInvitations", newInvitation);

        // In a real app, you would send an email here.
        // We'll add a separate action for that which uses the Resend API key.
        // @ts-ignore
        await ctx.scheduler.runAfter(0, internal.sharing.sendInvitationEmailInternal, {
            invitationId,
            workspaceName: "Your Workspace", // TODO: Get workspace name
            invitedByName: inviter.name,
        });

        return invitationId;
    }
});

export const sendInvitationEmailInternal = internalAction({
    args: {
        invitationId: v.id("userInvitations"),
        workspaceName: v.string(),
        invitedByName: v.string(),
    },
    handler: async (ctx, { invitationId, workspaceName, invitedByName }) => {
        // @ts-ignore
        const invitation = await ctx.runQuery(internal.sharing.getInvitation, { invitationId });
        if (!invitation) {
            console.error("Invitation not found");
            return;
        }

        // @ts-ignore
        const resendApiKeyRecord = await ctx.db
            .query("apiKeys")
            .withIndex("by_user_service", (q: any) => q.eq("userId", invitation.invitedBy).eq("serviceName", "resend"))
            .unique();

        if (!resendApiKeyRecord) {
            console.error("Resend API key not found for user", invitation.invitedBy);
            return;
        }
        
        // In a real app, you would decrypt the key here.
        const apiKey = resendApiKeyRecord.apiKey;

        const inviteLink = `${process.env.HOSTING_URL}/join?token=${invitationId}`;

        const emailData = {
            to: invitation.email,
            from: "LifeHub <noreply@lifehub.app>",
            subject: `You've been invited to ${workspaceName}`,
            html: `
              <h2>You're invited!</h2>
              <p><strong>${invitedByName}</strong> has invited you to join <strong>${workspaceName}</strong> on LifeHub.</p>
              <a href="${inviteLink}">Accept Invitation</a>
              <p>This invitation expires in 7 days.</p>
            `
        };

        try {
            const response = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(emailData)
            });
            if (!response.ok) {
                console.error("Failed to send invitation email:", await response.text());
            }
        } catch (e) {
            console.error("Error sending email:", e);
        }
    }
});

export const getInvitation = internalQuery({
    args: { invitationId: v.id("userInvitations") },
    handler: async (ctx, { invitationId }) => {
        return await ctx.db.get(invitationId);
    }
});

export const acceptInvitation = mutation({
    args: {
        invitationId: v.id("userInvitations"),
    },
    handler: async (ctx, { invitationId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("User not authenticated");
        }
        const user = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", identity.email!)).unique();
        if (!user) {
            throw new Error("User not found");
        }

        const invitation = await ctx.db.get(invitationId);

        if (!invitation) {
            throw new Error("Invitation not found");
        }
        if (invitation.email !== user.email) {
            throw new Error("This invitation is for a different user.");
        }
        if (invitation.status !== "pending") {
            throw new Error("This invitation has already been ${invitation.status}.");
        }
        if (invitation.expiresAt < Date.now()) {
            throw new Error("This invitation has expired.");
        }

        await ctx.db.patch(invitation._id, {
            status: "accepted",
            acceptedAt: Date.now(),
        });

        // Add user to the workspace via the permissions table
        await ctx.db.insert("permissions", {
            workspaceId: invitation.workspaceId,
            userId: user._id,
            module: "all", // Or handle per-module permissions based on role
            canView: true,
            canAdd: invitation.role === "admin",
            canDelete: invitation.role === "admin",
            canEditShared: invitation.role === "admin",
        });

        return invitation.workspaceId;
    }
});

export const revokeInvitation = mutation({
    args: {
        invitationId: v.id("userInvitations"),
    },
    handler: async (ctx, { invitationId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("User not authenticated");
        }
        // TODO: Check if user has permission to revoke this invitation

        await ctx.db.patch(invitationId, {
            status: "revoked",
            revokedAt: Date.now(),
        });
    },
});

export const getInvitations = query({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, { workspaceId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }
        // TODO: Check if user has permission to view invitations for this workspace

        return await ctx.db
            .query("userInvitations")
            .withIndex("by_workspace", q => q.eq("workspaceId", workspaceId))
            .collect();
    }
});