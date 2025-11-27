import { useState, useEffect } from 'react'
import { X, Calendar, Flag, Clock, Hash, Trash2, Lightbulb, Repeat, CheckSquare, Plus } from 'lucide-react'
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

    // Recurrence fields
    isRecurring: false,
    recurrenceType: 'daily' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    recurrenceInterval: '',
    recurrenceEndDate: '',
    recurrenceCount: '',
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

        // Recurrence fields
        isRecurring: task.isRecurring || false,
        recurrenceType: task.recurrenceType || 'daily',
        recurrenceInterval: task.recurrenceInterval ? task.recurrenceInterval.toString() : '',
        recurrenceEndDate: task.recurrenceEndDate ? task.recurrenceEndDate.split('T')[0] : '',
        recurrenceCount: task.recurrenceCount ? task.recurrenceCount.toString() : '',
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

        // Recurrence fields
        isRecurring: false,
        recurrenceType: 'daily',
        recurrenceInterval: '',
        recurrenceEndDate: '',
        recurrenceCount: '',
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

        // Recurrence fields
        isRecurring: formData.isRecurring,
        recurrenceType: formData.isRecurring ? formData.recurrenceType : undefined,
        recurrenceInterval: formData.isRecurring && formData.recurrenceInterval ? parseInt(formData.recurrenceInterval) : undefined,
        recurrenceEndDate: formData.isRecurring && formData.recurrenceEndDate ? formData.recurrenceEndDate : undefined,
        recurrenceCount: formData.isRecurring && formData.recurrenceCount ? parseInt(formData.recurrenceCount) : undefined,
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-[#384C5A]">
              {mode === 'create' ? 'Create New Task' : 'Edit Task'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {mode === 'create' ? 'Add details for your new task' : 'Update task information'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200/50 rounded-full transition-colors text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">
            {/* Main Info Section */}
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-[#384C5A] mb-1.5">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2.5 text-lg border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#384C5A] focus:border-transparent placeholder:text-gray-300 transition-all"
                  placeholder="What needs to be done?"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-[#384C5A] mb-1.5">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#384C5A] focus:border-transparent placeholder:text-gray-300 transition-all resize-none"
                  placeholder="Add details, context, or notes..."
                />
              </div>
            </div>

            {/* Source Idea Banner */}
            {task?.ideaId && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-full flex-shrink-0">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-amber-900">Converted from Idea</h3>
                  <p className="text-sm text-amber-700 mt-0.5">
                    This task originated from an idea created on {new Date(task.createdAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Properties */}
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <CheckSquare className="w-3 h-3" /> Properties
                </h3>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Priority Level
                    </label>
                    <div className="relative">
                      <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        id="priority"
                        value={formData.priority}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#384C5A] focus:border-transparent bg-white appearance-none"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Due Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        id="dueDate"
                        value={formData.dueDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#384C5A] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Estimated Effort (Hours)
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        id="estimatedHours"
                        min="0"
                        step="0.5"
                        value={formData.estimatedHours}
                        onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#384C5A] focus:border-transparent"
                        placeholder="0.0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-red-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#384C5A] focus:border-transparent text-sm"
                          placeholder="Add tag..."
                        />
                      </div>
                      <Button type="button" onClick={addTag} size="sm" variant="outline">
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Planning & Recurrence */}
              <div className="space-y-6">
                {/* Time Allocation */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h3 className="text-sm font-bold text-[#384C5A] mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Time Budgeting
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="dailyAllocation" className="block text-xs font-medium text-gray-500 mb-1">
                        Daily Hours
                      </label>
                      <input
                        type="number"
                        id="dailyAllocation"
                        min="0"
                        step="0.5"
                        value={formData.dailyAllocation}
                        onChange={(e) => setFormData(prev => ({ ...prev, dailyAllocation: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#384C5A] focus:border-transparent bg-white"
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <label htmlFor="weeklyAllocation" className="block text-xs font-medium text-gray-500 mb-1">
                        Weekly Hours
                      </label>
                      <input
                        type="number"
                        id="weeklyAllocation"
                        min="0"
                        step="0.5"
                        value={formData.weeklyAllocation}
                        onChange={(e) => setFormData(prev => ({ ...prev, weeklyAllocation: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#384C5A] focus:border-transparent bg-white"
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <label htmlFor="monthlyAllocation" className="block text-xs font-medium text-gray-500 mb-1">
                        Monthly Hours
                      </label>
                      <input
                        type="number"
                        id="monthlyAllocation"
                        min="0"
                        step="0.5"
                        value={formData.monthlyAllocation}
                        onChange={(e) => setFormData(prev => ({ ...prev, monthlyAllocation: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#384C5A] focus:border-transparent bg-white"
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <label htmlFor="yearlyAllocation" className="block text-xs font-medium text-gray-500 mb-1">
                        Yearly Hours
                      </label>
                      <input
                        type="number"
                        id="yearlyAllocation"
                        min="0"
                        step="0.5"
                        value={formData.yearlyAllocation}
                        onChange={(e) => setFormData(prev => ({ ...prev, yearlyAllocation: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#384C5A] focus:border-transparent bg-white"
                        placeholder="0.0"
                      />
                    </div>
                  </div>
                </div>

                {/* Recurrence */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-[#384C5A] flex items-center gap-2">
                      <Repeat className="w-4 h-4" /> Recurrence
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isRecurring}
                        onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#384C5A] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#384C5A]"></div>
                    </label>
                  </div>

                  {formData.isRecurring && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Frequency</label>
                        <select
                          value={formData.recurrenceType}
                          onChange={(e) => setFormData(prev => ({ ...prev, recurrenceType: e.target.value as any }))}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#384C5A] focus:border-transparent bg-white"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Interval</label>
                          <input
                            type="number"
                            min="1"
                            value={formData.recurrenceInterval}
                            onChange={(e) => setFormData(prev => ({ ...prev, recurrenceInterval: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#384C5A] focus:border-transparent bg-white"
                            placeholder="Every X..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                          <input
                            type="date"
                            value={formData.recurrenceEndDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, recurrenceEndDate: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#384C5A] focus:border-transparent bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Subtasks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtasks
              </label>

              {subtasks.length > 0 && (
                <div className="space-y-2 mb-3">
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className={cn(
                        "flex items-center gap-3 p-3 border rounded-lg transition-colors group",
                        subtask.completed
                          ? "bg-gray-50 border-gray-100"
                          : "bg-white border-gray-200"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSubtask(subtask.id)}
                        className={cn(
                          "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                          subtask.completed
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-gray-300 hover:border-[#384C5A]"
                        )}
                      >
                        {subtask.completed && <span className="text-xs">✓</span>}
                      </button>

                      <span
                        className={cn(
                          "flex-1 text-sm",
                          subtask.completed ? "line-through text-gray-400" : "text-gray-700"
                        )}
                      >
                        {subtask.title}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeSubtask(subtask.id)}
                        className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#384C5A] focus:border-transparent text-sm"
                    placeholder="Add a subtask..."
                  />
                </div>
                <Button type="button" onClick={addSubtask} size="sm" variant="outline">
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
              className="bg-[#384C5A] hover:bg-[#2c3b46] text-white px-6 shadow-lg shadow-[#384C5A]/20"
            >
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Task' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}