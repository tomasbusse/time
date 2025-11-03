import { BrowserRouter as Router } from 'react-router-dom'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { WorkspaceProvider } from './lib/WorkspaceContext'
import AppRoutes from './routes'

const convexUrl = import.meta.env.VITE_CONVEX_URL || 'https://placeholder.convex.cloud'
const convex = new ConvexReactClient(convexUrl)

function App() {
  return (
    <ConvexProvider client={convex}>
      <WorkspaceProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <AppRoutes />
          </div>
        </Router>
      </WorkspaceProvider>
    </ConvexProvider>
  )
}

export default App
