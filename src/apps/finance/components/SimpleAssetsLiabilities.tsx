import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { formatCurrency } from '@/lib/utils'
import { SimpleAssetForm } from './SimpleAssetForm'
import { SimpleLiabilityForm } from './SimpleLiabilityForm'
import AssetValuationModal from './AssetValuationModal'
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useSearchParams } from 'react-router-dom'

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
  const [, setSearchParams] = useSearchParams()

  // Month selection
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)

  const [showAssetForm, setShowAssetForm] = useState(false)
  const [showLiabilityForm, setShowLiabilityForm] = useState(false)
  const [showValuationModal, setShowValuationModal] = useState(false)
  const [editingAsset, setEditingAsset] = useState<SimpleAsset | undefined>()
  const [editingLiability, setEditingLiability] = useState<SimpleLiability | undefined>()

  // Query data
  const allAssets = useQuery(
    api.simpleFinance.listSimpleAssets,
    workspaceId ? { workspaceId } : 'skip'
  ) || []

  // Filter out bank accounts - those belong to Liquidity page only
  const assets = allAssets.filter((asset: SimpleAsset) => asset.type !== 'bank_account')

  const liabilities = useQuery(
    api.simpleFinance.listSimpleLiabilities,
    workspaceId ? { workspaceId } : 'skip'
  ) || []

  // Query monthly valuations for selected month
  const monthlyValuations = useQuery(
    api.simpleFinance.listMonthlyValuations,
    workspaceId ? { workspaceId, year: selectedYear, month: selectedMonth } : 'skip'
  ) || []

  const netWorth = useQuery(
    api.simpleFinance.getSimpleNetWorth,
    workspaceId ? { workspaceId } : 'skip'
  )

  const progress = useQuery(
    api.simpleFinance.getSimpleProgress,
    workspaceId ? { workspaceId } : 'skip'
  )

  // Get 12-month equity history for chart
  const equityHistory = useQuery(
    api.simpleFinance.getEquityMonitoring,
    workspaceId ? { workspaceId, months: 12 } : 'skip'
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

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  // Get value for an item (asset or liability) from monthly valuations or fallback to current value
  const getItemValue = (itemId: string, itemType: 'asset' | 'liability', fallbackValue: number): number => {
    const valuation = monthlyValuations.find(
      (v: any) => v.itemId === itemId && v.itemType === itemType
    )
    return valuation ? valuation.value : fallbackValue
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
      {/* Month Selector */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-dark-blue flex items-center gap-1"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">Previous</span>
        </button>
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-bold text-dark-blue text-center">
            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth - 1]} {selectedYear}
          </h3>
          <Button
            onClick={() => setShowValuationModal(true)}
            size="sm"
            variant="outline"
            className="mt-2"
          >
            Update Valuations
          </Button>
        </div>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-dark-blue flex items-center gap-1"
        >
          <span className="text-sm">Next</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

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

      {/* Net Worth Trend Chart */}
      <Card className="p-4" style={{ backgroundColor: '#F1F5EE' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" style={{ color: '#384C5A' }} />
            <h3 className="text-lg font-semibold" style={{ color: '#384C5A' }}>Net Worth Trend</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchParams({ tab: 'equity-monitoring' })}
          >
            View Details
          </Button>
        </div>
        {equityHistory && equityHistory.history.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={equityHistory.history}>
                <XAxis
                  dataKey="month"
                  tickFormatter={(value) => {
                    const [year, month] = value.split('-')
                    const date = new Date(parseInt(year), parseInt(month) - 1)
                    return date.toLocaleDateString('en-IE', { month: 'short' })
                  }}
                  tick={{ fontSize: 11, fill: '#B6B2B5' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: '#B6B2B5' }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Net Worth']}
                  labelFormatter={(label) => {
                    const [year, month] = label.split('-')
                    const date = new Date(parseInt(year), parseInt(month) - 1)
                    return date.toLocaleDateString('en-IE', { month: 'long', year: 'numeric' })
                  }}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="netWorth"
                  stroke="#384C5A"
                  strokeWidth={2}
                  dot={{ fill: '#384C5A', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: '#384C5A' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-center">
            <div>
              <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" style={{ color: '#B6B2B5' }} />
              <p className="text-sm" style={{ color: '#B6B2B5' }}>No historical data yet</p>
              <p className="text-xs" style={{ color: '#B6B2B5' }}>Update valuations monthly to see trends</p>
            </div>
          </div>
        )}
      </Card>

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
            {assets.map((asset: SimpleAsset) => {
              const displayValue = getItemValue(asset._id, 'asset', asset.currentValue)
              return (
                <Card key={asset._id} className="p-4" style={{ backgroundColor: '#F1F5EE' }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold" style={{ color: '#384C5A' }}>{asset.name}</h3>
                      <p className="text-sm" style={{ color: '#B6B2B5' }}>{getAssetTypeLabel(asset.type)}</p>
                      <p className="text-lg font-bold mt-2" style={{ color: '#384C5A' }}>
                        {formatCurrency(displayValue)}
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
              )
            })}
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
            {liabilities.map((liability: SimpleLiability) => {
              const displayValue = getItemValue(liability._id, 'liability', liability.currentBalance)
              return (
                <Card key={liability._id} className="p-4" style={{ backgroundColor: '#F1F5EE' }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold" style={{ color: '#384C5A' }}>{liability.name}</h3>
                      <p className="text-sm" style={{ color: '#B6B2B5' }}>{getLiabilityTypeLabel(liability.type)}</p>
                      <p className="text-lg font-bold mt-2" style={{ color: '#A78573' }}>
                        {formatCurrency(displayValue)}
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
              )
            })}
          </div>
        )}
      </div>

      {/* Asset Valuation Modal */}
      {showValuationModal && (
        <AssetValuationModal
          isOpen={showValuationModal}
          onClose={() => setShowValuationModal(false)}
          workspaceId={workspaceId!}
          year={selectedYear}
          month={selectedMonth}
        />
      )}
    </div>
  )
}
