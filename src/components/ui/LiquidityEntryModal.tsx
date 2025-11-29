import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { formatCurrency } from '@/lib/utils'
import { X, Check, AlertCircle } from 'lucide-react'
import type { Id } from '../../../convex/_generated/dataModel'
import { Button } from '@/components/ui/Button'

interface LiquidityEntryModalProps {
    isOpen: boolean
    onClose: () => void
    workspaceId: Id<"workspaces">
    year: number
    month: number
}

export default function LiquidityEntryModal({ isOpen, onClose, workspaceId, year, month }: LiquidityEntryModalProps) {
    const outgoings = useQuery(api.budget.listBudgetOutgoings, workspaceId ? { workspaceId } : 'skip')
    const monthlyOverrides = useQuery(
        (api as any).budget.getMonthlyOverrides,
        workspaceId ? { workspaceId, year, month } : 'skip'
    )
    const setMonthlyOverride = useMutation((api as any).budget.setBudgetMonthlyOutgoing)

    const [monthlyAmounts, setMonthlyAmounts] = useState<Record<string, number>>({})
    const [hasChanges, setHasChanges] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (outgoings) {
            const amounts: Record<string, number> = {}
            const overridesMap = new Map(monthlyOverrides?.map((m: any) => [m.outgoingId, m.amount]) || [])

            outgoings.forEach((o: any) => {
                amounts[o._id] = overridesMap.has(o._id) ? overridesMap.get(o._id)! : o.amount
            })
            setMonthlyAmounts(amounts)
            setHasChanges(false)
        }
    }, [outgoings, monthlyOverrides])

    const handleSave = async () => {
        if (!workspaceId || !outgoings) return
        setIsSaving(true)
        try {
            for (const outgoing of outgoings) {
                const currentAmount = monthlyAmounts[outgoing._id]
                // Only save if different from default or if it was already an override
                // We save even if it matches default if it was previously overridden to "reset" it effectively, 
                // or we can just set the override. The backend handles logic usually.
                // Here we just set the override for this specific month.
                if (currentAmount !== undefined) {
                    await setMonthlyOverride({
                        workspaceId,
                        outgoingId: outgoing._id as any,
                        year,
                        month,
                        amount: currentAmount,
                    })
                }
            }
            setHasChanges(false)
            onClose()
        } catch (error) {
            console.error("Failed to save liquidity entries", error)
        } finally {
            setIsSaving(false)
        }
    }

    if (!isOpen) return null

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-xl">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-2xl sticky top-0 z-10">
                    <div>
                        <h3 className="text-xl font-bold text-dark-blue">Monthly Balance</h3>
                        <p className="text-sm text-gray-500">{monthNames[month - 1]} {year}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Fixed Costs */}
                    {outgoings && outgoings.filter((o: any) => o.isFixed).length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 sticky top-0 bg-white py-2">Fixed Costs</h4>
                            <div className="space-y-3">
                                {outgoings.filter((o: any) => o.isFixed).map((outgoing: any) => (
                                    <EntryRow
                                        key={outgoing._id}
                                        outgoing={outgoing}
                                        amount={monthlyAmounts[outgoing._id]}
                                        onAmountChange={(val) => {
                                            setMonthlyAmounts(prev => ({ ...prev, [outgoing._id]: val }))
                                            setHasChanges(true)
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Variable Costs */}
                    {outgoings && outgoings.filter((o: any) => !o.isFixed).length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 sticky top-0 bg-white py-2">Variable Costs</h4>
                            <div className="space-y-3">
                                {outgoings.filter((o: any) => !o.isFixed).map((outgoing: any) => (
                                    <EntryRow
                                        key={outgoing._id}
                                        outgoing={outgoing}
                                        amount={monthlyAmounts[outgoing._id]}
                                        onAmountChange={(val) => {
                                            setMonthlyAmounts(prev => ({ ...prev, [outgoing._id]: val }))
                                            setHasChanges(true)
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {(!outgoings || outgoings.length === 0) && (
                        <div className="text-center py-8 text-gray-400">
                            <p>No budget items found.</p>
                            <p className="text-xs mt-1">Add items in the Finance section first.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <div className="flex gap-3">
                        <Button
                            onClick={handleSave}
                            disabled={!hasChanges || isSaving}
                            className="flex-1 bg-dark-blue hover:bg-blue-900 text-white"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function EntryRow({ outgoing, amount, onAmountChange }: { outgoing: any, amount: number, onAmountChange: (val: number) => void }) {
    const isChanged = amount !== outgoing.amount

    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex-1 min-w-0 mr-4">
                <div className="font-medium text-dark-blue truncate">{outgoing.name}</div>
                <div className="text-xs text-gray-500 truncate">{outgoing.category}</div>
            </div>
            <div className="flex flex-col items-end">
                <input
                    type="number"
                    value={amount || 0}
                    onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
                    className={`w-24 px-2 py-1 text-right font-bold text-dark-blue border rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-brown ${isChanged ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white'
                        }`}
                />
                {isChanged && (
                    <div className="text-[10px] text-orange-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Default: {formatCurrency(outgoing.amount)}
                    </div>
                )}
            </div>
        </div>
    )
}
