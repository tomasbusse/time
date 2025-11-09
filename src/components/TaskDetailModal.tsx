import { useState } from 'react';

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
}

interface TaskDetailModalProps {
  task?: Task;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => Promise<void>;
  isLoading?: boolean;
}

export function TaskDetailModal({ task, isOpen, onClose, onSave, isLoading }: TaskDetailModalProps) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium' as const,
    dailyAllocation: task?.dailyAllocation?.toString() || '',
    weeklyAllocation: task?.weeklyAllocation?.toString() || '',
    monthlyAllocation: task?.monthlyAllocation?.toString() || '',
    yearlyAllocation: task?.yearlyAllocation?.toString() || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    // Validate time allocations are positive numbers
    const allocationFields = ['dailyAllocation', 'weeklyAllocation', 'monthlyAllocation', 'yearlyAllocation'];
    allocationFields.forEach(field => {
      const value = formData[field as keyof typeof formData];
      if (value && (isNaN(Number(value)) || Number(value) < 0)) {
        newErrors[field] = 'Must be a positive number';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      priority: formData.priority,
      dailyAllocation: formData.dailyAllocation ? Number(formData.dailyAllocation) : undefined,
      weeklyAllocation: formData.weeklyAllocation ? Number(formData.weeklyAllocation) : undefined,
      monthlyAllocation: formData.monthlyAllocation ? Number(formData.monthlyAllocation) : undefined,
      yearlyAllocation: formData.yearlyAllocation ? Number(formData.yearlyAllocation) : undefined,
    };

    try {
      await onSave(taskData);
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-light rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border-light">
          <h2 className="text-2xl font-bold text-text-primary">
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
            disabled={isLoading}
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.title ? 'border-error' : 'border-border-light'
              } bg-background-light text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors`}
              placeholder="Enter task title"
              disabled={isLoading}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-error">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-border-light bg-background-light text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
              placeholder="Enter task description (optional)"
              disabled={isLoading}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border-light bg-background-light text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              disabled={isLoading}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Time Allocation Section */}
          <div className="bg-surface-light rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary-600">schedule</span>
              <h3 className="text-lg font-semibold text-text-primary">Time Allocation</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Daily Allocation */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Daily (hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.dailyAllocation}
                  onChange={(e) => handleInputChange('dailyAllocation', e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.dailyAllocation ? 'border-error' : 'border-border-light'
                  } bg-background-light text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors`}
                  placeholder="0"
                  disabled={isLoading}
                />
                {errors.dailyAllocation && (
                  <p className="mt-1 text-sm text-error">{errors.dailyAllocation}</p>
                )}
              </div>

              {/* Weekly Allocation */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Weekly (hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.weeklyAllocation}
                  onChange={(e) => handleInputChange('weeklyAllocation', e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.weeklyAllocation ? 'border-error' : 'border-border-light'
                  } bg-background-light text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors`}
                  placeholder="0"
                  disabled={isLoading}
                />
                {errors.weeklyAllocation && (
                  <p className="mt-1 text-sm text-error">{errors.weeklyAllocation}</p>
                )}
              </div>

              {/* Monthly Allocation */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Monthly (hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.monthlyAllocation}
                  onChange={(e) => handleInputChange('monthlyAllocation', e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.monthlyAllocation ? 'border-error' : 'border-border-light'
                  } bg-background-light text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors`}
                  placeholder="0"
                  disabled={isLoading}
                />
                {errors.monthlyAllocation && (
                  <p className="mt-1 text-sm text-error">{errors.monthlyAllocation}</p>
                )}
              </div>

              {/* Yearly Allocation */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Yearly (hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.yearlyAllocation}
                  onChange={(e) => handleInputChange('yearlyAllocation', e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.yearlyAllocation ? 'border-error' : 'border-border-light'
                  } bg-background-light text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors`}
                  placeholder="0"
                  disabled={isLoading}
                />
                {errors.yearlyAllocation && (
                  <p className="mt-1 text-sm text-error">{errors.yearlyAllocation}</p>
                )}
              </div>
            </div>

            {/* Show total allocated time if any allocations are set */}
            {((task?.dailyAllocation || formData.dailyAllocation) ||
              (task?.weeklyAllocation || formData.weeklyAllocation) ||
              (task?.monthlyAllocation || formData.monthlyAllocation) ||
              (task?.yearlyAllocation || formData.yearlyAllocation)) && (
              <div className="bg-primary-50 rounded-lg p-4 mt-4">
                <h4 className="text-sm font-medium text-primary-700 mb-2">Time Allocation Summary</h4>
                <div className="text-sm text-primary-600">
                  {task?.timeSpent !== undefined && (
                    <p>⏱️ Time spent: {task.timeSpent.toFixed(1)} hours</p>
                  )}
                  {(task?.dailyAllocation || formData.dailyAllocation) && (
                    <p>📅 Daily: {task?.dailyAllocation || formData.dailyAllocation} hours</p>
                  )}
                  {(task?.weeklyAllocation || formData.weeklyAllocation) && (
                    <p>📊 Weekly: {task?.weeklyAllocation || formData.weeklyAllocation} hours</p>
                  )}
                  {(task?.monthlyAllocation || formData.monthlyAllocation) && (
                    <p>📈 Monthly: {task?.monthlyAllocation || formData.monthlyAllocation} hours</p>
                  )}
                  {(task?.yearlyAllocation || formData.yearlyAllocation) && (
                    <p>📋 Yearly: {task?.yearlyAllocation || formData.yearlyAllocation} hours</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-3 rounded-lg font-medium transition-colors duration-200 border border-border-light text-text-secondary hover:bg-surface-light disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.title.trim()}
              className="px-6 py-3 rounded-lg font-medium transition-colors duration-200 bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && <span className="material-symbols-outlined animate-spin">progress_activity</span>}
              {task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}