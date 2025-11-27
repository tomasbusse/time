# Convex Database Setup Guide

This guide walks through setting up the Convex database for the Productivity App.

## Installation

### 1. Install Convex

```bash
npm install convex
```

### 2. Initialize Convex Project

```bash
npx convex dev
```

This will:
- Prompt you to log in or create a Convex account
- Create a new Convex project
- Generate `.env.local` with your `VITE_CONVEX_URL`
- Start the Convex development server

### 3. Configure Environment Variables

Copy the Convex URL from the output:

```bash
cp .env.example .env
```

Add to `.env`:

```
VITE_CONVEX_URL=https://your-project-name.convex.cloud
```


### 4. Secure server environment variables (OAuth + API keys)

The Convex backend reads sensitive credentials from Convex environment variables (not from source code):

- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_REDIRECT_URI (optional; defaults to http://localhost:5174/auth/google/callback)
- API_KEYS_MASTER_KEY (base64-encoded 32 bytes; used to encrypt user API keys at rest)

Generate a strong encryption key and set variables for your dev deployment:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# copy the output as <BASE64_32_BYTES>

npx convex env set dev API_KEYS_MASTER_KEY "<BASE64_32_BYTES>"
npx convex env set dev GOOGLE_CLIENT_ID "<your_client_id>.apps.googleusercontent.com"
npx convex env set dev GOOGLE_CLIENT_SECRET "<your_client_secret>"
npx convex env set dev GOOGLE_REDIRECT_URI "http://localhost:5174/auth/google/callback"
```

When you deploy to production, set the same variables for the prod deployment with your production values (e.g., your production domain as redirect URI):

```bash
npx convex env set prod API_KEYS_MASTER_KEY "<BASE64_32_BYTES>"
npx convex env set prod GOOGLE_CLIENT_ID "<prod_client_id>.apps.googleusercontent.com"
npx convex env set prod GOOGLE_CLIENT_SECRET "<prod_client_secret>"
npx convex env set prod GOOGLE_REDIRECT_URI "https://your-domain.com/auth/google/callback"
```

Verify values via:

```bash
npx convex env list dev
npx convex env list prod
```

## Database Schema

The schema is defined in `convex/schema.ts` with the following tables:

### Core Tables

#### `users`
- Stores user information
- Fields: `email`, `name`, `isAdmin`, `createdAt`
- Indexed by: `email`

#### `workspaces`
- Shared contexts for collaborative data
- Fields: `name`, `ownerId`, `createdAt`
- Indexed by: `ownerId`

#### `permissions`
- Fine-grained access control per user/module
- Fields: `workspaceId`, `userId`, `module`, `canView`, `canAdd`, `canDelete`, `canEditShared`
- Indexed by: `workspaceId + userId`, `userId`

#### `sharedAccess`
- Tracks workspace sharing
- Fields: `workspaceId`, `userId`, `invitedBy`, `invitedAt`
- Indexed by: `workspaceId`, `userId`

### Time App Tables

#### `timeAllocations`
- Daily/weekly time allocation
- Fields: `userId`, `workspaceId`, `taskId`, `taskName`, `date`, `allocatedDuration`, `weekNumber`
- Indexed by: `workspaceId`, `userId + date`

#### `timeLogged`
- Actual time spent tracking
- Fields: `userId`, `workspaceId`, `allocationId`, `sessionStart`, `sessionEnd`, `elapsedTime`, `logged`
- Indexed by: `workspaceId`, `userId`, `allocationId`

### Finance App Tables

#### `accounts`
- Bank, loan, and savings accounts
- Fields: `workspaceId`, `ownerId`, `name`, `accountType`, `currentBalance`, `isPrivate`, `isDeleted`
- Account types: `bank`, `loan`, `savings`
- Indexed by: `workspaceId`, `ownerId`

#### `transactions`
- Financial transactions
- Fields: `workspaceId`, `accountId`, `amount`, `date`, `category`, `notes`, `isRecurring`
- Indexed by: `accountId`, `workspaceId`

#### `monthlyProjection`
- Cash flow forecasting
- Fields: `workspaceId`, `accountId`, `month`, `projectedBalance`, `committedExpenses`
- Indexed by: `accountId + month`, `workspaceId`

#### `assets`
- Property, vehicles, investments
- Fields: `workspaceId`, `ownerId`, `name`, `type`, `value`
- Asset types: `property`, `vehicle`, `investment`, `other`
- Indexed by: `workspaceId`, `ownerId`

#### `liabilities`
- Mortgages and other debts
- Fields: `workspaceId`, `ownerId`, `name`, `amount`, `relatedAssetId`
- Indexed by: `workspaceId`, `ownerId`

#### `equityGoals`
- Financial targets (Liquidity-based)
- Fields: `workspaceId`, `ownerId`, `targetEquity`, `targetDate`
- Indexed by: `workspaceId`, `ownerId`

#### `subscriptions`
- Recurring expenses
- Fields: `workspaceId`, `ownerId`, `name`, `cost`, `billingCycle`, `nextBillingDate`, `isActive`
- Billing cycles: `monthly`, `yearly`
- Indexed by: `workspaceId`, `ownerId`

### Flow/Ideas App Tables

#### `ideas`
- Idea capture
- Fields: `workspaceId`, `userId`, `title`, `description`, `status`
- Statuses: `new`, `reviewing`, `converted`, `archived`
- Indexed by: `workspaceId`, `userId`

#### `tasks`
- Task management
- Fields: `workspaceId`, `userId`, `ideaId`, `title`, `status`, `priority`, `dueDate`
- Statuses: `todo`, `in_progress`, `completed`
- Priorities: `low`, `medium`, `high`
- Indexed by: `workspaceId`, `userId`, `ideaId`

### Food App Tables

#### `recipes`
- Recipe storage
- Fields: `workspaceId`, `userId`, `name`, `instructions`
- Indexed by: `workspaceId`, `userId`

#### `recipeIngredients`
- Recipe ingredients
- Fields: `recipeId`, `ingredientName`, `quantity`, `unit`
- Indexed by: `recipeId`

#### `shoppingLists`
- Shopping lists
- Fields: `workspaceId`, `userId`, `name`
- Indexed by: `workspaceId`, `userId`

#### `shoppingListItems`
- Shopping list items
- Fields: `shoppingListId`, `ingredientName`, `quantity`, `unit`, `completed`, `recipeSourceId`
- Indexed by: `shoppingListId`

### Calendar App Tables

#### `calendarSync`
- Google Calendar sync data
- Fields: `workspaceId`, `userId`, `googleAccessToken`, `googleRefreshToken`, `lastSyncTime`
- Indexed by: `workspaceId`, `userId`

#### `calendarEvents`
- Synced calendar events
- Fields: `workspaceId`, `userId`, `googleEventId`, `title`, `startTime`, `endTime`
- Indexed by: `workspaceId`, `userId`, `googleEventId`

## Convex Functions

### User Management (`convex/users.ts`)

```typescript
// Create a new user
createUser({ email, name, isAdmin })

// Create a workspace
createWorkspace({ name, ownerId })
```

### Time Allocations (`convex/timeAllocations.ts`)

```typescript
// List allocations for a date
list({ workspaceId, date })

// Create time allocation
create({ workspaceId, userId, taskName, date, allocatedDuration, weekNumber })

// Log time spent
logTime({ workspaceId, userId, allocationId, sessionStart, sessionEnd, elapsedTime })
```

## Development Workflow

### 1. Run Convex Dev Server

```bash
npm run convex:dev
```

This watches `convex/` folder for changes and auto-deploys functions.

### 2. Query Data in Dashboard

Visit the Convex dashboard (URL provided when running `convex dev`) to:
- Browse tables
- Run queries
- View logs
- Inspect data

### 3. Deploy to Production

```bash
npm run convex:deploy
```

## Permissions Model

The app uses a workspace-based permissions system:

1. **Owner**: Creates workspace, has full control
2. **Shared Users**: Invited to workspace with granular permissions
3. **Module Permissions**: Per-user, per-module access control
   - `canView`: See data
   - `canAdd`: Create new items
   - `canDelete`: Remove items
   - `canEditShared`: Modify shared data

### Private Data

Accounts and data can be marked as `isPrivate`, hiding them from non-admin users.

## Troubleshooting

### "Cannot find module 'convex/server'"

Run:
```bash
npx convex dev
```

This generates the required type definitions.

### Environment variable not found

Ensure `.env` has:
```
VITE_CONVEX_URL=https://your-project.convex.cloud
```

Restart the dev server after adding.

### Schema validation errors

Check `convex/schema.ts` for type mismatches. The schema uses Convex validators (`v.string()`, `v.number()`, etc.).

## Resources

- [Convex Docs](https://docs.convex.dev)
- [Convex Schema Guide](https://docs.convex.dev/database/schemas)
- [Convex React Guide](https://docs.convex.dev/client/react)
