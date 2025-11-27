import { Play, Clock, MoreVertical, Edit, Trash2, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

interface TimeAllocationCardProps {
  taskName: string;
  allocatedDuration: number;
  timeSpent?: number;
  category?: string;
  isRecurring?: boolean;
  onStartTimer: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TimeAllocationCard({
  taskName,
  allocatedDuration,
  timeSpent = 0,
  category,
  onStartTimer,
  onEdit,
  onDelete,
  isRecurring,
}: TimeAllocationCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const progressPercentage =
    allocatedDuration > 0 ? Math.min((timeSpent / allocatedDuration) * 100, 100) : 0;

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
          <h3 className="text-lg font-semibold text-dark-blue mb-1">
            {taskName}
          </h3>
          {category && (
            <span className="inline-block text-xs px-2 py-1 bg-light-gray text-custom-brown rounded">
              {category}
            </span>
          )}
          {isRecurring && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-light-gray text-custom-brown rounded-md border border-custom-brown/40">
              <Repeat className="w-3 h-3" />
              Recurring
            </span>
          )}
        </div>
        
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 hover:bg-light-gray rounded"
          >
            <MoreVertical className="w-5 h-5 text-gray" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
              <button
                onClick={() => {
                  onEdit();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray hover:bg-light-gray flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-light-gray flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray mb-2">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Allocated: {formatDuration(allocatedDuration)}</span>
          </div>
          <span>Spent: {formatDuration(timeSpent)}</span>
        </div>

        <div className="w-full bg-light-gray rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              progressPercentage >= 100 ? 'bg-off-white0' : 'bg-dark-blue'
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
