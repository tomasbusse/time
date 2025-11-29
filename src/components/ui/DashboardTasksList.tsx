import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { ListItem } from './ListItem'
import { CheckCircle2, Circle } from 'lucide-react'
import type { Id } from '../../../convex/_generated/dataModel'

interface DashboardTasksListProps {
    workspaceId: Id<"workspaces">
}

export function DashboardTasksList({ workspaceId }: DashboardTasksListProps) {
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
                />
            ))}
            {tasks.length > 10 && (
                <p className="text-sm text-gray-400 text-center pt-4">
                    Showing 10 of {tasks.length} tasks
                </p>
            )}
        </div>
    )
}
