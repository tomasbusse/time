import { createContext, useContext, ReactNode } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

interface WorkspaceContextType {
  userId: Id<"users"> | null
  workspaceId: Id<"workspaces"> | null
  userName: string | null
  isLoading: boolean
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  userId: null,
  workspaceId: null,
  userName: null,
  isLoading: true,
})

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  // Get workspace data from Convex
  const workspaceData = useQuery(api.setup.getDefaultWorkspace)

  const value: WorkspaceContextType = {
    userId: workspaceData?.userId || null,
    workspaceId: workspaceData?.workspaceId || null,
    userName: workspaceData?.userName || null,
    isLoading: workspaceData === undefined,
  }

  if (value.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspace must be used within WorkspaceProvider')
  }
  return context
}

