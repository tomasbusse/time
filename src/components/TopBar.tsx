import { useWorkspace } from '@/lib/WorkspaceContext'
import { Bell, Search, User } from 'lucide-react'

export function TopBar() {
  const { userName } = useWorkspace()

  return (
    <div className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-8 sticky top-0 z-40">
      {/* Search */}
      <div className="flex-1 max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 hover:bg-neutral-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-neutral-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-neutral-200">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-800">{userName || 'User'}</p>
            <p className="text-xs text-neutral-500">Organization</p>
          </div>
        </div>
      </div>
    </div>
  )
}
