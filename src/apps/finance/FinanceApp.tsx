import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
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
  const [activeTab, setActiveTab] = useState<TabType>('liquidity')
  const [showAccountForm, setShowAccountForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | undefined>()

  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: '1',
      name: 'Main Checking Account',
      accountType: 'bank',
      currentBalance: 5420.50,
      isPrivate: false,
    },
    {
      id: '2',
      name: 'Emergency Savings',
      accountType: 'savings',
      currentBalance: 12000,
      isPrivate: false,
    },
    {
      id: '3',
      name: 'Mortgage',
      accountType: 'loan',
      currentBalance: -180000,
      isPrivate: false,
    },
  ])

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

  const handleSaveAccount = (accountData: Partial<Account>) => {
    if (accountData.id) {
      setAccounts(accounts.map((a) => (a.id === accountData.id ? { ...a, ...accountData } as Account : a)))
    } else {
      setAccounts([...accounts, { ...accountData, id: Date.now().toString() } as Account])
    }
    setShowAccountForm(false)
    setEditingAccount(undefined)
  }

  const handleEditAccount = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId)
    setEditingAccount(account)
    setShowAccountForm(true)
  }

  const handleDeleteAccount = (accountId: string) => {
    if (confirm('Are you sure you want to delete this account?')) {
      setAccounts(accounts.filter((a) => a.id !== accountId))
    }
  }

  const handleTogglePrivacy = (accountId: string) => {
    setAccounts(
      accounts.map((a) =>
        a.id === accountId ? { ...a, isPrivate: !a.isPrivate } : a
      )
    )
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
              targetEquity={50000}
              targetDate="2026-12-31"
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
      </div>
    </div>
  )
}
