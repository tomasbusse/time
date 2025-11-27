import { DraggableDashboard } from '@/components/ui/DraggableDashboard'
import { useWorkspace } from '@/lib/WorkspaceContext'

export default function Dashboard() {
  const { workspaceId, userId, userName } = useWorkspace()
  
  // Handle null values by showing loading state
  if (!workspaceId || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-custom-off-white p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-custom-brown mx-auto mb-4"></div>
          <p className="text-gray text-sm sm:text-base">Loading dashboard...</p>
        </div>
      </div>
    )
  }
  
  return <DraggableDashboard workspaceId={workspaceId} userId={userId} userName={userName} />
}
