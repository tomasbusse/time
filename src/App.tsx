import { BrowserRouter as Router } from 'react-router-dom'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { WorkspaceProvider } from './lib/WorkspaceContext'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import AppRoutes from './routes'

const convexUrl = import.meta.env.VITE_CONVEX_URL || 'https://placeholder.convex.cloud'
const convex = new ConvexReactClient(convexUrl)

function App() {
  return (
    <ConvexProvider client={convex}>
      <WorkspaceProvider>
        <Router>
          <div className="flex min-h-screen bg-neutral-50">
            <Sidebar />
            <div className="flex-1 ml-64 transition-all duration-300">
              <TopBar />
              <main className="p-8">
                <AppRoutes />
              </main>
            </div>
          </div>
        </Router>
      </WorkspaceProvider>
    </ConvexProvider>
  )
}

export default App
