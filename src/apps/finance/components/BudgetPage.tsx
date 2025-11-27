import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Plus, Trash2, Edit2, Check, X, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react'

export default function BudgetPage() {
    const { workspaceId, userId } = useWorkspace()

    // Get current month/year
    const now = new Date()
    const [selectedYear, setSelectedYear] = useState(now.getFullYear())
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)

    // Get budget data
    const budgetIncome = useQuery(
        api.budget.getBudgetIncome,
        workspaceId ? { workspaceId, year: selectedYear, month: selectedMonth } : 'skip'
    )
    const outgoings = useQuery(api.budget.listBudgetOutgoings, workspaceId ? { workspaceId } : 'skip')

    const monthlyOverrides = useQuery(
        (api as any).budget.getMonthlyOverrides,
        workspaceId ? { workspaceId, year: selectedYear, month: selectedMonth } : 'skip'
    )

    // Yearly Budget Data
    const yearlyBudget = useQuery(
        (api as any).budget.getYearlyBudget,
        workspaceId ? { workspaceId, year: selectedYear } : 'skip'
    )

    // Mutations
    const setBudgetIncome = useMutation(api.budget.setBudgetIncome)
    const createOutgoing = useMutation(api.budget.createBudgetOutgoing)
    const updateOutgoing = useMutation(api.budget.updateBudgetOutgoing)
    const deleteOutgoing = useMutation(api.budget.deleteBudgetOutgoing)
    const setMonthlyOverride = useMutation((api as any).budget.setBudgetMonthlyOutgoing)

    // Income editing
    const [isEditingIncome, setIsEditingIncome] = useState(false)
    const [incomeAmount, setIncomeAmount] = useState(0)
    const [incomeNotes, setIncomeNotes] = useState('')

    // Outgoing editing/creating
    const [showOutgoingModal, setShowOutgoingModal] = useState(false)
    const [editingOutgoing, setEditingOutgoing] = useState<any>(null)
    const [outgoingForm, setOutgoingForm] = useState({
        name: '',
        category: 'Other',
        amount: 0,
        isFixed: true,
        notes: '',
    })

    // Monthly outgoing overrides
    const [monthlyAmounts, setMonthlyAmounts] = useState<Record<string, number>>({})
    const [hasChanges, setHasChanges] = useState(false)

    useEffect(() => {
        if (budgetIncome) {
            setIncomeAmount(budgetIncome.amount)
            setIncomeNotes(budgetIncome.notes || '')
        } else {
            setIncomeAmount(0)
            setIncomeNotes('')
        }
    }, [budgetIncome])

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

    const handleSaveIncome = async () => {
        if (!workspaceId || !userId) return
        await setBudgetIncome({
            workspaceId: workspaceId as any,
            userId: userId as any,
            year: selectedYear,
            month: selectedMonth,
            amount: incomeAmount,
            notes: incomeNotes,
        })
        setIsEditingIncome(false)
    }

    const handleSaveMonthlyOutgoings = async () => {
        if (!workspaceId || !outgoings) return

        for (const outgoing of outgoings) {
            const currentAmount = monthlyAmounts[outgoing._id]
            // Only save if different from default or if it was already an override
            if (currentAmount !== undefined && currentAmount !== outgoing.amount) {
                await setMonthlyOverride({
                    workspaceId: workspaceId as any,
                    outgoingId: outgoing._id as any,
                    year: selectedYear,
                    month: selectedMonth,
                    amount: currentAmount,
                })
            }
        }
        setHasChanges(false)
    }

    const handleCreateOutgoing = async () => {
        if (!workspaceId || !userId) return
        if (editingOutgoing) {
            await updateOutgoing({
                id: editingOutgoing._id as any,
                ...outgoingForm,
            })
        } else {
            await createOutgoing({
                workspaceId: workspaceId as any,
                userId: userId as any,
                ...outgoingForm,
            })
        }
        setShowOutgoingModal(false)
        setEditingOutgoing(null)
        setOutgoingForm({ name: '', category: 'Other', amount: 0, isFixed: true, notes: '' })
    }

    const handleEditOutgoing = (outgoing: any) => {
        setEditingOutgoing(outgoing)
        setOutgoingForm({
            name: outgoing.name,
            category: outgoing.category,
            amount: outgoing.amount,
            isFixed: outgoing.isFixed,
            notes: outgoing.notes || '',
        })
        setShowOutgoingModal(true)
    }

    const handleDeleteOutgoing = async (id: string) => {
        if (confirm('Are you sure you want to delete this outgoing?')) {
            await deleteOutgoing({ id: id as any })
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(amount)
    }

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

    const categories = [
        'Housing', 'Food', 'Transport', 'Utilities', 'Insurance',
        'Healthcare', 'Entertainment', 'Subscriptions', 'Savings', 'Other'
    ]

    const handlePrevMonth = () => {
        if (selectedMonth === 1) {
            setSelectedMonth(12)
            setSelectedYear(selectedYear - 1)
        } else {
            setSelectedMonth(selectedMonth - 1)
        }
    }

    const handleNextMonth = () => {
        if (selectedMonth === 12) {
            setSelectedMonth(1)
            setSelectedYear(selectedYear + 1)
        } else {
            setSelectedMonth(selectedMonth + 1)
        }
    }

    return (
        <div className="space-y-8">
            {/* Header & Year Selector */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-dark-blue">Budget Tracker</h2>
                    <p className="text-gray-500 mt-1">Manage your monthly budget and track yearly progress.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium">Year:</span>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="px-4 py-2 border border-light-gray rounded-lg bg-white font-medium text-dark-blue"
                    >
                        {[2024, 2025, 2026].map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Yearly Overview Card */}
            <Card className="p-6 bg-gradient-to-br from-white to-gray-50 border-l-4 border-l-custom-brown">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <div className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Yearly Income</div>
                        <div className="text-3xl font-bold text-dark-blue mt-1">
                            {formatCurrency(yearlyBudget?.yearlyTotal.income || 0)}
                        </div>
                    </div>
                    <div className="text-center md:text-left">
                        <div className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Yearly Outgoings</div>
                        <div className="text-3xl font-bold text-dark-blue mt-1">
                            {formatCurrency(yearlyBudget?.yearlyTotal.outgoings || 0)}
                        </div>
                    </div>
                    <div className="text-center md:text-right">
                        <div className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Projected Yearly Balance</div>
                        <div className={`text-4xl font-bold mt-1 flex items-center gap-2 ${yearlyBudget?.yearlyTotal.isHealthy ? 'text-off-white0' : 'text-custom-brown'}`}>
                            {yearlyBudget?.yearlyTotal.isHealthy ? <TrendingUp className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
                            {formatCurrency(yearlyBudget?.yearlyTotal.surplus || 0)}
                        </div>
                        <div className="text-sm text-gray-500 mt-1 font-medium">
                            {yearlyBudget?.yearlyTotal.isHealthy ? 'You are in the Green (Surplus)' : 'You are in the Red (Deficit)'}
                        </div>
                    </div>
                </div>

                {/* Yearly Progress Bar */}
                <div className="mt-6">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>0%</span>
                        <span>Break Even</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                            className={`h-full rounded-full ${yearlyBudget?.yearlyTotal.isHealthy ? 'bg-off-white0' : 'bg-custom-brown'}`}
                            style={{
                                width: `${Math.min((yearlyBudget?.yearlyTotal.income / (yearlyBudget?.yearlyTotal.outgoings || 1)) * 100, 100)}%`
                            }}
                        ></div>
                    </div>
                </div>
            </Card>

            {/* Month Navigation */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-light-gray">
                <Button variant="ghost" onClick={handlePrevMonth} className="text-gray-600 hover:text-dark-blue">
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Previous
                </Button>
                <h3 className="text-xl font-bold text-dark-blue w-48 text-center">
                    {monthNames[selectedMonth - 1]} {selectedYear}
                </h3>
                <Button variant="ghost" onClick={handleNextMonth} className="text-gray-600 hover:text-dark-blue">
                    Next
                    <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Income & Summary */}
                <div className="space-y-6">
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-dark-blue">Monthly Income</h3>
                            {!isEditingIncome && (
                                <Button variant="outline" size="sm" onClick={() => setIsEditingIncome(true)}>
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                            )}
                        </div>

                        {isEditingIncome ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount (EUR)</label>
                                    <input
                                        type="number"
                                        value={incomeAmount}
                                        onChange={(e) => setIncomeAmount(parseFloat(e.target.value) || 0)}
                                        className="w-full px-4 py-2 border border-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-brown"
                                        placeholder="Enter monthly income"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                    <textarea
                                        value={incomeNotes}
                                        onChange={(e) => setIncomeNotes(e.target.value)}
                                        className="w-full px-4 py-2 border border-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-brown"
                                        rows={2}
                                        placeholder="Optional notes"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleSaveIncome}>
                                        <Check className="w-4 h-4 mr-2" />
                                        Save
                                    </Button>
                                    <Button variant="outline" onClick={() => setIsEditingIncome(false)}>
                                        <X className="w-4 h-4 mr-2" />
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="text-3xl font-bold text-dark-blue mb-2">{formatCurrency(budgetIncome?.amount || 0)}</div>
                                {budgetIncome?.notes && <p className="text-sm text-gray-600">{budgetIncome.notes}</p>}
                            </div>
                        )}
                    </Card>

                    <Card className="p-6 bg-gray-50">
                        <h3 className="text-lg font-semibold text-dark-blue mb-4">Monthly Summary</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Income</span>
                                <span className="font-medium">{formatCurrency(budgetIncome?.amount || 0)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Outgoings</span>
                                <span className="font-medium">{formatCurrency(Object.values(monthlyAmounts).reduce((a, b) => a + b, 0))}</span>
                            </div>
                            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-lg">
                                <span>Net</span>
                                <span className={(budgetIncome?.amount || 0) - Object.values(monthlyAmounts).reduce((a, b) => a + b, 0) >= 0 ? 'text-off-white0' : 'text-custom-brown'}>
                                    {formatCurrency((budgetIncome?.amount || 0) - Object.values(monthlyAmounts).reduce((a, b) => a + b, 0))}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Outgoings List */}
                <div className="lg:col-span-2">
                    {/* Outgoings Section */}
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-dark-blue">Monthly Outgoings</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Adjust amounts for <span className="font-medium text-dark-blue">{monthNames[selectedMonth - 1]}</span>.
                                        Changes here do not affect other months.
                                    </p>
                                </div>
                                {hasChanges && (
                                    <Button size="sm" onClick={handleSaveMonthlyOutgoings} className="bg-off-white0 hover:bg-green-700 text-white animate-pulse">
                                        <Check className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </Button>
                                )}
                            </div>
                            <Button
                                onClick={() => {
                                    setEditingOutgoing(null)
                                    setOutgoingForm({ name: '', category: 'Other', amount: 0, isFixed: true, notes: '' })
                                    setShowOutgoingModal(true)
                                }}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Item
                            </Button>
                        </div>

                        <div className="space-y-6">
                            {/* Fixed Costs Group */}
                            {outgoings && outgoings.filter((o: any) => o.isFixed).length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Fixed Costs</h4>
                                    <div className="space-y-2">
                                        {outgoings.filter((o: any) => o.isFixed).map((outgoing: any) => (
                                            <OutgoingRow
                                                key={outgoing._id}
                                                outgoing={outgoing}
                                                monthlyAmount={monthlyAmounts[outgoing._id]}
                                                onAmountChange={(val) => {
                                                    setMonthlyAmounts(prev => ({ ...prev, [outgoing._id]: val }))
                                                    setHasChanges(true)
                                                }}
                                                onEdit={() => handleEditOutgoing(outgoing)}
                                                onDelete={() => handleDeleteOutgoing(outgoing._id)}
                                                formatCurrency={formatCurrency}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Variable Costs Group */}
                            {outgoings && outgoings.filter((o: any) => !o.isFixed).length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Variable Costs</h4>
                                    <div className="space-y-2">
                                        {outgoings.filter((o: any) => !o.isFixed).map((outgoing: any) => (
                                            <OutgoingRow
                                                key={outgoing._id}
                                                outgoing={outgoing}
                                                monthlyAmount={monthlyAmounts[outgoing._id]}
                                                onAmountChange={(val) => {
                                                    setMonthlyAmounts(prev => ({ ...prev, [outgoing._id]: val }))
                                                    setHasChanges(true)
                                                }}
                                                onEdit={() => handleEditOutgoing(outgoing)}
                                                onDelete={() => handleDeleteOutgoing(outgoing._id)}
                                                formatCurrency={formatCurrency}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {outgoings && outgoings.length === 0 && (
                                <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    <p>No budget items added yet.</p>
                                    <p className="text-sm mt-1">Add your fixed and variable expenses to start tracking.</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Budget History (Yearly Breakdown) */}
                    {yearlyBudget && yearlyBudget.months.length > 0 && (
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-dark-blue mb-4">Yearly Breakdown ({selectedYear})</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-light-gray/30">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Month</th>
                                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Income</th>
                                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Outgoings</th>
                                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Surplus/Deficit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {yearlyBudget.months.map((entry: any) => (
                                            <tr key={`${entry.year}-${entry.month}`} className={`border-t border-light-gray ${entry.month === selectedMonth ? 'bg-blue-50' : ''}`}>
                                                <td className="px-4 py-3 text-sm text-dark-blue font-medium">
                                                    {monthNames[entry.month - 1]}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-dark-blue">{formatCurrency(entry.income)}</td>
                                                <td className="px-4 py-3 text-sm text-right text-dark-blue">{formatCurrency(entry.outgoings)}</td>
                                                <td className={`px-4 py-3 text-sm text-right font-bold ${entry.surplus >= 0 ? 'text-off-white0' : 'text-custom-brown'}`}>
                                                    {formatCurrency(entry.surplus)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}

                    {/* Outgoing Modal */}
                    {showOutgoingModal && (
                        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                            <Card className="w-full max-w-md p-6">
                                <h3 className="text-lg font-semibold text-dark-blue mb-4">
                                    {editingOutgoing ? 'Edit Item Settings' : 'Add New Item'}
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                        <input
                                            type="text"
                                            value={outgoingForm.name}
                                            onChange={(e) => setOutgoingForm({ ...outgoingForm, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-brown"
                                            placeholder="e.g., Rent, Groceries"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                        <select
                                            value={outgoingForm.category}
                                            onChange={(e) => setOutgoingForm({ ...outgoingForm, category: e.target.value })}
                                            className="w-full px-4 py-2 border border-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-brown"
                                        >
                                            {categories.map((cat) => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {outgoingForm.isFixed ? 'Default Cost (EUR)' : 'Target Budget (EUR)'}
                                        </label>
                                        <input
                                            type="number"
                                            value={outgoingForm.amount}
                                            onChange={(e) => setOutgoingForm({ ...outgoingForm, amount: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 border border-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-brown"
                                            placeholder="0.00"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            {outgoingForm.isFixed
                                                ? 'This amount will be used every month unless overridden.'
                                                : 'This is your baseline budget. You can adjust the actual spend each month.'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                                        <input
                                            type="checkbox"
                                            id="isFixed"
                                            checked={outgoingForm.isFixed}
                                            onChange={(e) => setOutgoingForm({ ...outgoingForm, isFixed: e.target.checked })}
                                            className="w-4 h-4 text-custom-brown focus:ring-custom-brown"
                                        />
                                        <div>
                                            <label htmlFor="isFixed" className="text-sm font-medium text-dark-blue block">
                                                Fixed Cost
                                            </label>
                                            <p className="text-xs text-gray-500">
                                                Uncheck for variable expenses (e.g., Food, Entertainment)
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                                        <textarea
                                            value={outgoingForm.notes}
                                            onChange={(e) => setOutgoingForm({ ...outgoingForm, notes: e.target.value })}
                                            className="w-full px-4 py-2 border border-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-brown"
                                            rows={2}
                                            placeholder="Additional details"
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                        <Button onClick={handleCreateOutgoing} className="flex-1">
                                            {editingOutgoing ? 'Save Settings' : 'Add Item'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setShowOutgoingModal(false)
                                                setEditingOutgoing(null)
                                            }}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function OutgoingRow({ outgoing, monthlyAmount, onAmountChange, onEdit, onDelete, formatCurrency }: any) {
    const isOverridden = monthlyAmount !== undefined && monthlyAmount !== outgoing.amount

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-white border border-light-gray rounded-lg hover:shadow-sm transition-shadow group">
            <div className="flex-1 mb-2 sm:mb-0 w-full">
                <div className="flex items-center gap-2">
                    <div className="font-bold text-dark-blue">{outgoing.name}</div>
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">{outgoing.category}</span>
                </div>
                {outgoing.notes && <div className="text-xs text-gray-400 mt-1">{outgoing.notes}</div>}
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 hidden sm:inline">Amount:</span>
                        <input
                            type="number"
                            value={monthlyAmount || 0}
                            onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
                            className={`w-28 px-2 py-1 text-right font-bold text-dark-blue border rounded focus:outline-none focus:ring-2 focus:ring-custom-brown ${isOverridden ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                                }`}
                        />
                    </div>
                    {isOverridden && (
                        <div className="text-xs text-orange-600 mt-1">
                            {outgoing.isFixed ? 'Default' : 'Target'}: {formatCurrency(outgoing.amount)}
                        </div>
                    )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={onEdit}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-dark-blue"
                        title="Configure Item Settings"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 hover:bg-red-50 rounded-full transition-colors text-gray-400 hover:text-red-600"
                        title="Delete Item"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
