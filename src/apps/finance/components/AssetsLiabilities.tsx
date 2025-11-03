import { Plus, Trash2, Edit2, Home, Car, TrendingUp, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

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

interface AssetsLiabilitiesProps {
  assets: Asset[]
  liabilities: Liability[]
  onAddAsset: () => void
  onEditAsset: (assetId: string) => void
  onDeleteAsset: (assetId: string) => void
  onAddLiability: () => void
  onEditLiability: (liabilityId: string) => void
  onDeleteLiability: (liabilityId: string) => void
}

export default function AssetsLiabilities({
  assets,
  liabilities,
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

  const getAssetIcon = (type: string) => {
    const icons = {
      property: Home,
      vehicle: Car,
      investment: TrendingUp,
      other: DollarSign,
    }
    return icons[type as keyof typeof icons] || DollarSign
  }

  const getAssetColor = (type: string): string => {
    const colors = {
      property: 'bg-purple-100 text-purple-700',
      vehicle: 'bg-blue-100 text-blue-700',
      investment: 'bg-green-100 text-green-700',
      other: 'bg-neutral-100 text-neutral-700',
    }
    return colors[type as keyof typeof colors] || 'bg-neutral-100 text-neutral-700'
  }

  const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0)
  const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.amount, 0)
  const netWorth = totalAssets - totalLiabilities

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-neutral-500">Total Assets</div>
            <div className="text-2xl font-semibold text-green-600">
              {formatCurrency(totalAssets)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-neutral-500">Total Liabilities</div>
            <div className="text-2xl font-semibold text-red-600">
              {formatCurrency(totalLiabilities)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-neutral-500">Net Worth</div>
            <div
              className={`text-2xl font-semibold ${
                netWorth >= 0 ? 'text-blue-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(netWorth)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-800">Assets</h3>
          <Button onClick={onAddAsset} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Asset
          </Button>
        </div>

        {assets.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-neutral-600 text-sm">No assets added yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assets.map((asset) => {
              const Icon = getAssetIcon(asset.type)
              return (
                <Card key={asset.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getAssetColor(asset.type)}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-neutral-800">{asset.name}</h4>
                          <p className="text-xs text-neutral-500 capitalize">{asset.type}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => onEditAsset(asset.id)}
                          className="p-1 hover:bg-neutral-100 rounded"
                        >
                          <Edit2 className="w-4 h-4 text-neutral-500" />
                        </button>
                        <button
                          onClick={() => onDeleteAsset(asset.id)}
                          className="p-1 hover:bg-neutral-100 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xl font-semibold text-neutral-800">
                      {formatCurrency(asset.value)}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-800">Liabilities</h3>
          <Button onClick={onAddLiability} size="sm" variant="secondary">
            <Plus className="w-4 h-4 mr-2" />
            Add Liability
          </Button>
        </div>

        {liabilities.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-neutral-600 text-sm">No liabilities added yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {liabilities.map((liability) => (
              <Card key={liability.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-neutral-800">{liability.name}</h4>
                      {liability.relatedAssetId && (
                        <p className="text-xs text-neutral-500">
                          Linked to asset
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xl font-semibold text-red-600">
                        {formatCurrency(liability.amount)}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => onEditLiability(liability.id)}
                          className="p-1 hover:bg-neutral-100 rounded"
                        >
                          <Edit2 className="w-4 h-4 text-neutral-500" />
                        </button>
                        <button
                          onClick={() => onDeleteLiability(liability.id)}
                          className="p-1 hover:bg-neutral-100 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
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
