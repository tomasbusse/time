import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Plus, X } from 'lucide-react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useWorkspace } from '@/lib/WorkspaceContext'

interface AssetFormData {
  name: string
  type: string
}

interface AssetFormProps {
  initialData?: AssetFormData & { id?: string }
  onSubmit: (data: AssetFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  title?: string
}

export function AssetForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  title = "Add Asset" 
}: AssetFormProps) {
  const { workspaceId, userId } = useWorkspace()
  
  // Standard asset types
  const standardTypes = [
    { value: 'property', label: 'Property' },
    { value: 'vehicle', label: 'Vehicle' },
    { value: 'investment', label: 'Investment' },
    { value: 'other', label: 'Other' },
  ] as const

  // Query custom asset types
  const customTypes = useQuery(
    api.finance.listAssetTypes,
    workspaceId ? { workspaceId } : 'skip'
  ) || []

  // Mutations
  const createAssetTypeMutation = useMutation(api.finance.createAssetType)

  const [formData, setFormData] = useState<AssetFormData>({
    name: initialData?.name || '',
    type: initialData?.type || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showNewTypeInput, setShowNewTypeInput] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [isCreatingType, setIsCreatingType] = useState(false)

  // Combine standard and custom types
  const allTypes = [
    ...standardTypes,
    ...customTypes.map((type: any) => ({ 
      value: type.name, 
      label: type.name.charAt(0).toUpperCase() + type.name.slice(1) 
    }))
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Asset name is required'
    }
    if (!formData.type.trim()) {
      newErrors.type = 'Asset type is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await onSubmit({
        name: formData.name.trim(),
        type: formData.type.trim().toLowerCase(),
      })
    } catch (error) {
      console.error('Error submitting asset:', error)
    }
  }

  const handleChange = (field: keyof AssetFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleCreateNewType = async () => {
    if (!newTypeName.trim() || !workspaceId || !userId) return

    setIsCreatingType(true)
    try {
      await createAssetTypeMutation({
        workspaceId: workspaceId as any,
        createdBy: userId as any,
        name: newTypeName.trim(),
      })
      setFormData(prev => ({ ...prev, type: newTypeName.trim().toLowerCase() }))
      setNewTypeName('')
      setShowNewTypeInput(false)
    } catch (error) {
      console.error('Error creating asset type:', error)
      setErrors({ type: 'Failed to create asset type. Please try again.' })
    } finally {
      setIsCreatingType(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-800">{title}</h3>
        <p className="text-sm text-neutral-600">Fill in the details for your asset</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
            Asset Name *
          </label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., Primary Residence, 2019 Toyota Camry..."
            className={errors.name ? 'border-red-500' : ''}
            disabled={isLoading}
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-neutral-700 mb-1">
            Asset Type *
          </label>
          {showNewTypeInput ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="Enter new type name..."
                  disabled={isCreatingType}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleCreateNewType()
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleCreateNewType}
                  disabled={isCreatingType || !newTypeName.trim()}
                  size="sm"
                >
                  {isCreatingType ? 'Creating...' : 'Add'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowNewTypeInput(false)
                    setNewTypeName('')
                  }}
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <select
                id="type"
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
              >
                <option value="">Select a type...</option>
                {allTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowNewTypeInput(true)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Type
              </Button>
            </div>
          )}
          {errors.type && (
            <p className="text-sm text-red-600 mt-1">{errors.type}</p>
          )}
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
            {isLoading ? 'Saving...' : (initialData?.id ? 'Update Asset' : 'Add Asset')}
          </Button>
        </div>
      </form>
    </div>
  )
}