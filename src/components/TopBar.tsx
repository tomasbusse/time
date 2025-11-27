import { useWorkspace } from '@/lib/WorkspaceContext'
import { Bell, User } from 'lucide-react'

export function TopBar() {
  const { userName } = useWorkspace()

  return (
    <div className="h-16 bg-white border-b border-light-gray flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-40">
      {/* Logo/Title */}
      <div className="flex-1">
        <h1 className="text-lg font-bold text-dark-blue">LifeHub</h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notifications */}
        <button className="relative p-2 hover:bg-light-gray rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-dark-blue" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>
        </button>

        {/* Separator */}
        <div className="h-8 w-px bg-gray-200 mx-2"></div>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-dark-blue rounded-full flex items-center justify-center flex-shrink-0 text-white">
            <User className="w-5 h-5" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-bold text-dark-blue leading-tight">{userName || 'Tomas'}</p>
            <p className="text-xs text-gray-500 leading-tight">Organization</p>
          </div>
        </div>
      </div>
    </div>
  )
}
