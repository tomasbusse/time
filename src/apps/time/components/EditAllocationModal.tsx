import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Doc } from '../../../../convex/_generated/dataModel';
import { Repeat } from 'lucide-react';

interface EditAllocationModalProps {
  allocation: Doc<'timeAllocations'>;
  onClose: () => void;
  onSave: (id: string, data: Partial<Doc<'timeAllocations'>>) => void;
}

export default function EditAllocationModal({ allocation, onClose, onSave }: EditAllocationModalProps) {
  const [taskName, setTaskName] = useState(allocation.taskName);
  const [allocatedDuration, setAllocatedDuration] = useState(allocation.allocatedDuration);
  const [isRecurring, setIsRecurring] = useState(allocation.isRecurring || false);
  const [recurrenceType, setRecurrenceType] = useState(allocation.recurrenceType || 'daily');
  const [recurrenceInterval, setRecurrenceInterval] = useState(allocation.recurrenceInterval || 1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(allocation.recurrenceEndDate || '');

  useEffect(() => {
    setTaskName(allocation.taskName);
    setAllocatedDuration(allocation.allocatedDuration);
    setIsRecurring(allocation.isRecurring || false);
    setRecurrenceType(allocation.recurrenceType || 'daily');
    setRecurrenceInterval(allocation.recurrenceInterval || 1);
    setRecurrenceEndDate(allocation.recurrenceEndDate || '');
  }, [allocation]);

  const handleSave = () => {
    onSave(allocation._id, {
      taskName,
      allocatedDuration,
      isRecurring,
      recurrenceType,
      recurrenceInterval,
      recurrenceEndDate,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Edit Time Allocation</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="taskName" className="block text-sm font-medium text-gray mb-1">
              Task Name
            </label>
            <Input
              id="taskName"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray mb-1">
              Allocated Duration (minutes)
            </label>
            <Input
              id="duration"
              type="number"
              value={allocatedDuration}
              onChange={(e) => setAllocatedDuration(Number(e.target.value))}
              className="w-full"
            />
          </div>
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
        <div className="mt-8 flex justify-end gap-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}