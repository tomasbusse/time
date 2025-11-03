import { Play, Clock, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface TimeAllocationCardProps {
  taskName: string
  allocatedDuration: number
  timeSpent?: number
  category?: string
  onStartTimer: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export default function TimeAllocationCard({
  taskName,
  allocatedDuration,
  timeSpent = 0,
  category,
  onStartTimer,
  onEdit,
  onDelete,
}: TimeAllocationCardProps) {
  const progressPercentage = allocatedDuration > 0 
    ? Math.min((timeSpent / allocatedDuration) * 100, 100) 
    : 0

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${mins}m`
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-neutral-800 mb-1">
            {taskName}
          </h3>
          {category && (
            <span className="inline-block text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
              {category}
            </span>
          )}
        </div>
        
        {(onEdit || onDelete) && (
          <button className="p-1 hover:bg-neutral-100 rounded">
            <MoreVertical className="w-5 h-5 text-neutral-500" />
          </button>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-neutral-600 mb-2">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Allocated: {formatDuration(allocatedDuration)}</span>
          </div>
          <span>Spent: {formatDuration(timeSpent)}</span>
        </div>

        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              progressPercentage >= 100 ? 'bg-green-500' : 'bg-blue-600'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {progressPercentage >= 100 && (
          <p className="text-xs text-green-600 mt-1">✓ Time goal reached!</p>
        )}
      </div>

      <Button
        onClick={onStartTimer}
        variant="default"
        size="default"
        className="w-full"
      >
        <Play className="w-4 h-4 mr-2" />
        Start Timer
      </Button>
    </div>
  )
}
