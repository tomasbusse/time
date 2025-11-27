import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Play, Square, CheckCircle2, Circle, Clock } from 'lucide-react'
import { Button } from './Button'
import type { Id } from '../../../convex/_generated/dataModel'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

interface TasksDashboardWidgetProps {
    workspaceId: Id<"workspaces">
}

export function TasksDashboardWidget({ workspaceId }: TasksDashboardWidgetProps) {
    const tasks = useQuery(api.flow.listTasks, { workspaceId })
    const activeTimer = useQuery(api.flow.getActiveTimer, { workspaceId })
    const startTimer = useMutation(api.flow.startTimer)
    const stopTimer = useMutation(api.flow.stopTimer)
    const updateTaskStatus = useMutation(api.flow.updateTaskStatus)

    const [elapsed, setElapsed] = useState(0)

    useEffect(() => {
        if (activeTimer) {
            const interval = setInterval(() => {
                setElapsed(Math.floor((Date.now() - activeTimer.startTime) / 1000))
            }, 1000)
            setElapsed(Math.floor((Date.now() - activeTimer.startTime) / 1000))
            return () => clearInterval(interval)
        } else {
            setElapsed(0)
        }
    }, [activeTimer])

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        return `${h > 0 ? `${h}:` : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const handleStartTimer = async (taskId: Id<"tasks">) => {
        try {
            await startTimer({ workspaceId, taskId })
        } catch (error) {
            console.error('Failed to start timer:', error)
        }
    }

    const handleStopTimer = async () => {
        try {
            await stopTimer({ workspaceId })
        } catch (error) {
            console.error('Failed to stop timer:', error)
        }
    }

    const handleToggleStatus = async (taskId: Id<"tasks">, currentStatus: string) => {
        const newStatus = currentStatus === 'completed' ? 'todo' : 'completed'
        await updateTaskStatus({ taskId, status: newStatus as any })
    }

    const upcomingTasks = Array.isArray(tasks)
        ? tasks.filter(t => t.status !== 'completed').slice(0, 5)
        : []

    return (
        <div className="h-full flex flex-col">
            {/* Active Timer Section */}
            {activeTimer && (
                <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Active Timer</p>
                            <p className="text-sm font-bold text-dark-blue">{activeTimer.taskTitle}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xl font-mono font-bold text-blue-600">
                            {formatTime(elapsed)}
                        </span>
                        <Button
                            onClick={handleStopTimer}
                            variant="destructive"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full"
                        >
                            <Square className="w-4 h-4 fill-current" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Tasks List */}
            <div className="flex-1 space-y-2">
                {upcomingTasks.length > 0 ? (
                    upcomingTasks.map((task) => (
                        <div
                            key={task._id}
                            className="group flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <button
                                    onClick={() => handleToggleStatus(task._id, task.status)}
                                    className="text-gray-400 hover:text-green-600 transition-colors"
                                >
                                    {task.status === 'completed' ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <Circle className="w-5 h-5" />
                                    )}
                                </button>
                                <span className={`text-sm font-medium truncate ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-dark-blue'}`}>
                                    {task.title}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!activeTimer && task.status !== 'completed' && (
                                    <Button
                                        onClick={() => handleStartTimer(task._id)}
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-custom-brown hover:text-brown hover:bg-orange-50"
                                        title="Start Timer"
                                    >
                                        <Play className="w-4 h-4 fill-current" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        No upcoming tasks
                    </div>
                )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100">
                <Link to="/flow" className="text-custom-brown hover:text-brown text-sm font-medium flex items-center gap-1">
                    View all tasks →
                </Link>
            </div>
        </div>
    )
}
