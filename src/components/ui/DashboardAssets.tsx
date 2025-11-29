import { useState, useEffect, useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { formatCurrency } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Id } from '../../../convex/_generated/dataModel'

interface DashboardAssetsProps {
    workspaceId: Id<"workspaces">
    year: number
    month: number
    onYearChange: (year: number) => void
    onMonthChange: (month: number) => void
}

export function DashboardAssets({ workspaceId, year, month, onYearChange, onMonthChange }: DashboardAssetsProps) {
    // Get all assets and filter out bank accounts
    const allAssets = useQuery(
        api.simpleFinance.listSimpleAssets,
        workspaceId ? { workspaceId } : 'skip'
    )

    const liabilities = useQuery(
        api.simpleFinance.listSimpleLiabilities,
        workspaceId ? { workspaceId } : 'skip'
    )

    const monthlyValuations = useQuery(
        api.simpleFinance.listMonthlyValuations,
        workspaceId ? { workspaceId, year, month } : 'skip'
    )

    // Filter out bank accounts (they belong to Liquidity)
    const assets = useMemo(() => {
        return allAssets?.filter((a: any) => a.type !== 'bank_account') || []
    }, [allAssets])

    // Calculate totals from monthly valuations
    const { totalAssets, totalLiabilities, netWorth } = useMemo(() => {
        let assetTotal = 0
        let liabilityTotal = 0

        if (monthlyValuations) {
            monthlyValuations.forEach((val: any) => {
                if (val.itemType === 'asset') {
                    assetTotal += val.value
                } else if (val.itemType === 'liability') {
                    liabilityTotal += val.value
                }
            })
        }

        // Fallback to current values if no valuations
        if (assetTotal === 0 && assets) {
            assetTotal = assets.reduce((sum: number, a: any) => sum + (a.currentValue || 0), 0)
        }
        if (liabilityTotal === 0 && liabilities) {
            liabilityTotal = liabilities.reduce((sum: number, l: any) => sum + (l.currentBalance || 0), 0)
        }

        return {
            totalAssets: assetTotal,
            totalLiabilities: liabilityTotal,
            netWorth: assetTotal - liabilityTotal
        }
    }, [monthlyValuations, assets, liabilities])

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

            {/* Assets Summary Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-full">
                        <div className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Total Assets</div>
                        <div className="text-4xl font-bold text-dark-blue">
                            {formatCurrency(totalAssets)}
                        </div>
                        <div className="text-sm text-gray-500 mt-2 font-medium">
                            {assets?.length || 0} Assets Tracked
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-100 my-2"></div>

                    <div className="grid grid-cols-2 gap-8 w-full">
                        <div>
                            <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Liabilities</div>
                            <div className="text-xl font-bold text-custom-brown">{formatCurrency(totalLiabilities)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Net Worth</div>
                            <div className={`text-xl font-bold ${netWorth >= 0 ? 'text-dark-blue' : 'text-custom-brown'}`}>
                                {formatCurrency(netWorth)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
