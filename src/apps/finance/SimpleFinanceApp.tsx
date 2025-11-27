import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { SimpleAssetsLiabilities } from './components/SimpleAssetsLiabilities'
import { SubscriptionForm } from './components/SubscriptionForm'
import SubscriptionList from './components/SubscriptionList'
import NewLiquidityManager from './components/NewLiquidityManager'
import MoneyOverview from './components/MoneyOverview'
import BudgetPage from './components/BudgetPage'
import InvoiceApp from '../invoices/InvoiceApp'
import InvoiceOverview from '../invoices/components/InvoiceOverview'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TrendingUp, TrendingDown, Users, GraduationCap } from 'lucide-react'
import UserManagementPage from '../admin/UserManagementPage'
import TeacherDashboard from '../teacher/TeacherDashboard'

type TabType = 'overview' | 'assets-liabilities' | 'equity' | 'subscriptions' | 'budget' | 'invoices-overview' | 'invoices-list' | 'invoices-drafts' | 'invoices-customers' | 'invoices-lessons' | 'users' | 'teacher-dashboard'

interface Subscription {
  id: string
  name: string
  cost: number
  yearlyAmount?: number
  billingCycle: 'monthly' | 'yearly'
  nextBillingDate: string
  isActive: boolean
  isNecessary?: boolean
  classification: 'business' | 'private'
  category: 'ai' | 'software' | 'marketing' | 'productivity' | 'design' | 'communication' | 'development' | 'analytics' | 'security' | 'other'
  subcategory?: string
  type?: 'subscription' | 'bill' | 'rent' | 'insurance' | 'loan' | 'other'
}

export default function FinanceApp() {
  const { workspaceId, userId } = useWorkspace()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [classificationFilter, setClassificationFilter] = useState<'all' | 'business' | 'private'>('all');
  const currentUser = useQuery(api.users.getCurrentUser);

  // Auto-redirect teachers to dashboard
  if (currentUser && !currentUser.isAdmin && currentUser.role === 'teacher' && activeTab !== 'teacher-dashboard') {
    setActiveTab('teacher-dashboard');
  }

  // Get simple finance data
  const netWorth = useQuery(api.simpleFinance.getSimpleNetWorth, workspaceId ? { workspaceId } : 'skip')
  const progress = useQuery(api.simpleFinance.getSimpleProgress, workspaceId ? { workspaceId } : 'skip')

  // Subscriptions
  const subscriptionsData = useQuery(api.finance.listSubscriptions, workspaceId ? { workspaceId } : 'skip')
  const subs: Subscription[] = (subscriptionsData || []).map((s: any) => ({
    id: s._id,
    name: s.name,
    cost: s.cost,
    yearlyAmount: s.yearlyAmount,
    billingCycle: s.billingCycle,
    nextBillingDate: s.nextBillingDate,
    isActive: s.isActive,
    isNecessary: s.isNecessary ?? true,
    classification: s.classification ?? 'private',
    category: s.category ?? 'other',
    subcategory: s.subcategory,
    type: s.type ?? 'subscription',
  }))

  const filteredSubs = subs.filter(sub => {
    if (classificationFilter === 'all') {
      return true;
    }
    return sub.classification === classificationFilter;
  });

  const createSubscription = useMutation(api.finance.createSubscription)
  const updateSubscription = useMutation(api.finance.updateSubscription)
  const deleteSubscription = useMutation(api.finance.deleteSubscription)

  // Equity goal - now handled by UnifiedEquityPage component
  // Removed local goal state and modal since UnifiedEquityPage handles it

  const [showSubModal, setShowSubModal] = useState(false)
  const [editingSub, setEditingSub] = useState<Subscription | undefined>()
  const [subForm, setSubForm] = useState({
    name: '',
    cost: 0,
    yearlyAmount: undefined as number | undefined,
    billingCycle: 'monthly' as 'monthly' | 'yearly',
    nextBillingDate: '',
    isActive: true,
    isNecessary: true,
    classification: 'private' as 'business' | 'private',
    category: 'other' as 'ai' | 'software' | 'marketing' | 'productivity' | 'design' | 'communication' | 'development' | 'analytics' | 'security' | 'other',
    subcategory: '' as string | undefined,
  })

  const handleToggleNecessary = async (subscriptionId: string, isNecessary: boolean) => {
    await updateSubscription({
      id: subscriptionId as any,
      isNecessary: isNecessary,
      ownerId: userId as any,
    })
  }

  const handleToggleActive = async (subscriptionId: string, isActive: boolean) => {
    await updateSubscription({
      id: subscriptionId as any,
      isActive: isActive,
      ownerId: userId as any,
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  return (
    <div className="min-h-screen bg-off-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-gray hover:text-dark-blue mb-4 sm:mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm sm:text-base">Back to Dashboard</span>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-dark-blue mb-6 sm:mb-8">Finance</h1>

        {/* Money Dropdown Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-4 sm:mb-6 overflow-hidden">
          <div className="p-3 sm:p-4">
            <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 flex-1">
                <span className="text-xs sm:text-sm font-medium text-gray-600 sm:w-16">Money:</span>
                <div className="relative flex-1 w-full">
                  <select
                    value={['overview', 'assets-liabilities', 'equity', 'subscriptions', 'budget'].includes(activeTab) ? activeTab : ''}
                    onChange={(e) => {
                      if (e.target.value) setActiveTab(e.target.value as TabType)
                    }}
                    className="w-full px-3 sm:px-4 py-2 pr-10 border border-light-gray rounded-lg bg-white text-dark-blue text-sm sm:text-base font-medium focus:outline-none focus:ring-2 focus:ring-custom-brown appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select View</option>
                    <option value="overview">Overview</option>
                    <option value="assets-liabilities">Assets & Liability</option>
                    <option value="equity">Liquidity</option>
                    <option value="subscriptions">Subscriptions</option>
                    <option value="budget">Budget</option>
                    {(currentUser?.isAdmin || currentUser?.role === 'admin') && (
                      <option value="users">Users</option>
                    )}
                    {(currentUser?.role === 'teacher' || currentUser?.isAdmin || currentUser?.role === 'admin') && (
                      <option value="teacher-dashboard">Teacher Portal</option>
                    )}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-600 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 flex-1">
                <span className="text-xs sm:text-sm font-medium text-gray-600 sm:w-16">Invoices:</span>
                <div className="relative flex-1 w-full">
                  <select
                    value={activeTab.startsWith('invoices-') ? activeTab : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        setActiveTab(e.target.value as TabType)
                        // Set hash for InvoiceApp routing
                        if (e.target.value === 'invoices-list') {
                          window.location.hash = '#/invoices'
                        } else if (e.target.value === 'invoices-customers') {
                          window.location.hash = '#/invoices/customers'
                        } else if (e.target.value === 'invoices-lessons') {
                          window.location.hash = '#/invoices/lessons'
                        }
                      }
                    }}
                    className="w-full px-3 sm:px-4 py-2 pr-10 border border-light-gray rounded-lg bg-white text-dark-blue text-sm sm:text-base font-medium focus:outline-none focus:ring-2 focus:ring-custom-brown appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select View</option>
                    <option value="invoices-overview">Overview</option>
                    <option value="invoices-list">Invoices</option>
                    <option value="invoices-drafts">Drafts</option>
                    <option value="invoices-customers">Customers</option>
                    <option value="invoices-lessons">Lessons</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-600 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && <MoneyOverview onNavigate={(tab) => setActiveTab(tab as TabType)} />}

        {/* Assets & Liabilities Tab */}
        {activeTab === 'assets-liabilities' && <SimpleAssetsLiabilities />}

        {/* Budget Tab */}
        {activeTab === 'budget' && <BudgetPage />}

        {/* Liquidity Tab - Shows Original Equity Content */}
        {activeTab === 'equity' && (
          <div className="mt-6">
            <NewLiquidityManager />
          </div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <>
            {/* Responsive Filter Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
              <span className="text-sm font-medium text-gray-600">Filter by:</span>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant={classificationFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setClassificationFilter('all')}
                  className="flex-1 sm:flex-none"
                >
                  All
                </Button>
                <Button
                  variant={classificationFilter === 'business' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setClassificationFilter('business')}
                  className="flex-1 sm:flex-none"
                >
                  Business
                </Button>
                <Button
                  variant={classificationFilter === 'private' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setClassificationFilter('private')}
                  className="flex-1 sm:flex-none"
                >
                  Private
                </Button>
              </div>
            </div>
            <SubscriptionList
              subscriptions={filteredSubs}
              classificationFilter={classificationFilter}
              onAddSubscription={() => {
                setEditingSub(undefined)
                setSubForm({ name: '', cost: 0, yearlyAmount: undefined, billingCycle: 'monthly', nextBillingDate: '', isActive: true, isNecessary: true, classification: 'private', category: 'other', subcategory: undefined })
                setShowSubModal(true)
              }}
              onEditSubscription={(id) => {
                const found = subs.find((s) => s.id === id)
                if (found) {
                  setEditingSub(found)
                  setSubForm({ name: found.name, cost: found.cost, yearlyAmount: found.yearlyAmount, billingCycle: found.billingCycle, nextBillingDate: found.nextBillingDate, isActive: found.isActive, isNecessary: found.isNecessary ?? true, classification: found.classification, category: found.category, subcategory: found.subcategory })
                  setShowSubModal(true)
                }
              }}
              onDeleteSubscription={async (id) => {
                if (!userId) return
                await deleteSubscription({ id: id as any, ownerId: userId as any })
              }}
              onToggleNecessary={handleToggleNecessary}
              onToggleActive={handleToggleActive}
            />
          </>
        )}

        {/* Invoices Tabs - using hash-based routing */}
        {(activeTab === 'invoices-overview' || activeTab === 'invoices-list' || activeTab === 'invoices-drafts' || activeTab === 'invoices-customers' || activeTab === 'invoices-lessons') && (
          <InvoiceApp />
        )}

        {/* Users Tab */}
        {activeTab === 'users' && <UserManagementPage />}

        {/* Teacher Dashboard Tab */}
        {activeTab === 'teacher-dashboard' && <TeacherDashboard />}

        {/* Subscription Modal */}
        {showSubModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <SubscriptionForm
              initialData={editingSub ? {
                id: editingSub.id,
                name: editingSub.name,
                cost: editingSub.cost,
                yearlyAmount: editingSub.yearlyAmount,
                billingCycle: editingSub.billingCycle,
                nextBillingDate: editingSub.nextBillingDate,
                isActive: editingSub.isActive,
                isNecessary: editingSub.isNecessary,
                classification: editingSub.classification,
                category: editingSub.category,
                subcategory: editingSub.subcategory,
                type: editingSub.type,
              } : undefined}
              onSubmit={async (data) => {
                if (!workspaceId || !userId) return
                if (editingSub) {
                  await updateSubscription({ id: editingSub.id as any, ...data, ownerId: userId as any })
                } else {
                  await createSubscription({ workspaceId: workspaceId as any, ownerId: userId as any, ...data })
                }
                setShowSubModal(false)
                setEditingSub(undefined)
              }}
              onCancel={() => {
                setShowSubModal(false)
                setEditingSub(undefined)
              }}
            />
          </div>
        )}

        {/* Equity Goal Modal - now handled by UnifiedEquityPage */}
      </div>
    </div >
  )
}
