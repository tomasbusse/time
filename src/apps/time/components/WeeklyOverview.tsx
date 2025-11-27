import { format, startOfWeek, addDays } from 'date-fns'

interface WeekAllocation {
  date: string
  taskName: string
  duration: number
  category?: string
}

interface WeeklyOverviewProps {
  weekAllocations: WeekAllocation[]
  weekStart: Date
  onDayClick?: (date: string) => void
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function WeeklyOverview({
  weekAllocations,
  weekStart,
  onDayClick,
}: WeeklyOverviewProps) {
  const weekStartDate = startOfWeek(weekStart, { weekStartsOn: 1 })

  const getDayAllocations = (dayIndex: number) => {
    const dayDate = format(addDays(weekStartDate, dayIndex), 'yyyy-MM-dd')
    return weekAllocations.filter((allocation) => allocation.date === dayDate)
  }

  const getDayTotal = (dayIndex: number) => {
    const allocations = getDayAllocations(dayIndex)
    return allocations.reduce((total, allocation) => total + allocation.duration, 0)
  }

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${mins}m`
  }

  const getCategoryColor = (category?: string): string => {
    const colors: Record<string, string> = {
      work: 'bg-custom-brown',
      personal: 'bg-off-white0',
      learning: 'bg-dark-blue',
      health: 'bg-off-white0',
      default: 'bg-gray',
    }
    return category ? colors[category.toLowerCase()] || colors.default : colors.default
  }

  const weekTotal = weekAllocations.reduce((total, allocation) => total + allocation.duration, 0)

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-dark-blue">
          Week of {format(weekStartDate, 'MMM d, yyyy')}
        </h2>
        <div className="text-sm text-gray">
          Total: <span className="font-semibold">{formatDuration(weekTotal)}</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((day, index) => {
          const dayDate = format(addDays(weekStartDate, index), 'yyyy-MM-dd')
          const allocations = getDayAllocations(index)
          const dayTotal = getDayTotal(index)
          const isToday = format(new Date(), 'yyyy-MM-dd') === dayDate

          return (
            <div
              key={day}
              onClick={() => onDayClick?.(dayDate)}
              className={`border rounded-lg p-3 min-h-[150px] cursor-pointer transition-all ${
                isToday
                  ? 'border-custom-brown bg-custom-brown/10'
                  : 'border-light-gray hover:border-light-gray hover:bg-off-white'
              }`}
            >
              <div className="text-center mb-2">
                <div className="text-xs font-medium text-gray">{day}</div>
                <div className="text-lg font-semibold text-dark-blue">
                  {format(addDays(weekStartDate, index), 'd')}
                </div>
              </div>

              {allocations.length > 0 ? (
                <div className="space-y-1">
                  {allocations.map((allocation, idx) => (
                    <div
                      key={idx}
                      className={`text-xs p-1.5 rounded text-off-white ${getCategoryColor(
                        allocation.category
                      )}`}
                    >
                      <div className="font-medium truncate">{allocation.taskName}</div>
                      <div className="text-[10px] opacity-90">
                        {formatDuration(allocation.duration)}
                      </div>
                    </div>
                  ))}

                  <div className="text-xs text-gray font-medium pt-1 border-t border-light-gray">
                    Total: {formatDuration(dayTotal)}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray text-center mt-4">
                  No allocations
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-off-white rounded-lg p-3">
          <div className="text-xs text-gray">Mon-Fri</div>
          <div className="text-lg font-semibold text-dark-blue">
            {formatDuration(
              DAYS.slice(0, 5).reduce((total, _, index) => total + getDayTotal(index), 0)
            )}
          </div>
        </div>

        <div className="bg-off-white rounded-lg p-3">
          <div className="text-xs text-gray">Weekend</div>
          <div className="text-lg font-semibold text-dark-blue">
            {formatDuration(
              DAYS.slice(5).reduce((total, _, index) => total + getDayTotal(index + 5), 0)
            )}
          </div>
        </div>

        <div className="bg-off-white rounded-lg p-3">
          <div className="text-xs text-gray">Avg/Day</div>
          <div className="text-lg font-semibold text-dark-blue">
            {formatDuration(Math.round(weekTotal / 7))}
          </div>
        </div>

        <div className="bg-custom-brown/10 rounded-lg p-3">
          <div className="text-xs text-custom-brown">Week Total</div>
          <div className="text-lg font-semibold text-custom-brown">
            {formatDuration(weekTotal)}
          </div>
        </div>
      </div>
    </div>
  )
}
