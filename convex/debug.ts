import { query } from "./_generated/server";

export const listUsersAndWorkspaces = query({
    args: {},
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        const workspaces = await ctx.db.query("workspaces").collect();
        return { users, workspaces };
    },
});
