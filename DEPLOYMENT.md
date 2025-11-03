# GitHub Actions and Vercel Deployment Setup

This guide configures automatic deployment to Vercel when pushing to GitHub.

## Prerequisites

1. GitHub repository initialized
2. Vercel account created
3. Vercel CLI installed (optional)

## GitHub Actions Configuration

### 1. Create Workflow File

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Build project
        run: npm run build
      
      - name: Run tests (if available)
        run: npm test --if-present

  deploy-preview:
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'pull_request'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Deploy to Vercel (Preview)
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: ${{ secrets.VERCEL_ORG_ID }}

  deploy-production:
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          scope: ${{ secrets.VERCEL_ORG_ID }}
```

### 2. Setup GitHub Secrets

Add the following secrets to your GitHub repository:

1. Go to: Repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add these secrets:

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `VERCEL_TOKEN` | Vercel deployment token | Vercel → Settings → Tokens |
| `VERCEL_ORG_ID` | Organization ID | Run `vercel project ls` |
| `VERCEL_PROJECT_ID` | Project ID | Run `vercel project ls` |

#### Getting Vercel Tokens

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Get project details
vercel project ls
```

Copy the org ID and project ID from the output.

To create a token:
1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Give it a name (e.g., "GitHub Actions")
4. Copy the token (you won't see it again!)

## Vercel Configuration

### 1. Create `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This is already created at `/Users/tomas/apps/time/vercel.json`.

### 2. Environment Variables in Vercel

Add environment variables to Vercel:

1. Go to: Vercel → Your Project → Settings → Environment Variables
2. Add:
   - `VITE_CONVEX_URL` (from your Convex dashboard)
   - `VITE_GOOGLE_CLIENT_ID` (when Calendar integration is ready)
   - `VITE_GOOGLE_API_KEY` (when Calendar integration is ready)

## Local Testing

### Test build locally before pushing:

```bash
# Build project
npm run build

# Preview build
npm run preview
```

Visit `http://localhost:4173` to test the production build.

## Deployment Workflow

### Automatic Deployment

1. **Push to main branch**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin main
   ```

2. **GitHub Actions runs**:
   - Installs dependencies
   - Runs linter
   - Builds project
   - Deploys to Vercel (production)

3. **Vercel deployment**:
   - Build completes
   - Production URL updated
   - Visit: `https://your-project.vercel.app`

### Pull Request Previews

1. **Create PR**:
   ```bash
   git checkout -b feature/new-component
   git add .
   git commit -m "feat: add timer component"
   git push origin feature/new-component
   ```

2. **GitHub Actions runs**:
   - Tests code
   - Deploys preview to Vercel
   - Comments on PR with preview URL

3. **Review preview**:
   - Click preview URL in PR comment
   - Test changes
   - Merge when ready

## Convex Deployment

Convex functions must be deployed separately:

```bash
# Deploy Convex to production
npm run convex:deploy
```

Add this to your workflow if you want automatic Convex deployment:

```yaml
- name: Deploy Convex Functions
  run: npm run convex:deploy
  env:
    CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}
```

Get `CONVEX_DEPLOY_KEY` from Convex dashboard → Settings → Deploy Keys.

## Monitoring Deployments

### Vercel Dashboard

Visit https://vercel.com/dashboard to:
- View deployment logs
- Monitor build times
- Check deployment status
- Roll back if needed

### GitHub Actions

Visit Repository → Actions to:
- See workflow runs
- Debug failed builds
- View test results

## Troubleshooting

### Build Fails on Vercel

1. Check GitHub Actions logs
2. Verify environment variables are set
3. Test build locally: `npm run build`

### Convex URL Not Found

1. Ensure `VITE_CONVEX_URL` is set in Vercel env vars
2. Redeploy after adding env var
3. Check `.env` is not committed (it's in `.gitignore`)

### GitHub Actions Fails

1. Check secrets are correctly set
2. Verify Vercel token is valid
3. Review workflow logs for error messages

## Manual Deployment

If automatic deployment fails, deploy manually:

```bash
# Deploy to Vercel
vercel --prod

# Or use Vercel CLI
npm i -g vercel
vercel login
vercel --prod
```

## Resources

- [Vercel Docs](https://vercel.com/docs)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Vercel GitHub Integration](https://vercel.com/docs/git/vercel-for-github)
