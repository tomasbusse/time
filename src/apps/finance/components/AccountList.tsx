import { Plus, Trash2, Edit2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

interface Account {
  id: string
  name: string
  accountType: 'bank' | 'loan' | 'savings'
  currentBalance: number
  isPrivate: boolean
}

interface AccountListProps {
  accounts: Account[]
  onAddAccount: () => void
  onEditAccount: (accountId: string) => void
  onDeleteAccount: (accountId: string) => void
  onTogglePrivacy: (accountId: string) => void
}

export default function AccountList({
  accounts,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  onTogglePrivacy,
}: AccountListProps) {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const getAccountTypeColor = (type: string): string => {
    const colors = {
      bank: 'bg-blue-100 text-blue-700',
      loan: 'bg-red-100 text-red-700',
      savings: 'bg-green-100 text-green-700',
    }
    return colors[type as keyof typeof colors] || 'bg-neutral-100 text-neutral-700'
  }

  const getAccountTypeLabel = (type: string): string => {
    const labels = {
      bank: 'Bank Account',
      loan: 'Loan',
      savings: 'Savings',
    }
    return labels[type as keyof typeof labels] || type
  }

  const totalLiquidity = accounts
    .filter((acc) => acc.accountType !== 'loan')
    .reduce((sum, acc) => sum + acc.currentBalance, 0)

  const totalLoans = accounts
    .filter((acc) => acc.accountType === 'loan')
    .reduce((sum, acc) => sum + Math.abs(acc.currentBalance), 0)

  const netPosition = totalLiquidity - totalLoans

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-neutral-500">Total Liquid Assets</div>
            <div className="text-2xl font-semibold text-green-600">
              {formatCurrency(totalLiquidity)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-neutral-500">Total Liabilities</div>
            <div className="text-2xl font-semibold text-red-600">
              {formatCurrency(totalLoans)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-neutral-500">Net Position</div>
            <div
              className={`text-2xl font-semibold ${
                netPosition >= 0 ? 'text-blue-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(netPosition)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-800">Accounts</h2>
        <Button onClick={onAddAccount}>
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-neutral-600 mb-4">No accounts yet</p>
            <Button onClick={onAddAccount}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{account.name}</CardTitle>
                      {account.isPrivate && (
                        <EyeOff className="w-4 h-4 text-neutral-400" />
                      )}
                    </div>
                    <span
                      className={`inline-block text-xs px-2 py-1 rounded ${getAccountTypeColor(
                        account.accountType
                      )}`}
                    >
                      {getAccountTypeLabel(account.accountType)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onTogglePrivacy(account.id)}
                      className="p-1 hover:bg-neutral-100 rounded"
                      title={account.isPrivate ? 'Make visible' : 'Make private'}
                    >
                      {account.isPrivate ? (
                        <EyeOff className="w-4 h-4 text-neutral-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-neutral-500" />
                      )}
                    </button>
                    <button
                      onClick={() => onEditAccount(account.id)}
                      className="p-1 hover:bg-neutral-100 rounded"
                    >
                      <Edit2 className="w-4 h-4 text-neutral-500" />
                    </button>
                    <button
                      onClick={() => onDeleteAccount(account.id)}
                      className="p-1 hover:bg-neutral-100 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-neutral-500 mb-1">Current Balance</div>
                <div
                  className={`text-2xl font-semibold ${
                    account.currentBalance >= 0 ? 'text-neutral-800' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(account.currentBalance)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
