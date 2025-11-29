import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { formatCurrency } from '@/lib/utils'
import { X } from 'lucide-react'
import type { Id } from '../../../../convex/_generated/dataModel'
import { Button } from '@/components/ui/Button'

interface AssetValuationModalProps {
    isOpen: boolean
    onClose: () => void
    workspaceId: Id<"workspaces">
    year: number
    month: number
}

export default function AssetValuationModal({ isOpen, onClose, workspaceId, year, month }: AssetValuationModalProps) {
    const allAssets = useQuery(api.simpleFinance.listSimpleAssets, workspaceId ? { workspaceId } : 'skip')
    const liabilities = useQuery(api.simpleFinance.listSimpleLiabilities, workspaceId ? { workspaceId } : 'skip')
    const monthlyValuations = useQuery(
        api.simpleFinance.listMonthlyValuations,
        workspaceId ? { workspaceId, year, month } : 'skip'
    )
    const createValuation = useMutation(api.simpleFinance.createMonthlyValuation)

    const [assetValues, setAssetValues] = useState<Record<string, number>>({})
    const [liabilityValues, setLiabilityValues] = useState<Record<string, number>>({})
    const [assetNotes, setAssetNotes] = useState<Record<string, string>>({})
    const [liabilityNotes, setLiabilityNotes] = useState<Record<string, string>>({})
    const [hasChanges, setHasChanges] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Filter out bank accounts (they belong to Liquidity)
    const assets = allAssets?.filter((a: any) => a.type !== 'bank_account') || []

    useEffect(() => {
        if (monthlyValuations && assets && liabilities) {
            const newAssetValues: Record<string, number> = {}
            const newLiabilityValues: Record<string, number> = {}
            const newAssetNotes: Record<string, string> = {}
            const newLiabilityNotes: Record<string, string> = {}

            monthlyValuations.forEach((val: any) => {
                if (val.itemType === 'asset') {
                    newAssetValues[val.itemId] = val.value
                    newAssetNotes[val.itemId] = val.notes || ''
                } else if (val.itemType === 'liability') {
                    newLiabilityValues[val.itemId] = val.value
                    newLiabilityNotes[val.itemId] = val.notes || ''
                }
            })

            setAssetValues(newAssetValues)
            setLiabilityValues(newLiabilityValues)
            setAssetNotes(newAssetNotes)
            setLiabilityNotes(newLiabilityNotes)
            setHasChanges(false)
        }
    }, [monthlyValuations, assets, liabilities])

    const handleSave = async () => {
        if (!workspaceId) return
        setIsSaving(true)
        try {
            // Save asset valuations
            for (const asset of assets) {
                if (assetValues[asset._id] !== undefined) {
                    await createValuation({
                        workspaceId,
                        itemType: 'asset' as const,
                        itemId: asset._id as any,
                        year,
                        month,
                        value: assetValues[asset._id],
                        notes: assetNotes[asset._id],
                    })
                }
            }

            // Save liability valuations
            if (liabilities) {
                for (const liability of liabilities) {
                    if (liabilityValues[liability._id] !== undefined) {
                        await createValuation({
                            workspaceId,
                            itemType: 'liability' as const,
                            itemId: liability._id as any,
                            year,
                            month,
                            value: liabilityValues[liability._id],
                            notes: liabilityNotes[liability._id],
                        })
                    }
                }
            }

            setHasChanges(false)
            onClose()
        } catch (error) {
            console.error("Failed to save valuations", error)
        } finally {
            setIsSaving(false)
        }
    }

    if (!isOpen) return null

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-2xl sticky top-0 z-10">
                    <div>
                        <h3 className="text-xl font-bold text-dark-blue">Monthly Valuations</h3>
                        <p className="text-sm text-gray-500">{monthNames[month - 1]} {year}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Assets Section */}
                    {assets.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 sticky top-0 bg-white py-2">Assets</h4>
                            <div className="space-y-4">
                                {assets.map((asset: any) => (
                                    <div key={asset._id} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="font-medium text-dark-blue">{asset.name}</label>
                                            <span className="text-xs text-gray-400">
                                                Current: {formatCurrency(assetValues[asset._id] || asset.currentValue || 0)}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                                                <input
                                                    type="number"
                                                    value={assetValues[asset._id] !== undefined ? assetValues[asset._id] : ''}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value)
                                                        setAssetValues(prev => ({ ...prev, [asset._id]: isNaN(val) ? 0 : val }))
                                                        setHasChanges(true)
                                                    }}
                                                    className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                                                    placeholder={asset.currentValue?.toString() || "0.00"}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Liabilities Section */}
                    {liabilities && liabilities.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 sticky top-0 bg-white py-2">Liabilities</h4>
                            <div className="space-y-4">
                                {liabilities.map((liability: any) => (
                                    <div key={liability._id} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="font-medium text-dark-blue">{liability.name}</label>
                                            <span className="text-xs text-gray-400">
                                                Current: {formatCurrency(liabilityValues[liability._id] || liability.currentBalance || 0)}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                                                <input
                                                    type="number"
                                                    value={liabilityValues[liability._id] !== undefined ? liabilityValues[liability._id] : ''}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value)
                                                        setLiabilityValues(prev => ({ ...prev, [liability._id]: isNaN(val) ? 0 : val }))
                                                        setHasChanges(true)
                                                    }}
                                                    className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                                                    placeholder={liability.currentBalance?.toString() || "0.00"}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {(!assets || assets.length === 0) && (!liabilities || liabilities.length === 0) && (
                        <div className="text-center py-8 text-gray-400">
                            <p>No assets or liabilities found.</p>
                            <p className="text-xs mt-1">Add items first to track monthly valuations.</p>
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
                            {isSaving ? 'Saving...' : 'Save Valuations'}
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
