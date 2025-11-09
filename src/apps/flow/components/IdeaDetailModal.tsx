import { useState, useEffect } from 'react'
import { X, Lightbulb, Tag, Flag, Paperclip, Plus, Edit2, Archive } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface Idea {
  id: string
  title: string
  description?: string
  richDescription?: string
  category?: string
  tags?: string[]
  priority?: 'low' | 'medium' | 'high'
  attachments?: Array<{
    url: string
    name: string
    type: string
  }>
  status: 'new' | 'reviewing' | 'converted' | 'archived'
}

interface Task {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  createdAt: string
}

interface IdeaDetailModalProps {
  isOpen: boolean
  onClose: () => void
  idea: Idea | null
  relatedTasks: Task[]
  onEditIdea: () => void
  onArchiveIdea: () => void
  onCreateTasks: (taskTitles: string[]) => Promise<void>
  onViewTask: (taskId: string) => void
}

export default function IdeaDetailModal({
  isOpen,
  onClose,
  idea,
  relatedTasks,
  onEditIdea,
  onArchiveIdea,
  onCreateTasks,
  onViewTask,
}: IdeaDetailModalProps) {
  const [newTaskTitles, setNewTaskTitles] = useState<string[]>([''])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setNewTaskTitles([''])
    }
  }, [isOpen])

  const getPriorityColor = (priority?: string): string => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusColor = (status: string): string => {
    const colors = {
      todo: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
    }
    return colors[status as keyof typeof colors] || colors.todo
  }

  const addTaskTitle = () => {
    setNewTaskTitles([...newTaskTitles, ''])
  }

  const updateTaskTitle = (index: number, value: string) => {
    const updated = [...newTaskTitles]
    updated[index] = value
    setNewTaskTitles(updated)
  }

  const removeTaskTitle = (index: number) => {
    if (newTaskTitles.length > 1) {
      setNewTaskTitles(newTaskTitles.filter((_, i) => i !== index))
    }
  }

  const handleCreateTasks = async () => {
    const validTitles = newTaskTitles.filter(title => title.trim())
    if (validTitles.length === 0) return

    setIsSubmitting(true)
    try {
      await onCreateTasks(validTitles)
      setNewTaskTitles([''])
    } catch (error) {
      console.error('Error creating tasks:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !idea) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">{idea.title}</h2>
              <p className="text-sm text-slate-500 capitalize">{idea.status} • Created from idea</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onEditIdea} variant="outline" size="sm">
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button onClick={onArchiveIdea} variant="outline" size="sm">
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </Button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Idea Details */}
            <div className="space-y-6">
              {/* Description */}
              {(idea.description || idea.richDescription) && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Description</h3>
                  {idea.description && (
                    <p className="text-sm text-slate-600 mb-3">{idea.description}</p>
                  )}
                  {idea.richDescription && (
                    <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                      <pre className="whitespace-pre-wrap font-sans">{idea.richDescription}</pre>
                    </div>
                  )}
                </div>
              )}

              {/* Category and Priority */}
              <div className="grid grid-cols-2 gap-4">
                {idea.category && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-2">Category</h3>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-lg">
                      {idea.category}
                    </span>
                  </div>
                )}

                {idea.priority && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-2">Priority</h3>
                    <span className={cn(
                      "inline-flex items-center gap-1 px-3 py-1 text-sm rounded-lg border capitalize",
                      getPriorityColor(idea.priority)
                    )}>
                      <Flag className="w-3 h-3" />
                      {idea.priority}
                    </span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {idea.tags && idea.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {idea.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {idea.attachments && idea.attachments.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Attachments</h3>
                  <div className="space-y-2">
                    {idea.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <Paperclip className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-700">{attachment.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Related Tasks and Task Creation */}
            <div className="space-y-6">
              {/* Existing Tasks */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-slate-800">
                    Related Tasks ({relatedTasks.length})
                  </h3>
                </div>

                {relatedTasks.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg">
                    <Lightbulb className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">No tasks created from this idea yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {relatedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-4 border border-slate-200 rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
                        onClick={() => onViewTask(task.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-slate-800 flex-1">{task.title}</h4>
                          <span className={cn(
                            "text-xs px-2 py-1 rounded-full ml-2",
                            getStatusColor(task.status)
                          )}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-xs px-2 py-1 rounded border capitalize",
                            getPriorityColor(task.priority)
                          )}>
                            <Flag className="w-3 h-3 inline mr-1" />
                            {task.priority}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(task.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Create New Tasks */}
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Create Tasks</h3>
                <div className="space-y-3">
                  {newTaskTitles.map((title, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => updateTaskTitle(index, e.target.value)}
                        placeholder={`Task ${index + 1} title...`}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {newTaskTitles.length > 1 && (
                        <button
                          onClick={() => removeTaskTitle(index)}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={addTaskTitle}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Task
                    </Button>
                    <Button
                      onClick={handleCreateTasks}
                      disabled={isSubmitting || newTaskTitles.every(title => !title.trim())}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Tasks'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}