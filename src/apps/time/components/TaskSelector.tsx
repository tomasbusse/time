import { useState } from 'react';
import { X, Search, Plus, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { Doc, Id } from '../../../../convex/_generated/dataModel';
import EditTaskModal from './EditTaskModal';

interface Task {
  _id: Id<'tasks'>;
  title: string;
  category?: string;
}

interface TaskSelectorProps {
  tasks: Doc<'tasks'>[];
  onSelectTask: (taskData: Partial<Doc<'timeAllocations'>>) => void;
  onClose: () => void;
}

export default function TaskSelector({
  tasks,
  onSelectTask,
  onClose,
}: TaskSelectorProps) {
  const { workspaceId, userId } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [duration, setDuration] = useState<number>(60);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [editingTask, setEditingTask] = useState<Doc<'tasks'> | null>(null);

  const createTask = useMutation(api.flow.createTask);
  const updateTask = useMutation(api.flow.updateTask);
  const deleteTask = useMutation(api.flow.deleteTask);

  const filteredTasks =
    tasks?.filter(
      (task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) ?? [];

  const handleCreateTask = async () => {
    if (newTaskName.trim() === '' || !workspaceId || !userId) return;

    const newTaskId = await createTask({
      workspaceId,
      userId,
      title: newTaskName,
      status: 'todo',
      priority: 'medium',
    });

    setNewTaskName('');
    setShowNewTaskForm(false);
    setSelectedTaskId(newTaskId);
  };

  const handleUpdateTask = (id: Id<'tasks'>, title: string) => {
    updateTask({ taskId: id, title });
  };

  const handleDeleteTask = (id: Id<'tasks'>) => {
    deleteTask({ taskId: id });
  };

  const handleSubmit = () => {
    const selectedTask = tasks.find((t) => t._id === selectedTaskId);
    if (selectedTask && duration > 0) {
      onSelectTask({
        taskId: selectedTask._id,
        taskName: selectedTask.title,
        allocatedDuration: duration,
        isRecurring,
        recurrenceType: isRecurring ? recurrenceType : undefined,
        recurrenceInterval: isRecurring ? recurrenceInterval : undefined,
        recurrenceEndDate: isRecurring ? recurrenceEndDate : undefined,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-dark-blue">
            Add Time Allocation
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-light-gray rounded"
          >
            <X className="w-5 h-5 text-gray" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray mb-2">
              Search Tasks
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray" />
              <Input
                type="text"
                placeholder="Search by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray">
                Select Task
              </label>
              {!showNewTaskForm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewTaskForm(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New Task
                </Button>
              )}
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <div
                    key={task._id}
                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${selectedTaskId === task._id
                        ? 'border-custom-brown bg-custom-brown/10'
                        : 'border-transparent hover:bg-off-white'
                      }`}
                  >
                    <input
                      type="radio"
                      name="task"
                      value={task._id}
                      checked={selectedTaskId === task._id}
                      onChange={() => setSelectedTaskId(task._id)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-dark-blue">{task.title}</p>

                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTask(task);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task._id);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray text-center py-4">
                  No tasks found.
                </p>
              )}
            </div>
          </div>

          {showNewTaskForm && (
            <div className="mb-4 p-4 bg-off-white rounded-lg border">
              <h3 className="text-sm font-medium mb-2 text-dark-blue">
                Create New Task
              </h3>
              <Input
                placeholder="Enter new task name..."
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                className="mb-2"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowNewTaskForm(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateTask}>Create & Select</Button>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray mb-2">
              Duration (minutes)
            </label>
            <Input
              type="number"
              min="1"
              max="480"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              placeholder="60"
            />
            <p className="text-xs text-gray mt-1">
              {duration >= 60
                ? `${Math.floor(duration / 60)}h ${duration % 60}m`
                : `${duration} minutes`}
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-medium text-dark-blue flex items-center">
              <Repeat className="w-5 h-5 mr-2" />
              Recurrence
            </h3>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isRecurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 text-custom-brown border-light-gray rounded focus:ring-custom-brown"
              />
              <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray">
                This is a recurring allocation
              </label>
            </div>
            {isRecurring && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="recurrenceType" className="block text-xs font-medium text-gray mb-1">
                    Frequency
                  </label>
                  <select
                    id="recurrenceType"
                    value={recurrenceType}
                    onChange={(e) => setRecurrenceType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-light-gray rounded-lg focus:ring-2 focus:ring-custom-brown focus:border-custom-brown bg-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="recurrenceInterval" className="block text-xs font-medium text-gray mb-1">
                    Interval
                  </label>
                  <Input
                    type="number"
                    id="recurrenceInterval"
                    min="1"
                    step="1"
                    value={recurrenceInterval}
                    onChange={(e) => setRecurrenceInterval(Number(e.target.value))}
                    className="w-full"
                    placeholder={`e.g., every 2 ${recurrenceType}s`}
                  />
                </div>
                <div className="col-span-2">
                  <label htmlFor="recurrenceEndDate" className="block text-xs font-medium text-gray mb-1">
                    End Date (optional)
                  </label>
                  <Input
                    type="date"
                    id="recurrenceEndDate"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="default"
            className="flex-1"
            disabled={!selectedTaskId || duration <= 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Allocation
          </Button>
        </div>
        {editingTask && (
          <EditTaskModal
            task={editingTask}
            onClose={() => setEditingTask(null)}
            onSave={handleUpdateTask}
          />
        )}
      </div>
    </div>
  );
}
