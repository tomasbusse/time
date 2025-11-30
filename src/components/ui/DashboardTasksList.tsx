import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { ListItem } from './ListItem'
import { CheckCircle2, Circle, Edit2, Trash2, Plus } from 'lucide-react'
import type { Id } from '../../../convex/_generated/dataModel'

interface DashboardTasksListProps {
    workspaceId: Id<"workspaces">
    onEdit?: (task: any) => void
    onDelete?: (taskId: string) => void
    onCreate?: () => void
}

export function DashboardTasksList({ workspaceId, onEdit, onDelete, onCreate }: DashboardTasksListProps) {
    const tasks = useQuery(api.flow.listTasks, { workspaceId })

    if (!tasks) {
        return <p className="text-gray-400 text-center py-8">Loading...</p>
    }

    if (tasks.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                <p>No tasks yet</p>
                <p className="text-sm mt-2">Tap the + button to create your first task</p>
            </div>
        )
    }

    const incompleteTasks = tasks.filter(t => t.status !== 'completed').slice(0, 10)

    return (
        <div className="space-y-2">
            {incompleteTasks.map((task) => (
                <ListItem
                    key={task._id}
                    icon={task.status === 'completed' ? CheckCircle2 : Circle}
                    title={task.title}
                    subtitle={task.description || undefined}
                    onClick={() => onEdit?.(task)}
                    actions={
                        <div className="flex items-center gap-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onEdit?.(task)
                                }}
                                className="p-1.5 text-gray-400 hover:text-dark-blue hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDelete?.(task._id)
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    }
                />
            ))}
            {tasks.length > 10 && (
                <p className="text-sm text-gray-400 text-center pt-4">
                    Showing 10 of {tasks.length} tasks
                </p>
            )}

            {onCreate && (
                <button
                    onClick={onCreate}
                    className="w-full mt-3 py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-dark-blue hover:text-dark-blue transition-colors flex items-center justify-center gap-2 font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Add Task
                </button>
            )}
        </div>
    )
}
