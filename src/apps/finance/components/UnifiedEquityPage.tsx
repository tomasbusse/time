import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SimpleEquityAccounts } from './SimpleEquityAccounts'
import { SimpleEquityValuations } from './SimpleEquityValuations'
import { Target, TrendingUp, TrendingDown, Plus, Edit2, Calendar, BarChart3 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function UnifiedEquityPage() {
  const { workspaceId, userId } = useWorkspace()
  const [activeSection, setActiveSection] = useState<'overview' | 'accounts' | 'valuations' | 'goal'>('overview')
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [goalAmount, setGoalAmount] = useState('')
  const [goalDate, setGoalDate] = useState('')

  // Data queries
  const goalData = useQuery(
    api.simpleFinance.getEquityGoalProgress,
    workspaceId ? { workspaceId } : 'skip'
  )
  
  const equitySummary = useQuery(
    api.simpleFinance.getEquitySummary,
    workspaceId ? { workspaceId } : 'skip'
  )
  
  // Use the new equity monitoring function that correctly uses equity valuations
  const equityMonitoring = useQuery(
    api.equityMonitoring.getEquityMonitoring,
    workspaceId ? { workspaceId, months: 12 } : 'skip'
  )

  // Mutations
  const upsertGoal = useMutation(api.simpleFinance.upsertEquityGoal)

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

  // Calculate current equity from valuations
  const currentEquity = equitySummary?.totalEquity || 0
  const targetEquity = goalData?.targetEquity || 0
  const missingAmount = Math.max(targetEquity - currentEquity, 0)
  const progress = targetEquity > 0 ? (currentEquity / targetEquity) * 100 : 0

  const SectionButton = ({ 
    target, 
    label, 
    icon: Icon 
  }: { 
    target: typeof activeSection
    label: string
    icon: any 
  }) => (
    <Button
      variant={activeSection === target ? "default" : "outline"}
      onClick={() => setActiveSection(target)}
      className="flex items-center gap-2"
    >
      <Icon className="w-4 h-4" />
      {label}
    </Button>
  )

  if (!goalData || !equitySummary || !equityMonitoring) {
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
      {/* Header with section navigation */}
      <div className="flex flex-wrap gap-3 items-center border-b border-light-gray pb-3">
        <SectionButton target="overview" label="Overview" icon={BarChart3} />
        <SectionButton target="accounts" label="Accounts" icon={Plus} />
        <SectionButton target="valuations" label="Valuations" icon={Calendar} />
        <SectionButton target="goal" label="Goal Settings" icon={Target} />
      </div>

      {/* Overview Section - Missing Amount Prominently Displayed */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Prominent Missing Amount Display */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-custom-brown/40">
            <CardContent className="p-8">
              <div className="text-center">
                <h2 className="text-lg font-medium text-dark-blue mb-2">Missing Amount to Reach Goal</h2>
                {goalData.hasGoal ? (
                  <div className={`text-6xl font-bold ${missingAmount > 0 ? 'text-custom-brown' : 'text-green-600'} mb-2`}>
                    {formatCurrency(missingAmount)}
                  </div>
                ) : (
                  <div className="text-3xl font-medium text-custom-brown mb-2">
                    No Goal Set
                  </div>
                )}
                {goalData.hasGoal && (
                  <div className="text-sm text-custom-brown">
                    Current: {formatCurrency(currentEquity)} / Target: {formatCurrency(targetEquity)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Equity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Current Equity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-dark-blue">
                  {formatCurrency(currentEquity)}
                </div>
                <div className="text-sm text-gray mt-1">
                  {equitySummary?.count || 0} equity accounts
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
                {goalData.hasGoal ? (
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

            {/* Monthly Change */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {equityMonitoring.history.length >= 2 && 
                   equityMonitoring.history[equityMonitoring.history.length - 1].netWorth >= 
                   equityMonitoring.history[equityMonitoring.history.length - 2].netWorth ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                  Monthly Change
                </CardTitle>
              </CardHeader>
              <CardContent>
                {equityMonitoring.history.length >= 2 ? (
                  <div>
                    {(() => {
                      const current = equityMonitoring.history[equityMonitoring.history.length - 1]
                      const previous = equityMonitoring.history[equityMonitoring.history.length - 2]
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
                    <div className="text-xs text-gray mt-1">Add more valuations</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          {goalData.hasGoal && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray">Progress to Goal</span>
                  <span className="text-sm text-gray">
                    {formatCurrency(currentEquity)} / {formatCurrency(targetEquity)}
                  </span>
                </div>
                <div className="w-full bg-light-gray rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all duration-500 ${getProgressBarColor(progress)}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                {goalData.daysRemaining !== null && goalData.daysRemaining > 0 && (
                  <div className="text-xs text-gray mt-2">
                    {goalData.daysRemaining} days remaining to reach goal
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Equity Trend Chart */}
          {equityMonitoring.history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Equity Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={equityMonitoring.history}>
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
                        formatter={(value: number) => [formatCurrency(value), 'Net Worth']}
                        labelFormatter={(label) => formatMonth(label)}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="netWorth"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Other Sections */}
      {activeSection === 'accounts' && <SimpleEquityAccounts />}
      {activeSection === 'valuations' && <SimpleEquityValuations />}
      {activeSection === 'goal' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Goal Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goalData.hasGoal ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray">Current Target</div>
                    <div className="text-2xl font-semibold text-custom-brown">
                      {formatCurrency(goalData.targetEquity)}
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
                <div className="text-lg font-medium text-dark-blue mb-2">No Goal Set</div>
                <div className="text-gray mb-4">Set your first equity goal to start tracking progress</div>
                <Button onClick={() => setShowGoalModal(true)} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Set Goal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-dark-blue">
                {goalData.hasGoal ? 'Update Equity Goal' : 'Set Equity Goal'}
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
                  placeholder={goalData.targetEquity ? goalData.targetEquity.toString() : "Enter target amount"}
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
                {goalData.hasGoal ? 'Update Goal' : 'Set Goal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}