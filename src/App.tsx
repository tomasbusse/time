import { BrowserRouter as Router } from 'react-router-dom'
import { useState } from 'react'
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from 'convex/react'
import { WorkspaceProvider } from './lib/WorkspaceContext'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import AppRoutes from './routes'
import LoginPage from './pages/LoginPage'
import { useWorkspace } from './lib/WorkspaceContext'

const convexUrl = import.meta.env.VITE_CONVEX_URL || 'https://placeholder.convex.cloud'
const convex = new ConvexReactClient(convexUrl)

function AppContent() {
  const { userId, isLoading, workspaceId } = useWorkspace();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  console.log('AppContent - userId:', userId, 'workspaceId:', workspaceId, 'isLoading:', isLoading);

  if (isLoading) {
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

  // Show login page if not authenticated
  if (!userId) {
    return <LoginPage />;
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
    <ConvexAuthProvider client={convex}>
      <WorkspaceProvider>
        <AppContent />
      </WorkspaceProvider>
    </ConvexAuthProvider>
  )
}

export default App
