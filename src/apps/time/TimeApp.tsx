import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks } from 'date-fns'
import { Button } from '@/components/ui/Button'
import TimerWidget from './components/TimerWidget'
import TimeAllocationCard from './components/TimeAllocationCard'
import TaskSelector from './components/TaskSelector'
import WeeklyOverview from './components/WeeklyOverview'
import TimeLogHistory from './components/TimeLogHistory'

type TabType = 'daily' | 'weekly' | 'history'

interface TimeAllocation {
  id: string
  taskName: string
  allocatedDuration: number
  timeSpent: number
  category?: string
  date: string
}

interface LogEntry {
  id: string
  taskName: string
  date: string
  elapsedTime: number
  sessionStart: number
  sessionEnd: number
}

export default function TimeApp() {
  const [activeTab, setActiveTab] = useState<TabType>('daily')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [showTaskSelector, setShowTaskSelector] = useState(false)
  const [activeTimer, setActiveTimer] = useState<TimeAllocation | null>(null)

  const [allocations, setAllocations] = useState<TimeAllocation[]>([
    {
      id: '1',
      taskName: 'Book flights for vacation',
      allocatedDuration: 120,
      timeSpent: 45,
      category: 'Personal',
      date: format(new Date(), 'yyyy-MM-dd'),
    },
    {
      id: '2',
      taskName: 'Design the Flow mini-app UI',
      allocatedDuration: 180,
      timeSpent: 90,
      category: 'Work',
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  ])

  const [logEntries, setLogEntries] = useState<LogEntry[]>([
    {
      id: '1',
      taskName: 'Book flights for vacation',
      date: format(new Date(), 'yyyy-MM-dd'),
      elapsedTime: 45,
      sessionStart: Date.now() - 45 * 60 * 1000,
      sessionEnd: Date.now(),
    },
  ])

  const mockTasks = [
    { id: '1', name: 'Book flights for vacation', category: 'Personal' },
    { id: '2', name: 'Design the Flow mini-app UI', category: 'Work' },
    { id: '3', name: 'Develop task creation form', category: 'Work' },
    { id: '4', name: 'Workout session', category: 'Health' },
    { id: '5', name: 'Read documentation', category: 'Learning' },
  ]

  const todayAllocations = allocations.filter(
    (allocation) => allocation.date === format(selectedDate, 'yyyy-MM-dd')
  )

  const handleAddAllocation = (_taskId: string, taskName: string, duration: number) => {
    const newAllocation: TimeAllocation = {
      id: Date.now().toString(),
      taskName,
      allocatedDuration: duration,
      timeSpent: 0,
      date: format(selectedDate, 'yyyy-MM-dd'),
    }
    setAllocations([...allocations, newAllocation])
  }

  const handleStartTimer = (allocation: TimeAllocation) => {
    setActiveTimer(allocation)
  }

  const handleStopTimer = (elapsedSeconds: number) => {
    if (activeTimer) {
      const elapsedMinutes = Math.floor(elapsedSeconds / 60)
      
      setAllocations(
        allocations.map((a) =>
          a.id === activeTimer.id
            ? { ...a, timeSpent: a.timeSpent + elapsedMinutes }
            : a
        )
      )

      const newLogEntry: LogEntry = {
        id: Date.now().toString(),
        taskName: activeTimer.taskName,
        date: format(new Date(), 'yyyy-MM-dd'),
        elapsedTime: elapsedMinutes,
        sessionStart: Date.now() - elapsedSeconds * 1000,
        sessionEnd: Date.now(),
      }
      setLogEntries([newLogEntry, ...logEntries])
      setActiveTimer(null)
    }
  }

  const weekAllocations = allocations.map((a) => ({
    date: a.date,
    taskName: a.taskName,
    duration: a.allocatedDuration,
    category: a.category,
  }))

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
          <h1 className="text-3xl font-bold text-neutral-800">Time</h1>
          {activeTab === 'daily' && (
            <Button onClick={() => setShowTaskSelector(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Allocation
            </Button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-neutral-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('daily')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'daily'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-neutral-600 hover:text-neutral-800'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setActiveTab('weekly')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'weekly'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-neutral-600 hover:text-neutral-800'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-neutral-600 hover:text-neutral-800'
                }`}
              >
                History
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'daily' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                  className="p-2 hover:bg-neutral-100 rounded"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold text-neutral-800">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </h2>
                <button
                  onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                  className="p-2 hover:bg-neutral-100 rounded"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {activeTimer && (
                <TimerWidget
                  allocatedDuration={activeTimer.allocatedDuration}
                  taskName={activeTimer.taskName}
                  onStop={handleStopTimer}
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {todayAllocations.map((allocation) => (
                <TimeAllocationCard
                  key={allocation.id}
                  taskName={allocation.taskName}
                  allocatedDuration={allocation.allocatedDuration}
                  timeSpent={allocation.timeSpent}
                  category={allocation.category}
                  onStartTimer={() => handleStartTimer(allocation)}
                />
              ))}
            </div>

            {todayAllocations.length === 0 && !activeTimer && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-neutral-600 mb-4">
                  No time allocations for today
                </p>
                <Button onClick={() => setShowTaskSelector(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Allocation
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'weekly' && (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={() => setWeekStart(subWeeks(weekStart, 1))}
                className="p-2 hover:bg-white rounded shadow-md"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-white rounded shadow-md"
              >
                This Week
              </button>
              <button
                onClick={() => setWeekStart(addWeeks(weekStart, 1))}
                className="p-2 hover:bg-white rounded shadow-md"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <WeeklyOverview
              weekAllocations={weekAllocations}
              weekStart={weekStart}
              onDayClick={(date) => {
                setSelectedDate(new Date(date))
                setActiveTab('daily')
              }}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <TimeLogHistory loggedEntries={logEntries} />
        )}

        {showTaskSelector && (
          <TaskSelector
            tasks={mockTasks}
            onSelectTask={handleAddAllocation}
            onClose={() => setShowTaskSelector(false)}
          />
        )}
      </div>
    </div>
  )
}
