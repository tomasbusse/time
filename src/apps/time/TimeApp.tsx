import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks, getWeek } from 'date-fns';
import { Button } from '@/components/ui/Button';
import TimerWidget from './components/TimerWidget';
import TimeAllocationCard from './components/TimeAllocationCard';
import TaskSelector from './components/TaskSelector';
import WeeklyOverview from './components/WeeklyOverview';
import TimeLogHistory from './components/TimeLogHistory';
import EditAllocationModal from './components/EditAllocationModal';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { Doc, Id } from '../../../convex/_generated/dataModel';

type TabType = 'daily' | 'weekly' | 'history';

export default function TimeApp() {
  const { workspaceId, userId } = useWorkspace();
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<Doc<'timeAllocations'> | null>(null);
  const [activeTimer, setActiveTimer] = useState<Doc<'timeAllocations'> | null>(null);

  const allocations = useQuery(
    api.timeAllocations.list,
    workspaceId ? { workspaceId, date: format(selectedDate, 'yyyy-MM-dd') } : 'skip'
  );

  const tasks = useQuery(api.flow.listTasks, workspaceId ? { workspaceId } : 'skip');

  const createAllocation = useMutation(api.timeAllocations.create);
  const updateAllocation = useMutation(api.timeAllocations.update);
  const deleteAllocation = useMutation(api.timeAllocations.remove);
  const logTime = useMutation(api.timeAllocations.logTime);

  const [logEntries, setLogEntries] = useState<any[]>([]); // Replace with Convex query

  const handleAddAllocation = (data: Partial<Doc<'timeAllocations'>>) => {
    if (!workspaceId || !userId || !data.taskName || !data.allocatedDuration || !data.taskId) return;
    createAllocation({
      workspaceId,
      userId,
      date: format(selectedDate, 'yyyy-MM-dd'),
      weekNumber: getWeek(selectedDate),
      taskName: data.taskName,
      taskId: data.taskId,
      allocatedDuration: data.allocatedDuration,
      isRecurring: data.isRecurring,
      recurrenceType: data.recurrenceType,
      recurrenceInterval: data.recurrenceInterval,
      recurrenceEndDate: data.recurrenceEndDate,
    });
  };

  const handleUpdateAllocation = (id: string, data: Partial<Doc<'timeAllocations'>>) => {
    updateAllocation({ id: id as Id<'timeAllocations'>, ...data });
  };

  const handleDeleteAllocation = (id: string) => {
    deleteAllocation({ id: id as Id<'timeAllocations'> });
  };

  const handleStartTimer = (allocation: Doc<'timeAllocations'>) => {
    setActiveTimer(allocation);
  };

  const handleStopTimer = (elapsedSeconds: number) => {
    if (activeTimer && workspaceId && userId) {
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);
      logTime({
        workspaceId,
        userId,
        allocationId: activeTimer._id,
        sessionStart: Date.now() - elapsedSeconds * 1000,
        sessionEnd: Date.now(),
        elapsedTime: elapsedMinutes,
      });
      // Note: timeSpent on allocation will be updated via a Convex function later
      setActiveTimer(null);
    }
  };

  const weekAllocations =
    allocations?.map((a) => ({
      date: a.date,
      taskName: a.taskName,
      duration: a.allocatedDuration,
      category: a.category,
    })) ?? [];

  return (
    <div className="min-h-screen bg-off-white p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray hover:text-dark-blue mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-dark-blue">Time</h1>
          {activeTab === 'daily' && (
            <Button onClick={() => setShowTaskSelector(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Allocation
            </Button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-light-gray">
            <div className="flex">
              <button
                onClick={() => setActiveTab('daily')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'daily'
                    ? 'text-custom-brown border-b-2 border-custom-brown'
                    : 'text-gray hover:text-dark-blue'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setActiveTab('weekly')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'weekly'
                    ? 'text-custom-brown border-b-2 border-custom-brown'
                    : 'text-gray hover:text-dark-blue'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'text-custom-brown border-b-2 border-custom-brown'
                    : 'text-gray hover:text-dark-blue'
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
                  className="p-2 hover:bg-light-gray rounded"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold text-dark-blue">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </h2>
                <button
                  onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                  className="p-2 hover:bg-light-gray rounded"
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
              {allocations?.map((allocation) => (
                <TimeAllocationCard
                  key={allocation._id}
                  taskName={allocation.taskName}
                  allocatedDuration={allocation.allocatedDuration}
                  timeSpent={allocation.timeSpent ?? 0}
                  category={allocation.category}
                  isRecurring={allocation.isRecurring}
                  onStartTimer={() => handleStartTimer(allocation)}
                  onEdit={() => setEditingAllocation(allocation)}
                  onDelete={() => handleDeleteAllocation(allocation._id)}
                />
              ))}
            </div>

            {allocations?.length === 0 && !activeTimer && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray mb-4">No time allocations for today</p>
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
                className="px-4 py-2 text-sm font-medium text-gray hover:bg-white rounded shadow-md"
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
            tasks={tasks || []}
            onSelectTask={(data) => handleAddAllocation(data)}
            onClose={() => setShowTaskSelector(false)}
          />
        )}

        {editingAllocation && (
          <EditAllocationModal
            allocation={editingAllocation}
            onClose={() => setEditingAllocation(null)}
            onSave={(id, data) => {
              handleUpdateAllocation(id, data);
              setEditingAllocation(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
