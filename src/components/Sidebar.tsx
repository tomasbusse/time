import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ListTodo,
  DollarSign,
  UtensilsCrossed,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react'
import { useState, useEffect } from 'react'
import RoundClock from './ui/RoundClock'

interface NavItem {
  name: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Productivity', path: '/productivity', icon: ListTodo },
  { name: 'Finance', path: '/finance', icon: DollarSign },
  { name: 'Food', path: '/food', icon: UtensilsCrossed },
  { name: 'Calendar', path: '/calendar', icon: Calendar },
]

export interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false)
  }, [location.pathname])

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? (
          <X className="w-6 h-6 text-dark-blue" />
        ) : (
          <Menu className="w-6 h-6 text-dark-blue" />
        )}
      </button>

      {/* Mobile Overlay - Full Screen Solid Color */}
      <div
        className={`fixed inset-0 bg-custom-off-white z-40 lg:hidden transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full pt-16 px-6 pb-6">
          {/* Mobile Clock */}
          <div className="flex justify-center mb-8">
            <div className="scale-125">
              <RoundClock isCollapsed={false} />
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 space-y-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-4 px-6 py-4 rounded-xl text-lg font-medium transition-all duration-200 ${active
                      ? 'bg-custom-brown text-white shadow-lg transform scale-105'
                      : 'bg-white text-dark-blue hover:bg-white/60 shadow-sm'
                    }`}
                >
                  <Icon className={`w-6 h-6 ${active ? 'text-white' : 'text-custom-brown'}`} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Mobile Settings */}
          <div className="mt-auto pt-6 border-t border-dark-blue/10">
            <Link
              to="/settings"
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center gap-4 px-6 py-4 rounded-xl bg-white text-dark-blue hover:bg-white/60 shadow-sm transition-all duration-200"
            >
              <Settings className="w-6 h-6 text-custom-brown" />
              <span className="text-lg font-medium">Settings</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:block fixed lg:sticky left-0 top-0 h-screen bg-gray-300 shadow-lg transition-all duration-300 z-50 ${isCollapsed ? 'w-20' : 'w-64'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Clock */}
          <div className={`p-4 text-dark-blue bg-light-gray/20 ${isCollapsed ? 'text-center' : ''}`}>
            <RoundClock isCollapsed={isCollapsed} />
          </div>

          {/* Logo */}
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-light-gray/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
              <LayoutDashboard className="w-6 h-6 text-dark-blue" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-dark-blue font-bold text-xl">LifeHub</h1>
                <p className="text-dark-blue text-xs">Your productivity suite</p>
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${active
                      ? 'bg-light-gray/20 backdrop-blur-sm text-dark-blue shadow-md'
                      : 'text-dark-blue hover:bg-light-gray/10 hover:text-dark-blue'
                    }`}
                  title={isCollapsed ? item.name : ''}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-dark-blue' : 'text-dark-blue group-hover:text-dark-blue'}`} />
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{item.name}</span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Settings & Collapse Button */}
          <div className="p-3 space-y-2 border-t border-dark-blue/10">
            <Link
              to="/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-dark-blue hover:bg-light-gray/10 hover:text-dark-blue transition-all duration-200"
              title={isCollapsed ? 'Settings' : ''}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
            </Link>

            <button
              onClick={onToggle}
              className="w-full flex items-center justify-center px-4 py-3 rounded-lg text-dark-blue hover:bg-light-gray/10 hover:text-dark-blue transition-all duration-200"
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
    </>
  )
}
