import { BrowserRouter as Router } from 'react-router-dom'
import { useState } from 'react'
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/clerk-react'
import { ConvexReactClient } from 'convex/react'
import { ConvexProvider, useQuery } from 'convex/react'
import { WorkspaceProvider } from './lib/WorkspaceContext'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import AppRoutes from './routes'
import { useWorkspace } from './lib/WorkspaceContext'
import { api } from '../convex/_generated/api'

const convexUrl = import.meta.env.VITE_CONVEX_URL || 'https://placeholder.convex.cloud'
const convex = new ConvexReactClient(convexUrl)
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY!

function AppContent() {
  const { userId, isLoading, workspaceId } = useWorkspace();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user } = useUser();
  const authorizedEmails = useQuery(api.auth.listAuthorizedEmails) || [];

  console.log('AppContent - userId:', userId, 'workspaceId:', workspaceId, 'isLoading:', isLoading);

  if (isLoading || authorizedEmails === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-custom-brown mx-auto mb-4"></div>
          <p className="text-gray">Loading workspace data...</p>
          <p className="text-gray-400 text-sm mt-2">Connecting to Convex...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-off-white">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        {/* Responsive main content area */}
        <div className="flex-1 transition-all duration-300 min-w-0">
          <TopBar />
          <main className="p-4 sm:p-6 lg:p-8">
            <AppRoutes />
          </main>
        </div>
      </div>
    </Router>
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <ConvexProvider client={convex}>
        <SignedIn>
          <WorkspaceProvider>
            <AppContent />
          </WorkspaceProvider>
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </ConvexProvider>
    </ClerkProvider>
  )
}

export default App
