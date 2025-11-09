import { useMemo } from 'react'

export interface Subscription {
  id: string
  name: string
  cost: number
  billingCycle: 'monthly' | 'yearly'
  nextBillingDate: string
  isActive: boolean
  classification: 'business' | 'private'
  category: 'ai' | 'software' | 'marketing' | 'productivity' | 'design' | 'communication' | 'development' | 'analytics' | 'security' | 'other'
  subcategory?: string
}

export interface CategoryBudget {
  id?: string
  classification: 'business' | 'private'
  category: 'ai' | 'software' | 'marketing' | 'productivity' | 'design' | 'communication' | 'development' | 'analytics' | 'security' | 'other'
  subcategory?: string
  monthlyBudgetLimit: number
  yearlyBudgetLimit: number
  alertThreshold: '50' | '75' | '90' | '100'
  isActive: boolean
}

export interface CategorySpending {
  classification: 'business' | 'private'
  category: string
  subcategory?: string
  subscriptions: Subscription[]
  monthlyTotal: number
  yearlyTotal: number
  budgetLimit?: number
  budgetUsage: number
  budgetStatus: 'under' | 'warning' | 'over' | 'no-budget'
  alertThreshold: number
}

export function useBudgetTracking(
  subscriptions: Subscription[],
  budgets: CategoryBudget[] = []
) {
  const categorySpending = useMemo(() => {
    const spending: CategorySpending[] = []

    // Group subscriptions by classification and category
    const grouped = subscriptions
      .filter(sub => sub.isActive)
      .reduce((acc, sub) => {
        const key = `${sub.classification}-${sub.category}-${sub.subcategory || 'none'}`
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(sub)
        return acc
      }, {} as Record<string, Subscription[]>)

    // Calculate spending for each group
    Object.entries(grouped).forEach(([key, subs]) => {
      const [classification, category, subcategory] = key.split('-')
      const monthlyTotal = subs.reduce((sum, sub) => 
        sum + (sub.billingCycle === 'monthly' ? sub.cost : sub.cost / 12), 0
      )
      const yearlyTotal = monthlyTotal * 12

      // Find matching budget
      const budget = budgets.find(b => 
        b.classification === classification &&
        b.category === category &&
        b.subcategory === subcategory &&
        b.isActive
      )

      let budgetStatus: CategorySpending['budgetStatus'] = 'no-budget'
      let budgetUsage = 0
      let alertThreshold = 0

      if (budget) {
        budgetUsage = budget.monthlyBudgetLimit > 0 ? (monthlyTotal / budget.monthlyBudgetLimit) * 100 : 0
        alertThreshold = parseInt(budget.alertThreshold)
        
        if (monthlyTotal > budget.monthlyBudgetLimit) {
          budgetStatus = 'over'
        } else if (budgetUsage >= alertThreshold) {
          budgetStatus = 'warning'
        } else {
          budgetStatus = 'under'
        }
      }

      spending.push({
        classification: classification as 'business' | 'private',
        category,
        subcategory: subcategory === 'none' ? undefined : subcategory,
        subscriptions: subs,
        monthlyTotal,
        yearlyTotal,
        budgetLimit: budget?.monthlyBudgetLimit,
        budgetUsage,
        budgetStatus,
        alertThreshold
      })
    })

    return spending.sort((a, b) => b.monthlyTotal - a.monthlyTotal)
  }, [subscriptions, budgets])

  const totalSpending = useMemo(() => {
    return subscriptions
      .filter(sub => sub.isActive)
      .reduce((sum, sub) => 
        sum + (sub.billingCycle === 'monthly' ? sub.cost : sub.cost / 12), 0
      )
  }, [subscriptions])

  const spendingByClassification = useMemo(() => {
    const business = categorySpending
      .filter(s => s.classification === 'business')
      .reduce((sum, s) => sum + s.monthlyTotal, 0)
    
    const privateSpending = categorySpending
      .filter(s => s.classification === 'private')
      .reduce((sum, s) => sum + s.monthlyTotal, 0)

    return { business, private: privateSpending }
  }, [categorySpending])

  const spendingByCategory = useMemo(() => {
    const categoryTotals = categorySpending.reduce((acc, spending) => {
      if (!acc[spending.category]) {
        acc[spending.category] = 0
      }
      acc[spending.category] += spending.monthlyTotal
      return acc
    }, {} as Record<string, number>)

    return Object.entries(categoryTotals)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
  }, [categorySpending])

  const budgetAlerts = useMemo(() => {
    return categorySpending
      .filter(s => s.budgetStatus === 'warning' || s.budgetStatus === 'over')
      .map(s => ({
        category: s.category,
        classification: s.classification,
        current: s.monthlyTotal,
        limit: s.budgetLimit || 0,
        usage: s.budgetUsage,
        status: s.budgetStatus
      }))
  }, [categorySpending])

  const getBudgetColor = (status: CategorySpending['budgetStatus']): string => {
    switch (status) {
      case 'under':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'over':
        return 'text-red-600'
      default:
        return 'text-neutral-500'
    }
  }

  const getBudgetBgColor = (status: CategorySpending['budgetStatus']): string => {
    switch (status) {
      case 'under':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'over':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-neutral-50 border-neutral-200'
    }
  }

  return {
    categorySpending,
    totalSpending,
    spendingByClassification,
    spendingByCategory,
    budgetAlerts,
    getBudgetColor,
    getBudgetBgColor
  }
}