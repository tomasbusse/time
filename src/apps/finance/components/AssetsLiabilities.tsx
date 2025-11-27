import { Plus, Trash2, Edit2, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

interface Account {
  id: string
  accountCode: string
  accountName: string
  accountCategory: string
  currentBalance: number
  isActive: boolean
}

interface MonthlyTotal {
  month: string
  assets: number
  liabilities: number
}

interface AssetsLiabilitiesProps {
  assetAccounts: Account[]
  liabilityAccounts: Account[]
  monthlyTotals?: MonthlyTotal[]
  onAddAsset: () => void
  onEditAsset: (accountId: string) => void
  onDeleteAsset: (accountId: string) => void
  onAddLiability: () => void
  onEditLiability: (accountId: string) => void
  onDeleteLiability: (accountId: string) => void
}

export default function AssetsLiabilities({
  assetAccounts,
  liabilityAccounts,
  monthlyTotals = [],
  onAddAsset,
  onEditAsset,
  onDeleteAsset,
  onAddLiability,
  onEditLiability,
  onDeleteLiability,
}: AssetsLiabilitiesProps) {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      current_asset: 'bg-light-gray text-green-700',
      fixed_asset: 'bg-light-gray text-custom-brown',
      current_liability: 'bg-light-gray text-red-700',
      long_term_liability: 'bg-light-gray text-brown',
    }
    return colors[category] || 'bg-light-gray text-gray'
  }

  // Calculate totals from accounts
  const totalAssets = assetAccounts.filter(a => a.isActive).reduce((sum, a) => sum + Math.max(0, a.currentBalance), 0)
  const totalLiabilities = liabilityAccounts.filter(a => a.isActive).reduce((sum, a) => sum + Math.max(0, a.currentBalance), 0)
  const netWorth = totalAssets - totalLiabilities

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray">Total Assets</div>
            <div className="text-2xl font-semibold text-green-600">
              {formatCurrency(totalAssets)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray">Total Liabilities</div>
            <div className="text-2xl font-semibold text-red-600">
              {formatCurrency(totalLiabilities)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray">Net Worth</div>
            <div
              className={`text-2xl font-semibold ${
                netWorth >= 0 ? 'text-custom-brown' : 'text-red-600'
              }`}
            >
              {formatCurrency(netWorth)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-dark-blue">Asset Accounts</h3>
          <Button onClick={onAddAsset} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Asset Account
          </Button>
        </div>

        {assetAccounts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray text-sm">No asset accounts created yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {assetAccounts.map((account) => (
              <Card key={account.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`px-3 py-1 rounded text-xs font-semibold ${getCategoryColor(account.accountCategory)}`}>
                          {account.accountCode}
                        </div>
                        <div className={`px-3 py-1 rounded text-xs font-medium ${getCategoryColor(account.accountCategory)}`}>
                          {account.accountCategory.replace('_', ' ')}
                        </div>
                      </div>
                      <h4 className="font-medium text-dark-blue mb-1">{account.accountName}</h4>
                      <p className="text-sm font-semibold text-green-600">
                        Balance: {formatCurrency(account.currentBalance)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onEditAsset(account.id)}
                        className="p-2 hover:bg-light-gray rounded"
                      >
                        <Edit2 className="w-4 h-4 text-gray" />
                      </button>
                      <button
                        onClick={() => onDeleteAsset(account.id)}
                        className="p-2 hover:bg-light-gray rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-dark-blue">Liability Accounts</h3>
          <Button onClick={onAddLiability} size="sm" variant="secondary">
            <Plus className="w-4 h-4 mr-2" />
            Add Liability Account
          </Button>
        </div>

        {liabilityAccounts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray text-sm">No liability accounts created yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {liabilityAccounts.map((account) => (
              <Card key={account.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`px-3 py-1 rounded text-xs font-semibold ${getCategoryColor(account.accountCategory)}`}>
                          {account.accountCode}
                        </div>
                        <div className={`px-3 py-1 rounded text-xs font-medium ${getCategoryColor(account.accountCategory)}`}>
                          {account.accountCategory.replace('_', ' ')}
                        </div>
                      </div>
                      <h4 className="font-medium text-dark-blue mb-1">{account.accountName}</h4>
                      <p className="text-sm font-semibold text-red-600">
                        Balance: {formatCurrency(account.currentBalance)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onEditLiability(account.id)}
                        className="p-2 hover:bg-light-gray rounded"
                      >
                        <Edit2 className="w-4 h-4 text-gray" />
                      </button>
                      <button
                        onClick={() => onDeleteLiability(account.id)}
                        className="p-2 hover:bg-light-gray rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
