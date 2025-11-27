import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface LiabilityFormData {
  name: string
  relatedAssetId: string
}

interface LiabilityFormProps {
  initialData?: LiabilityFormData & { id?: string }
  onSubmit: (data: LiabilityFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  title?: string
  availableAssets: Array<{ _id: string; accountName: string; accountCode: string }>
}

export function LiabilityForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  title = "Add Liability",
  availableAssets = []
}: LiabilityFormProps) {
  const [formData, setFormData] = useState<LiabilityFormData>({
    name: initialData?.name || '',
    relatedAssetId: initialData?.relatedAssetId || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Liability name is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await onSubmit({
        name: formData.name.trim(),
        relatedAssetId: formData.relatedAssetId || '',
      })
    } catch (error) {
      console.error('Error submitting liability:', error)
    }
  }

  const handleChange = (field: keyof LiabilityFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-dark-blue">{title}</h3>
        <p className="text-sm text-gray">Fill in the details for your liability</p>
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
            placeholder="e.g., Home Mortgage, Student Loan, Car Loan..."
            className={errors.name ? 'border-red-500' : ''}
            disabled={isLoading}
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="relatedAssetId" className="block text-sm font-medium text-gray mb-1">
            Related Asset (Optional)
          </label>
          <select
            id="relatedAssetId"
            value={formData.relatedAssetId}
            onChange={(e) => handleChange('relatedAssetId', e.target.value)}
            className="flex h-10 w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm ring-offset-off-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
          >
            <option value="">No related asset</option>
            {availableAssets.map((asset) => (
              <option key={asset._id} value={asset._id}>
                {asset.accountCode} - {asset.accountName}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray mt-1">
            Link this liability to a specific asset (e.g., mortgage → property)
          </p>
        </div>

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
            {isLoading ? 'Saving...' : (initialData?.id ? 'Update Liability' : 'Add Liability')}
          </Button>
        </div>
      </form>
    </div>
  )
}