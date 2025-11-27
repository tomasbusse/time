import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function AdminPanel() {
  return (
    <div className="min-h-screen bg-off-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-gray hover:text-dark-blue mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        
        <h1 className="text-3xl font-bold text-dark-blue mb-8">Admin Settings</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Workspace Management</h2>
          <p className="text-gray">Invite users, manage permissions, and control data visibility.</p>
        </div>
      </div>
    </div>
  )
}
