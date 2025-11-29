import { useState, useEffect, useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { formatCurrency } from '@/lib/utils'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Target } from 'lucide-react'
import type { Id } from '../../../convex/_generated/dataModel'

interface DashboardLiquidityProps {
    workspaceId: Id<"workspaces">
    year: number
    month: number
    onYearChange: (year: number) => void
    onMonthChange: (month: number) => void
}

export function DashboardLiquidity({ workspaceId, year, month, onYearChange, onMonthChange }: DashboardLiquidityProps) {
    // Format month as YYYY-MM for the API
    const monthStr = `${year}-${month.toString().padStart(2, '0')}`

    // Get liquidity data
    const monthlyBalances = useQuery(
        api.simpleFinance.getMonthlyBalances,
        workspaceId ? { workspaceId, month: monthStr } : 'skip'
    )

    const goalData = useQuery(
        api.simpleFinance.getEquityGoalProgress,
        workspaceId ? { workspaceId } : 'skip'
    )

    // Calculate totals
    const { currentLiquidity, targetEquity, progress } = useMemo(() => {
        const liquidity = (monthlyBalances || []).reduce((sum: number, balance: any) => sum + balance.balance, 0)
        const target = goalData?.targetEquity || 0
        const prog = target > 0 ? (liquidity / target) * 100 : 0

        return {
            currentLiquidity: liquidity,
            targetEquity: target,
            progress: prog
        }
    }, [monthlyBalances, goalData])

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

    const handlePrevMonth = () => {
        if (month === 1) {
            onMonthChange(12)
            onYearChange(year - 1)
        } else {
            onMonthChange(month - 1)
        }
    }

    const handleNextMonth = () => {
        if (month === 12) {
            onMonthChange(1)
            onYearChange(year + 1)
        } else {
            onMonthChange(month + 1)
        }
    }

    return (
        <div className="space-y-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <button
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-dark-blue"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-bold text-dark-blue w-48 text-center">
                    {monthNames[month - 1]} {year}
                </h3>
                <button
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-dark-blue"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Liquidity Summary Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div>
                        <div className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Total Liquidity</div>
                        <div className="text-2xl font-bold text-dark-blue break-words">
                            {formatCurrency(currentLiquidity)}
                        </div>
                        <div className="text-sm text-gray-500 mt-2 font-medium">
                            {monthlyBalances?.length || 0} Accounts Tracked
                        </div>
                    </div>

                    {targetEquity > 0 && (
                        <div className="w-full space-y-2">
                            <div className="w-full h-px bg-gray-100 my-2"></div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Goal Progress</span>
                                <span className="font-bold text-dark-blue">{progress.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full bg-dark-blue rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                ></div>
                            </div>
                            <div className="text-xs text-gray-400 text-right">
                                Target: {formatCurrency(targetEquity)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
