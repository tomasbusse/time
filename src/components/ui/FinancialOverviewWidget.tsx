import { useWorkspace } from '@/lib/WorkspaceContext'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'

export function FinancialOverviewWidget() {
    const { workspaceId } = useWorkspace()

    const liquidityHistory = useQuery(
        api.simpleFinance.getLiquidityHistory,
        workspaceId ? { workspaceId } : 'skip'
    )

    const netWorthData = useQuery(
        api.simpleFinance.getSimpleNetWorth,
        workspaceId ? { workspaceId } : 'skip'
    )

    const goalData = useQuery(
        api.simpleFinance.getEquityGoalProgress,
        workspaceId ? { workspaceId } : 'skip'
    )

    // Get the most recent liquidity figure
    const currentLiquidity = liquidityHistory && liquidityHistory.length > 0
        ? liquidityHistory[liquidityHistory.length - 1].totalLiquidity
        : 0;

    const netWorth = netWorthData?.netWorth || 0
    const assets = netWorthData?.totalAssets || 0
    const liabilities = netWorthData?.totalLiabilities || 0
    const goal = goalData?.targetEquity || 50000 // Default goal if not set

    return (
        <div className="h-full flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-4">
                {/* Liquidity Section */}
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Liquidity</p>
                    <div className="text-2xl font-bold text-dark-blue">
                        {formatCurrency(currentLiquidity)}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                        Goal: {formatCurrency(goal)}
                    </p>
                </div>

                {/* Net Worth Section */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-500">Net Worth</p>
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold text-dark-blue">
                        {formatCurrency(netWorth)}
                    </div>
                    <div className="mt-1 space-y-0.5">
                        <p className="text-xs text-gray-400">
                            Assets: {formatCurrency(assets)}
                        </p>
                        <p className="text-xs text-gray-400">
                            Liabilities: {formatCurrency(liabilities)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
