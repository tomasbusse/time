import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { formatCurrency } from '@/lib/utils'
import { X, Check, AlertCircle } from 'lucide-react'
import type { Id } from '../../../convex/_generated/dataModel'
import { Button } from '@/components/ui/Button'
import { useWorkspace } from '@/lib/WorkspaceContext'

interface LiquidityEntryModalProps {
    isOpen: boolean
    onClose: () => void
    workspaceId: Id<"workspaces">
    year: number
    month: number
}

export default function LiquidityEntryModal({ isOpen, onClose, workspaceId, year, month }: LiquidityEntryModalProps) {
    const { userId } = useWorkspace()

    // Format month as YYYY-MM
    const monthStr = `${year}-${month.toString().padStart(2, '0')}`

    const assets = useQuery(api.simpleFinance.listSimpleAssets, workspaceId ? { workspaceId } : 'skip')
    const monthlyBalances = useQuery(
        api.simpleFinance.getMonthlyBalances,
        workspaceId ? { workspaceId, month: monthStr } : 'skip'
    )
    const recordMonthlyBalance = useMutation(api.simpleFinance.recordMonthlyBalance)

    const [balances, setBalances] = useState<Record<string, number>>({})
    const [notes, setNotes] = useState<Record<string, string>>({})
    const [hasChanges, setHasChanges] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Filter for only bank accounts (assets)
    const bankAccounts = assets?.filter((a: any) => a.type === 'bank_account') || []

    useEffect(() => {
        if (monthlyBalances) {
            const newBalances: Record<string, number> = {}
            const newNotes: Record<string, string> = {}

            monthlyBalances.forEach((mb: any) => {
                newBalances[mb.assetId] = mb.balance
                newNotes[mb.assetId] = mb.notes || ''
            })

            setBalances(newBalances)
            setNotes(newNotes)
            setHasChanges(false)
        }
    }, [monthlyBalances])

    const handleSave = async () => {
        if (!workspaceId || !bankAccounts || !userId) return
        setIsSaving(true)
        try {
            for (const account of bankAccounts) {
                // Only save if we have a value (even 0)
                if (balances[account._id] !== undefined) {
                    await recordMonthlyBalance({
                        workspaceId,
                        userId,
                        assetId: account._id as any,
                        month: monthStr,
                        balance: balances[account._id],
                        notes: notes[account._id],
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
                    {bankAccounts.length > 0 ? (
                        <div className="space-y-4">
                            {bankAccounts.map((account: any) => (
                                <div key={account._id} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="font-medium text-dark-blue">{account.name}</label>
                                        <span className="text-xs text-gray-400">Current: {formatCurrency(balances[account._id] || 0)}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                                            <input
                                                type="number"
                                                value={balances[account._id] !== undefined ? balances[account._id] : ''}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value)
                                                    setBalances(prev => ({ ...prev, [account._id]: isNaN(val) ? 0 : val }))
                                                    setHasChanges(true)
                                                }}
                                                className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={notes[account._id] || ''}
                                            onChange={(e) => {
                                                setNotes(prev => ({ ...prev, [account._id]: e.target.value }))
                                                setHasChanges(true)
                                            }}
                                            className="w-1/3 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue text-sm"
                                            placeholder="Notes"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            <p>No bank accounts found.</p>
                            <p className="text-xs mt-1">Add accounts in the Finance section first.</p>
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
