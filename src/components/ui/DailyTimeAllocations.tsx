import { useWorkspace } from '@/lib/WorkspaceContext'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Play } from 'lucide-react'
import { format } from 'date-fns'
import { Doc } from '../../../convex/_generated/dataModel'

interface DailyTimeAllocationsProps {
  tasks: Doc<'tasks'>[] | undefined | null
}

export function DailyTimeAllocations({ tasks }: DailyTimeAllocationsProps) {
  const { workspaceId } = useWorkspace()
  const today = format(new Date(), 'yyyy-MM-dd')

  const allocations = useQuery(
    api.timeAllocations.list,
    workspaceId ? { workspaceId, date: today } : 'skip'
  )

  const startTimer = useMutation(api.flow.startTimer)

  const handleStartTimer = async (allocation: any) => {
    if (!workspaceId) return
    const taskId = allocation.taskId
    if (!taskId) {
      console.warn("No taskId found, attempting name-based task lookup...")
      if (tasks) {
        const match = tasks.find(
          (t: any) =>
            t.title?.trim().toLowerCase() === allocation.taskName?.trim().toLowerCase()
        )
        if (match?._id) {
          console.log("Matched by name, starting timer with task:", match._id)
          try {
            await startTimer({ workspaceId, taskId: match._id as any })
          } catch (error) {
            console.error("Failed to start timer:", error)
          }
          return
        }
      }
      console.error("Unable to locate related task for allocation:", allocation)
      return
    }
    try {
      await startTimer({ workspaceId, taskId: taskId as any })
    } catch (error) {
      console.error("Failed to start timer:", error)
    }
  }

  return (
    <Card className="bg-white shadow-lg" style={{ backgroundColor: '#F1F5EE' }}>
      <CardHeader>
        <CardTitle className="text-custom-dark-blue" style={{ color: '#384C5A' }}>Today's Time Allocations</CardTitle>
      </CardHeader>
      <CardContent>
        {allocations && allocations.length > 0 ? (
          <div className="space-y-3">
            {allocations.map((alloc: any) => (
              <div key={alloc._id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#DDDEE3' }}>
                <div>
                  <p className="text-sm font-medium truncate" style={{ color: '#384C5A' }}>{alloc.taskName}</p>
                  <p className="text-xs" style={{ color: '#B6B2B5' }}>{alloc.allocatedDuration} minutes</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleStartTimer(alloc)}>
                  <Play className="w-4 h-4" style={{ color: '#384C5A' }} />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: '#B6B2B5' }}>No time allocated for today.</p>
        )}
      </CardContent>
    </Card>
  )
}