import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useWorkspace } from '@/lib/WorkspaceContext'

interface SimpleLiability {
  _id: string
  name: string
  type: string
  currentBalance: number
  originalAmount?: number
  interestRate?: number
  monthlyPayment?: number
  createdAt: number
  updatedAt: number
}

interface SimpleLiabilityFormProps {
  liability?: SimpleLiability
  onSubmit: () => void
  onCancel: () => void
}

const LIABILITY_TYPES = [
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'personal_loan', label: 'Personal Loan' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'other_debt', label: 'Other Debt' },
] as const

export function SimpleLiabilityForm({ liability, onSubmit, onCancel }: SimpleLiabilityFormProps) {
  const { workspaceId } = useWorkspace()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: liability?.name || '',
    type: liability?.type || '',
    currentBalance: liability?.currentBalance || 0,
    originalAmount: liability?.originalAmount || '',
    interestRate: liability?.interestRate || '',
    monthlyPayment: liability?.monthlyPayment || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createLiability = useMutation(api.simpleFinance.createSimpleLiability)
  const updateLiability = useMutation(api.simpleFinance.updateSimpleLiability)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspaceId) return

    // Basic validation
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Liability name is required'
    if (!formData.type) newErrors.type = 'Liability type is required'
    if (formData.currentBalance <= 0) newErrors.currentBalance = 'Current balance must be greater than 0'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    try {
      if (liability) {
        // Update existing liability
        await updateLiability({
          id: liability._id as any,
          name: formData.name.trim(),
          type: formData.type,
          currentBalance: formData.currentBalance,
          originalAmount: formData.originalAmount ? Number(formData.originalAmount) : undefined,
          interestRate: formData.interestRate ? Number(formData.interestRate) : undefined,
          monthlyPayment: formData.monthlyPayment ? Number(formData.monthlyPayment) : undefined,
        })
      } else {
        // Create new liability
        await createLiability({
          workspaceId: workspaceId as any,
          name: formData.name.trim(),
          type: formData.type,
          currentBalance: formData.currentBalance,
          originalAmount: formData.originalAmount ? Number(formData.originalAmount) : undefined,
          interestRate: formData.interestRate ? Number(formData.interestRate) : undefined,
          monthlyPayment: formData.monthlyPayment ? Number(formData.monthlyPayment) : undefined,
        })
      }
      onSubmit()
    } catch (error) {
      console.error('Error saving liability:', error)
      setErrors({ submit: 'Failed to save liability. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-dark-blue">
          {liability ? 'Edit Liability' : 'Add New Liability'}
        </h3>
        <p className="text-sm text-gray">
          Track your debts like mortgages, loans, and credit cards
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray mb-1">
            Liability Name *
          </label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., Home Mortgage, Car Loan, Credit Card..."
            className={errors.name ? 'border-red-500' : ''}
            disabled={isLoading}
          />
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray mb-1">
            Liability Type *
          </label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="flex h-10 w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm ring-offset-off-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
          >
            <option value="">Select liability type...</option>
            {LIABILITY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.type && <p className="text-sm text-red-600 mt-1">{errors.type}</p>}
        </div>

        <div>
          <label htmlFor="currentBalance" className="block text-sm font-medium text-gray mb-1">
            Current Balance *
          </label>
          <Input
            id="currentBalance"
            type="number"
            step="0.01"
            min="0"
            value={formData.currentBalance}
            onChange={(e) => handleChange('currentBalance', Number(e.target.value))}
            placeholder="0.00"
            className={errors.currentBalance ? 'border-red-500' : ''}
            disabled={isLoading}
          />
          {errors.currentBalance && <p className="text-sm text-red-600 mt-1">{errors.currentBalance}</p>}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="originalAmount" className="block text-sm font-medium text-gray mb-1">
              Original Amount
            </label>
            <Input
              id="originalAmount"
              type="number"
              step="0.01"
              min="0"
              value={formData.originalAmount}
              onChange={(e) => handleChange('originalAmount', e.target.value)}
              placeholder="0.00"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="interestRate" className="block text-sm font-medium text-gray mb-1">
              Interest Rate (%)
            </label>
            <Input
              id="interestRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.interestRate}
              onChange={(e) => handleChange('interestRate', e.target.value)}
              placeholder="0.00"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="monthlyPayment" className="block text-sm font-medium text-gray mb-1">
              Monthly Payment
            </label>
            <Input
              id="monthlyPayment"
              type="number"
              step="0.01"
              min="0"
              value={formData.monthlyPayment}
              onChange={(e) => handleChange('monthlyPayment', e.target.value)}
              placeholder="0.00"
              disabled={isLoading}
            />
          </div>
        </div>

        {errors.submit && (
          <div className="p-3 bg-off-white border border-light-gray rounded-md">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Saving...' : (liability ? 'Update Liability' : 'Add Liability')}
          </Button>
        </div>
      </form>
    </div>
  )
}
