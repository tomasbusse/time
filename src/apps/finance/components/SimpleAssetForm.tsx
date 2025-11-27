import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useWorkspace } from '@/lib/WorkspaceContext'

interface SimpleAsset {
  _id: string
  name: string
  type: string
  currentValue: number
  purchaseValue?: number
  purchaseDate?: string
  createdAt: number
  updatedAt: number
}

interface SimpleAssetFormProps {
  asset?: SimpleAsset
  onSubmit: () => void
  onCancel: () => void
}

const ASSET_TYPES = [
  { value: 'bank_account', label: 'Bank Account' },
  { value: 'property', label: 'Property (Flat/House)' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'investment', label: 'Investment' },
  { value: 'garage', label: 'Garage/Storage' },
  { value: 'other', label: 'Other' },
] as const

export function SimpleAssetForm({ asset, onSubmit, onCancel }: SimpleAssetFormProps) {
  const { workspaceId } = useWorkspace()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: asset?.name || '',
    type: asset?.type || '',
    currentValue: asset?.currentValue || 0,
    purchaseValue: asset?.purchaseValue || '',
    purchaseDate: asset?.purchaseDate || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createAsset = useMutation(api.simpleFinance.createSimpleAsset)
  const updateAsset = useMutation(api.simpleFinance.updateSimpleAsset)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspaceId) return

    // Basic validation
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Asset name is required'
    if (!formData.type) newErrors.type = 'Asset type is required'
    if (formData.currentValue <= 0) newErrors.currentValue = 'Current value must be greater than 0'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    try {
      if (asset) {
        // Update existing asset
        await updateAsset({
          id: asset._id as any,
          name: formData.name.trim(),
          type: formData.type,
          currentValue: formData.currentValue,
          purchaseValue: formData.purchaseValue ? Number(formData.purchaseValue) : undefined,
          purchaseDate: formData.purchaseDate || undefined,
        })
      } else {
        // Create new asset
        await createAsset({
          workspaceId: workspaceId as any,
          name: formData.name.trim(),
          type: formData.type,
          currentValue: formData.currentValue,
          purchaseValue: formData.purchaseValue ? Number(formData.purchaseValue) : undefined,
          purchaseDate: formData.purchaseDate || undefined,
        })
      }
      onSubmit()
    } catch (error) {
      console.error('Error saving asset:', error)
      setErrors({ submit: 'Failed to save asset. Please try again.' })
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
          {asset ? 'Edit Asset' : 'Add New Asset'}
        </h3>
        <p className="text-sm text-gray">
          Track your assets like bank accounts, property, vehicles, and investments
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray mb-1">
            Asset Name *
          </label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., Primary Residence, 2019 Toyota Camry, Savings Account..."
            className={errors.name ? 'border-red-500' : ''}
            disabled={isLoading}
          />
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray mb-1">
            Asset Type *
          </label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="flex h-10 w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm ring-offset-off-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
          >
            <option value="">Select asset type...</option>
            {ASSET_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.type && <p className="text-sm text-red-600 mt-1">{errors.type}</p>}
        </div>

        <div>
          <label htmlFor="currentValue" className="block text-sm font-medium text-gray mb-1">
            Current Value *
          </label>
          <Input
            id="currentValue"
            type="number"
            step="0.01"
            min="0"
            value={formData.currentValue}
            onChange={(e) => handleChange('currentValue', Number(e.target.value))}
            placeholder="0.00"
            className={errors.currentValue ? 'border-red-500' : ''}
            disabled={isLoading}
          />
          {errors.currentValue && <p className="text-sm text-red-600 mt-1">{errors.currentValue}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="purchaseValue" className="block text-sm font-medium text-gray mb-1">
              Purchase Value
            </label>
            <Input
              id="purchaseValue"
              type="number"
              step="0.01"
              min="0"
              value={formData.purchaseValue}
              onChange={(e) => handleChange('purchaseValue', e.target.value)}
              placeholder="0.00"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray mb-1">
              Purchase Date
            </label>
            <Input
              id="purchaseDate"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => handleChange('purchaseDate', e.target.value)}
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
            {isLoading ? 'Saving...' : (asset ? 'Update Asset' : 'Add Asset')}
          </Button>
        </div>
      </form>
    </div>
  )
}
