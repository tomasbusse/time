import { internalMutation } from "../_generated/server";

export const updateUserInvitationsSchema = internalMutation({
  args: {},
  handler: async (ctx) => {
    const invitations = await ctx.db.query("userInvitations").collect();
    
    for (const invitation of invitations) {
      const invitationData = invitation as any;
      
      // Add revokedAt field if it doesn't exist
      if (invitationData.revokedAt === undefined) {
        // Don't set revokedAt at all, let it be undefined (which is optional)
        // await ctx.db.patch(invitation._id, { revokedAt: null }); // This would cause a type error
      }
      
      // Make sure the status is valid
      const validStatuses = ["pending", "accepted", "expired", "revoked"];
      if (!validStatuses.includes(invitationData.status)) {
        await ctx.db.patch(invitation._id, { status: "pending" });
      }
    }
    
    return {
      message: `Updated ${invitations.length} invitations`,
    };
  },
});