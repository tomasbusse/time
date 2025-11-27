import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Plus, X } from 'lucide-react'
import { useWorkspace } from '@/lib/WorkspaceContext'

interface AssetFormData {
  name: string
  type: string
  accountId: string
}

interface AssetFormProps {
  initialData?: AssetFormData & { id?: string }
  onSubmit: (data: AssetFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  title?: string
  availableAccounts: Array<{ _id: string; accountName: string; accountCode: string }>
}

export function AssetForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  title = "Add Asset",
  availableAccounts = []
}: AssetFormProps) {
  const { workspaceId, userId } = useWorkspace()

  // Standard asset types
  const standardTypes = [
    { value: 'property', label: 'Property' },
    { value: 'vehicle', label: 'Vehicle' },
    { value: 'investment', label: 'Investment' },
    { value: 'other', label: 'Other' },
  ] as const

  const [formData, setFormData] = useState<AssetFormData>({
    name: initialData?.name || '',
    type: initialData?.type || '',
    accountId: initialData?.accountId || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showNewTypeInput, setShowNewTypeInput] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')

  // Combine standard and custom types
  const allTypes: { value: string; label: string }[] = [];

  const seen = new Set<string>();
  for (const t of standardTypes) {
    if (!seen.has(t.value)) {
      allTypes.push(t);
      seen.add(t.value);
    }
  }

  // Add current type if not in standard types
  if (formData.type && !seen.has(formData.type)) {
    allTypes.push({
      value: formData.type,
      label: formData.type.charAt(0).toUpperCase() + formData.type.slice(1),
    });
    seen.add(formData.type);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Asset name is required'
    }
    if (!formData.type.trim()) {
      newErrors.type = 'Asset type is required'
    }
    // accountId is now optional - will be auto-created if not provided

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await onSubmit({
        name: formData.name.trim(),
        type: formData.type.trim().toLowerCase(),
        accountId: formData.accountId, // Can be empty string, parent will handle account creation
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

  const handleCreateNewType = () => {
    if (!newTypeName.trim()) return

    setFormData(prev => ({ ...prev, type: newTypeName.trim().toLowerCase() }))
    setNewTypeName('')
    setShowNewTypeInput(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-dark-blue">{title}</h3>
        <p className="text-sm text-gray">Fill in the details for your asset</p>
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
            placeholder="e.g., Primary Residence, 2019 Toyota Camry..."
            className={errors.name ? 'border-red-500' : ''}
            disabled={isLoading}
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray mb-1">
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
                  disabled={!newTypeName.trim()}
                  size="sm"
                >
                  Add
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
                className="flex h-10 w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm ring-offset-off-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

        <div>
          <label htmlFor="accountId" className="block text-sm font-medium text-gray mb-1">
            Asset Account (Optional)
          </label>
          <select
            id="accountId"
            value={formData.accountId}
            onChange={(e) => handleChange('accountId', e.target.value)}
            className="flex h-10 w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm ring-offset-off-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
          >
            <option value="">Auto-create account</option>
            {availableAccounts.map((account) => (
              <option key={account._id} value={account._id}>
                {account.accountCode} - {account.accountName}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray mt-1">
            Leave empty to automatically create an asset account
          </p>
          {errors.accountId && (
            <p className="text-sm text-red-600 mt-1">{errors.accountId}</p>
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