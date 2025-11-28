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

  // Show error if user exists but no workspace
  if (value.userId && !value.workspaceId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off-white">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-dark-blue mb-4">Workspace Not Found</h2>
          <p className="text-gray mb-6">
            Your account exists but doesn't have a workspace associated with it.
            Please contact support or run the setup script.
          </p>
          <div className="bg-light-gray p-4 rounded-lg text-left">
            <p className="text-sm font-mono text-dark-blue mb-2">Run in Convex dashboard:</p>
            <code className="text-xs bg-white p-2 rounded block">
              await ctx.runMutation(api.users.createAccount, &#123;<br/>
              &nbsp;&nbsp;email: "{workspaceData?.userName || 'your-email'}@example.com",<br/>
              &nbsp;&nbsp;name: "{workspaceData?.userName || 'Your Name'}"<br/>
              &#125;)
            </code>
          </div>
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

