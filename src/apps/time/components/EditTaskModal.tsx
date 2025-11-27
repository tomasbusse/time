import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Doc, Id } from '../../../../convex/_generated/dataModel';

interface EditTaskModalProps {
  task: Doc<'tasks'>;
  onClose: () => void;
  onSave: (id: Id<'tasks'>, title: string) => void;
}

export default function EditTaskModal({ task, onClose, onSave }: EditTaskModalProps) {
  const [title, setTitle] = useState(task.title);

  useEffect(() => {
    setTitle(task.title);
  }, [task]);

  const handleSave = () => {
    onSave(task._id, title);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Edit Task</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="taskName" className="block text-sm font-medium text-gray mb-1">
              Task Name
            </label>
            <Input
              id="taskName"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full"
            />
          </div>
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