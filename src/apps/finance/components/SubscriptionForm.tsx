import React, { useState } from 'react'

interface SubscriptionFormData {
  name: string
  cost: number
  yearlyAmount?: number
  billingCycle: 'monthly' | 'yearly'
  nextBillingDate: string
  isActive: boolean
  isNecessary: boolean
  classification: 'business' | 'private'
  type: 'subscription' | 'bill' | 'rent' | 'insurance' | 'loan' | 'other'
  category: 'ai' | 'software' | 'marketing' | 'productivity' | 'design' | 'communication' | 'development' | 'analytics' | 'security' | 'other'
  subcategory?: string
}

interface SubscriptionFormProps {
  initialData?: Partial<SubscriptionFormData> & { id?: string }
  onSubmit: (data: SubscriptionFormData & { id?: string }) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function SubscriptionForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}: SubscriptionFormProps) {
  const [formData, setFormData] = useState<SubscriptionFormData>({
    name: initialData?.name || '',
    cost: initialData?.cost || 0,
    yearlyAmount: initialData?.yearlyAmount,
    billingCycle: initialData?.billingCycle || 'monthly',
    nextBillingDate: initialData?.nextBillingDate || '',
    isActive: initialData?.isActive ?? true,
    isNecessary: initialData?.isNecessary ?? true,
    classification: initialData?.classification || 'private',
    type: initialData?.type || 'subscription',
    category: initialData?.category || 'other',
    subcategory: initialData?.subcategory,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    if (formData.cost <= 0) {
      newErrors.cost = 'Cost must be greater than 0'
    }
    if (!formData.nextBillingDate) {
      newErrors.nextBillingDate = 'Next billing date is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Error submitting subscription form:', error)
    }
  }

  const handleChange = (field: keyof SubscriptionFormData, value: string | number | boolean | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold text-dark-blue">
          {initialData?.id ? 'Edit Outgoing' : 'Add Regular Outgoing'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray mb-2">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`flex h-10 w-full rounded-md border ${errors.name ? 'border-red-300' : 'border-light-gray'
              } bg-white px-3 py-2 text-sm`}
            placeholder="e.g., Netflix, Rent, Electricity"
          />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray mb-2">
              {formData.billingCycle === 'monthly' ? 'Monthly Cost (€)' : 'Yearly Cost (€)'}
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={formData.cost}
              onChange={(e) => handleChange('cost', Number(e.target.value))}
              className={`flex h-10 w-full rounded-md border ${errors.cost ? 'border-red-300' : 'border-light-gray'
                } bg-white px-3 py-2 text-sm`}
            />
            {errors.cost && <p className="text-xs text-red-600 mt-1">{errors.cost}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray mb-2">Yearly Amount (€) <span className="text-xs text-gray">(Optional)</span></label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={formData.yearlyAmount || ''}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : undefined
                setFormData(prev => ({ ...prev, yearlyAmount: value }))
              }}
              placeholder="Leave empty to auto-calc"
              className="flex h-10 w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray mb-2">Billing Cycle</label>
          <select
            value={formData.billingCycle}
            onChange={(e) => handleChange('billingCycle', e.target.value as 'monthly' | 'yearly')}
            className="flex h-10 w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm"
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isNecessary}
              onChange={(e) => handleChange('isNecessary', e.target.checked)}
              className="w-4 h-4 text-green-600 rounded border-light-gray focus:ring-green-500"
            />
            <span className="text-sm text-gray">Necessary</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="w-4 h-4 text-custom-brown rounded border-light-gray focus:ring-custom-brown"
            />
            <span className="text-sm text-gray">Active</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value as any)}
              className="flex h-10 w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm"
            >
              <option value="subscription">Subscription</option>
              <option value="bill">Bill</option>
              <option value="rent">Rent</option>
              <option value="insurance">Insurance</option>
              <option value="loan">Loan</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray mb-2">Classification</label>
            <select
              value={formData.classification}
              onChange={(e) => handleChange('classification', e.target.value as 'business' | 'private')}
              className="flex h-10 w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm"
            >
              <option value="business">Business</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray mb-2">Category</label>
          <select
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value as any)}
            className="flex h-10 w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm"
          >
            <option value="ai">AI</option>
            <option value="software">Software Tools</option>
            <option value="marketing">Marketing</option>
            <option value="productivity">Productivity</option>
            <option value="design">Design</option>
            <option value="communication">Communication</option>
            <option value="development">Development</option>
            <option value="analytics">Analytics</option>
            <option value="security">Security</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray mb-2">Subcategory (Optional)</label>
          <input
            type="text"
            value={formData.subcategory || ''}
            onChange={(e) => {
              const value = e.target.value || undefined
              setFormData(prev => ({ ...prev, subcategory: value }))
            }}
            placeholder="e.g., ChatGPT, Figma Pro, etc."
            className="flex h-10 w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray mb-2">Next Billing Date</label>
          <input
            type="date"
            value={formData.nextBillingDate}
            onChange={(e) => handleChange('nextBillingDate', e.target.value)}
            className={`flex h-10 w-full rounded-md border ${errors.nextBillingDate ? 'border-red-300' : 'border-light-gray'
              } bg-white px-3 py-2 text-sm`}
          />
          {errors.nextBillingDate && <p className="text-xs text-red-600 mt-1">{errors.nextBillingDate}</p>}
        </div>

        <div className="p-6 border-t flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 h-10 px-4 rounded-md border border-light-gray disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 h-10 px-4 rounded-md bg-dark-blue text-off-white disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}