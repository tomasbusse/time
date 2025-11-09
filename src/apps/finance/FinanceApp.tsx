import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
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
import SubscriptionList from './components/SubscriptionList'
import CategoryBudgetsPanel from './components/CategoryBudgetsPanel'

type TabType = 'liquidity' | 'assets' | 'subscriptions' | 'categories'

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
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
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

interface CategoryBudget {
  id: string
  classification: 'business' | 'private'
  category: 'ai' | 'software' | 'marketing' | 'productivity' | 'design' | 'communication' | 'development' | 'analytics' | 'security' | 'other'
  subcategory?: string
  monthlyBudgetLimit: number
  yearlyBudgetLimit: number
  alertThreshold: '50' | '75' | '90' | '100'
  isActive: boolean
}

export default function FinanceApp() {
  const { workspaceId, userId } = useWorkspace()
  const [activeTab, setActiveTab] = useState<TabType>('liquidity')
  const [showAccountForm, setShowAccountForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | undefined>()

  // Query accounts from Convex
  const accountsData = useQuery(api.finance.listAccounts, 
    workspaceId ? { workspaceId } : 'skip'
  )
  const accounts = (accountsData || []).map(acc => ({
    id: acc._id,
    name: acc.name,
    accountType: acc.accountType,
    currentBalance: acc.currentBalance,
    isPrivate: acc.isPrivate,
  }))

  // Mutations
  const createAccountMutation = useMutation(api.finance.createAccount)
  const updateAccountMutation = useMutation(api.finance.updateAccount)
  const deleteAccountMutation = useMutation(api.finance.deleteAccount)

  // Equity goal (Convex)
  const goal = useQuery(
    api.finance.getEquityGoal,
    workspaceId ? { workspaceId } : 'skip'
  )
  const upsertGoal = useMutation(api.finance.upsertEquityGoal)
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

  const assetAccounts = (accountsForAssets || []).map((a: AccountWithBalance) => ({
    id: a._id,
    accountId: a._id,
    accountCode: a.accountCode,
    accountName: a.accountName,
    accountCategory: a.accountCategory,
    currentBalance: a.currentBalance,
    isActive: a.isActive,
  }))

  const liabilityAccounts = (accountsForLiabilities || []).map((a: AccountWithBalance) => ({
    id: a._id,
    accountId: a._id,
    accountCode: a.accountCode,
    accountName: a.accountName,
    accountCategory: a.accountCategory,
    currentBalance: a.currentBalance,
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
  const createSubscription = useMutation(api.finance.createSubscription)
  const updateSubscription = useMutation(api.finance.updateSubscription)
  const deleteSubscription = useMutation(api.finance.deleteSubscription)
  
  // Category Budgets (Convex)
  const categoryBudgetsData = useQuery(
    api.finance.listCategoryBudgets,
    workspaceId ? { workspaceId } : 'skip'
  )
  const categoryBudgets: CategoryBudget[] = (categoryBudgetsData || []).map((b: any) => ({
    id: b._id,
    classification: b.classification ?? 'business',
    category: b.category ?? 'other',
    subcategory: b.subcategory,
    monthlyBudgetLimit: b.monthlyBudgetLimit,
    yearlyBudgetLimit: b.yearlyBudgetLimit,
    alertThreshold: b.alertThreshold ?? '75',
    isActive: b.isActive ?? true,
  }))
  const createCategoryBudgetMutation = useMutation(api.finance.createCategoryBudget)
  const updateCategoryBudgetMutation = useMutation(api.finance.updateCategoryBudget)
  const deleteCategoryBudgetMutation = useMutation(api.finance.deleteCategoryBudget)

  const handleCreateCategoryBudget = async (payload: {
    classification: 'business' | 'private'
    category: 'ai' | 'software' | 'marketing' | 'productivity' | 'design' | 'communication' | 'development' | 'analytics' | 'security' | 'other'
    subcategory?: string
    monthlyBudgetLimit: number
    yearlyBudgetLimit: number
    alertThreshold: '50' | '75' | '90' | '100'
  }) => {
    if (!workspaceId) return
    await createCategoryBudgetMutation({
      workspaceId: workspaceId as any,
      ...payload,
    })
  }

  const handleUpdateCategoryBudget = async (payload: {
    id: string
    monthlyBudgetLimit?: number
    yearlyBudgetLimit?: number
    alertThreshold?: '50' | '75' | '90' | '100'
    isActive?: boolean
  }) => {
    await updateCategoryBudgetMutation({
      ...payload,
      id: payload.id as any,
    })
  }

  const handleDeleteCategoryBudget = async ({ id }: { id: string }) => {
    await deleteCategoryBudgetMutation({ id: id as any })
  }

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
        id: accountData.id as any,
        name: accountData.name,
        currentBalance: accountData.currentBalance,
        isPrivate: accountData.isPrivate,
      })
    } else {
      // Create new account
      await createAccountMutation({
        workspaceId: workspaceId as any,
        ownerId: userId as any,
        name: accountData.name!,
        accountType: accountData.accountType!,
        currentBalance: accountData.currentBalance!,
        isPrivate: accountData.isPrivate!,
      })
    }
    setShowAccountForm(false)
    setEditingAccount(undefined)
  }

  const handleEditAccount = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId)
    setEditingAccount(account)
    setShowAccountForm(true)
  }

  const handleDeleteAccount = async (accountId: string) => {
    await deleteAccountMutation({ accountId: accountId as any })
  }

  const handleTogglePrivacy = async (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId)
    if (account) {
      await updateAccountMutation({
        id: accountId as any,
        isPrivate: !account.isPrivate,
      })
    }
  }

  // Asset handlers (account-based)
  const handleSaveAsset = async (assetData: { name: string; type: string; accountId?: string; purchasePrice?: number; currentValue?: number }) => {
    if (!workspaceId || !userId) return

    if (editingAsset) {
      await updateAssetMutation({
        id: editingAsset.id as any,
        name: assetData.name,
        type: assetData.type,
        ownerId: userId as any,
      })
    } else {
      if (!assetData.accountId) {
        alert('Please select or create an asset account')
        return
      }
      await assetsMutation({
        workspaceId: workspaceId as any,
        ownerId: userId as any,
        accountId: assetData.accountId as any,
        name: assetData.name,
        type: assetData.type,
        purchasePrice: assetData.purchasePrice,
        currentValue: assetData.currentValue,
        isFixed: assetData.type === 'property' || assetData.type === 'vehicle',
      })
    }
    setShowAssetForm(false)
    setEditingAsset(undefined)
  }

  const handleEditAsset = (assetId: string) => {
    const asset = assetAccounts.find((a) => a.id === assetId)
    if (asset) {
      setEditingAsset({
        id: asset.id,
        accountId: asset.accountId,
        name: asset.accountName,
        type: asset.accountCategory,
        isFixed: asset.accountCategory.includes('fixed'),
      })
      setShowAssetForm(true)
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
  const handleSaveLiability = async (liabilityData: { name: string; type: string; accountId?: string; originalAmount?: number; currentBalance?: number }) => {
    if (!workspaceId || !userId) return

    if (editingLiability) {
      await updateLiabilityMutation({
        id: editingLiability.id as any,
        name: liabilityData.name,
        type: liabilityData.type,
        ownerId: userId as any,
      })
    } else {
      if (!liabilityData.accountId) {
        alert('Please select or create a liability account')
        return
      }
      await liabilityMutation({
        workspaceId: workspaceId as any,
        ownerId: userId as any,
        accountId: liabilityData.accountId as any,
        name: liabilityData.name,
        type: liabilityData.type,
        originalAmount: liabilityData.originalAmount,
        currentBalance: liabilityData.currentBalance,
        isFixed: liabilityData.type === 'mortgage' || liabilityData.type === 'loan',
      })
    }
    setShowLiabilityForm(false)
    setEditingLiability(undefined)
  }

  const handleEditLiability = (liabilityId: string) => {
    const liability = liabilityAccounts.find((l) => l.id === liabilityId)
    if (liability) {
      setEditingLiability({
        id: liability.id,
        accountId: liability.accountId,
        name: liability.accountName,
        type: liability.accountCategory,
        isFixed: liability.accountCategory.includes('long_term'),
      })
      setShowLiabilityForm(true)
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
    .filter((acc) => acc.accountType !== 'loan')
    .reduce((sum, acc) => sum + acc.currentBalance, 0)

  const totalLiabilitiesFromAccounts = accounts
    .filter((acc) => acc.accountType === 'loan')
    .reduce((sum, acc) => sum + Math.abs(acc.currentBalance), 0)

  const currentEquity = totalLiquidity - totalLiabilitiesFromAccounts

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold text-neutral-800 mb-8">Finance</h1>

        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-neutral-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('liquidity')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'liquidity'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-neutral-600 hover:text-neutral-800'
                }`}
              >
                Liquidity
              </button>
              <button
                onClick={() => setActiveTab('assets')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'assets'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-neutral-600 hover:text-neutral-800'
                }`}
              >
                Assets & Liabilities
              </button>
              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'subscriptions'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-neutral-600 hover:text-neutral-800'
                }`}
              >
                Subscriptions
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'categories'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-neutral-600 hover:text-neutral-800'
                }`}
              >
                Categories
              </button>
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
              accounts={accounts}
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-neutral-800">{editingSub ? 'Edit Subscription' : 'Add Subscription'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Name</label>
                <input
                  type="text"
                  value={subForm.name}
                  onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {subForm.billingCycle === 'monthly' ? 'Monthly Cost (€)' : 'Yearly Cost (€)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={subForm.cost}
                    onChange={(e) => setSubForm({ ...subForm, cost: Number(e.target.value) })}
                    className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Yearly Amount (€) <span className="text-xs text-neutral-500">(Optional)</span></label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={subForm.yearlyAmount || ''}
                    onChange={(e) => setSubForm({ ...subForm, yearlyAmount: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Leave empty to auto-calc"
                    className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Billing Cycle</label>
                <select
                  value={subForm.billingCycle}
                  onChange={(e) => setSubForm({ ...subForm, billingCycle: e.target.value as 'monthly' | 'yearly' })}
                  className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
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
                  <span className="text-sm text-neutral-700">Necessary subscription</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={subForm.isActive}
                    onChange={(e) => setSubForm({ ...subForm, isActive: e.target.checked })}
                  />
                  <span className="text-sm text-neutral-700">Active</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Classification</label>
                <select
                  value={subForm.classification}
                  onChange={(e) => setSubForm({ ...subForm, classification: e.target.value as 'business' | 'private' })}
                  className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="business">Business</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Category</label>
                <select
                  value={subForm.category}
                  onChange={(e) => setSubForm({ ...subForm, category: e.target.value as any })}
                  className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
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
                <label className="block text-sm font-medium text-neutral-700 mb-2">Subcategory (Optional)</label>
                <input
                  type="text"
                  value={subForm.subcategory || ''}
                  onChange={(e) => setSubForm({ ...subForm, subcategory: e.target.value || undefined })}
                  placeholder="e.g., ChatGPT, Figma Pro, etc."
                  className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Next Billing Date</label>
                <input
                  type="date"
                  value={subForm.nextBillingDate}
                  onChange={(e) => setSubForm({ ...subForm, nextBillingDate: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button onClick={() => setShowSubModal(false)} className="flex-1 h-10 px-4 rounded-md border border-neutral-300">Cancel</button>
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
                className="flex-1 h-10 px-4 rounded-md bg-neutral-900 text-white"
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={assetAccounts.length === 0}
                >
                  Record Asset Valuation
                </button>
                <button
                  onClick={() => setShowLiabilityValuationEntry(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
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
                      } : undefined}
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
                        relatedAssetId: editingLiability.relatedAssetId || '',
                      } : undefined}
                      availableAssets={assets}
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
          <SubscriptionList
            subscriptions={subs}
            onAddSubscription={() => {
              setEditingSub(undefined)
              setSubForm({ 
                name: '', 
                cost: 0, 
                billingCycle: 'monthly', 
                nextBillingDate: '', 
                isActive: true,
                isNecessary: true,
                classification: 'private',
                category: 'other',
                subcategory: undefined
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
        )}

        {activeTab === 'categories' && (
          <CategoryBudgetsPanel
            subscriptions={subs}
            categoryBudgets={categoryBudgets}
            onCreateBudget={handleCreateCategoryBudget}
            onUpdateBudget={handleUpdateCategoryBudget}
            onDeleteBudget={handleDeleteCategoryBudget}
          />
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
                <h2 className="text-xl font-semibold text-neutral-800">Set Equity Goal</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Target Amount (€)</label>
                  <input
                    type="number"
                    min={1}
                    value={goalAmount}
                    onChange={(e) => setGoalAmount(Number(e.target.value))}
                    className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Target Date (optional)</label>
                  <input
                    type="date"
                    value={goalDate}
                    onChange={(e) => setGoalDate(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="p-6 border-t flex gap-3">
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 h-10 px-4 rounded-md border border-neutral-300"
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
                  className="flex-1 h-10 px-4 rounded-md bg-neutral-900 text-white"
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
