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

        <div className="w-full px-2 sm:px-4">
            <h2 className="text-lg font-bold text-dark-blue mb-3 px-2">Daily Tasks</h2>
            <div className="bg-white rounded-[2rem] p-5 shadow-sm space-y-1">
                {tasks.map((task) => {
                    const Icon = task.icon
                    return (
                        <div key={task.id} className="flex items-center justify-between py-3 group">
                            <div className="flex items-center gap-3">
                                <button className="w-5 h-5 rounded-full border border-gray-300 hover:border-custom-brown transition-colors flex items-center justify-center flex-shrink-0">
                                    {/* Empty circle for todo state */}
                                </button>
                                <div>
                                    <h3 className="font-bold text-dark-blue text-sm leading-tight">{task.title}</h3>
                                    <p className="text-gray-400 text-xs mt-0.5 font-medium">{task.time}</p>
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
