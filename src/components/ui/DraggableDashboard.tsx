import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { FinancialOverviewWidget } from './FinancialOverviewWidget'
import { formatCurrency } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { InvoicesDashboardWidget } from './InvoicesDashboardWidget'
import { TasksDashboardWidget } from './TasksDashboardWidget'
import { DraftInvoicesDashboardWidget } from './DraftInvoicesDashboardWidget'
import { QuickLessonCreate } from './QuickLessonCreate'
import { QuickMenuWidget } from './QuickMenuWidget'
import { DailyTasksWidget } from './DailyTasksWidget'
import { BottomNavigation } from '../BottomNavigation'
import type { Id } from '../../../convex/_generated/dataModel'

interface DraggableDashboardProps {
  workspaceId: Id<"workspaces"> | null
  userId: Id<"users"> | null
  userName?: string | null
}

export function DraggableDashboard({ workspaceId, userId, userName }: DraggableDashboardProps) {
  // We can keep the tab state for desktop if we want, but for mobile we are focusing on the new design
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices'>('overview')

  // Data queries
  const finance = useQuery(api.finance.subscriptionTotals, workspaceId ? { workspaceId } : 'skip')
  const lists = useQuery(api.food.listShoppingLists, workspaceId ? { workspaceId } : 'skip') as any[] | 'skip' | undefined

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-custom-off-white pb-24 lg:pb-8">
      {/* Mobile Header - Removed as it is now in TopBar */}

      {/* Desktop Header (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 p-6 lg:p-8">
        <div>
          <h1 className="text-3xl font-bold text-dark-blue">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {userName || 'User'}. Here's your productivity overview.</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 lg:p-8 space-y-8 max-w-md mx-auto lg:max-w-none">

        {/* Quick Menu */}
        <div>
          <h3 className="text-lg font-bold text-dark-blue mb-4 px-4 lg:px-0">Quick Menu</h3>
          <QuickMenuWidget />
        </div>

        {/* Daily Tasks */}
        <DailyTasksWidget workspaceId={workspaceId!} />

        {/* Desktop-only Widgets (Hidden on Mobile for now to match screenshot purity, or we can add them below) */}
        <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {/* Financial Overview */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-base font-semibold text-dark-blue mb-4">Financial Overview</h3>
            <div className="flex-1">
              <FinancialOverviewWidget />
            </div>
          </div>

          {/* Subscriptions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
            <h3 className="text-base font-semibold text-dark-blue mb-2">Subscriptions</h3>
            {finance ? (
              <div>
                <div className="text-3xl font-bold text-dark-blue">
                  €{finance.monthlyTotal.toFixed(2)}
                  <span className="text-sm font-normal text-gray-600 ml-1">/mo</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(finance.yearlyTotal)}/year
                </p>
                <div className="mt-4">
                  <Link to="/finance" className="text-custom-brown hover:text-brown text-sm font-medium flex items-center gap-1">
                    Manage →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 text-sm">Loading...</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}