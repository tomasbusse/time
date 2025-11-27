import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Card } from '@/components/ui/Card'
import { TrendingUp, TrendingDown, Wallet, CreditCard, Target, DollarSign } from 'lucide-react'

export default function MoneyOverview({ onNavigate }: { onNavigate: (tab: string) => void }) {
    const { workspaceId } = useWorkspace()

    // Get current month/year
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    // Get financial data
    const netWorth = useQuery(api.simpleFinance.getSimpleNetWorth, workspaceId ? { workspaceId } : 'skip')
    const equityProgress = useQuery(api.simpleFinance.getEquityGoalProgress, workspaceId ? { workspaceId } : 'skip')
    const subscriptions = useQuery(api.finance.listSubscriptions, workspaceId ? { workspaceId } : 'skip')
    const budgetSummary = useQuery(
        api.budget.getBudgetSummary,
        workspaceId ? { workspaceId, year: currentYear, month: currentMonth } : 'skip'
    )

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(amount)
    }

    // Calculate subscription totals
    const subscriptionTotals = subscriptions?.reduce(
        (acc: any, sub: any) => {
            if (!sub.isActive) return acc
            if (sub.billingCycle === 'monthly') {
                acc.monthly += sub.cost
                acc.yearly += sub.cost * 12
            } else {
                acc.monthly += sub.cost / 12
                acc.yearly += sub.cost
            }
            return acc
        },
        { monthly: 0, yearly: 0 }
    ) || { monthly: 0, yearly: 0 }

    return (
        <div className="space-y-4 sm:space-y-6">
            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-dark-blue mb-1 sm:mb-2">Money Overview</h2>
                <p className="text-sm sm:text-base text-gray-600">Your complete financial snapshot</p>
            </div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Net Worth */}
                <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-white">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="text-xs sm:text-sm font-medium text-gray-600">Net Worth</div>
                        <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-dark-blue">
                        {formatCurrency(netWorth?.netWorth || 0)}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                        Assets: {formatCurrency(netWorth?.totalAssets || 0)}
                    </div>
                    <div className="text-xs text-gray-500">
                        Liabilities: {formatCurrency(netWorth?.totalLiabilities || 0)}
                    </div>
                </Card>

                {/* Liquidity */}
                <Card className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="text-xs sm:text-sm font-medium text-gray-600">Current Liquidity</div>
                        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-off-white0" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-dark-blue">
                        {formatCurrency(equityProgress?.currentEquity || 0)}
                    </div>
                    {equityProgress?.hasGoal && equityProgress?.targetEquity && (
                        <div className="mt-2 text-xs text-gray-500">
                            Goal: {formatCurrency(equityProgress.targetEquity)}
                        </div>
                    )}
                </Card>

                {/* Subscriptions */}
                <Card className="p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-white">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="text-xs sm:text-sm font-medium text-gray-600">Subscriptions</div>
                        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-dark-blue">
                        {formatCurrency(subscriptionTotals.monthly)}
                        <span className="text-xs sm:text-sm font-normal text-gray-600 ml-1">/mo</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                        {formatCurrency(subscriptionTotals.yearly)}/year
                    </div>
                </Card>

                {/* Budget Health */}
                <Card className={`p-4 sm:p-6 ${budgetSummary?.isHealthy ? 'bg-gradient-to-br from-gray-50 to-white' : 'bg-gradient-to-br from-gray-50 to-white'}`}>
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="text-xs sm:text-sm font-medium text-gray-600">Budget Health</div>
                        {budgetSummary?.isHealthy ? (
                            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-off-white0" />
                        ) : (
                            <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-custom-brown" />
                        )}
                    </div>
                    <div className={`text-xl sm:text-2xl font-bold ${budgetSummary?.isHealthy ? 'text-off-white0' : 'text-custom-brown'}`}>
                        {budgetSummary?.isHealthy ? 'Surplus' : 'Deficit'}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                        {formatCurrency(Math.abs(budgetSummary?.surplus || 0))}
                    </div>
                </Card>
            </div>

            {/* Detailed Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Assets & Liabilities Breakdown */}
                <Card className="p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-dark-blue mb-3 sm:mb-4">Assets & Liabilities</h3>
                    <div className="space-y-3 sm:space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1 sm:mb-2">
                                <span className="text-xs sm:text-sm text-gray-600">Total Assets</span>
                                <span className="text-sm sm:text-base font-semibold text-off-white0">
                                    {formatCurrency(netWorth?.totalAssets || 0)}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                                <div
                                    className="bg-off-white0 h-1.5 sm:h-2 rounded-full"
                                    style={{
                                        width: `${((netWorth?.totalAssets || 0) / Math.max(netWorth?.totalAssets || 1, netWorth?.totalLiabilities || 1)) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1 sm:mb-2">
                                <span className="text-xs sm:text-sm text-gray-600">Total Liabilities</span>
                                <span className="text-sm sm:text-base font-semibold text-custom-brown">
                                    {formatCurrency(netWorth?.totalLiabilities || 0)}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                                <div
                                    className="bg-custom-brown h-1.5 sm:h-2 rounded-full"
                                    style={{
                                        width: `${((netWorth?.totalLiabilities || 0) / Math.max(netWorth?.totalAssets || 1, netWorth?.totalLiabilities || 1)) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div className="pt-3 sm:pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm sm:text-base font-medium text-gray-700">Net Worth</span>
                                <span className="text-base sm:text-lg font-bold text-dark-blue">
                                    {formatCurrency(netWorth?.netWorth || 0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Budget Overview */}
                <Card className="p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-dark-blue mb-3 sm:mb-4">This Month's Budget</h3>
                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm text-gray-600">Income</span>
                            <span className="text-sm sm:text-base font-semibold text-off-white0">
                                {formatCurrency(budgetSummary?.income || 0)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm text-gray-600">Outgoings</span>
                            <span className="text-sm sm:text-base font-semibold text-custom-brown">
                                {formatCurrency(budgetSummary?.outgoings || 0)}
                            </span>
                        </div>
                        <div className="pt-3 sm:pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm sm:text-base font-medium text-gray-700">Surplus/Deficit</span>
                                <span className={`text-base sm:text-lg font-bold ${budgetSummary?.isHealthy ? 'text-off-white0' : 'text-custom-brown'}`}>
                                    {formatCurrency(budgetSummary?.surplus || 0)}
                                </span>
                            </div>
                        </div>
                        {budgetSummary?.outgoingsCount !== undefined && (
                            <div className="pt-1 sm:pt-2 text-xs text-gray-500">
                                {budgetSummary.outgoingsCount} outgoing{budgetSummary.outgoingsCount !== 1 ? 's' : ''} tracked
                            </div>
                        )}
                    </div>
                </Card>

                {/* Liquidity Progress */}
                {equityProgress?.hasGoal && equityProgress?.targetEquity && (
                    <Card className="p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold text-dark-blue mb-3 sm:mb-4 flex items-center gap-2">
                            <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                            Liquidity Goal Progress
                        </h3>
                        <div className="space-y-3 sm:space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1 sm:mb-2">
                                    <span className="text-xs sm:text-sm text-gray-600">Current</span>
                                    <span className="text-sm sm:text-base font-semibold text-dark-blue">
                                        {formatCurrency(equityProgress.currentEquity)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mb-1 sm:mb-2">
                                    <span className="text-xs sm:text-sm text-gray-600">Target</span>
                                    <span className="text-sm sm:text-base font-semibold text-gray-700">
                                        {formatCurrency(equityProgress.targetEquity)}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 mt-2 sm:mt-3">
                                    <div
                                        className="bg-custom-brown h-2 sm:h-3 rounded-full transition-all"
                                        style={{ width: `${Math.min(equityProgress.progress, 100)}%` }}
                                    />
                                </div>
                                <div className="text-center mt-1 sm:mt-2 text-xs sm:text-sm font-medium text-gray-700">
                                    {equityProgress.progress.toFixed(1)}% of goal
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Active Subscriptions */}
                <Card className="p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-dark-blue mb-3 sm:mb-4">Active Subscriptions</h3>
                    <div className="space-y-2">
                        {subscriptions && subscriptions.filter((s: any) => s.isActive).length > 0 ? (
                            <>
                                <div className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                                    {subscriptions.filter((s: any) => s.isActive).length} active subscription
                                    {subscriptions.filter((s: any) => s.isActive).length !== 1 ? 's' : ''}
                                </div>
                                <div className="space-y-2">
                                    {subscriptions
                                        .filter((s: any) => s.isActive)
                                        .slice(0, 5)
                                        .map((sub: any) => (
                                            <div key={sub._id} className="flex justify-between items-center text-xs sm:text-sm">
                                                <span className="text-gray-700">{sub.name}</span>
                                                <span className="font-medium text-dark-blue">
                                                    {formatCurrency(sub.billingCycle === 'monthly' ? sub.cost : sub.cost / 12)}
                                                    <span className="text-xs text-gray-500 ml-1">/mo</span>
                                                </span>
                                            </div>
                                        ))}
                                    {subscriptions.filter((s: any) => s.isActive).length > 5 && (
                                        <div className="text-xs text-gray-500 text-center pt-1 sm:pt-2">
                                            +{subscriptions.filter((s: any) => s.isActive).length - 5} more
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-3 sm:py-4 text-gray-500 text-xs sm:text-sm">No active subscriptions</div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-dark-blue mb-3 sm:mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                    <button
                        onClick={() => onNavigate('assets-liabilities')}
                        className="p-3 sm:p-4 border border-light-gray rounded-lg hover:bg-light-gray/30 transition-colors text-left"
                    >
                        <div className="text-xs sm:text-sm font-medium text-dark-blue">View Assets</div>
                        <div className="text-[10px] sm:text-xs text-gray-500 mt-1">Manage assets & liabilities</div>
                    </button>
                    <button
                        onClick={() => onNavigate('equity')}
                        className="p-3 sm:p-4 border border-light-gray rounded-lg hover:bg-light-gray/30 transition-colors text-left"
                    >
                        <div className="text-xs sm:text-sm font-medium text-dark-blue">Track Liquidity</div>
                        <div className="text-[10px] sm:text-xs text-gray-500 mt-1">Monitor cash flow</div>
                    </button>
                    <button
                        onClick={() => onNavigate('budget')}
                        className="p-3 sm:p-4 border border-light-gray rounded-lg hover:bg-light-gray/30 transition-colors text-left"
                    >
                        <div className="text-xs sm:text-sm font-medium text-dark-blue">Manage Budget</div>
                        <div className="text-[10px] sm:text-xs text-gray-500 mt-1">Income vs outgoings</div>
                    </button>
                    <button
                        onClick={() => onNavigate('subscriptions')}
                        className="p-3 sm:p-4 border border-light-gray rounded-lg hover:bg-light-gray/30 transition-colors text-left"
                    >
                        <div className="text-xs sm:text-sm font-medium text-dark-blue">View Subscriptions</div>
                        <div className="text-[10px] sm:text-xs text-gray-500 mt-1">Track recurring costs</div>
                    </button>
                </div>
            </Card>
        </div>
    )
}
