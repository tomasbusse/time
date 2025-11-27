import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Trash2 } from 'lucide-react';

export default function TempDeletePage() {
  const { workspaceId } = useWorkspace();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const deleteTestHouse = useMutation(api.temp_data_clear.deleteTestHouseAsset);
  const clearTimeAllocations = useMutation(api.temp_data_clear.clearTimeAllocations);

  const handleClearAllocations = async () => {
    if (!workspaceId) {
      setResult({ type: 'error', message: 'Workspace not found.' });
      return;
    }
    setIsLoading(true);
    try {
      const response = await clearTimeAllocations({ workspaceId });
      setResult({ type: 'success', data: response });
    } catch (e: any) {
      setResult({ type: 'error', message: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!workspaceId) {
      setResult({ type: 'error', message: 'Workspace not found.' });
      return;
    }
    setIsLoading(true);
    try {
      const response = await deleteTestHouse({ workspaceId });
      setResult({ type: 'success', data: response });
    } catch (e: any) {
      setResult({ type: 'error', message: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Card className="border-brown">
        <CardHeader>
          <CardTitle className="text-brown flex items-center gap-2">
            <Trash2 />
            Delete "Test House" Asset
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray">
            This action will permanently delete the asset named "Test House" from your current workspace. This cannot be undone.
          </p>
          <Button
            onClick={handleDelete}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? 'Deleting...' : 'Delete "Test House" Asset'}
          </Button>
          {result && (
            <div className={`mt-4 p-3 rounded-md text-sm ${result.type === 'error' ? 'bg-light-gray text-red-800' : 'bg-light-gray text-green-800'}`}>
              <pre>{JSON.stringify(result.data || result, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="border-blue-500 mt-8">
        <CardHeader>
          <CardTitle className="text-blue-500 flex items-center gap-2">
            <Trash2 />
            Clear Time Allocations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray">
            This action will permanently delete all time allocations from your current workspace. This cannot be undone.
          </p>
          <Button
            onClick={handleClearAllocations}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? 'Deleting...' : 'Clear All Time Allocations'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}