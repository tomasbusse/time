# Productivity App

A modular productivity application with building-block architecture featuring Time, Finance, Flow, Food, Calendar, and Ideas modules.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Convex

1. Create a Convex account at [convex.dev](https://convex.dev)
2. Run the Convex setup:

```bash
npx convex dev
```

3. Copy the provided Convex URL to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your Convex URL:

```
VITE_CONVEX_URL=https://your-project.convex.cloud
```

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

## Project Structure

```
/Users/tomas/apps/time/
├── src/
│   ├── apps/              # Modular applications
│   │   ├── time/          # Time allocation & tracking
│   │   ├── finance/       # Liquidity, Assets, Subscriptions
│   │   ├── flow/          # Task manager
│   │   ├── food/          # Recipes & shopping lists
│   │   ├── calendar/      # Google Calendar sync
│   │   └── ideas/         # Idea capture
│   ├── components/        # Shared components
│   ├── pages/             # Dashboard & Admin
│   └── routes.tsx         # Application routing
├── convex/                # Convex database
│   ├── schema.ts          # Database schema
│   └── functions/         # Convex queries & mutations
└── designs/               # Design references
```

## Modules

### Time
Daily/weekly time allocation with real-time timer, elapsed logging, and progress tracking.

### Finance
- **Liquidity Manager**: Track cash in/out across accounts (bank, loan, savings)
- **Assets Manager**: Manage assets and liabilities with equity visualization
- **Subscription Manager**: Track recurring subscriptions

### Flow
Comprehensive task manager from Ideas → Tasks → Completion.

### Food & Shopping
Recipe management with ingredient-to-shopping-list integration.

### Calendar
Google Calendar integration for schedule sync.

### Ideas
Quick capture interface for thoughts and inspiration.

## Features

- **Modular Architecture**: Building-block design with independent, interconnected modules
- **Real-time Sync**: Convex database powers real-time updates
- **Sharing & Permissions**: Admin-controlled workspace sharing with granular permissions
- **Private Data**: Mark accounts/data as private to prevent accidental sharing

## Documentation

- [Convex Setup](./CONVEX_SETUP.md) - Database initialization and schema
- [Design Guide](./DESIGN_GUIDE.md) - Time app design specifications
- [Architecture](./ARCHITECTURE.md) - Module system and data flow
- [Permissions](./PERMISSIONS.md) - Admin/sharing model
- [Finance Data Model](./FINANCE_DATA_MODEL.md) - Liquidity and Assets schema
- [Deployment](./DEPLOYMENT.md) - GitHub Actions and Vercel setup

## Development

```bash
# Run dev server
npm run dev

# Run Convex dev (in separate terminal)
npm run convex:dev

# Build for production
npm run build

# Deploy Convex functions
npm run convex:deploy
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS
- **Database**: Convex (real-time serverless database)
- **Icons**: Lucide React
- **Date handling**: date-fns
- **Routing**: React Router

## License

Private project
