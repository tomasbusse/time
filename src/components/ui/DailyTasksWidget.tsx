import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Calendar, FileText, Users, Circle, CheckCircle2 } from 'lucide-react'
import type { Id } from '../../../convex/_generated/dataModel'

interface DailyTasksWidgetProps {
    workspaceId: Id<"workspaces">
}

export function DailyTasksWidget({ workspaceId }: DailyTasksWidgetProps) {
    // Mock data to match screenshot for now, or use real data if available
    // In a real implementation, we would map task types to icons
    const tasks = [
        { id: '1', title: 'Client Meeting', time: '9:00 AM - 10:00 AM', icon: Calendar, completed: false },
        { id: '2', title: 'Report Analysis', time: '10:30 AM - 12:00 PM', icon: FileText, completed: false },
        { id: '3', title: 'Team Brainstorming', time: '1:00 PM - 2:00 PM', icon: Users, completed: false },
    ]

    return (
        <div className="w-full px-4">
            <h2 className="text-xl font-bold text-dark-blue mb-4">Daily Tasks</h2>
            <div className="bg-white rounded-[2rem] p-4 shadow-sm space-y-2">
                {tasks.map((task) => {
                    const Icon = task.icon
                    return (
                        <div key={task.id} className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-4">
                                <button className="text-gray-300 hover:text-custom-brown transition-colors">
                                    <Circle className="w-6 h-6" />
                                </button>
                                <div>
                                    <h3 className="font-bold text-dark-blue text-base">{task.title}</h3>
                                    <p className="text-gray-400 text-sm">{task.time}</p>
                                </div>
                            </div>
                            <div className="text-gray-400">
                                <Icon className="w-5 h-5" />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
