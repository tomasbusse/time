import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TrendingUp, TrendingDown, Target, Calendar, BarChart3, Download } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

interface EquityDataPoint {
  month: string
  assets: number
  liabilities: number
  netWorth: number
}

interface EquityProgress {
  hasGoal: boolean
  currentNetWorth: number
  targetEquity: number
  progress: number
  remaining: number
  targetDate: string | null
  daysRemaining: number | null
  createdAt?: number
  updatedAt?: number
}

interface EquityProgress {
  hasGoal: boolean
  currentNetWorth: number
  targetEquity: number
  progress: number
  remaining: number
  targetDate: string | null
  daysRemaining: number | null
}

interface EquityMonitoringData {
  currentNetWorth: number
  currentAssets: number
  currentLiabilities: number
  history: EquityDataPoint[]
  lastUpdated: number
}

export default function EquityMonitoring() {
  const { workspaceId } = useWorkspace()
  const [selectedPeriod, setSelectedPeriod] = useState(12) // months
  const [showSnapshotModal, setShowSnapshotModal] = useState(false)

  // Get equity monitoring data
  const equityData = useQuery(
    api.simpleFinance.getEquityMonitoring,
    workspaceId ? { workspaceId, months: selectedPeriod } : 'skip'
  )

  // Get equity goal progress
  const goalProgress = useQuery(
    api.simpleFinance.getEquityGoalProgress,
    workspaceId ? { workspaceId } : 'skip'
  )

  // Create equity snapshot mutation
  const createSnapshot = useMutation(api.simpleFinance.createEquitySnapshot)

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const formatMonth = (monthStr: string): string => {
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('en-IE', { month: 'short', year: '2-digit' })
  }

  const handleCreateSnapshot = async () => {
    if (!workspaceId) return

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    try {
      await createSnapshot({
        workspaceId: workspaceId as any,
        year: currentYear,
        month: currentMonth,
        notes: 'Manual equity snapshot',
      })
      setShowSnapshotModal(false)
    } catch (error) {
      console.error('Failed to create snapshot:', error)
    }
  }

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

  if (!equityData || !goalProgress) {
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
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-blue">Equity Monitoring</h2>
          <p className="text-gray">Track your net worth over time and monitor progress toward your goals</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className="px-3 py-2 border border-light-gray rounded-md text-sm"
          >
            <option value={6}>6 months</option>
            <option value={12}>12 months</option>
            <option value={24}>24 months</option>
          </select>
          <Button onClick={() => setShowSnapshotModal(true)} className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Create Snapshot
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Net Worth */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-custom-brown" />
              Current Net Worth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-dark-blue">
              {formatCurrency(equityData.currentNetWorth)}
            </div>
            <div className="text-sm text-gray mt-1">
              Assets: {formatCurrency(equityData.currentAssets)} |
              Liabilities: {formatCurrency(equityData.currentLiabilities)}
            </div>
          </CardContent>
        </Card>

        {/* Goal Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goalProgress.hasGoal ? (
              <div>
                <div className={`text-3xl font-bold ${getProgressColor(goalProgress.progress)}`}>
                  {goalProgress.progress.toFixed(1)}%
                </div>
                <div className="text-sm text-gray mt-1">
                  {formatCurrency(goalProgress.remaining)} remaining
                </div>
                {goalProgress.targetDate && (
                  <div className="text-xs text-gray mt-1">
                    Target: {formatCurrency(goalProgress.targetEquity)} by {new Date(goalProgress.targetDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-2">
                <div className="text-sm text-gray">No goal set</div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowSnapshotModal(true)}
                >
                  Set Goal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Month-over-Month Change */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              {equityData.history.length >= 2 &&
                equityData.history[equityData.history.length - 1].netWorth >=
                equityData.history[equityData.history.length - 2].netWorth ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
              Monthly Change
            </CardTitle>
          </CardHeader>
          <CardContent>
            {equityData.history.length >= 2 ? (
              <div>
                {(() => {
                  const current = equityData.history[equityData.history.length - 1]
                  const previous = equityData.history[equityData.history.length - 2]
                  const change = current.netWorth - previous.netWorth
                  const isPositive = change >= 0
                  return (
                    <>
                      <div className={`text-3xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{formatCurrency(change)}
                      </div>
                      <div className="text-sm text-gray mt-1">
                        vs {formatMonth(previous.month)}
                      </div>
                    </>
                  )
                })()}
              </div>
            ) : (
              <div className="text-center py-2">
                <div className="text-sm text-gray">Insufficient data</div>
                <div className="text-xs text-gray mt-1">Create more snapshots to see trends</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {goalProgress.hasGoal && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray">Progress to Goal</span>
              <span className="text-sm text-gray">
                {formatCurrency(goalProgress.currentEquity)} / {formatCurrency(goalProgress.targetEquity)}
              </span>
            </div>
            <div className="w-full bg-light-gray rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(goalProgress.progress)}`}
                style={{ width: `${Math.min(goalProgress.progress, 100)}%` }}
              />
            </div>
            {goalProgress.daysRemaining !== null && goalProgress.daysRemaining > 0 && (
              <div className="text-xs text-gray mt-2">
                {goalProgress.daysRemaining} days remaining to reach goal
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Equity Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Equity Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {equityData.history.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityData.history}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={formatMonth}
                    className="text-xs"
                  />
                  <YAxis
                    tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                    className="text-xs"
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === 'netWorth' ? 'Net Worth' : name === 'assets' ? 'Assets' : 'Liabilities'
                    ]}
                    labelFormatter={(label) => formatMonth(label)}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="assets"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="liabilities"
                    stackId="2"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.3}
                  />
                  <Line
                    type="monotone"
                    dataKey="netWorth"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12 text-gray">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No equity data available</p>
              <p className="text-sm">Create your first snapshot to start tracking your equity</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historical Data Table */}
      {equityData.history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Historical Data</span>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Month</th>
                    <th className="text-right py-3 px-2">Assets</th>
                    <th className="text-right py-3 px-2">Liabilities</th>
                    <th className="text-right py-3 px-2">Net Worth</th>
                    <th className="text-right py-3 px-2">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {equityData.history.map((item: EquityDataPoint, index: number) => {
                    const change = index > 0 ? item.netWorth - equityData.history[index - 1].netWorth : 0
                    return (
                      <tr key={item.month} className="border-b hover:bg-off-white">
                        <td className="py-3 px-2 font-medium">{formatMonth(item.month)}</td>
                        <td className="text-right py-3 px-2">{formatCurrency(item.assets)}</td>
                        <td className="text-right py-3 px-2">{formatCurrency(item.liabilities)}</td>
                        <td className="text-right py-3 px-2 font-semibold">{formatCurrency(item.netWorth)}</td>
                        <td className={`text-right py-3 px-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {change >= 0 ? '+' : ''}{formatCurrency(change)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Snapshot Modal */}
      {showSnapshotModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-dark-blue">Create Equity Snapshot</h2>
              <p className="text-sm text-gray mt-1">
                Capture your current assets and liabilities for this month
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-custom-brown/10 border border-custom-brown/40 rounded-lg p-4">
                <h3 className="font-medium text-dark-blue mb-2">What this will do:</h3>
                <ul className="text-sm text-custom-brown space-y-1">
                  <li>• Record current values for all your assets</li>
                  <li>• Record current balances for all your liabilities</li>
                  <li>• Calculate your net worth for this month</li>
                  <li>• Add to your equity tracking history</li>
                </ul>
              </div>
              <div className="text-sm text-gray">
                <strong>Current values that will be recorded:</strong>
                <div className="mt-2 space-y-1">
                  <div>Assets: {formatCurrency(equityData.currentAssets)}</div>
                  <div>Liabilities: {formatCurrency(equityData.currentLiabilities)}</div>
                  <div>Net Worth: {formatCurrency(equityData.currentNetWorth)}</div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => setShowSnapshotModal(false)}
                className="flex-1 h-10 px-4 rounded-md border border-light-gray"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSnapshot}
                className="flex-1 h-10 px-4 rounded-md bg-dark-blue text-off-white"
              >
                Create Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}