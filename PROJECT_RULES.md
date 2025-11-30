# Project Rules

1. **GitHub Push**: Always push changes to GitHub immediately after completing a significant step or fix. This triggers the Vercel deployment.
2. **Convex Deployment**: When modifying the database schema (`convex/schema.ts`), you MUST manually run `npx convex deploy` to apply changes to the backend. The dev server does not always pick up schema changes reliably.
