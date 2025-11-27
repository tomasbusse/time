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
      bank: 'bg-light-gray text-custom-brown',
      loan: 'bg-light-gray text-red-700',
      savings: 'bg-light-gray text-green-700',
    }
    return colors[type as keyof typeof colors] || 'bg-light-gray text-gray'
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
    <div className="space-y-4 sm:space-y-6">
      {/* Responsive Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="text-xs sm:text-sm text-gray">Total Liquid Assets</div>
            <div className="text-xl sm:text-2xl font-semibold text-green-600">
              {formatCurrency(totalLiquidity)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="text-xs sm:text-sm text-gray">Total Liabilities</div>
            <div className="text-xl sm:text-2xl font-semibold text-red-600">
              {formatCurrency(totalLoans)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="text-xs sm:text-sm text-gray">Net Position</div>
            <div
              className={`text-xl sm:text-2xl font-semibold ${
                netPosition >= 0 ? 'text-custom-brown' : 'text-red-600'
              }`}
            >
              {formatCurrency(netPosition)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Responsive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <h2 className="text-lg sm:text-xl font-semibold text-dark-blue">Accounts</h2>
        <Button onClick={onAddAccount} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden xs:inline">Add Account</span>
          <span className="xs:hidden">Add</span>
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="py-8 sm:py-12 text-center">
            <p className="text-gray mb-4 text-sm sm:text-base">No accounts yet</p>
            <Button onClick={onAddAccount} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <CardTitle className="text-base sm:text-lg truncate">{account.name}</CardTitle>
                      {account.isPrivate && (
                        <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 text-gray flex-shrink-0" />
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
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => onTogglePrivacy(account.id)}
                      className="p-1.5 sm:p-2 hover:bg-light-gray rounded transition-colors"
                      title={account.isPrivate ? 'Make visible' : 'Make private'}
                      aria-label={account.isPrivate ? 'Make visible' : 'Make private'}
                    >
                      {account.isPrivate ? (
                        <EyeOff className="w-4 h-4 text-gray" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray" />
                      )}
                    </button>
                    <button
                      onClick={() => onEditAccount(account.id)}
                      className="p-1.5 sm:p-2 hover:bg-light-gray rounded transition-colors"
                      aria-label="Edit account"
                    >
                      <Edit2 className="w-4 h-4 text-gray" />
                    </button>
                    <button
                      onClick={() => onDeleteAccount(account.id)}
                      className="p-1.5 sm:p-2 hover:bg-light-gray rounded transition-colors"
                      aria-label="Delete account"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-3 sm:pt-4">
                <div className="text-xs sm:text-sm text-gray mb-1">Current Balance</div>
                <div
                  className={`text-xl sm:text-2xl font-semibold ${
                    account.currentBalance >= 0 ? 'text-dark-blue' : 'text-red-600'
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
