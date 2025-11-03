import { Link } from 'react-router-dom'
import { Clock, DollarSign, FileText, UtensilsCrossed, Calendar, Lightbulb, Settings } from 'lucide-react'
import { format } from 'date-fns'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Card, CardContent } from '@/components/ui/Card'

export default function Dashboard() {
  const now = new Date()
  const { userName } = useWorkspace()
  
  const modules = [
    {
      name: 'Ideas',
      icon: Lightbulb,
      path: '/ideas',
      description: 'Capture your thoughts and inspiration.',
      color: 'bg-green-100 text-green-700',
    },
    {
      name: 'Time',
      icon: Clock,
      path: '/time',
      description: 'Focus your time and track your progress.',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      name: 'Finance',
      icon: DollarSign,
      path: '/finance',
      description: 'Organize your income and expenses.',
      color: 'bg-purple-100 text-purple-700',
    },
    {
      name: 'Flow',
      icon: FileText,
      path: '/flow',
      description: 'Organize your work and life, effortlessly.',
      color: 'bg-amber-100 text-amber-700',
    },
    {
      name: 'Food',
      icon: UtensilsCrossed,
      path: '/food',
      description: 'Shopping lists and personal recipes.',
      color: 'bg-red-100 text-red-700',
    },
    {
      name: 'Calendar',
      icon: Calendar,
      path: '/calendar',
      description: 'Sync your schedule and appointments.',
      color: 'bg-indigo-100 text-indigo-700',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Clock className="w-12 h-12 text-neutral-700" />
            <h1 className="text-5xl font-bold text-neutral-800">Time</h1>
          </div>

        {/* Quick Overview Widgets */}
        <OverviewWidgets />
          <p className="text-xl text-neutral-600">Welcome, {userName || 'User'}. Your calm productivity sanctuary awaits.</p>
          
          <div className="mt-8 flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-neutral-300 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-neutral-700">
                    {format(now, 'HH:mm')}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <p className="mt-4 text-neutral-600">{format(now, 'EEEE, dd MMMM yyyy')}</p>
        </div>

        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-neutral-800">Today's Focus</h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-neutral-100 rounded">
                <FileText className="w-5 h-5 text-neutral-600" />
              </button>
              <button className="p-2 hover:bg-neutral-100 rounded">
                <Clock className="w-5 h-5 text-neutral-600" />
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded">
              <input type="radio" className="w-4 h-4" />
              <div className="flex-1">
                <p className="text-neutral-700">Book flights for vacation</p>
              </div>
              <span className="text-sm text-neutral-500 px-3 py-1 bg-neutral-100 rounded">Personal</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded">
              <input type="radio" className="w-4 h-4" />
              <div className="flex-1">
                <p className="text-neutral-700">Design the 'Flow' mini-app UI</p>
              </div>
              <span className="text-sm text-neutral-500 px-3 py-1 bg-neutral-100 rounded">MyLife App</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded">
              <input type="radio" className="w-4 h-4" />
              <div className="flex-1">
                <p className="text-neutral-700">Develop the task creation form</p>
              </div>
              <span className="text-sm text-neutral-500 px-3 py-1 bg-neutral-100 rounded">MyLife App</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => {
            const Icon = module.icon
            return (
              <Link
                key={module.path}
                to={module.path}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className={`w-12 h-12 rounded-lg ${module.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-800 mb-2">{module.name}</h3>
                <p className="text-neutral-600 text-sm">{module.description}</p>
              </Link>
            )
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-800 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>Admin Settings</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

function OverviewWidgets() {
  const { workspaceId } = useWorkspace()
  const finance = useQuery(api.finance.subscriptionTotals, workspaceId ? { workspaceId } : 'skip')
  const lists = useQuery(api.food.listShoppingLists, workspaceId ? { workspaceId } : 'skip') as any[] | 'skip' | undefined
  const itemsRemaining = Array.isArray(lists)
    ? lists.reduce((sum, l) => sum + (Array.isArray(l.items) ? l.items.filter((i: any) => !i.completed).length : 0), 0)
    : 0
  const listCount = Array.isArray(lists) ? lists.length : 0

  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-500">Monthly Subscriptions</div>
              <div className="text-2xl font-semibold text-neutral-800">
                {finance ? new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(finance.monthlyTotal || 0) : '—'}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <span>{finance ? finance.activeCount : 0} active</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-500">Shopping Items Remaining</div>
              <div className="text-2xl font-semibold text-neutral-800">{itemsRemaining}</div>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <UtensilsCrossed className="w-5 h-5 text-red-600" />
              <span>{listCount} list{listCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
