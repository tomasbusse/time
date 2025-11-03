import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns'

interface CalendarEvent {
  id: string
  title: string
  startTime: number
  endTime: number
  googleEventId?: string
}

export default function CalendarApp() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Team Meeting',
      startTime: new Date(2025, 10, 15, 10, 0).getTime(),
      endTime: new Date(2025, 10, 15, 11, 0).getTime(),
      googleEventId: 'google-123',
    },
    {
      id: '2',
      title: 'Lunch with Client',
      startTime: new Date(2025, 10, 18, 12, 30).getTime(),
      endTime: new Date(2025, 10, 18, 14, 0).getTime(),
    },
    {
      id: '3',
      title: 'Project Deadline',
      startTime: new Date(2025, 10, 20, 17, 0).getTime(),
      endTime: new Date(2025, 10, 20, 17, 30).getTime(),
    },
  ])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime)
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const formatTime = (timestamp: number): string => {
    return format(new Date(timestamp), 'h:mm a')
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 mb-2">Calendar</h1>
            <p className="text-neutral-600">Sync your schedule and appointments.</p>
          </div>
          <Button onClick={() => alert('Connect Google Calendar - Coming soon')} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Google Calendar
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-neutral-100 rounded"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-neutral-800">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
              </div>

              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-neutral-100 rounded"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-neutral-500 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: monthStart.getDay() }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}

              {daysInMonth.map((day) => {
                const dayEvents = getEventsForDay(day)
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isCurrentDay = isToday(day)

                return (
                  <div
                    key={day.toISOString()}
                    className={`aspect-square border rounded-lg p-2 ${
                      isCurrentDay
                        ? 'border-blue-500 bg-blue-50'
                        : isCurrentMonth
                        ? 'border-neutral-200 bg-white hover:bg-neutral-50'
                        : 'border-neutral-100 bg-neutral-50'
                    }`}
                  >
                    <div
                      className={`text-sm font-medium mb-1 ${
                        isCurrentDay
                          ? 'text-blue-600'
                          : isCurrentMonth
                          ? 'text-neutral-800'
                          : 'text-neutral-400'
                      }`}
                    >
                      {format(day, 'd')}
                    </div>

                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded truncate"
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-neutral-500">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Upcoming Events
            </h3>

            {events.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                No upcoming events
              </div>
            ) : (
              <div className="space-y-3">
                {events
                  .sort((a, b) => a.startTime - b.startTime)
                  .map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-neutral-800">{event.title}</h4>
                        <p className="text-sm text-neutral-600">
                          {format(new Date(event.startTime), 'EEEE, MMMM d, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-neutral-700">
                          {formatTime(event.startTime)} - {formatTime(event.endTime)}
                        </p>
                        {event.googleEventId && (
                          <p className="text-xs text-blue-600">From Google Calendar</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            💡 <strong>Tip:</strong> Connect your Google Calendar to sync events automatically.
            Click "Sync Google Calendar" above to get started.
          </p>
        </div>
      </div>
    </div>
  )
}
