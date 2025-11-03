import { BrowserRouter as Router } from 'react-router-dom'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import AppRoutes from './routes'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)

function App() {
  return (
    <ConvexProvider client={convex}>
      <Router>
        <div className="min-h-screen bg-background">
          <AppRoutes />
        </div>
      </Router>
    </ConvexProvider>
  )
}

export default App
