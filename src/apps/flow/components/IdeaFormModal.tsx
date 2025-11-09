import { useState, useEffect } from 'react'
import { X, Tag, Flag, Paperclip, Hash } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Attachment {
  url: string
  name: string
  type: string
}

interface IdeaFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (ideaData: any) => Promise<void>
  idea?: any
  mode: 'create' | 'edit'
}

export default function IdeaFormModal({
  isOpen,
  onClose,
  onSave,
  idea,
  mode,
}: IdeaFormModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    richDescription: '',
    category: '',
    tags: [] as string[],
    priority: 'medium' as 'low' | 'medium' | 'high',
    attachments: [] as Attachment[],
  })
  const [newTag, setNewTag] = useState('')
  const [newAttachment, setNewAttachment] = useState({ url: '', name: '', type: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form data when modal opens or idea changes
  useEffect(() => {
    if (isOpen && idea) {
      setFormData({
        title: idea.title || '',
        description: idea.description || '',
        richDescription: idea.richDescription || '',
        category: idea.category || '',
        tags: idea.tags || [],
        priority: idea.priority || 'medium',
        attachments: idea.attachments || [],
      })
    } else if (isOpen && !idea) {
      setFormData({
        title: '',
        description: '',
        richDescription: '',
        category: '',
        tags: [],
        priority: 'medium',
        attachments: [],
      })
    }
  }, [isOpen, idea])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    setIsSubmitting(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving idea:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }))
  }

  const addAttachment = () => {
    if (newAttachment.url.trim() && newAttachment.name.trim()) {
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, { ...newAttachment }],
      }))
      setNewAttachment({ url: '', name: '', type: '' })
    }
  }

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }))
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {mode === 'create' ? 'Create New Idea' : 'Edit Idea'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter idea title..."
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter brief description..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Rich Description */}
          <div>
            <label htmlFor="richDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Rich Description (Markdown supported)
            </label>
            <textarea
              id="richDescription"
              value={formData.richDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, richDescription: e.target.value }))}
              placeholder="Enter detailed description with formatting..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          {/* Category and Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <Input
                id="category"
                type="text"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Feature, Enhancement"
              />
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent capitalize ${getPriorityColor(formData.priority)}`}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-3">
              <Input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add a tag..."
                className="flex-1"
              />
              <Button type="button" onClick={addTag} variant="outline" size="sm">
                <Tag className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments (URLs)
            </label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <Input
                type="text"
                value={newAttachment.url}
                onChange={(e) => setNewAttachment(prev => ({ ...prev, url: e.target.value }))}
                placeholder="URL"
              />
              <Input
                type="text"
                value={newAttachment.name}
                onChange={(e) => setNewAttachment(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Name"
              />
              <Input
                type="text"
                value={newAttachment.type}
                onChange={(e) => setNewAttachment(prev => ({ ...prev, type: e.target.value }))}
                placeholder="Type"
              />
            </div>
            <Button type="button" onClick={addAttachment} variant="outline" size="sm">
              <Paperclip className="w-4 h-4 mr-1" />
              Add Attachment
            </Button>
            {formData.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{attachment.name}</span>
                      <span className="text-xs text-gray-500">({attachment.type})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Idea' : 'Update Idea'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
