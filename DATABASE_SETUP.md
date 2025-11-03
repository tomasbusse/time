# Database Connection Guide

## Quick Setup (5 minutes)

### Step 1: Install Convex CLI (if not installed)

```bash
npm install -g convex
```

### Step 2: Initialize Convex

```bash
cd /Users/tomas/apps/time
npx convex dev
```

This will:
1. Open your browser to sign up/login to Convex
2. Create a new project
3. Generate `.env.local` with your Convex URL
4. Start watching your functions

### Step 3: The app will automatically:
- Create a default user (demo@productivity.app)
- Create a workspace ("My Workspace")
- Populate with sample data

### Step 4: Restart your dev server

```bash
# Stop the current server (Ctrl+C if needed)
npm run dev
```

## What Happens

When you start the app with Convex connected:

1. **First Load**: 
   - App detects no user exists
   - Automatically runs `setupDefaultData` mutation
   - Creates user "Tomas" with email "demo@productivity.app"
   - Creates workspace "My Workspace"
   - Adds sample data to all modules

2. **Subsequent Loads**:
   - App finds existing user/workspace
   - Loads all your data from database
   - Changes persist across refreshes!

## Verify It's Working

### Check Convex Dashboard

Visit: https://dashboard.convex.dev

You'll see:
- Your project
- All tables populated
- Real-time data updates

### Test Data Persistence

1. Go to Finance app
2. Click "Add Account"
3. Create a new account
4. **Refresh the page** - your account is still there! ✅

## Current Setup

**Without Convex** (current):
- Using mock data (useState)
- Data lost on refresh
- No persistence

**With Convex** (after setup):
- Real database
- Data persists across refreshes
- Real-time sync
- Ready for multi-user

## Troubleshooting

### "Cannot find convex URL"
Make sure `.env.local` exists with:
```
VITE_CONVEX_URL=https://your-project.convex.cloud
```

### "Setup not running"
The setup runs automatically on first load. Check Convex dashboard to see if tables are populated.

### "Functions not found"
Make sure `npx convex dev` is running. It watches the `convex/` folder.

## Next Steps

Once Convex is connected:

1. **Test all modules** - Add/edit/delete items
2. **Refresh pages** - See data persist
3. **Deploy** - Use `npx convex deploy` for production

## Files Created

- `convex/finance.ts` - Account, Asset, Subscription functions
- `convex/food.ts` - Recipe, Shopping list functions  
- `convex/flow.ts` - Task, Idea functions
- `convex/timeAllocations.ts` - Time tracking functions
- `convex/setup.ts` - Initial data setup
- `src/lib/WorkspaceContext.tsx` - React context for workspace

## Ready to Go!

Just run:
```bash
npx convex dev
```

And your app will have a real database! 🎉
