import { createContext, useContext, ReactNode } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Doc, Id } from '../../convex/_generated/dataModel'

interface WorkspaceContextType {
  userId: Id<"users"> | null
  workspaceId: Id<"workspaces"> | null
  userName: string | null
  workspace: Doc<"workspaces"> | null
  isLoading: boolean
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  userId: null,
  workspaceId: null,
  userName: null,
  workspace: null,
  isLoading: true,
})

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  // Get workspace data from Convex
  const workspaceData = useQuery(api.setup.getDefaultWorkspace)

  console.log('WorkspaceProvider - workspaceData:', workspaceData);

  const value: WorkspaceContextType = {
    userId: workspaceData?.userId || null,
    workspaceId: workspaceData?.workspaceId || null,
    userName: workspaceData?.userName || null,
    workspace: workspaceData?.workspace || null,
    isLoading: workspaceData === undefined,
  }

  if (value.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-custom-brown mx-auto mb-4"></div>
          <p className="text-gray">Loading workspace...</p>
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

