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
import type { Id } from '../../../convex/_generated/dataModel'

interface DraggableDashboardProps {
  workspaceId: Id<"workspaces"> | null
  userId: Id<"users"> | null
  userName?: string | null
}

export function DraggableDashboard({ workspaceId, userId, userName }: DraggableDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices'>('overview')

  // Data queries
  const finance = useQuery(api.finance.subscriptionTotals, workspaceId ? { workspaceId } : 'skip')
  const lists = useQuery(api.food.listShoppingLists, workspaceId ? { workspaceId } : 'skip') as any[] | 'skip' | undefined

  return (
    <div className="space-y-8 bg-custom-off-white p-6 lg:p-8 rounded-lg min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-dark-blue">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {userName || 'User'}. Here's your productivity overview.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'overview'
            ? 'bg-white text-dark-blue shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'invoices'
            ? 'bg-white text-dark-blue shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Invoices
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

          {/* Shopping Lists */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-base font-semibold text-dark-blue mb-4">Shopping Lists</h3>
            {Array.isArray(lists) && lists.length > 0 ? (
              <div className="space-y-3 flex-1">
                {lists.slice(0, 3).map((list: any) => {
                  const total = Array.isArray(list.items) ? list.items.length : 0
                  const completed = Array.isArray(list.items) ? list.items.filter((i: any) => i.completed).length : 0

                  return (
                    <div key={list._id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-dark-blue truncate">{list.name}</span>
                        <span className="text-xs text-gray-500">{completed}/{total}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-custom-brown h-1.5 rounded-full transition-all"
                          style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
                <Link to="/food" className="text-custom-brown hover:text-brown text-sm font-medium mt-auto block pt-2">
                  View all →
                </Link>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-400 text-sm">No shopping lists</div>
              </div>
            )}
          </div>

          {/* Tasks & Timer - Spans 2 columns */}
          <div className="md:col-span-2 lg:col-span-2 row-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-base font-semibold text-dark-blue mb-4">Tasks & Timer</h3>
            <div className="flex-1">
              {workspaceId ? (
                <TasksDashboardWidget workspaceId={workspaceId} />
              ) : (
                <div className="text-center py-6 text-gray-400 text-sm">Loading...</div>
              )}
            </div>
          </div>

          {/* Quick Create Lesson */}
          <div className="md:col-span-1 lg:col-span-1 row-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-base font-semibold text-dark-blue mb-4">Quick Lesson</h3>
            {workspaceId && userId ? (
              <QuickLessonCreate workspaceId={workspaceId} userId={userId} />
            ) : (
              <div className="text-center py-6 text-gray-400 text-sm">Loading...</div>
            )}
          </div>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Open Invoices */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col min-h-[300px]">
            <h3 className="text-base font-semibold text-dark-blue mb-4">Open Invoices</h3>
            <div className="flex-1 flex flex-col">
              {workspaceId ? (
                <InvoicesDashboardWidget workspaceId={workspaceId} />
              ) : (
                <div className="text-center py-6 text-gray-400 text-sm">Loading...</div>
              )}
            </div>
          </div>

          {/* Draft Invoices */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col min-h-[300px]">
            <h3 className="text-base font-semibold text-dark-blue mb-4">Draft Invoices</h3>
            <div className="flex-1 flex flex-col">
              {workspaceId ? (
                <DraftInvoicesDashboardWidget workspaceId={workspaceId} />
              ) : (
                <div className="text-center py-6 text-gray-400 text-sm">Loading...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}