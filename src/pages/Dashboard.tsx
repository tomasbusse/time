import { useWorkspace } from '@/lib/WorkspaceContext'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ActiveTimer } from '@/components/ActiveTimer'
import { Clock, DollarSign, ListTodo, TrendingUp, AlertCircle, Calendar, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { workspaceId, userName } = useWorkspace()
  
  // Data queries
  const flowSummary = useQuery(api.flow.getTimeAllocationSummary, workspaceId ? { workspaceId } : 'skip')
  const activeTimer = useQuery(api.flow.getActiveTimer, workspaceId ? { workspaceId } : 'skip')
  const finance = useQuery(api.finance.subscriptionTotals, workspaceId ? { workspaceId } : 'skip')
  const budgetAnalytics = useQuery(api.finance.getBudgetAnalytics, workspaceId ? { workspaceId } : 'skip')
  const accounts = useQuery(api.finance.listAccounts, workspaceId ? { workspaceId } : 'skip')
  const lists = useQuery(api.food.listShoppingLists, workspaceId ? { workspaceId } : 'skip') as any[] | 'skip' | undefined
  const tasks = useQuery(api.flow.listTasks, workspaceId ? { workspaceId } : 'skip')
  
  const stopTimer = useMutation(api.flow.stopTimer)
  
  // Calculate metrics
  const itemsRemaining = Array.isArray(lists)
    ? lists.reduce((sum, l) => sum + (Array.isArray(l.items) ? l.items.filter((i: any) => !i.completed).length : 0), 0)
    : 0
  const listCount = Array.isArray(lists) ? lists.length : 0
  
  const totalBalance = Array.isArray(accounts)
    ? accounts.filter(a => a.accountType === 'bank').reduce((sum, a) => sum + a.currentBalance, 0)
    : 0
  
  const completionRate = flowSummary && flowSummary.totalTasks > 0
    ? Math.round((flowSummary.completedTasks / flowSummary.totalTasks) * 100)
    : 0
  
  const upcomingTasks = Array.isArray(tasks)
    ? tasks.filter(t => t.status !== 'completed').slice(0, 5)
    : []
  
  const budgetAlerts = budgetAnalytics?.budgetAlerts || { overBudget: [], warning: [] }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-neutral-800">Dashboard</h1>
        <p className="text-neutral-600 mt-2">Welcome back, {userName || 'User'}. Here's your productivity overview.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Tasks"
          value={flowSummary?.totalTasks || 0}
          subtitle={`${flowSummary?.completedTasks || 0} completed`}
          icon={<ListTodo className="w-6 h-6 text-blue-600" />}
        />
        <StatCard
          title="Monthly Subscriptions"
          value={finance ? `€${finance.monthlyTotal.toFixed(0)}` : '—'}
          subtitle={`${finance?.activeCount || 0} active`}
          icon={<DollarSign className="w-6 h-6 text-purple-600" />}
        />
        <StatCard
          title="Account Balance"
          value={`€${totalBalance.toLocaleString()}`}
          icon={<TrendingUp className="w-6 h-6 text-green-600" />}
        />
        <StatCard
          title="Shopping Items"
          value={itemsRemaining}
          subtitle={`${listCount} list${listCount !== 1 ? 's' : ''}`}
          icon={<ShoppingCart className="w-6 h-6 text-red-600" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Timer / Time Allocation */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Flow Time Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTimer ? (
              <ActiveTimer
                taskTitle={activeTimer.taskTitle}
                startTime={activeTimer.startTime}
                onStop={async () => {
                  if (workspaceId) {
                    await stopTimer({ workspaceId })
                  }
                }}
                compact
              />
            ) : (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <p className="text-neutral-500 text-sm">No active timer</p>
                  <Link to="/flow" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block">
                    Start a task →
                  </Link>
                </div>
                {flowSummary && (
                  <div className="space-y-3 pt-4 border-t border-neutral-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Completion Rate</span>
                      <span className="text-sm font-semibold text-neutral-800">{completionRate}%</span>
                    </div>
                    <ProgressBar value={completionRate} variant={completionRate > 70 ? 'success' : completionRate > 40 ? 'warning' : 'error'} />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Alerts */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              Budget Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {budgetAlerts.overBudget.length === 0 && budgetAlerts.warning.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-green-600">check_circle</span>
                </div>
                <p className="text-sm text-neutral-600">All budgets on track!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {budgetAlerts.overBudget.slice(0, 3).map((alert: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-900">{alert.category}</p>
                      <p className="text-xs text-red-700 mt-1">€{alert.spent} / €{alert.budget}</p>
                    </div>
                    <Badge variant="error" className="flex-shrink-0">Over</Badge>
                  </div>
                ))}
                {budgetAlerts.warning.slice(0, 2).map((alert: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-yellow-900">{alert.category}</p>
                      <p className="text-xs text-yellow-700 mt-1">€{alert.spent} / €{alert.budget}</p>
                    </div>
                    <Badge variant="warning" className="flex-shrink-0">{alert.threshold}%</Badge>
                  </div>
                ))}
                <Link to="/finance" className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium mt-4">
                  View all budgets →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscriptions Breakdown */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {finance ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-neutral-800">€{finance.monthlyTotal.toFixed(2)}</p>
                  <p className="text-sm text-neutral-500 mt-1">per month</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-neutral-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-semibold text-neutral-800">{finance.activeCount}</p>
                    <p className="text-xs text-neutral-600">Active</p>
                  </div>
                  <div className="bg-neutral-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-semibold text-neutral-800">€{finance.yearlyTotal.toFixed(0)}</p>
                    <p className="text-xs text-neutral-600">Yearly</p>
                  </div>
                </div>
                {finance.potentialMonthlySavings > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-900">Potential Savings</p>
                    <p className="text-lg font-bold text-green-700 mt-1">€{finance.potentialMonthlySavings.toFixed(2)}/mo</p>
                  </div>
                )}
                <Link to="/finance" className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Manage subscriptions →
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500">Loading...</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Upcoming Tasks
              </div>
              <Link to="/flow" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length > 0 ? (
              <div className="space-y-3">
                {upcomingTasks.map((task: any) => (
                  <div key={task._id} className="flex items-center justify-between p-3 hover:bg-neutral-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-800 truncate">{task.title}</p>
                        {task.dueDate && (
                          <p className="text-xs text-neutral-500 mt-1">{task.dueDate}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={
                      task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'info' : 'default'
                    } className="flex-shrink-0 ml-2">
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500">No upcoming tasks</div>
            )}
          </CardContent>
        </Card>

        {/* Shopping Lists */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-red-600" />
                Shopping Lists
              </div>
              <Link to="/food" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(lists) && lists.length > 0 ? (
              <div className="space-y-4">
                {lists.slice(0, 3).map((list: any) => {
                  const total = Array.isArray(list.items) ? list.items.length : 0
                  const completed = Array.isArray(list.items) ? list.items.filter((i: any) => i.completed).length : 0
                  const percentage = total > 0 ? (completed / total) * 100 : 0
                  
                  return (
                    <div key={list._id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-neutral-800">{list.name}</p>
                        <span className="text-xs text-neutral-500">{completed}/{total}</span>
                      </div>
                      <ProgressBar 
                        value={completed} 
                        max={total} 
                        variant={percentage === 100 ? 'success' : percentage > 50 ? 'warning' : 'default'} 
                      />
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500">No shopping lists</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
