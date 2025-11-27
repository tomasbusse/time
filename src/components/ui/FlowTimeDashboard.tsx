import { useWorkspace } from '@/lib/WorkspaceContext'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'

import { ActiveTimer } from '@/components/ActiveTimer'
import { DailyTimeAllocations } from '@/components/ui/DailyTimeAllocations'
import { Badge } from '@/components/ui/Badge'
import { Link } from 'react-router-dom'

export function FlowTimeDashboard() {
  const { workspaceId } = useWorkspace()

  const activeTimer = useQuery(api.flow.getActiveTimer, workspaceId ? { workspaceId } : 'skip')
  const tasks = useQuery(api.flow.listTasks, workspaceId ? { workspaceId } : 'skip')
  const stopTimer = useMutation(api.flow.stopTimer)

  const upcomingTasks = Array.isArray(tasks)
    ? tasks.filter(t => t.status !== 'completed').slice(0, 3)
    : []

  return (
    <div className="h-full flex flex-col">
      {/* Active Timer Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-600 mb-3">Active Work</h3>
        {activeTimer ? (
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
            <ActiveTimer
              taskTitle={activeTimer.taskTitle}
              startTime={activeTimer.startTime}
              onStop={async () => {
                if (workspaceId) {
                  await stopTimer({ workspaceId })
                }
              }}
            />
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500 text-sm">No active timer</p>
            <Link to="/time" className="text-custom-brown hover:text-brown text-sm font-medium mt-2 inline-block">
              Start a timer →
            </Link>
          </div>
        )}
      </div>

      {/* Today's Focus */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-600 mb-3">Today's Focus</h3>
        <DailyTimeAllocations tasks={tasks} />
      </div>

      {/* Upcoming Tasks */}
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-600 mb-3">Upcoming Tasks</h3>
        {upcomingTasks.length > 0 ? (
          <div className="space-y-2">
            {upcomingTasks.map((task: any) => (
              <div key={task._id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:border-gray-200 transition-colors shadow-sm">
                <p className="text-sm font-medium text-dark-blue truncate">{task.title}</p>
                <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-200 border-none font-normal">
                  {task.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400 text-sm">No upcoming tasks</div>
        )}
      </div>
    </div>
  )
}