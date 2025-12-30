import { createContext, useContext, ReactNode, useEffect, useState } from 'react'
import { useQuery, useMutation, useConvexAuth } from 'convex/react'
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
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const [isSettingUp, setIsSettingUp] = useState(false)
  
  const workspaceData = useQuery(api.setup.getDefaultWorkspace)
  const ensureWorkspace = useMutation(api.setup.ensureWorkspaceExists)

  useEffect(() => {
    const setupWorkspace = async () => {
      if (!authLoading && isAuthenticated && workspaceData === null && !isSettingUp) {
        setIsSettingUp(true)
        try {
          await ensureWorkspace()
        } catch (error) {
          console.error('Failed to setup workspace:', error)
        }
        setIsSettingUp(false)
      }
    }
    setupWorkspace()
  }, [authLoading, isAuthenticated, workspaceData, isSettingUp, ensureWorkspace])

  const isLoading = authLoading || workspaceData === undefined || isSettingUp || (isAuthenticated && workspaceData === null)

  const value: WorkspaceContextType = {
    userId: workspaceData?.userId || null,
    workspaceId: workspaceData?.workspaceId || null,
    userName: workspaceData?.userName || null,
    workspace: workspaceData?.workspace || null,
    isLoading,
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-custom-brown mx-auto mb-4"></div>
          <p className="text-gray">{isSettingUp ? 'Setting up your workspace...' : 'Loading workspace...'}</p>
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
