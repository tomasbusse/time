import { useWorkspace } from '@/lib/WorkspaceContext'
import { Bell, User, Menu } from 'lucide-react'

export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { userName } = useWorkspace()
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden h-16 bg-custom-off-white flex items-center justify-between px-6 sticky top-0 z-40">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 text-dark-blue hover:bg-black/5 rounded-full transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="text-3xl font-bold text-dark-blue tracking-wider font-mono">
          {currentTime}
        </div>

        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 border border-green-200">
          <User className="w-5 h-5" />
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex h-16 bg-white border-b border-light-gray items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-40">
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
    </>
  )
}
