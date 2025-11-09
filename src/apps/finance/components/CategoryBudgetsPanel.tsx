import { useState } from 'react'
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useBudgetTracking } from '../hooks/useBudgetTracking'

interface Subscription {
  id: string
  name: string
  cost: number
  billingCycle: 'monthly' | 'yearly'
  nextBillingDate: string
  isActive: boolean
  classification: 'business' | 'private'
  category: 'ai' | 'software' | 'marketing' | 'productivity' | 'design' | 'communication' | 'development' | 'analytics' | 'security' | 'other'
  subcategory?: string
}

interface CategoryBudget {
  id: string
  classification: 'business' | 'private'
  category: 'ai' | 'software' | 'marketing' | 'productivity' | 'design' | 'communication' | 'development' | 'analytics' | 'security' | 'other'
  subcategory?: string
  monthlyBudgetLimit: number
  yearlyBudgetLimit: number
  alertThreshold: '50' | '75' | '90' | '100'
  isActive: boolean
}

interface CategoryBudgetsPanelProps {
  subscriptions: Subscription[]
  categoryBudgets: CategoryBudget[]
  onCreateBudget: (args: any) => Promise<any>
  onUpdateBudget: (args: any) => Promise<any>
  onDeleteBudget: (args: { id: string }) => Promise<any>
}

interface BudgetFormData {
  classification: 'business' | 'private'
  category: 'ai' | 'software' | 'marketing' | 'productivity' | 'design' | 'communication' | 'development' | 'analytics' | 'security' | 'other'
  subcategory?: string
  monthlyBudgetLimit: number
  yearlyBudgetLimit: number
  alertThreshold: '50' | '75' | '90' | '100'
}

export default function CategoryBudgetsPanel({
  subscriptions,
  categoryBudgets,
  onCreateBudget,
  onUpdateBudget,
  onDeleteBudget,
}: CategoryBudgetsPanelProps) {
  const { categorySpending, budgetAlerts, getBudgetColor, getBudgetBgColor } = useBudgetTracking(subscriptions, categoryBudgets)
  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState<CategoryBudget | null>(null)
  const [formData, setFormData] = useState<BudgetFormData>({
    classification: 'business',
    category: 'ai',
    subcategory: '',
    monthlyBudgetLimit: 100,
    yearlyBudgetLimit: 1200,
    alertThreshold: '75',
  })

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const handleSaveBudget = async () => {
    try {
      if (editingBudget) {
        await onUpdateBudget({
          id: editingBudget.id as any,
          monthlyBudgetLimit: formData.monthlyBudgetLimit,
          yearlyBudgetLimit: formData.yearlyBudgetLimit,
          alertThreshold: formData.alertThreshold,
        })
      } else {
        await onCreateBudget({
          classification: formData.classification,
          category: formData.category,
          subcategory: formData.subcategory || undefined,
          monthlyBudgetLimit: formData.monthlyBudgetLimit,
          yearlyBudgetLimit: formData.yearlyBudgetLimit,
          alertThreshold: formData.alertThreshold,
        })
      }
      setShowForm(false)
      setEditingBudget(null)
      resetForm()
    } catch (error) {
      console.error('Error saving budget:', error)
      alert('Failed to save budget. Please try again.')
    }
  }

  const handleDeleteBudget = async (budget: CategoryBudget) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      try {
        await onDeleteBudget({ id: budget.id as any })
      } catch (error) {
        console.error('Error deleting budget:', error)
        alert('Failed to delete budget. Please try again.')
      }
    }
  }

  const handleEditBudget = (budget: CategoryBudget) => {
    setEditingBudget(budget)
    setFormData({
      classification: budget.classification,
      category: budget.category,
      subcategory: budget.subcategory || '',
      monthlyBudgetLimit: budget.monthlyBudgetLimit,
      yearlyBudgetLimit: budget.yearlyBudgetLimit,
      alertThreshold: budget.alertThreshold,
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      classification: 'business',
      category: 'ai',
      subcategory: '',
      monthlyBudgetLimit: 100,
      yearlyBudgetLimit: 1200,
      alertThreshold: '75',
    })
  }

  const handleAddNew = () => {
    setEditingBudget(null)
    resetForm()
    setShowForm(true)
  }

  const categories = [
    'ai', 'software', 'marketing', 'productivity', 
    'design', 'communication', 'development', 'analytics', 'security', 'other'
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800">Category Budgets</h2>
          <p className="text-neutral-600 mt-1">
            Manage spending limits by category and classification
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add Budget
        </Button>
      </div>

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-800">Budget Alerts</h3>
          </div>
          <div className="space-y-2">
            {budgetAlerts.map((alert, index) => (
              <div key={index} className="text-sm text-yellow-700">
                {alert.classification} {alert.category} budget: {formatCurrency(alert.current)} spent 
                of {formatCurrency(alert.limit)} ({alert.usage.toFixed(1)}%)
                {alert.status === 'over' && <span className="font-semibold"> - OVER BUDGET</span>}
                {alert.status === 'warning' && <span className="font-semibold"> - Warning</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Budgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {categoryBudgets.map((budget) => {
          const spending = categorySpending.find(
            s => s.classification === budget.classification && 
                 s.category === budget.category &&
                 s.subcategory === budget.subcategory
          )
          const usage = spending?.budgetUsage || 0
          const status = spending?.budgetStatus || 'no-budget'
          
          return (
            <Card key={budget.id} className={getBudgetBgColor(status)}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-neutral-800 capitalize">
                        {budget.category}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded capitalize ${
                        budget.classification === 'business' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {budget.classification}
                      </span>
                    </div>
                    {budget.subcategory && (
                      <p className="text-sm text-neutral-600">{budget.subcategory}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditBudget(budget)}
                      className="p-1 hover:bg-neutral-100 rounded"
                    >
                      <Edit2 className="w-4 h-4 text-neutral-500" />
                    </button>
                    <button
                      onClick={() => handleDeleteBudget(budget)}
                      className="p-1 hover:bg-neutral-100 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Budget vs Spending */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-neutral-600">Monthly Budget</span>
                      <span className="font-medium">{formatCurrency(budget.monthlyBudgetLimit)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-neutral-600">Current Spending</span>
                      <span className={`font-medium ${getBudgetColor(status)}`}>
                        {formatCurrency(spending?.monthlyTotal || 0)}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          status === 'over' ? 'bg-red-500' :
                          status === 'warning' ? 'bg-yellow-500' :
                          status === 'under' ? 'bg-green-500' :
                          'bg-neutral-400'
                        }`}
                        style={{ width: `${Math.min(usage, 100)}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-neutral-500 mt-1">
                      <span>{usage.toFixed(1)}% used</span>
                      <span className={`capitalize ${getBudgetColor(status)}`}>
                        {status === 'no-budget' ? 'No limit set' : status}
                      </span>
                    </div>
                  </div>

                  {/* Subscription Count */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">
                      {spending?.subscriptions.length || 0} subscription{(spending?.subscriptions.length || 0) !== 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center gap-1">
                      {status === 'over' ? (
                        <TrendingUp className="w-4 h-4 text-red-500" />
                      ) : status === 'under' ? (
                        <TrendingDown className="w-4 h-4 text-green-500" />
                      ) : null}
                      <span className="text-neutral-600">
                        {formatCurrency(spending?.monthlyTotal || 0)}/month
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {categoryBudgets.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">No Category Budgets</h3>
            <p className="text-neutral-600 mb-4">
              Create your first budget to start tracking spending by category
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Create Budget
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Budget Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-neutral-800">
                {editingBudget ? 'Edit Budget' : 'Create Budget'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Classification</label>
                  <select
                    value={formData.classification}
                    onChange={(e) => setFormData({ ...formData, classification: e.target.value as 'business' | 'private' })}
                    className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="business">Business</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat} className="capitalize">{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Subcategory (Optional)</label>
                <input
                  type="text"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  placeholder="e.g., AI Tools, Design Software"
                  className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Monthly Budget (€)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.monthlyBudgetLimit}
                    onChange={(e) => setFormData({ ...formData, monthlyBudgetLimit: Number(e.target.value) })}
                    className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Yearly Budget (€)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.yearlyBudgetLimit}
                    onChange={(e) => setFormData({ ...formData, yearlyBudgetLimit: Number(e.target.value) })}
                    className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Alert Threshold</label>
                <select
                  value={formData.alertThreshold}
                  onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value as '50' | '75' | '90' | '100' })}
                  className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="50">50% (Very Cautious)</option>
                  <option value="75">75% (Moderate)</option>
                  <option value="90">90% (High Risk)</option>
                  <option value="100">100% (No Alert)</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingBudget(null)
                  resetForm()
                }}
                className="flex-1 h-10 px-4 rounded-md border border-neutral-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBudget}
                className="flex-1 h-10 px-4 rounded-md bg-neutral-900 text-white"
              >
                {editingBudget ? 'Update Budget' : 'Create Budget'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}