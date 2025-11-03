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
import SubscriptionList from './components/SubscriptionList'

type TabType = 'liquidity' | 'assets' | 'subscriptions'

interface Account {
  id: string
  name: string
  accountType: 'bank' | 'loan' | 'savings'
  currentBalance: number
  isPrivate: boolean
}

interface Asset {
  id: string
  name: string
  type: 'property' | 'vehicle' | 'investment' | 'other'
  value: number
}

interface Liability {
  id: string
  name: string
  amount: number
  relatedAssetId?: string
}

interface Subscription {
  id: string
  name: string
  cost: number
  billingCycle: 'monthly' | 'yearly'
  nextBillingDate: string
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

  const [assets, setAssets] = useState<Asset[]>([
    {
      id: '1',
      name: 'Primary Residence',
      type: 'property',
      value: 350000,
    },
    {
      id: '2',
      name: '2019 Toyota',
      type: 'vehicle',
      value: 15000,
    },
  ])

  const [liabilities, setLiabilities] = useState<Liability[]>([
    {
      id: '1',
      name: 'Home Mortgage',
      amount: 180000,
      relatedAssetId: '1',
    },
  ])

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([
    {
      id: '1',
      name: 'Netflix',
      cost: 15.99,
      billingCycle: 'monthly',
      nextBillingDate: '2025-12-01',
      isActive: true,
    },
    {
      id: '2',
      name: 'Spotify',
      cost: 9.99,
      billingCycle: 'monthly',
      nextBillingDate: '2025-12-05',
      isActive: true,
    },
  ])

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
    if (confirm('Are you sure you want to delete this account?')) {
      await deleteAccountMutation({ id: accountId as any })
    }
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

        {activeTab === 'assets' && (
          <AssetsLiabilities
            assets={assets}
            liabilities={liabilities}
            onAddAsset={() => alert('Add Asset - Coming soon')}
            onEditAsset={() => alert('Edit Asset - Coming soon')}
            onDeleteAsset={(id) => setAssets(assets.filter((a) => a.id !== id))}
            onAddLiability={() => alert('Add Liability - Coming soon')}
            onEditLiability={() => alert('Edit Liability - Coming soon')}
            onDeleteLiability={(id) => setLiabilities(liabilities.filter((l) => l.id !== id))}
          />
        )}

        {activeTab === 'subscriptions' && (
          <SubscriptionList
            subscriptions={subscriptions}
            onAddSubscription={() => alert('Add Subscription - Coming soon')}
            onEditSubscription={() => alert('Edit Subscription - Coming soon')}
            onDeleteSubscription={(id) =>
              setSubscriptions(subscriptions.filter((s) => s.id !== id))
            }
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
