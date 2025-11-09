import { useState, useEffect } from 'react';
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

  // Mock user ID - in a real app this would come from authentication
  const userId = "user-123";

  // Convex queries and mutations
  const tasks = useQuery(api.flow.getTasks, { userId });
  const timeSummary = useQuery(api.flow.getTimeAllocationSummary, { userId });
  const createTaskMutation = useMutation(api.flow.createTask);
  const updateTaskMutation = useMutation(api.flow.updateTask);
  const deleteTaskMutation = useMutation(api.flow.deleteTask);
  const toggleTaskMutation = useMutation(api.flow.toggleTaskCompletion);

  const handleCreateTask = async (taskData: any) => {
    setIsLoading(true);
    try {
      await createTaskMutation({
        ...taskData,
        userId,
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
        taskId: editingTask._id,
        userId,
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
        await deleteTaskMutation({ taskId, userId });
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleToggleCompletion = async (task: Task) => {
    try {
      await toggleTaskMutation({
        taskId: task._id,
        userId,
        completed: !task.completed,
      });
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
        <div className="flex items-center gap-3 text-text-muted">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          <span>Loading tasks...</span>
        </div>
      </div>
    );
  }

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter(task => !task.completed).length;
  const pendingTasks = tasks.filter(task => !task.completed && !task.timeSpent).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Tasks</h1>
          <p className="text-text-secondary mt-1">Manage your daily tasks and time allocation</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined">add</span>
          Add Task
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-background-light rounded-xl p-6 border border-border-light shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-primary-100 p-3 rounded-lg">
              <span className="material-symbols-outlined text-primary-600 text-2xl">check_circle</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-secondary">Completed</h3>
              <p className="text-2xl font-bold text-text-primary">{completedTasks}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-background-light rounded-xl p-6 border border-border-light shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-warning/10 p-3 rounded-lg">
              <span className="material-symbols-outlined text-warning text-2xl">schedule</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-secondary">In Progress</h3>
              <p className="text-2xl font-bold text-text-primary">{inProgressTasks}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-background-light rounded-xl p-6 border border-border-light shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-accent/10 p-3 rounded-lg">
              <span className="material-symbols-outlined text-accent text-2xl">timer</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-secondary">Time Allocated</h3>
              <p className="text-2xl font-bold text-text-primary">{timeSummary?.tasksWithAllocation || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-background-light rounded-xl p-6 border border-border-light shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-background-light p-3 rounded-lg">
              <span className="material-symbols-outlined text-text-muted text-2xl">pending</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-secondary">Pending</h3>
              <p className="text-2xl font-bold text-text-primary">{pendingTasks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Time Allocation Summary */}
      {timeSummary && (timeSummary.totalDailyAllocation > 0 || timeSummary.totalWeeklyAllocation > 0) && (
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-6 border border-primary-100">
          <h2 className="text-xl font-bold text-text-primary mb-4">Time Allocation Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {timeSummary.totalDailyAllocation > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{timeSummary.totalDailyAllocation.toFixed(1)}</div>
                <div className="text-sm text-text-secondary">Hours/Day</div>
              </div>
            )}
            {timeSummary.totalWeeklyAllocation > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-accent-600">{timeSummary.totalWeeklyAllocation.toFixed(1)}</div>
                <div className="text-sm text-text-secondary">Hours/Week</div>
              </div>
            )}
            {timeSummary.totalMonthlyAllocation > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{timeSummary.totalMonthlyAllocation.toFixed(1)}</div>
                <div className="text-sm text-text-secondary">Hours/Month</div>
              </div>
            )}
            {timeSummary.totalTimeSpent > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-success-600">{timeSummary.totalTimeSpent.toFixed(1)}</div>
                <div className="text-sm text-text-secondary">Time Spent</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="bg-background-light rounded-xl border border-border-light shadow-sm">
        <div className="p-6 border-b border-border-light">
          <h2 className="text-xl font-bold text-text-primary">All Tasks</h2>
        </div>
        <div className="p-6">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl text-text-muted mb-4">📝</div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">No tasks yet</h3>
              <p className="text-text-secondary mb-6">Create your first task to get started with time allocation</p>
              <button 
                onClick={openCreateModal}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center gap-2 mx-auto"
              >
                <span className="material-symbols-outlined">add</span>
                Create Your First Task
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div 
                  key={task._id} 
                  className="flex items-center gap-4 p-4 rounded-lg hover:bg-surface-light transition-colors duration-200 border border-border-light/50"
                >
                  {/* Checkbox */}
                  <input 
                    type="checkbox" 
                    checked={task.completed}
                    onChange={() => handleToggleCompletion(task)}
                    className="form-checkbox size-5 rounded text-primary-600 border-border-light focus:ring-primary-500" 
                  />

                  {/* Task Content */}
                  <div 
                    className="flex-1 cursor-pointer" 
                    onClick={() => openEditModal(task)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          task.completed ? 'line-through text-text-muted' : 'text-text-primary'
                        }`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className={`text-xs mt-1 ${
                            task.completed ? 'line-through text-text-muted' : 'text-text-secondary'
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
                                className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full"
                              >
                                {allocation}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Progress Bar */}
                        {task.dailyAllocation && task.timeSpent && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                              <span>Daily Progress</span>
                              <span>{getProgressPercentage(task).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-surface-light rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  getProgressPercentage(task) >= 100 
                                    ? 'bg-success' 
                                    : getProgressPercentage(task) >= 75 
                                    ? 'bg-warning' 
                                    : 'bg-primary-500'
                                }`}
                                style={{ width: `${getProgressPercentage(task)}%` }}
                              />
                            </div>
                            {task.timeSpent > 0 && (
                              <div className="text-xs text-text-secondary mt-1">
                                {task.timeSpent.toFixed(1)}h of {task.dailyAllocation}h allocated
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Priority Badge */}
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    task.priority === 'high' ? 'bg-error/10 text-error' :
                    task.priority === 'medium' ? 'bg-warning/10 text-warning' :
                    'bg-success/10 text-success'
                  }`}>
                    {task.priority}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(task)}
                      className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-light rounded-lg transition-colors"
                      title="Edit task"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
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