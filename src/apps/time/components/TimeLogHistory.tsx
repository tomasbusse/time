import { format } from 'date-fns'
import { Clock, Calendar } from 'lucide-react'

interface LogEntry {
  id: string
  taskName: string
  date: string
  elapsedTime: number
  sessionStart: number
  sessionEnd: number
}

interface TimeLogHistoryProps {
  loggedEntries: LogEntry[]
  onViewDetails?: (logId: string) => void
}

export default function TimeLogHistory({
  loggedEntries,
  onViewDetails,
}: TimeLogHistoryProps) {
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${mins}m`
  }

  const formatTime = (timestamp: number): string => {
    return format(new Date(timestamp), 'h:mm a')
  }

  const groupedEntries = loggedEntries.reduce((groups, entry) => {
    const date = entry.date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(entry)
    return groups
  }, {} as Record<string, LogEntry[]>)

  const sortedDates = Object.keys(groupedEntries).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  )

  if (loggedEntries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Clock className="w-16 h-16 text-light-gray mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-dark-blue mb-2">
          No time logged yet
        </h3>
        <p className="text-gray">
          Start a timer and log your time to see your history here
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-dark-blue mb-6">Time Log History</h2>

      <div className="space-y-6">
        {sortedDates.map((date) => {
          const entries = groupedEntries[date]
          const dayTotal = entries.reduce((total, entry) => total + entry.elapsedTime, 0)

          return (
            <div key={date}>
              <div className="flex items-center justify-between mb-3 pb-2 border-b">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray" />
                  <h3 className="font-semibold text-dark-blue">
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </h3>
                </div>
                <span className="text-sm text-gray">
                  Total: <span className="font-semibold">{formatDuration(dayTotal)}</span>
                </span>
              </div>

              <div className="space-y-2">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="border border-light-gray rounded-lg p-4 hover:bg-off-white transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-dark-blue mb-1">
                          {entry.taskName}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {formatTime(entry.sessionStart)} - {formatTime(entry.sessionEnd)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-semibold text-custom-brown">
                          {formatDuration(entry.elapsedTime)}
                        </div>
                        {onViewDetails && (
                          <button
                            onClick={() => onViewDetails(entry.id)}
                            className="text-xs text-custom-brown hover:text-custom-brown mt-1"
                          >
                            View Details
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 pt-6 border-t">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-off-white rounded-lg p-4">
            <div className="text-sm text-gray">Total Entries</div>
            <div className="text-2xl font-semibold text-dark-blue">
              {loggedEntries.length}
            </div>
          </div>

          <div className="bg-off-white rounded-lg p-4">
            <div className="text-sm text-gray">Total Time</div>
            <div className="text-2xl font-semibold text-dark-blue">
              {formatDuration(
                loggedEntries.reduce((total, entry) => total + entry.elapsedTime, 0)
              )}
            </div>
          </div>

          <div className="bg-off-white rounded-lg p-4">
            <div className="text-sm text-gray">Avg Session</div>
            <div className="text-2xl font-semibold text-dark-blue">
              {formatDuration(
                Math.round(
                  loggedEntries.reduce((total, entry) => total + entry.elapsedTime, 0) /
                    loggedEntries.length
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
