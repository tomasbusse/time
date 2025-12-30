import { BrowserRouter as Router, Navigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { ConvexReactClient, useQuery } from 'convex/react'
import { ClerkProvider, useAuth, SignedIn, SignedOut } from '@clerk/clerk-react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { WorkspaceProvider } from './lib/WorkspaceContext'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import AppRoutes from './routes'
import { useWorkspace } from './lib/WorkspaceContext'
import { api } from '../convex/_generated/api'

const convexUrl = import.meta.env.VITE_CONVEX_URL || 'https://placeholder.convex.cloud'
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const convex = new ConvexReactClient(convexUrl)

function AuthGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const publicPaths = ['/login', '/auth/google/callback'];
  const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path));

  return (
    <>
      <SignedIn>
        {location.pathname === '/login' ? <Navigate to="/" replace /> : children}
      </SignedIn>
      <SignedOut>
        {isPublicPath ? children : <Navigate to="/login" replace />}
      </SignedOut>
    </>
  );
}

function AppContent() {
  const { userId, isLoading, workspaceId } = useWorkspace();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const authorizedEmails = useQuery(api.auth.listAuthorizedEmails) || [];

  const publicPaths = ['/login', '/auth/google/callback'];
  const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path));

  if (isPublicPath) {
    return <AppRoutes />;
  }

  if (isLoading || authorizedEmails === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-custom-brown mx-auto mb-4"></div>
          <p className="text-gray">Loading workspace data...</p>
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
  if (!clerkPubKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center text-red-600">
          <p className="text-xl font-bold">Missing Clerk Publishable Key</p>
          <p className="text-sm mt-2">Set VITE_CLERK_PUBLISHABLE_KEY in your environment</p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <Router>
          <AuthGate>
            <WorkspaceProvider>
              <AppContent />
            </WorkspaceProvider>
          </AuthGate>
        </Router>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}

export default App
