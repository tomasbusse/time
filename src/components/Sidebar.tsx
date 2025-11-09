import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  ListTodo, 
  DollarSign, 
  UtensilsCrossed, 
  Calendar,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  name: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Flow', path: '/flow', icon: ListTodo },
  { name: 'Finance', path: '/finance', icon: DollarSign },
  { name: 'Food', path: '/food', icon: UtensilsCrossed },
  { name: 'Time', path: '/time', icon: Clock },
  { name: 'Calendar', path: '/calendar', icon: Calendar },
]

export function Sidebar() {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div 
      className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-teal-600 to-teal-700 shadow-lg transition-all duration-300 z-50 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-white font-bold text-xl">LifeHub</h1>
              <p className="text-teal-100 text-xs">Your productivity suite</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  active
                    ? 'bg-white/20 backdrop-blur-sm text-white shadow-md'
                    : 'text-teal-100 hover:bg-white/10 hover:text-white'
                }`}
                title={isCollapsed ? item.name : ''}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-teal-100 group-hover:text-white'}`} />
                {!isCollapsed && (
                  <span className="text-sm font-medium">{item.name}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Settings & Collapse Button */}
        <div className="p-3 space-y-2 border-t border-white/10">
          <Link
            to="/admin"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-teal-100 hover:bg-white/10 hover:text-white transition-all duration-200"
            title={isCollapsed ? 'Settings' : ''}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
          </Link>
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center px-4 py-3 rounded-lg text-teal-100 hover:bg-white/10 hover:text-white transition-all duration-200"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <div className="flex items-center gap-3 w-full">
                <ChevronLeft className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">Collapse</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
