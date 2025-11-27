import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useWorkspace } from '@/lib/WorkspaceContext'
import AccountList from './components/AccountList'
import AccountForm from './components/AccountForm'
import EquityGoal from './components/EquityGoal'
import AssetsLiabilities from './components/AssetsLiabilities'
import { AssetForm } from './components/AssetForm'
import { LiabilityForm } from './components/LiabilityForm'
import { MonthlyValuationChart } from './components/MonthlyValuationChart'
import { ValuationEntry } from './components/ValuationEntry'
import { SubscriptionForm } from './components/SubscriptionForm'
import SubscriptionList from './components/SubscriptionList'

type TabType = 'liquidity' | 'assets' | 'subscriptions'

interface Account {
  id: string
  name: string
  accountType: 'bank' | 'loan' | 'savings'
  currentBalance: number
  isPrivate: boolean
}

interface AccountWithBalance {
  _id: string
  workspaceId: string
  accountCode: string
  accountName: string
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  accountCategory: string
  isActive: boolean
  currentBalance: number
  createdAt: number
}

interface Asset {
  id: string
  accountId: string
  name: string
  type: string
  purchasePrice?: number
  currentValue?: number
  isFixed: boolean
}

interface Liability {
  id: string
  accountId: string
  name: string
  type: string
  originalAmount?: number
  currentBalance?: number
  isFixed: boolean
}

interface MonthlyValuation {
  _id: string
  workspaceId: string
  accountId: string
  year: number
  month: number
  beginningBalance: number
  endingBalance: number
  netTransactions: number
  notes?: string
}

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
}

export default function FinanceApp() {
  const { workspaceId, userId } = useWorkspace()
  const [activeTab, setActiveTab] = useState<TabType>('liquidity')
  const [classificationFilter, setClassificationFilter] = useState<'all' | 'business' | 'private'>('all');
  const [showAccountForm, setShowAccountForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | undefined>()

  // Query accounts from Convex
  const accountsData = useQuery(api.finance.listAccounts, 
    workspaceId ? { workspaceId } : 'skip'
  )
  const accounts = (accountsData || []).map(acc => ({
    id: acc._id,
    name: acc.name ?? '',
    accountType: acc.accountType,
    currentBalance: acc.currentBalance ?? 0,
    isPrivate: acc.isPrivate ?? false,
  }))

  // Mutations
  const createAccountMutation = useMutation(api.finance.createAccount)
  const updateAccountMutation = useMutation(api.finance.updateAccount)
  const deleteAccountMutation = useMutation(api.finance.deleteAccount)

  // Equity goal (Convex)
  const goal = useQuery(
    api.finance.getLiquidityGoal,
    workspaceId ? { workspaceId } : 'skip'
  )
  const upsertGoal = useMutation(api.finance.upsertLiquidityGoal)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [goalAmount, setGoalAmount] = useState<number>(goal?.targetEquity ?? 0)
  const [goalDate, setGoalDate] = useState<string>(goal?.targetDate ?? '')

  // New Account-based Assets & Liabilities System
  const accountsForAssets = useQuery(
    api.finance.listAccounts,
    workspaceId ? { workspaceId, accountType: 'asset' } : 'skip'
  )
  const accountsForLiabilities = useQuery(
    api.finance.listAccounts,
    workspaceId ? { workspaceId, accountType: 'liability' } : 'skip'
  )

  const assetAccounts = (accountsForAssets || []).map((a) => ({
    id: a._id,
    accountId: a._id,
    accountCode: a.accountCode,
    accountName: a.accountName,
    accountCategory: a.accountCategory,
    currentBalance: a.currentBalance ?? 0,
    isActive: a.isActive,
  }))

  const liabilityAccounts = (accountsForLiabilities || []).map((a) => ({
    id: a._id,
    accountId: a._id,
    accountCode: a.accountCode,
    accountName: a.accountName,
    accountCategory: a.accountCategory,
    currentBalance: a.currentBalance ?? 0,
    isActive: a.isActive,
  }))

  const assetsMutation = useMutation(api.finance.createAsset)
  const updateAssetMutation = useMutation(api.finance.updateAsset)
  const deleteAssetMutation = useMutation(api.finance.deleteAsset)

  const liabilityMutation = useMutation(api.finance.createLiability)
  const updateLiabilityMutation = useMutation(api.finance.updateLiability)
  const deleteLiabilityMutation = useMutation(api.finance.deleteLiability)

  // Monthly valuation mutation
  const createMonthlyValuationMutation = useMutation(api.finance.createMonthlyValuation)

  // Asset form state
  const [showAssetForm, setShowAssetForm] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>()

  // Liability form state
  const [showLiabilityForm, setShowLiabilityForm] = useState(false)
  const [editingLiability, setEditingLiability] = useState<Liability | undefined>()

  // Valuation state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [showAssetValuationEntry, setShowAssetValuationEntry] = useState(false)
  const [showLiabilityValuationEntry, setShowLiabilityValuationEntry] = useState(false)
  const [isSubmittingValuation, setIsSubmittingValuation] = useState(false)

  // Monthly Valuations (new system)
  const monthlyValuationsData = useQuery(
    api.finance.listMonthlyValuations,
    workspaceId ? { workspaceId, year: selectedYear } : 'skip'
  )

  const monthlyValuations = (monthlyValuationsData || []).map((v: MonthlyValuation) => ({
    _id: v._id,
    accountId: v.accountId,
    year: v.year,
    month: v.month,
    beginningBalance: v.beginningBalance,
    endingBalance: v.endingBalance,
    netTransactions: v.netTransactions,
  }))

  // Aggregate valuations by month for chart display
  const monthlyTotals = Array.from({ length: 12 }, (_, i) => {
    const monthNumber = i + 1
    const monthValuations = monthlyValuations.filter(v => v.month === monthNumber && v.year === selectedYear)
    const assetValuations = monthValuations.filter(v => {
      const assetAccount = assetAccounts.find(a => a.id === v.accountId)
      return assetAccount !== undefined
    })
    const liabilityValuations = monthValuations.filter(v => {
      const liabilityAccount = liabilityAccounts.find(a => a.id === v.accountId)
      return liabilityAccount !== undefined
    })
    
    return {
      month: String(monthNumber),
      assets: assetValuations.reduce((sum, v) => sum + v.endingBalance, 0),
      liabilities: liabilityValuations.reduce((sum, v) => sum + v.endingBalance, 0),
    }
  }).filter(m => m.assets > 0 || m.liabilities > 0)

  const subscriptionsData = useQuery(
    api.finance.listSubscriptions,
    workspaceId ? { workspaceId } : 'skip'
  )
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

  const handleSaveAccount = async (accountData: Partial<Account>) => {
    if (!workspaceId || !userId) return

    if (accountData.id) {
      // Update existing account
      await updateAccountMutation({
        accountId: accountData.id as any,
        accountName: accountData.name!,
      })
    } else {
      // Create new account
      await createAccountMutation({
        workspaceId: workspaceId as any,
        accountCode: `ACCT-${Date.now()}`,
        accountName: accountData.name!,
        accountType: accountData.accountType as any,
        accountCategory: 'default',
        isActive: true,
        createdBy: userId as any,
      })
    }
    setShowAccountForm(false)
    setEditingAccount(undefined)
  }

  const handleEditAccount = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId)
    if (account) {
      setEditingAccount(account as any)
      setShowAccountForm(true)
    }
  }

  const handleDeleteAccount = async (accountId: string) => {
    await deleteAccountMutation({ accountId: accountId as any })
  }

  const handleTogglePrivacy = async (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId)
    if (account) {
      await updateAccountMutation({
        accountId: accountId as any,
      })
    }
  }

  // Asset handlers (account-based)
  const handleSaveAsset = async (assetData: { name: string; type: string; accountId: string }) => {
    if (!workspaceId || !userId) return

    try {
      if (editingAsset) {
        await updateAssetMutation({
          id: editingAsset.id as any,
          name: assetData.name,
          type: assetData.type,
          ownerId: userId as any,
        })
      } else {
        // If no accountId provided, create an asset account automatically
        let accountId = assetData.accountId
        if (!accountId) {
          const newAccountId = await createAccountMutation({
            workspaceId: workspaceId as any,
            accountCode: `ASSET-${Date.now()}`,
            accountName: `${assetData.name} Account`,
            accountType: 'asset',
            accountCategory: assetData.type === 'property' || assetData.type === 'vehicle' ? 'fixed_asset' : 'current_asset',
            isActive: true,
            createdBy: userId as any,
          })
          accountId = newAccountId
        }

        await assetsMutation({
          workspaceId: workspaceId as any,
          ownerId: userId as any,
          accountId: accountId as any,
          name: assetData.name,
          type: assetData.type,
          isFixed: assetData.type === 'property' || assetData.type === 'vehicle',
        })
      }
      setShowAssetForm(false)
      setEditingAsset(undefined)
    } catch (error) {
      console.error('Error saving asset:', error)
      alert('Failed to save asset. Please try again.')
    }
  }

  const handleEditAsset = (assetId: string) => {
    console.log('[DEBUG] handleEditAsset triggered for', assetId)
    const asset = assetAccounts.find((a) => a.id === assetId)
    if (asset) {
      console.log('[DEBUG] Found asset for editing:', asset)
      setEditingAsset({
        id: asset.id,
        accountId: asset.accountId,
        name: asset.accountName,
        type: asset.accountCategory,
        isFixed: asset.accountCategory.includes('fixed'),
      })
      setShowAssetForm(true)
    } else {
      console.warn('[DEBUG] handleEditAsset: no matching asset found for ID', assetId)
    }
  }

  const handleDeleteAsset = async (assetId: string) => {
    if (!userId) return
    try {
      await deleteAccountMutation({ accountId: assetId as any })
    } catch (error) {
      console.error('Error deleting asset:', error)
      alert('Failed to delete asset')
    }
  }

  // Liability handlers (account-based)
  const handleSaveLiability = async (liabilityData: { name: string; relatedAssetId: string }) => {
    if (!workspaceId || !userId) return

    try {
      if (editingLiability) {
        await updateLiabilityMutation({
          id: editingLiability.id as any,
          name: liabilityData.name,
          ownerId: userId as any,
        })
      } else {
        // For new liabilities, create a new liability account
        const liabilityAccountId = await createAccountMutation({
          workspaceId: workspaceId as any,
          accountCode: `LIABILITY-${Date.now()}`,
          accountName: `${liabilityData.name} Account`,
          accountType: 'liability',
          accountCategory: 'current_liability',
          isActive: true,
          createdBy: userId as any,
        })

        await liabilityMutation({
          workspaceId: workspaceId as any,
          ownerId: userId as any,
          accountId: liabilityAccountId as any,
          name: liabilityData.name,
          type: 'liability',
          isFixed: true,
        })
      }
      setShowLiabilityForm(false)
      setEditingLiability(undefined)
    } catch (error) {
      console.error('Error saving liability:', error)
      alert('Failed to save liability. Please try again.')
    }
  }

  const handleEditLiability = (liabilityId: string) => {
    console.log('[DEBUG] handleEditLiability triggered for', liabilityId)
    const liability = liabilityAccounts.find((l) => l.id === liabilityId)
    if (liability) {
      console.log('[DEBUG] Found liability for editing:', liability)
      setEditingLiability({
        id: liability.id,
        accountId: liability.accountId,
        name: liability.accountName,
        type: liability.accountCategory,
        isFixed: liability.accountCategory.includes('long_term'),
      })
      setShowLiabilityForm(true)
    } else {
      console.warn('[DEBUG] handleEditLiability: no matching liability found for ID', liabilityId)
    }
  }

  const handleDeleteLiability = async (liabilityId: string) => {
    if (!userId) return
    try {
      await deleteAccountMutation({ accountId: liabilityId as any })
    } catch (error) {
      console.error('Error deleting liability:', error)
      alert('Failed to delete liability')
    }
  }

  const handleAddAssetValuation = async (date: string, amount: number, accountId: string) => {
    if (!workspaceId || !userId) return
    setIsSubmittingValuation(true)
    try {
      const [year, month, day] = date.split('-').map(Number)
      await createMonthlyValuationMutation({
        workspaceId: workspaceId as any,
        accountId: accountId as any,
        year,
        month,
        beginningBalance: 0,
        endingBalance: amount,
        netTransactions: amount,
        createdBy: userId as any,
      })
      setShowAssetValuationEntry(false)
    } catch (error) {
      console.error('Error creating asset valuation:', error)
    } finally {
      setIsSubmittingValuation(false)
    }
  }

  const handleAddLiabilityValuation = async (date: string, amount: number, accountId: string) => {
    if (!workspaceId || !userId) return
    setIsSubmittingValuation(true)
    try {
      const [year, month, day] = date.split('-').map(Number)
      await createMonthlyValuationMutation({
        workspaceId: workspaceId as any,
        accountId: accountId as any,
        year,
        month,
        beginningBalance: 0,
        endingBalance: amount,
        netTransactions: amount,
        createdBy: userId as any,
      })
      setShowLiabilityValuationEntry(false)
    } catch (error) {
      console.error('Error creating liability valuation:', error)
    } finally {
      setIsSubmittingValuation(false)
    }
  }

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

  const totalLiquidity = accounts
    .filter((acc) => acc.accountType === 'asset')
    .reduce((sum, acc) => sum + acc.currentBalance, 0)

  const totalLiabilitiesFromAccounts = accounts
    .filter((acc) => acc.accountType === 'liability')
    .reduce((sum, acc) => sum + Math.abs(acc.currentBalance), 0)

  const currentEquity = totalLiquidity - totalLiabilitiesFromAccounts

  return (
    <div className="min-h-screen bg-off-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray hover:text-dark-blue mb-4 sm:mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm sm:text-base">Back to Dashboard</span>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-dark-blue mb-6 sm:mb-8">Finance</h1>

        {/* Responsive Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-4 sm:mb-6 overflow-hidden">
          <div className="border-b border-light-gray">
            {/* Desktop: Horizontal tabs */}
            <div className="hidden sm:flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('liquidity')}
                className={`px-4 md:px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'liquidity'
                    ? 'text-custom-brown border-b-2 border-custom-brown'
                    : 'text-gray hover:text-dark-blue'
                }`}
              >
                Liquidity
              </button>
              <button
                onClick={() => setActiveTab('assets')}
                className={`px-4 md:px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'assets'
                    ? 'text-custom-brown border-b-2 border-custom-brown'
                    : 'text-gray hover:text-dark-blue'
                }`}
              >
                Assets & Liabilities
              </button>
              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`px-4 md:px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'subscriptions'
                    ? 'text-custom-brown border-b-2 border-custom-brown'
                    : 'text-gray hover:text-dark-blue'
                }`}
              >
                Subscriptions
              </button>
            </div>

            {/* Mobile: Dropdown select */}
            <div className="sm:hidden p-3">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as TabType)}
                className="w-full px-4 py-2 border border-light-gray rounded-lg bg-white text-dark-blue font-medium focus:outline-none focus:ring-2 focus:ring-custom-brown"
              >
                <option value="liquidity">Liquidity</option>
                <option value="assets">Assets & Liabilities</option>
                <option value="subscriptions">Subscriptions</option>
              </select>
            </div>
          </div>
        </div>

        {activeTab === 'liquidity' && (
          <div className="space-y-6">
            <EquityGoal
              currentEquity={currentEquity}
              targetEquity={goal?.targetEquity ?? 0}
              targetDate={goal?.targetDate}
              canEdit={Boolean(userId)}
              onEdit={() => setShowGoalModal(true)}
            />

            <AccountList
              accounts={accounts as any}
              onAddAccount={() => {
                setEditingAccount(undefined)
                setShowAccountForm(true)
              }}
              onEditAccount={handleEditAccount}
              onDeleteAccount={handleDeleteAccount}
              onTogglePrivacy={handleTogglePrivacy}
            />
          </div>
        )}

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
            } : undefined}
            onSubmit={async (data) => {
              if (!workspaceId || !userId) return
              if (editingSub) {
                await updateSubscription({
                  id: editingSub.id as any,
                  ...data,
                  ownerId: userId as any,
                })
              } else {
                await createSubscription({
                  workspaceId: workspaceId as any,
                  ownerId: userId as any,
                  ...data,
                })
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
      {showSubModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-dark-blue">{editingSub ? 'Edit Subscription' : 'Add Subscription'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray mb-2">Name</label>
                <input
                  type="text"
                  value={subForm.name}
                  onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray mb-2">
                    {subForm.billingCycle === 'monthly' ? 'Monthly Cost (€)' : 'Yearly Cost (€)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={subForm.cost}
                    onChange={(e) => setSubForm({ ...subForm, cost: Number(e.target.value) })}
                    className="flex h-10 w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray mb-2">Yearly Amount (€) <span className="text-xs text-gray">(Optional)</span></label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={subForm.yearlyAmount || ''}
                    onChange={(e) => setSubForm({ ...subForm, yearlyAmount: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Leave empty to auto-calc"
                    className="flex h-10 w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray mb-2">Billing Cycle</label>
                <select
                  value={subForm.billingCycle}
                  onChange={(e) => setSubForm({ ...subForm, billingCycle: e.target.value as 'monthly' | 'yearly' })}
                  className="flex h-10 w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={subForm.isNecessary}
                    onChange={(e) => setSubForm({ ...subForm, isNecessary: e.target.checked })}
                  />
                  <span className="text-sm text-gray">Necessary subscription</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={subForm.isActive}
                    onChange={(e) => setSubForm({ ...subForm, isActive: e.target.checked })}
                  />
                  <span className="text-sm text-gray">Active</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray mb-2">Classification</label>
                <select
                  value={subForm.classification}
                  onChange={(e) => setSubForm({ ...subForm, classification: e.target.value as 'business' | 'private' })}
                  className="flex h-10 w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm"
                >
                  <option value="business">Business</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray mb-2">Category</label>
                <select
                  value={subForm.category}
                  onChange={(e) => setSubForm({ ...subForm, category: e.target.value as any })}
                  className="flex h-10 w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm"
                >
                  <option value="ai">AI</option>
                  <option value="software">Software Tools</option>
                  <option value="marketing">Marketing</option>
                  <option value="productivity">Productivity</option>
                  <option value="design">Design</option>
                  <option value="communication">Communication</option>
                  <option value="development">Development</option>
                  <option value="analytics">Analytics</option>
                  <option value="security">Security</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray mb-2">Subcategory (Optional)</label>
                <input
                  type="text"
                  value={subForm.subcategory || ''}
                  onChange={(e) => setSubForm({ ...subForm, subcategory: e.target.value || undefined })}
                  placeholder="e.g., ChatGPT, Figma Pro, etc."
                  className="flex h-10 w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray mb-2">Next Billing Date</label>
                <input
                  type="date"
                  value={subForm.nextBillingDate}
                  onChange={(e) => setSubForm({ ...subForm, nextBillingDate: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button onClick={() => setShowSubModal(false)} className="flex-1 h-10 px-4 rounded-md border border-light-gray">Cancel</button>
              <button
                onClick={async () => {
                  if (!workspaceId || !userId || !subForm.name || subForm.cost <= 0 || !subForm.nextBillingDate) return
                  if (editingSub) {
                    await updateSubscription({
                      id: editingSub.id as any,
                      name: subForm.name,
                      cost: subForm.cost,
                      yearlyAmount: subForm.yearlyAmount,
                      billingCycle: subForm.billingCycle,
                      nextBillingDate: subForm.nextBillingDate,
                      isActive: subForm.isActive,
                      isNecessary: subForm.isNecessary,
                      classification: subForm.classification,
                      category: subForm.category,
                      subcategory: subForm.subcategory,
                      ownerId: userId as any,
                    })
                  } else {
                    await createSubscription({
                      workspaceId: workspaceId as any,
                      ownerId: userId as any,
                      name: subForm.name,
                      cost: subForm.cost,
                      yearlyAmount: subForm.yearlyAmount,
                      billingCycle: subForm.billingCycle,
                      nextBillingDate: subForm.nextBillingDate,
                      isActive: subForm.isActive,
                      isNecessary: subForm.isNecessary,
                      classification: subForm.classification,
                      category: subForm.category,
                      subcategory: subForm.subcategory,
                    })
                  }
                  setShowSubModal(false)
                  setEditingSub(undefined)
                }}
                className="flex-1 h-10 px-4 rounded-md bg-dark-blue text-off-white"
              >
                Save Subscription
              </button>
            </div>
          </div>
        </div>
      )}

        {activeTab === 'assets' && (
          <>
            <div className="mb-8">
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setShowAssetValuationEntry(true)}
                  className="px-4 py-2 bg-dark-blue text-off-white rounded-lg hover:bg-dark-blue disabled:opacity-50"
                  disabled={assetAccounts.length === 0}
                >
                  Record Asset Valuation
                </button>
                <button
                  onClick={() => setShowLiabilityValuationEntry(true)}
                  className="px-4 py-2 bg-red-600 text-off-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  disabled={liabilityAccounts.length === 0}
                >
                  Record Liability Valuation
                </button>
              </div>
              <MonthlyValuationChart 
                data={monthlyTotals} 
                onYearChange={setSelectedYear}
                currentYear={selectedYear}
              />
            </div>

            <AssetsLiabilities
              assetAccounts={assetAccounts}
              liabilityAccounts={liabilityAccounts}
              monthlyTotals={monthlyTotals}
              onAddAsset={() => {
                setEditingAsset(undefined)
                setShowAssetForm(true)
              }}
              onEditAsset={handleEditAsset}
              onDeleteAsset={handleDeleteAsset}
              onAddLiability={() => {
                setEditingLiability(undefined)
                setShowLiabilityForm(true)
              }}
              onEditLiability={handleEditLiability}
              onDeleteLiability={handleDeleteLiability}
            />

            {showAssetForm && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                  <div className="p-6">
                    <AssetForm
                      initialData={editingAsset ? {
                        id: editingAsset.id,
                        name: editingAsset.name,
                        type: editingAsset.type,
                        accountId: editingAsset.accountId,
                      } : undefined}
                      availableAccounts={assetAccounts.map(acc => ({
                        _id: acc.id,
                        accountName: acc.accountName,
                        accountCode: acc.accountCode,
                      }))}
                      onSubmit={handleSaveAsset}
                      onCancel={() => {
                        setShowAssetForm(false)
                        setEditingAsset(undefined)
                      }}
                      title={editingAsset ? 'Edit Asset' : 'Add Asset'}
                    />
                  </div>
                </div>
              </div>
            )}

            {showLiabilityForm && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                  <div className="p-6">
                    <LiabilityForm
                      initialData={editingLiability ? {
                        id: editingLiability.id,
                        name: editingLiability.name,
                        relatedAssetId: '',
                      } : undefined}
                      availableAssets={assetAccounts.map(acc => ({
                        _id: acc.id,
                        accountName: acc.accountName,
                        accountCode: acc.accountCode,
                      }))}
                      onSubmit={handleSaveLiability}
                      onCancel={() => {
                        setShowLiabilityForm(false)
                        setEditingLiability(undefined)
                      }}
                      title={editingLiability ? 'Edit Liability' : 'Add Liability'}
                    />
                  </div>
                </div>
              </div>
            )}

            {showAssetValuationEntry && (
              <ValuationEntry
                type="asset"
                onSubmit={(date, amount, accountId) => handleAddAssetValuation(date, amount, accountId)}
                onCancel={() => setShowAssetValuationEntry(false)}
                isLoading={isSubmittingValuation}
                accounts={assetAccounts}
              />
            )}

            {showLiabilityValuationEntry && (
              <ValuationEntry
                type="liability"
                onSubmit={(date, amount, accountId) => handleAddLiabilityValuation(date, amount, accountId)}
                onCancel={() => setShowLiabilityValuationEntry(false)}
                isLoading={isSubmittingValuation}
                accounts={liabilityAccounts}
                />
            )}
        </>
    )}

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
                setSubForm({
                  name: '',
                  cost: 0,
                  yearlyAmount: undefined,
                  billingCycle: 'monthly',
                  nextBillingDate: '',
                  isActive: true,
                  isNecessary: true,
                  classification: 'private',
                  category: 'other',
                  subcategory: undefined,
                })
                setShowSubModal(true)
              }}
            onEditSubscription={(id) => {
              const found = subs.find((s) => s.id === id)
              if (found) {
                setEditingSub(found)
                setSubForm({
                  name: found.name,
                  cost: found.cost,
                  yearlyAmount: found.yearlyAmount,
                  billingCycle: found.billingCycle,
                  nextBillingDate: found.nextBillingDate,
                  isActive: found.isActive,
                  isNecessary: found.isNecessary ?? true,
                  classification: found.classification,
                  category: found.category,
                  subcategory: found.subcategory,
                })
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

        {showAccountForm && (
          <AccountForm
            account={editingAccount}
            onSave={handleSaveAccount}
            onClose={() => {
              setShowAccountForm(false)
              setEditingAccount(undefined)
            }}
          />
        )}

        {showGoalModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-dark-blue">Set Equity Goal</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray mb-2">Target Amount (€)</label>
                  <input
                    type="number"
                    min={1}
                    value={goalAmount}
                    onChange={(e) => setGoalAmount(Number(e.target.value))}
                    className="flex h-10 w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray mb-2">Target Date (optional)</label>
                  <input
                    type="date"
                    value={goalDate}
                    onChange={(e) => setGoalDate(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="p-6 border-t flex gap-3">
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 h-10 px-4 rounded-md border border-light-gray"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!workspaceId || !userId || goalAmount <= 0) return
                    await upsertGoal({
                      workspaceId: workspaceId as any,
                      ownerId: userId as any,
                      targetEquity: goalAmount,
                      targetDate: goalDate || undefined,
                    })
                    setShowGoalModal(false)
                  }}
                  className="flex-1 h-10 px-4 rounded-md bg-dark-blue text-off-white"
                >
                  Save Goal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
