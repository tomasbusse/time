import { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { formatCurrency } from '@/lib/utils'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import type { Id } from '../../../convex/_generated/dataModel'

interface DashboardLiquidityProps {
    workspaceId: Id<"workspaces">
    year: number
    month: number
    onYearChange: (year: number) => void
    onMonthChange: (month: number) => void
}

export function DashboardLiquidity({ workspaceId, year, month, onYearChange, onMonthChange }: DashboardLiquidityProps) {
    // Get budget data
    const budgetIncome = useQuery(
        api.budget.getBudgetIncome,
        workspaceId ? { workspaceId, year, month } : 'skip'
    )
    const outgoings = useQuery(api.budget.listBudgetOutgoings, workspaceId ? { workspaceId } : 'skip')

    const monthlyOverrides = useQuery(
        (api as any).budget.getMonthlyOverrides,
        workspaceId ? { workspaceId, year, month } : 'skip'
    )

    // Calculate totals
    const [totalOutgoings, setTotalOutgoings] = useState(0)

    useEffect(() => {
        if (outgoings) {
            const overridesMap = new Map(monthlyOverrides?.map((m: any) => [m.outgoingId, m.amount]) || [])
            let total = 0
            outgoings.forEach((o: any) => {
                total += overridesMap.has(o._id) ? overridesMap.get(o._id)! : o.amount
            })
            setTotalOutgoings(total)
        }
    }, [outgoings, monthlyOverrides])

    const income = budgetIncome?.amount || 0
    const surplus = income - totalOutgoings
    const isHealthy = surplus >= 0

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
                        <div className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Projected Liquidity</div>
                        <div className={`text-4xl font-bold flex items-center justify-center gap-2 ${isHealthy ? 'text-dark-blue' : 'text-custom-brown'}`}>
                            {isHealthy ? <TrendingUp className="w-8 h-8 text-green-500" /> : <TrendingDown className="w-8 h-8" />}
                            {formatCurrency(surplus)}
                        </div>
                        <div className="text-sm text-gray-500 mt-2 font-medium">
                            {isHealthy ? 'Surplus (Green)' : 'Deficit (Red)'}
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-100 my-2"></div>

                    <div className="grid grid-cols-2 gap-8 w-full">
                        <div>
                            <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Income</div>
                            <div className="text-xl font-bold text-dark-blue">{formatCurrency(income)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Outgoings</div>
                            <div className="text-xl font-bold text-dark-blue">{formatCurrency(totalOutgoings)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
