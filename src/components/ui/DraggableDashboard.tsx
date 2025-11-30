import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { FinancialOverviewWidget } from './FinancialOverviewWidget'
import { formatCurrency } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { InvoicesDashboardWidget } from './InvoicesDashboardWidget'
import { TasksDashboardWidget } from './TasksDashboardWidget'
import { DraftInvoicesDashboardWidget } from './DraftInvoicesDashboardWidget'
import { QuickLessonCreate } from './QuickLessonCreate'
import { QuickMenuWidget, DashboardView } from './QuickMenuWidget'
import { DailyTasksWidget } from './DailyTasksWidget'
import { DashboardTasksList } from './DashboardTasksList'
import { DashboardIdeasList } from './DashboardIdeasList'
import { BottomNavigation } from '../BottomNavigation'
import type { Id } from '../../../convex/_generated/dataModel'
import TaskDetailModal from '../../apps/flow/components/TaskDetailModal'
import IdeaFormModal from '../../apps/flow/components/IdeaFormModal'
import { DashboardLiquidity } from './DashboardLiquidity'
import LiquidityEntryModal from './LiquidityEntryModal'
import { DashboardAssets } from './DashboardAssets'
import AssetValuationModal from '../../apps/finance/components/AssetValuationModal'

interface DraggableDashboardProps {
  workspaceId: Id<"workspaces"> | null
  userId: Id<"users"> | null
  userName?: string | null
}

export function DraggableDashboard({ workspaceId, userId, userName }: DraggableDashboardProps) {
  // Dashboard view state
  const [selectedView, setSelectedView] = useState<DashboardView>('tasks')

  // Liquidity Date State
  const now = new Date()
  const [liquidityYear, setLiquidityYear] = useState(now.getFullYear())
  const [liquidityMonth, setLiquidityMonth] = useState(now.getMonth() + 1)

  // Assets Date State
  const [assetsYear, setAssetsYear] = useState(now.getFullYear())
  const [assetsMonth, setAssetsMonth] = useState(now.getMonth() + 1)

  // Modal states
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showIdeaModal, setShowIdeaModal] = useState(false)
  const [showLiquidityModal, setShowLiquidityModal] = useState(false)
  const [showAssetsModal, setShowAssetsModal] = useState(false)

  // Mutations
  const createTask = useMutation(api.flow.createTask)
  const updateTask = useMutation(api.flow.updateTask)
  const deleteTask = useMutation(api.flow.deleteTask)
  const createIdea = useMutation(api.flow.createIdea)
  const updateIdea = useMutation(api.flow.updateIdea)
  const deleteIdea = useMutation(api.flow.deleteIdea)

  // Modal Data State
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [selectedIdea, setSelectedIdea] = useState<any>(null)
  const [taskModalMode, setTaskModalMode] = useState<'create' | 'edit'>('create')
  const [ideaModalMode, setIdeaModalMode] = useState<'create' | 'edit'>('create')

  // We can keep the tab state for desktop if we want, but for mobile we are focusing on the new design
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices'>('overview')

  // Data queries
  const finance = useQuery(api.finance.subscriptionTotals, workspaceId ? { workspaceId } : 'skip')
  const lists = useQuery(api.food.listShoppingLists, workspaceId ? { workspaceId } : 'skip') as any[] | 'skip' | undefined

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const handleFabClick = () => {
    if (selectedView === 'tasks') {
      setSelectedTask(null)
      setTaskModalMode('create')
      setShowTaskModal(true)
    } else if (selectedView === 'ideas') {
      setSelectedIdea(null)
      setIdeaModalMode('create')
      setShowIdeaModal(true)
    } else if (selectedView === 'liquidity') {
      setShowLiquidityModal(true)
    } else if (selectedView === 'assets') {
      setShowAssetsModal(true)
    } else {
      // Default behavior: open task modal if on default view
      if (selectedView === 'default') {
        setSelectedTask(null)
        setTaskModalMode('create')
        setShowTaskModal(true)
      }
    }
  }

  const handleEditTask = (task: any) => {
    setSelectedTask(task)
    setTaskModalMode('edit')
    setShowTaskModal(true)
  }

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask({ taskId: taskId as Id<"tasks"> })
    }
  }

  const handleEditIdea = (idea: any) => {
    setSelectedIdea(idea)
    setIdeaModalMode('edit')
    setShowIdeaModal(true)
  }

  const handleDeleteIdea = async (ideaId: string) => {
    if (confirm('Are you sure you want to delete this idea?')) {
      await deleteIdea({ ideaId: ideaId as Id<"ideas"> })
    }
  }

  const handleSaveTask = async (taskData: any) => {
    if (!workspaceId || !userId) return

    if (taskModalMode === 'edit' && selectedTask) {
      await updateTask({
        taskId: selectedTask._id,
        ...taskData
      })
    } else {
      await createTask({
        workspaceId,
        userId,
        title: taskData.title,
        description: taskData.description,
        status: 'todo',
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate,
        tags: taskData.tags,
      })
    }
    setShowTaskModal(false)
    setSelectedTask(null)
  }

  const handleSaveIdea = async (ideaData: any) => {
    if (!workspaceId || !userId) return

    if (ideaModalMode === 'edit' && selectedIdea) {
      await updateIdea({
        ideaId: selectedIdea._id,
        ...ideaData
      })
    } else {
      await createIdea({
        workspaceId,
        userId,
        title: ideaData.title,
        description: ideaData.description,
        status: 'new',
      })
    }
    setShowIdeaModal(false)
    setSelectedIdea(null)
  }

  return (
    <div className="min-h-screen bg-custom-off-white pb-24 lg:pb-8">
      {/* Mobile Header - Removed as it is now in TopBar */}

      {/* Desktop Header (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 p-6 lg:p-8">
        <div>
          <h1 className="text-3xl font-bold text-dark-blue">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {userName || 'User'}. Here's your productivity overview.</p>
        </div>
      </div>

      {/* Mobile Content (Quick Menu & Dynamic View) */}
      <div className="lg:hidden p-4 space-y-8 max-w-md mx-auto">
        {/* Quick Menu */}
        <div>
          <h3 className="text-lg font-bold text-dark-blue mb-4 px-4">Quick Menu</h3>
          <QuickMenuWidget
            selectedView={selectedView}
            onSelectView={setSelectedView}
          />
        </div>

        {/* Dynamic Content Area - Shows based on selection */}
        {selectedView === 'default' && (
          <DailyTasksWidget workspaceId={workspaceId!} />
        )}

        {selectedView === 'tasks' && workspaceId && (
          <div className="px-4">
            <h3 className="text-lg font-bold text-dark-blue mb-4">Your Tasks</h3>
            <DashboardTasksList
              workspaceId={workspaceId}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
          </div>
        )}

        {selectedView === 'ideas' && workspaceId && (
          <div className="px-4">
            <h3 className="text-lg font-bold text-dark-blue mb-4">Your Ideas</h3>
            <DashboardIdeasList
              workspaceId={workspaceId}
              onEdit={handleEditIdea}
              onDelete={handleDeleteIdea}
            />
          </div>
        )}

        {selectedView === 'liquidity' && workspaceId && (
          <div className="px-4">
            <h3 className="text-lg font-bold text-dark-blue mb-4">Liquidity Overview</h3>
            <DashboardLiquidity
              workspaceId={workspaceId}
              year={liquidityYear}
              month={liquidityMonth}
              onYearChange={setLiquidityYear}
              onMonthChange={setLiquidityMonth}
            />
          </div>
        )}

        {selectedView === 'assets' && workspaceId && (
          <div className="px-4">
            <h3 className="text-lg font-bold text-dark-blue mb-4">Assets Overview</h3>
            <DashboardAssets
              workspaceId={workspaceId}
              year={assetsYear}
              month={assetsMonth}
              onYearChange={setAssetsYear}
              onMonthChange={setAssetsMonth}
            />
          </div>
        )}
      </div>

      {/* Desktop Content (Full Grid Layout) */}
      <div className="hidden lg:grid grid-cols-3 gap-6 p-8">
        {/* Column 1: Productivity */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-dark-blue mb-4">Daily Focus</h3>
            <DailyTasksWidget workspaceId={workspaceId!} />
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-dark-blue mb-4">Your Tasks</h3>
            <DashboardTasksList
              workspaceId={workspaceId!}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-dark-blue mb-4">Your Ideas</h3>
            <DashboardIdeasList
              workspaceId={workspaceId!}
              onEdit={handleEditIdea}
              onDelete={handleDeleteIdea}
            />
          </div>
        </div>

        {/* Column 2: Finance & Assets */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-base font-semibold text-dark-blue mb-4">Financial Overview</h3>
            <FinancialOverviewWidget />
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-dark-blue mb-4">Liquidity Overview</h3>
            {workspaceId && (
              <DashboardLiquidity
                workspaceId={workspaceId}
                year={liquidityYear}
                month={liquidityMonth}
                onYearChange={setLiquidityYear}
                onMonthChange={setLiquidityMonth}
              />
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-dark-blue mb-4">Assets Overview</h3>
            {workspaceId && (
              <DashboardAssets
                workspaceId={workspaceId}
                year={assetsYear}
                month={assetsMonth}
                onYearChange={setAssetsYear}
                onMonthChange={setAssetsMonth}
              />
            )}
          </div>
        </div>

        {/* Column 3: Invoices & Admin */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
            {workspaceId && <InvoicesDashboardWidget workspaceId={workspaceId} />}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
            {workspaceId && <DraftInvoicesDashboardWidget workspaceId={workspaceId} />}
          </div>
        </div>
      </div>

      {/* Bottom Navigation with Custom FAB Action */}
      <BottomNavigation onFabClick={handleFabClick} />

      {/* Modals */}
      {
        showTaskModal && (
          <TaskDetailModal
            isOpen={showTaskModal}
            onClose={() => {
              setShowTaskModal(false)
              setSelectedTask(null)
            }}
            onSave={handleSaveTask}
            task={selectedTask}
            mode={taskModalMode}
          />
        )
      }

      {
        showIdeaModal && (
          <IdeaFormModal
            isOpen={showIdeaModal}
            onClose={() => {
              setShowIdeaModal(false)
              setSelectedIdea(null)
            }}
            onSave={handleSaveIdea}
            idea={selectedIdea}
            mode={ideaModalMode}
          />
        )
      }

      {
        showLiquidityModal && workspaceId && (
          <LiquidityEntryModal
            isOpen={showLiquidityModal}
            onClose={() => setShowLiquidityModal(false)}
            workspaceId={workspaceId}
            year={liquidityYear}
            month={liquidityMonth}
          />
        )
      }

      {
        showAssetsModal && workspaceId && (
          <AssetValuationModal
            isOpen={showAssetsModal}
            onClose={() => setShowAssetsModal(false)}
            workspaceId={workspaceId}
            year={assetsYear}
            month={assetsMonth}
          />
        )
      }
    </div >
  )
}