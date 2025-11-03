import { useState } from 'react'
import { X, Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Task {
  id: string
  name: string
  category?: string
}

interface TaskSelectorProps {
  tasks: Task[]
  onSelectTask: (taskId: string, taskName: string, duration: number) => void
  onClose: () => void
}

export default function TaskSelector({
  tasks,
  onSelectTask,
  onClose,
}: TaskSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState<string>('')
  const [duration, setDuration] = useState<number>(60)

  const filteredTasks = tasks.filter((task) =>
    task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSubmit = () => {
    const selectedTask = tasks.find((t) => t.id === selectedTaskId)
    if (selectedTask && duration > 0) {
      onSelectTask(selectedTaskId, selectedTask.name, duration)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-neutral-800">
            Add Time Allocation
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 rounded"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Search Tasks
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                type="text"
                placeholder="Search by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Select Task
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredTasks.length === 0 ? (
                <p className="text-sm text-neutral-500 text-center py-4">
                  No tasks found
                </p>
              ) : (
                filteredTasks.map((task) => (
                  <label
                    key={task.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedTaskId === task.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="task"
                      value={task.id}
                      checked={selectedTaskId === task.id}
                      onChange={() => setSelectedTaskId(task.id)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-neutral-800">{task.name}</p>
                      {task.category && (
                        <p className="text-xs text-neutral-500">{task.category}</p>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Duration (minutes)
            </label>
            <Input
              type="number"
              min="1"
              max="480"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              placeholder="60"
            />
            <p className="text-xs text-neutral-500 mt-1">
              {duration >= 60
                ? `${Math.floor(duration / 60)}h ${duration % 60}m`
                : `${duration} minutes`}
            </p>
          </div>
        </div>

        <div className="p-6 border-t flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="default"
            className="flex-1"
            disabled={!selectedTaskId || duration <= 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Allocation
          </Button>
        </div>
      </div>
    </div>
  )
}
