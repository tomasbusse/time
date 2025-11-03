import { GripVertical, Edit2, Trash2, Calendar, Flag } from 'lucide-react'

export interface Task {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  ideaId?: string
}

interface TaskBoardProps {
  tasks: Task[]
  onEditTask: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
  onUpdateStatus: (taskId: string, status: 'todo' | 'in_progress' | 'completed') => void
}

export default function TaskBoard({
  tasks,
  onEditTask,
  onDeleteTask,
  onUpdateStatus,
}: TaskBoardProps) {
  const columns = [
    { id: 'todo', title: 'To Do', status: 'todo' as const },
    { id: 'in_progress', title: 'In Progress', status: 'in_progress' as const },
    { id: 'completed', title: 'Completed', status: 'completed' as const },
  ]

  const getPriorityColor = (priority: string): string => {
    const colors = {
      low: 'bg-blue-100 text-blue-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-red-100 text-red-700',
    }
    return colors[priority as keyof typeof colors] || colors.low
  }

  const getPriorityIcon = (_priority: string) => {
    return <Flag className="w-3 h-3" />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.status)

        return (
          <div key={column.id} className="bg-neutral-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-800">
                {column.title}
              </h3>
              <span className="text-sm text-neutral-500 bg-white px-2 py-1 rounded">
                {columnTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {columnTasks.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-sm">
                  No tasks
                </div>
              ) : (
                columnTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-start gap-2">
                      <button className="mt-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-4 h-4 text-neutral-400" />
                      </button>

                      <div className="flex-1">
                        <h4 className="font-medium text-neutral-800 mb-2">
                          {task.title}
                        </h4>

                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {getPriorityIcon(task.priority)}
                            {task.priority}
                          </span>

                          {task.dueDate && (
                            <span className="inline-flex items-center gap-1 text-xs text-neutral-600">
                              <Calendar className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {column.status !== 'todo' && (
                            <button
                              onClick={() => onUpdateStatus(task.id, 'todo')}
                              className="text-xs px-2 py-1 text-neutral-600 hover:bg-neutral-100 rounded"
                            >
                              ← To Do
                            </button>
                          )}
                          {column.status !== 'in_progress' && (
                            <button
                              onClick={() => onUpdateStatus(task.id, 'in_progress')}
                              className="text-xs px-2 py-1 text-neutral-600 hover:bg-neutral-100 rounded"
                            >
                              → In Progress
                            </button>
                          )}
                          {column.status !== 'completed' && (
                            <button
                              onClick={() => onUpdateStatus(task.id, 'completed')}
                              className="text-xs px-2 py-1 text-neutral-600 hover:bg-neutral-100 rounded"
                            >
                              ✓ Complete
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => onEditTask(task.id)}
                          className="p-1 hover:bg-neutral-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit2 className="w-4 h-4 text-neutral-500" />
                        </button>
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="p-1 hover:bg-neutral-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
