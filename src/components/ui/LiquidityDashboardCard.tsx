import { useWorkspace } from '@/lib/WorkspaceContext'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { DollarSign } from 'lucide-react'

export function LiquidityDashboardCard() {
  const { workspaceId } = useWorkspace()

  const liquidityHistory = useQuery(
    api.simpleFinance.getLiquidityHistory,
    workspaceId ? { workspaceId } : 'skip'
  )

  const goalData = useQuery(
    api.simpleFinance.getEquityGoalProgress,
    workspaceId ? { workspaceId } : 'skip'
  )

  // Get the most recent liquidity figure from the history
  const currentLiquidity = liquidityHistory && liquidityHistory.length > 0
    ? liquidityHistory[liquidityHistory.length - 1].totalLiquidity
    : 0;

  const targetEquity = goalData?.targetEquity || 0
  const progress = targetEquity > 0 ? (currentLiquidity / targetEquity) * 100 : 0

  return (
    <div className="h-full">
      <Card className="h-full border-none shadow-none bg-transparent">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-3">
          <CardTitle className="text-sm font-medium text-gray-600">
            Liquidity
          </CardTitle>
          <DollarSign className="h-5 w-5 text-off-white0" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-2xl font-bold text-dark-blue">
            {formatCurrency(currentLiquidity)}
          </div>
          {targetEquity > 0 && (
            <>
              <p className="text-xs text-gray-500 mt-1">
                Goal: {formatCurrency(targetEquity)}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-off-white0 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}