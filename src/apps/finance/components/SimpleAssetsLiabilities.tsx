import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { formatCurrency } from '@/lib/utils'
import { SimpleAssetForm } from './SimpleAssetForm'
import { SimpleLiabilityForm } from './SimpleLiabilityForm'
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown } from 'lucide-react'

interface SimpleAsset {
  _id: string
  name: string
  type: string
  currentValue: number
  purchaseValue?: number
  purchaseDate?: string
  createdAt: number
  updatedAt: number
}

interface SimpleLiability {
  _id: string
  name: string
  type: string
  currentBalance: number
  originalAmount?: number
  interestRate?: number
  monthlyPayment?: number
  createdAt: number
  updatedAt: number
}

export function SimpleAssetsLiabilities() {
  const { workspaceId } = useWorkspace()
  const [showAssetForm, setShowAssetForm] = useState(false)
  const [showLiabilityForm, setShowLiabilityForm] = useState(false)
  const [editingAsset, setEditingAsset] = useState<SimpleAsset | undefined>()
  const [editingLiability, setEditingLiability] = useState<SimpleLiability | undefined>()

  // Query data
  const assets = useQuery(
    api.simpleFinance.listSimpleAssets,
    workspaceId ? { workspaceId } : 'skip'
  ) || []
  
  const liabilities = useQuery(
    api.simpleFinance.listSimpleLiabilities,
    workspaceId ? { workspaceId } : 'skip'
  ) || []

  const netWorth = useQuery(
    api.simpleFinance.getSimpleNetWorth,
    workspaceId ? { workspaceId } : 'skip'
  )

  const progress = useQuery(
    api.simpleFinance.getSimpleProgress,
    workspaceId ? { workspaceId } : 'skip'
  )

  // Mutations
  const deleteAsset = useMutation(api.simpleFinance.deleteSimpleAsset)
  const deleteLiability = useMutation(api.simpleFinance.deleteSimpleLiability)

  const handleDeleteAsset = async (assetId: string) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      try {
        await deleteAsset({ id: assetId as any })
      } catch (error) {
        console.error('Error deleting asset:', error)
        alert('Failed to delete asset. Please try again.')
      }
    }
  }

  const handleDeleteLiability = async (liabilityId: string) => {
    if (confirm('Are you sure you want to delete this liability?')) {
      try {
        await deleteLiability({ id: liabilityId as any })
      } catch (error) {
        console.error('Error deleting liability:', error)
        alert('Failed to delete liability. Please try again.')
      }
    }
  }


  const getAssetTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      bank_account: 'Bank Account',
      property: 'Property',
      vehicle: 'Vehicle',
      investment: 'Investment',
      garage: 'Garage/Storage',
      other: 'Other',
    }
    return types[type] || type
  }

  const getLiabilityTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      mortgage: 'Mortgage',
      personal_loan: 'Personal Loan',
      credit_card: 'Credit Card',
      other_debt: 'Other Debt',
    }
    return types[type] || type
  }

  const handleFormSubmit = () => {
    setShowAssetForm(false)
    setShowLiabilityForm(false)
    setEditingAsset(undefined)
    setEditingLiability(undefined)
  }

  const handleFormCancel = () => {
    setShowAssetForm(false)
    setShowLiabilityForm(false)
    setEditingAsset(undefined)
    setEditingLiability(undefined)
  }

  if (showAssetForm || editingAsset) {
    return (
      <div className="max-w-2xl mx-auto">
        <SimpleAssetForm
          asset={editingAsset}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      </div>
    )
  }

  if (showLiabilityForm || editingLiability) {
    return (
      <div className="max-w-2xl mx-auto">
        <SimpleLiabilityForm
          liability={editingLiability}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4" style={{ backgroundColor: '#F1F5EE' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: '#B6B2B5' }}>Total Assets</p>
              <p className="text-2xl font-bold" style={{ color: '#384C5A' }}>
                {formatCurrency(netWorth?.totalAssets || 0)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8" style={{ color: '#A78573' }} />
          </div>
        </Card>

        <Card className="p-4" style={{ backgroundColor: '#F1F5EE' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: '#B6B2B5' }}>Total Liabilities</p>
              <p className="text-2xl font-bold" style={{ color: '#A78573' }}>
                {formatCurrency(netWorth?.totalLiabilities || 0)}
              </p>
            </div>
            <TrendingDown className="w-8 h-8" style={{ color: '#A78573' }} />
          </div>
        </Card>

        <Card className="p-4" style={{ backgroundColor: '#F1F5EE' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: '#B6B2B5' }}>Net Worth</p>
              <p className={`text-2xl font-bold`} style={{ color: (netWorth?.netWorth || 0) >= 0 ? '#384C5A' : '#A78573' }}>
                {formatCurrency(netWorth?.netWorth || 0)}
              </p>
            </div>
            <div className="text-right">
              {progress && (
                <p className="text-sm" style={{ color: '#B6B2B5' }}>
                  {progress.change >= 0 ? '+' : ''}{formatCurrency(progress.change)}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Progress Indicator */}
      {progress && (
        <Card className="p-4" style={{ backgroundColor: '#F1F5EE' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: '#B6B2B5' }}>Month over Month Change</p>
              <p className="text-lg font-semibold" style={{ color: '#384C5A' }}>
                {progress.previousMonth} → {progress.currentMonth}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold`} style={{ color: progress.change >= 0 ? '#384C5A' : '#A78573' }}>
                {progress.change >= 0 ? '+' : ''}{formatCurrency(progress.change)}
                {progress.changePercent !== 0 && (
                  <span className="text-sm ml-2" style={{ color: '#B6B2B5' }}>
                    ({progress.changePercent.toFixed(1)}%)
                  </span>
                )}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Assets Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold" style={{ color: '#384C5A' }}>Assets</h2>
          <Button onClick={() => setShowAssetForm(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Asset
          </Button>
        </div>

        {assets.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray">No assets added yet</p>
            <Button 
              onClick={() => setShowAssetForm(true)} 
              variant="outline" 
              className="mt-4"
            >
              Add Your First Asset
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assets.map((asset: SimpleAsset) => (
              <Card key={asset._id} className="p-4" style={{ backgroundColor: '#F1F5EE' }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold" style={{ color: '#384C5A' }}>{asset.name}</h3>
                    <p className="text-sm" style={{ color: '#B6B2B5' }}>{getAssetTypeLabel(asset.type)}</p>
                    <p className="text-lg font-bold mt-2" style={{ color: '#384C5A' }}>
                      {formatCurrency(asset.currentValue)}
                    </p>
                    {asset.purchaseValue && (
                      <p className="text-sm" style={{ color: '#B6B2B5' }}>
                        Purchase: {formatCurrency(asset.purchaseValue)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingAsset(asset)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteAsset(asset._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Liabilities Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold" style={{ color: '#384C5A' }}>Liabilities</h2>
          <Button onClick={() => setShowLiabilityForm(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Liability
          </Button>
        </div>

        {liabilities.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray">No liabilities added yet</p>
            <Button 
              onClick={() => setShowLiabilityForm(true)} 
              variant="outline" 
              className="mt-4"
            >
              Add Your First Liability
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liabilities.map((liability: SimpleLiability) => (
              <Card key={liability._id} className="p-4" style={{ backgroundColor: '#F1F5EE' }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold" style={{ color: '#384C5A' }}>{liability.name}</h3>
                    <p className="text-sm" style={{ color: '#B6B2B5' }}>{getLiabilityTypeLabel(liability.type)}</p>
                    <p className="text-lg font-bold mt-2" style={{ color: '#A78573' }}>
                      {formatCurrency(liability.currentBalance)}
                    </p>
                    {liability.monthlyPayment && (
                      <p className="text-sm" style={{ color: '#B6B2B5' }}>
                        Monthly Payment: {formatCurrency(liability.monthlyPayment)}
                      </p>
                    )}
                    {liability.interestRate && (
                      <p className="text-sm" style={{ color: '#B6B2B5' }}>
                        Interest Rate: {liability.interestRate}%
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingLiability(liability)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteLiability(liability._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
