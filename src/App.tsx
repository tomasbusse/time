import { BrowserRouter as Router, Navigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { ConvexReactClient, useQuery, useConvexAuth } from 'convex/react'
import { ConvexAuthProvider } from "@convex-dev/auth/react"
import { WorkspaceProvider } from './lib/WorkspaceContext'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import AppRoutes from './routes'
import { useWorkspace } from './lib/WorkspaceContext'
import { api } from '../convex/_generated/api'

const convexUrl = import.meta.env.VITE_CONVEX_URL || 'https://placeholder.convex.cloud'
const convex = new ConvexReactClient(convexUrl)

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-custom-brown mx-auto mb-4"></div>
          <p className="text-gray">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Allow unauthenticated access to login and OAuth callback pages
  const publicPaths = ['/login', '/auth/google/callback'];
  const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path));

  if (!isAuthenticated && !isPublicPath) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated and on login page, redirect to home
  if (isAuthenticated && location.pathname === '/login') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { userId, isLoading, workspaceId } = useWorkspace();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const authorizedEmails = useQuery(api.auth.listAuthorizedEmails) || [];

  // Public pages don't need the app shell (sidebar, topbar)
  const publicPaths = ['/login', '/auth/google/callback'];
  const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path));

  if (isPublicPath) {
    return <AppRoutes />;
  }

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
    <div className="flex min-h-screen bg-off-white">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />
      {/* Responsive main content area */}
      <div className="flex-1 transition-all duration-300 min-w-0">
        <TopBar onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="p-4 sm:p-6 lg:p-8">
          <AppRoutes />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ConvexAuthProvider client={convex}>
      <Router>
        <AuthGate>
          <WorkspaceProvider>
            <AppContent />
          </WorkspaceProvider>
        </AuthGate>
      </Router>
    </ConvexAuthProvider>
  )
}

export default App
