import { useState } from 'react';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface Task {
  _id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  dailyAllocation?: number;
  weeklyAllocation?: number;
  monthlyAllocation?: number;
  yearlyAllocation?: number;
  timeSpent?: number;
  createdAt: number;
}

export function Todos() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  // Mock workspace ID - in a real app this would come from authentication
  const workspaceId = "workspace-123" as any;

  // Convex queries and mutations
  const tasks = useQuery(api.flow.listTasks, workspaceId ? { workspaceId } : "skip");
  const timeSummary = useQuery(api.flow.getTimeAllocationSummary, workspaceId ? { workspaceId } : "skip");
  const createTaskMutation = useMutation(api.flow.createTask);
  const updateTaskMutation = useMutation(api.flow.updateTask);
  const deleteTaskMutation = useMutation(api.flow.deleteTask);

  const handleCreateTask = async (taskData: any) => {
    setIsLoading(true);
    try {
      await createTaskMutation({
        ...taskData,
        workspaceId,
      });
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTask = async (taskData: any) => {
    if (!editingTask) return;

    setIsLoading(true);
    try {
      await updateTaskMutation({
        taskId: editingTask._id as any,
        workspaceId,
        ...taskData,
      });
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTaskMutation({ taskId: taskId as any });
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleToggleCompletion = async (task: Task) => {
    try {
      // Note: updateTask doesn't support status directly, this would need a separate mutation
      console.log('Toggle completion for:', task._id);
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  const openCreateModal = () => {
    setEditingTask(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(undefined);
  };

  const formatTimeAllocation = (task: Task) => {
    const allocations = [];
    if (task.dailyAllocation) allocations.push(`📅 ${task.dailyAllocation}h/day`);
    if (task.weeklyAllocation) allocations.push(`📊 ${task.weeklyAllocation}h/week`);
    if (task.monthlyAllocation) allocations.push(`📈 ${task.monthlyAllocation}h/month`);
    if (task.yearlyAllocation) allocations.push(`📋 ${task.yearlyAllocation}h/year`);
    return allocations;
  };

  const getProgressPercentage = (task: Task) => {
    const dailyAllocation = task.dailyAllocation;
    if (!dailyAllocation || !task.timeSpent) return 0;
    return Math.min((task.timeSpent / dailyAllocation) * 100, 100);
  };

  if (tasks === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          <span>Loading tasks...</span>
        </div>
      </div>
    );
  }

  const completedTasks = tasks.filter((task: any) => task.status === "completed").length;
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter((task: any) => task.status !== "completed").length;
  const pendingTasks = tasks.filter((task: any) => task.status !== "completed" && !task.timeSpent).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-dark-blue">Tasks</h1>
          <p className="text-gray mt-1">Manage your daily tasks and time allocation</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-dark-blue hover:bg-dark-blue text-off-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined">add</span>
          Add Task
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-off-white-light rounded-xl p-6 border border-gray-light shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-light-gray p-3 rounded-lg">
              <span className="material-symbols-outlined text-dark-blue text-2xl">check_circle</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray">Completed</h3>
              <p className="text-2xl font-bold text-dark-blue">{completedTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-off-white-light rounded-xl p-6 border border-gray-light shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-500/10 p-3 rounded-lg">
              <span className="material-symbols-outlined text-yellow-500 text-2xl">schedule</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray">In Progress</h3>
              <p className="text-2xl font-bold text-dark-blue">{inProgressTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-off-white-light rounded-xl p-6 border border-gray-light shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-brown/10 p-3 rounded-lg">
              <span className="material-symbols-outlined text-brown text-2xl">timer</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray">Time Allocated</h3>
              <p className="text-2xl font-bold text-dark-blue">{timeSummary?.tasksWithAllocation || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-off-white-light rounded-xl p-6 border border-gray-light shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-off-white-light p-3 rounded-lg">
              <span className="material-symbols-outlined text-gray text-2xl">pending</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray">Pending</h3>
              <p className="text-2xl font-bold text-dark-blue">{pendingTasks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Time Allocation Summary */}
      {timeSummary && (timeSummary.totalDailyAllocation > 0 || timeSummary.totalWeeklyAllocation > 0) && (
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-6 border border-light-gray">
          <h2 className="text-xl font-bold text-dark-blue mb-4">Time Allocation Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {timeSummary.totalDailyAllocation > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-dark-blue">{timeSummary.totalDailyAllocation.toFixed(1)}</div>
                <div className="text-sm text-gray">Hours/Day</div>
              </div>
            )}
            {timeSummary.totalWeeklyAllocation > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-brown-600">{timeSummary.totalWeeklyAllocation.toFixed(1)}</div>
                <div className="text-sm text-gray">Hours/Week</div>
              </div>
            )}
            {timeSummary.totalMonthlyAllocation > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-dark-blue">{timeSummary.totalMonthlyAllocation.toFixed(1)}</div>
                <div className="text-sm text-gray">Hours/Month</div>
              </div>
            )}
            {timeSummary.totalTimeSpent > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500-600">{timeSummary.totalTimeSpent.toFixed(1)}</div>
                <div className="text-sm text-gray">Time Spent</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="bg-off-white-light rounded-xl border border-gray-light shadow-sm">
        <div className="p-6 border-b border-gray-light">
          <h2 className="text-xl font-bold text-dark-blue">All Tasks</h2>
        </div>
        <div className="p-6">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl text-gray mb-4">📝</div>
              <h3 className="text-xl font-semibold text-dark-blue mb-2">No tasks yet</h3>
              <p className="text-gray mb-6">Create your first task to get started with time allocation</p>
              <button
                onClick={openCreateModal}
                className="bg-dark-blue hover:bg-dark-blue text-off-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center gap-2 mx-auto"
              >
                <span className="material-symbols-outlined">add</span>
                Create Your First Task
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task: any) => (
                <div
                  key={task._id}
                  className="flex items-center gap-4 p-4 rounded-lg hover:bg-off-white transition-colors duration-200 border border-gray-light/50"
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={task.status === "completed"}
                    onChange={() => handleToggleCompletion(task)}
                    className="form-checkbox size-5 rounded text-dark-blue border-gray-light focus:ring-dark-blue"
                  />

                  {/* Task Content */}
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => openEditModal(task)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${task.status === "completed" ? 'line-through text-gray' : 'text-dark-blue'
                          }`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className={`text-xs mt-1 ${task.status === "completed" ? 'line-through text-gray' : 'text-gray'
                            }`}>
                            {task.description}
                          </p>
                        )}

                        {/* Time Allocation Badges */}
                        {formatTimeAllocation(task).length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {formatTimeAllocation(task).map((allocation, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-light-gray text-dark-blue text-xs rounded-full"
                              >
                                {allocation}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Progress Bar */}
                        {task.dailyAllocation && task.timeSpent && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-gray mb-1">
                              <span>Daily Progress</span>
                              <span>{getProgressPercentage(task).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-off-white rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${getProgressPercentage(task) >= 100
                                  ? 'bg-green-500'
                                  : getProgressPercentage(task) >= 75
                                    ? 'bg-yellow-500'
                                    : 'bg-off-white0'
                                  }`}
                                style={{ width: `${getProgressPercentage(task)}%` }}
                              />
                            </div>
                            {task.timeSpent > 0 && (
                              <div className="text-xs text-gray mt-1">
                                {task.timeSpent.toFixed(1)}h of {task.dailyAllocation}h allocated
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Priority Badge */}
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${task.priority === 'high' ? 'bg-off-white0/10 text-red-500' :
                    task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-green-500/10 text-green-500'
                    }`}>
                    {task.priority}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(task)}
                      className="p-2 text-gray hover:text-dark-blue hover:bg-off-white rounded-lg transition-colors"
                      title="Edit task"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="p-2 text-gray hover:text-red-500 hover:bg-off-white0/10 rounded-lg transition-colors"
                      title="Delete task"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={editingTask}
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={editingTask ? handleUpdateTask : handleCreateTask}
        isLoading={isLoading}
      />
    </div>
  );
}