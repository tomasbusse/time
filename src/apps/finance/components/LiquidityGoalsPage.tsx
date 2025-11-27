import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Target, TrendingUp, Calendar, BarChart3, Plus, Edit2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function LiquidityGoalsPage() {
  const { workspaceId, userId } = useWorkspace()
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [goalAmount, setGoalAmount] = useState('')
  const [goalDate, setGoalDate] = useState('')

  // Data queries - use simple finance system for liquid assets (bank accounts only)
  const simpleAssets = useQuery(
    api.simpleFinance.listSimpleAssets,
    workspaceId ? { workspaceId } : 'skip'
  ) || []
  
  // Query equity goal progress for target amount
  const goalData = useQuery(
    api.simpleFinance.getEquityGoalProgress,
    workspaceId ? { workspaceId } : 'skip'
  )

  // Mutations
  const upsertGoal = useMutation(api.simpleFinance.upsertEquityGoal)

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  // Calculate current liquidity - ONLY include bank accounts (truly liquid assets)
  const currentLiquidity = simpleAssets
    ?.filter((asset) => {
      // Only include bank accounts (the most liquid assets)
      return asset.type === 'bank_account' && asset.currentValue > 0
    })
    .reduce((sum, asset) => sum + (asset.currentValue || 0), 0) || 0

  const targetLiquidity = goalData?.targetEquity || 0
  const missingAmount = Math.max(targetLiquidity - currentLiquidity, 0)
  const progress = targetLiquidity > 0 ? (currentLiquidity / targetLiquidity) * 100 : 0

  const getProgressColor = (progress: number): string => {
    if (progress >= 100) return 'text-green-600'
    if (progress >= 75) return 'text-custom-brown'
    if (progress >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressBarColor = (progress: number): string => {
    if (progress >= 100) return 'bg-off-white0'
    if (progress >= 75) return 'bg-custom-brown'
    if (progress >= 50) return 'bg-yellow-500'
    return 'bg-off-white0'
  }

  const handleSaveGoal = async () => {
    if (!workspaceId || !userId || !goalAmount || Number(goalAmount) <= 0) return
    
    await upsertGoal({
      workspaceId: workspaceId as any,
      ownerId: userId as any,
      targetEquity: Number(goalAmount),
      targetDate: goalDate || undefined,
    })
    
    setShowGoalModal(false)
    setGoalAmount('')
    setGoalDate('')
  }

  if (!simpleAssets || !goalData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-light-gray rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-light-gray rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-blue">Liquidity Goals</h2>
          <p className="text-gray">Track your liquid assets and progress toward financial goals</p>
        </div>
        <Button onClick={() => setShowGoalModal(true)} className="flex items-center gap-2">
          <Target className="w-4 h-4" />
          {goalData ? 'Update Goal' : 'Set Goal'}
        </Button>
      </div>

      {/* Prominent Missing Amount Display */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-custom-brown/40">
        <CardContent className="p-8">
          <div className="text-center">
            <h2 className="text-lg font-medium text-dark-blue mb-2">Missing Amount to Reach Goal</h2>
            {targetLiquidity > 0 ? (
              <div className={`text-6xl font-bold ${missingAmount > 0 ? 'text-custom-brown' : 'text-green-600'} mb-2`}>
                {formatCurrency(missingAmount)}
              </div>
            ) : (
              <div className="text-3xl font-medium text-custom-brown mb-2">
                No Goal Set
              </div>
            )}
            {targetLiquidity > 0 && (
              <div className="text-sm text-custom-brown">
                Current: {formatCurrency(currentLiquidity)} / Target: {formatCurrency(targetLiquidity)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Liquidity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Current Liquidity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-dark-blue">
              {formatCurrency(currentLiquidity)}
            </div>
            <div className="text-sm text-gray mt-1">
              {simpleAssets.filter((asset) => asset.type === 'bank_account' && asset.currentValue > 0).length} liquid accounts
            </div>
          </CardContent>
        </Card>

        {/* Goal Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-custom-brown" />
              Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {targetLiquidity > 0 ? (
              <div>
                <div className={`text-3xl font-bold ${getProgressColor(progress)}`}>
                  {Math.min(progress, 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray mt-1">
                  {formatCurrency(missingAmount)} remaining
                </div>
                {goalData.targetDate && (
                  <div className="text-xs text-gray mt-1">
                    Target: {new Date(goalData.targetDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="text-2xl text-gray">No goal</div>
                <Button 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setShowGoalModal(true)}
                >
                  Set Goal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-custom-brown" />
              Account Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {simpleAssets
                .filter((asset) => asset.type === 'bank_account' && asset.currentValue > 0)
                .slice(0, 3)
                .map((asset) => (
                  <div key={asset._id} className="flex justify-between text-sm">
                    <span className="text-gray truncate">{asset.name}</span>
                    <span className="font-medium">{formatCurrency(asset.currentValue)}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {targetLiquidity > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray">Progress to Goal</span>
              <span className="text-sm text-gray">
                {formatCurrency(currentLiquidity)} / {formatCurrency(targetLiquidity)}
              </span>
            </div>
            <div className="w-full bg-light-gray rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all duration-500 ${getProgressBarColor(progress)}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            {goalData.targetDate && (
              <div className="text-xs text-gray mt-2">
                Target date: {new Date(goalData.targetDate).toLocaleDateString()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Goal Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Goal Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {targetLiquidity > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray">Current Target</div>
                  <div className="text-2xl font-semibold text-custom-brown">
                    {formatCurrency(targetLiquidity)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray">Target Date</div>
                  <div className="text-2xl font-semibold text-dark-blue">
                    {goalData.targetDate ? new Date(goalData.targetDate).toLocaleDateString() : 'No date set'}
                  </div>
                </div>
              </div>
              <Button onClick={() => setShowGoalModal(true)} className="flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                Update Goal
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 mx-auto text-gray mb-4" />
              <div className="text-lg font-medium text-dark-blue mb-2">No Liquidity Goal Set</div>
              <div className="text-gray mb-4">Set your first liquidity goal to start tracking progress</div>
              <Button onClick={() => setShowGoalModal(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Set Goal
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-dark-blue">
                {targetLiquidity > 0 ? 'Update Liquidity Goal' : 'Set Liquidity Goal'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray mb-2">
                  Target Amount (€)
                </label>
                <input
                  type="number"
                  min="1"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  placeholder={targetLiquidity ? targetLiquidity.toString() : "Enter target amount"}
                  className="flex h-10 w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray mb-2">
                  Target Date (optional)
                </label>
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
                onClick={handleSaveGoal}
                className="flex-1 h-10 px-4 rounded-md bg-dark-blue text-off-white"
              >
                {targetLiquidity > 0 ? 'Update Goal' : 'Set Goal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}