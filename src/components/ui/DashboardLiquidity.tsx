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

    // Get all assets to determine type (asset vs liability)
    const allAssets = useQuery(
        api.simpleFinance.listSimpleAssets,
        workspaceId ? { workspaceId } : 'skip'
    )

    const goalData = useQuery(
        api.simpleFinance.getEquityGoalProgress,
        workspaceId ? { workspaceId } : 'skip'
    )

    // Calculate totals
    const { currentLiquidity, totalAssets, totalLiabilities, targetEquity, progress } = useMemo(() => {
        let assetTotal = 0
        let liabilityTotal = 0

        if (monthlyBalances && allAssets) {
            monthlyBalances.forEach((balance: any) => {
                const asset = allAssets.find((a: any) => a._id === balance.assetId)
                if (asset) {
                    if (asset.type === 'bank_account_liability') {
                        liabilityTotal += Math.abs(balance.balance)
                    } else {
                        assetTotal += balance.balance
                    }
                }
            })
        }

        const netWorth = assetTotal - liabilityTotal
        const target = goalData?.targetEquity || 0
        const prog = target > 0 ? (netWorth / target) * 100 : 0

        return {
            currentLiquidity: netWorth,
            totalAssets: assetTotal,
            totalLiabilities: liabilityTotal,
            targetEquity: target,
            progress: prog
        }
    }, [monthlyBalances, allAssets, goalData])

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
                    {/* Net Worth - Prominent & Top */}
                    <div className="w-full">
                        <div className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Net Worth</div>
                        <div className={`text-2xl font-bold break-words ${currentLiquidity >= 0 ? 'text-dark-blue' : 'text-custom-brown'}`}>
                            {formatCurrency(currentLiquidity)}
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-100"></div>

                    {/* Assets & Liabilities - Stacked */}
                    <div className="w-full flex flex-col gap-3">
                        <div className="text-center">
                            <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Assets</div>
                            <div className="text-base font-bold text-dark-blue break-words">
                                {formatCurrency(totalAssets)}
                            </div>
                        </div>

                        <div className="w-full h-px bg-gray-50"></div>

                        <div className="text-center">
                            <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Liabilities</div>
                            <div className="text-base font-bold text-custom-brown break-words">
                                {formatCurrency(totalLiabilities)}
                            </div>
                        </div>
                    </div>

                    {targetEquity > 0 && (
                        <div className="w-full space-y-2 pt-2">
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
