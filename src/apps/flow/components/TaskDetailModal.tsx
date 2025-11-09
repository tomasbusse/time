import { useState, useEffect } from 'react'
import { X, Calendar, Flag, Clock, Hash, Trash2, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface TaskDetailModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (taskData: any) => Promise<void>
  task: any
  mode: 'create' | 'edit'
}

export default function TaskDetailModal({
  isOpen,
  onClose,
  onSave,
  task,
  mode,
}: TaskDetailModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    tags: [] as string[],
    estimatedHours: '',
    assigneeId: '',
    
    // Time allocation fields
    dailyAllocation: '',
    weeklyAllocation: '',
    monthlyAllocation: '',
    yearlyAllocation: '',
  })
  const [newTag, setNewTag] = useState('')
  const [subtasks, setSubtasks] = useState<any[]>([])
  const [newSubtask, setNewSubtask] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form data when modal opens or task changes
  useEffect(() => {
    if (isOpen && task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        tags: task.tags || [],
        estimatedHours: task.estimatedHours ? task.estimatedHours.toString() : '',
        assigneeId: task.assigneeId || '',
        
        // Time allocation fields
        dailyAllocation: task.dailyAllocation ? task.dailyAllocation.toString() : '',
        weeklyAllocation: task.weeklyAllocation ? task.weeklyAllocation.toString() : '',
        monthlyAllocation: task.monthlyAllocation ? task.monthlyAllocation.toString() : '',
        yearlyAllocation: task.yearlyAllocation ? task.yearlyAllocation.toString() : '',
      })
      // Load subtasks if editing
      if (mode === 'edit' && task._id) {
        // In a real implementation, you'd fetch subtasks here
        setSubtasks([])
      }
    } else if (isOpen && mode === 'create') {
      // Reset form for create mode
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        tags: [],
        estimatedHours: '',
        assigneeId: '',
        
        // Time allocation fields
        dailyAllocation: '',
        weeklyAllocation: '',
        monthlyAllocation: '',
        yearlyAllocation: '',
      })
      setSubtasks([])
    }
  }, [isOpen, task, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    setIsSubmitting(true)
    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        dueDate: formData.dueDate || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        assigneeId: formData.assigneeId || undefined,
        
        // Time allocation fields
        dailyAllocation: formData.dailyAllocation ? parseFloat(formData.dailyAllocation) : undefined,
        weeklyAllocation: formData.weeklyAllocation ? parseFloat(formData.weeklyAllocation) : undefined,
        monthlyAllocation: formData.monthlyAllocation ? parseFloat(formData.monthlyAllocation) : undefined,
        yearlyAllocation: formData.yearlyAllocation ? parseFloat(formData.yearlyAllocation) : undefined,
      }

      await onSave(taskData)
    } catch (error) {
      console.error('Error saving task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const addSubtask = () => {
    if (newSubtask.trim()) {
      const subtask = {
        id: Date.now().toString(), // Temporary ID
        title: newSubtask.trim(),
        completed: false,
      }
      setSubtasks(prev => [...prev, subtask])
      setNewSubtask('')
    }
  }

  const removeSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(st => st.id !== id))
  }

  const toggleSubtask = (id: string) => {
    setSubtasks(prev => prev.map(st => 
      st.id === id ? { ...st, completed: !st.completed } : st
    ))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">
            {mode === 'create' ? 'Create New Task' : 'Edit Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter task title..."
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add a detailed description..."
              />
            </div>

            {/* Source Idea */}
            {task?.ideaId && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-yellow-800 mb-1">Source Idea</h3>
                    <p className="text-sm text-yellow-700 mb-2">
                      This task was created from an idea
                    </p>
                    <div className="text-xs text-yellow-600">
                      Created: {new Date(task.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Priority and Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-slate-700 mb-2">
                  <Flag className="inline w-4 h-4 mr-1" />
                  Priority
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Due Date
                </label>
                <input
                  type="date"
                  id="dueDate"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Estimated Hours */}
            <div>
              <label htmlFor="estimatedHours" className="block text-sm font-medium text-slate-700 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Estimated Hours
              </label>
              <input
                type="number"
                id="estimatedHours"
                min="0"
                step="0.5"
                value={formData.estimatedHours}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.0"
              />
            </div>

            {/* Time Allocation Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Time Allocation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dailyAllocation" className="block text-xs font-medium text-slate-600 mb-1">
                    Daily (hours/day)
                  </label>
                  <input
                    type="number"
                    id="dailyAllocation"
                    min="0"
                    step="0.5"
                    value={formData.dailyAllocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, dailyAllocation: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    placeholder="0.0"
                  />
                </div>

                <div>
                  <label htmlFor="weeklyAllocation" className="block text-xs font-medium text-slate-600 mb-1">
                    Weekly (hours/week)
                  </label>
                  <input
                    type="number"
                    id="weeklyAllocation"
                    min="0"
                    step="0.5"
                    value={formData.weeklyAllocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, weeklyAllocation: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    placeholder="0.0"
                  />
                </div>

                <div>
                  <label htmlFor="monthlyAllocation" className="block text-xs font-medium text-slate-600 mb-1">
                    Monthly (hours/month)
                  </label>
                  <input
                    type="number"
                    id="monthlyAllocation"
                    min="0"
                    step="0.5"
                    value={formData.monthlyAllocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthlyAllocation: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    placeholder="0.0"
                  />
                </div>

                <div>
                  <label htmlFor="yearlyAllocation" className="block text-xs font-medium text-slate-600 mb-1">
                    Yearly (hours/year)
                  </label>
                  <input
                    type="number"
                    id="yearlyAllocation"
                    min="0"
                    step="0.5"
                    value={formData.yearlyAllocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, yearlyAllocation: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    placeholder="0.0"
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Hash className="inline w-4 h-4 mr-1" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-purple-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add a tag..."
                />
                <Button type="button" onClick={addTag} size="sm">
                  Add
                </Button>
              </div>
            </div>

            {/* Subtasks */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Subtasks
              </label>
              
              {subtasks.length > 0 && (
                <div className="space-y-2 mb-4">
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className={cn(
                        "flex items-center gap-3 p-3 border rounded-lg transition-colors",
                        subtask.completed 
                          ? "bg-green-50 border-green-200" 
                          : "bg-slate-50 border-slate-200"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSubtask(subtask.id)}
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                          subtask.completed
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-slate-300 hover:border-slate-400"
                        )}
                      >
                        {subtask.completed && <span className="text-xs">✓</span>}
                      </button>
                      
                      <span
                        className={cn(
                          "flex-1",
                          subtask.completed && "line-through text-slate-500"
                        )}
                      >
                        {subtask.title}
                      </span>
                      
                      <button
                        type="button"
                        onClick={() => removeSubtask(subtask.id)}
                        className="p-1 hover:bg-red-100 rounded text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add a subtask..."
                />
                <Button type="button" onClick={addSubtask} size="sm">
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Task' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}