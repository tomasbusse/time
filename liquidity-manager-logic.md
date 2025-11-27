# Liquidity Manager Logic Documentation

## Overview
The Liquidity Manager is designed to track liquid assets (bank accounts) and calculate progress toward liquidity goals.

## Current Data Flow (After Fix)

### 1. Data Source
- **Query**: `api.simpleFinance.listSimpleAssets`
- **Data**: All assets from the simple finance system
- **Filter**: Only `type === 'bank_account'` assets are considered liquid

### 2. Current Liquidity Calculation
```typescript
const currentLiquidity = simpleAssets
  ?.filter((asset) => {
    // Only include bank accounts (the most liquid assets)
    return asset.type === 'bank_account' && asset.currentValue > 0
  })
  .reduce((sum, asset) => sum + (asset.currentValue || 0), 0) || 0
```

### 3. Target Goal Calculation
```typescript
const targetLiquidity = goalData?.targetEquity || 0
// From: api.simpleFinance.getEquityGoalProgress
```

### 4. Progress Metrics
```typescript
const missingAmount = Math.max(targetLiquidity - currentLiquidity, 0)
const progress = targetLiquidity > 0 ? (currentLiquidity / targetLiquidity) * 100 : 0
```

## Expected Data Requirements

### Simple Assets (Bank Accounts)
| Name | Type | Current Value |
|------|------|---------------|
| Main Checking Account | bank_account | €15,000 |
| Savings Account | bank_account | €10,000 |
| Money Market Fund | bank_account | €5,000 |
| **Total Liquid Assets** | | **€30,000** |

### Equity Goal
- **Target Equity**: €90,000
- **Target Date**: (optional)

