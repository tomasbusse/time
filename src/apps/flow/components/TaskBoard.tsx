import { useState, useMemo } from 'react'
import { 
  DndContext, 
  DragEndEvent, 
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { 
  SortableContext, 
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { 
  GripVertical, 
  Edit2, 
  Trash2, 
  Calendar, 
  Flag, 
  Clock,
  Hash,
  Search,
  Archive,
  Plus,
  Lightbulb,
  Play,
  Pause,
} from 'lucide-react'
import { format, isBefore } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { cn } from '@/lib/utils'
import type { Doc, Id } from '../../../../convex/_generated/dataModel'

export type Task = Doc<'tasks'>

interface TaskBoardProps {
  onEditTask: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
  onCreateTask: (status: 'todo' | 'in_progress' | 'completed') => void
}

export default function TaskBoard({
  onEditTask,
  onDeleteTask,
  onCreateTask,
}: TaskBoardProps) {
  const { workspaceId } = useWorkspace()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPriority, setSelectedPriority] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showOverdue, setShowOverdue] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  // Query tasks with enhanced filtering
  const queryResult = useQuery(
    api.flow.listTasks,
    workspaceId ? { 
      workspaceId, 
      searchTerm: searchTerm || undefined,
      priority: selectedPriority ? (selectedPriority as Task['priority']) : undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    } : 'skip'
  )

  const tasks = Array.isArray(queryResult) ? (queryResult as Task[]) : []
  
  const activeTimer = useQuery(api.flow.getActiveTimer, workspaceId ? { workspaceId } : 'skip')

  const reorderTasks = useMutation(api.flow.reorderTasks)
  const archiveTask = useMutation(api.flow.archiveTask)
  const startTimer = useMutation(api.flow.startTimer)
  const stopTimer = useMutation(api.flow.stopTimer)

  // Separate tasks by status and sort by position
  const { todoTasks, inProgressTasks, completedTasks } = useMemo(() => {
    const todo: Task[] = []
    const inProgress: Task[] = []
    const completed: Task[] = []

    tasks.forEach((task) => {
      // Filter out overdue tasks if showOverdue is false
      if (showOverdue === false && task.dueDate && task.status !== 'completed') {
        const dueDate = new Date(task.dueDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (isBefore(dueDate, today)) {
          return // Skip overdue tasks
        }
      }

      switch (task.status) {
        case 'todo':
          todo.push(task)
          break
        case 'in_progress':
          inProgress.push(task)
          break
        case 'completed':
          completed.push(task)
          break
      }
    })

    // Sort by position
    todo.sort((a, b) => a.position - b.position)
    inProgress.sort((a, b) => a.position - b.position)
    completed.sort((a, b) => a.position - b.position)

    return { todoTasks: todo, inProgressTasks: inProgress, completedTasks: completed }
  }, [tasks, showOverdue])

  // Get all unique tags for filtering
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    tasks.forEach((task) => {
      if (task.tags) {
        task.tags.forEach((tag) => tags.add(tag))
      }
    })
    return Array.from(tags).sort()
  }, [tasks])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as Id<'tasks'>)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeTask = tasks.find((task) => task._id === (active.id as Id<'tasks'>))
    if (!activeTask) return

    // Determine new status and position
    let newStatus = activeTask.status
    let newPosition = activeTask.position

    // Check if dropped in a different column
    if (over.id !== activeTask.status) {
      newStatus = over.id as 'todo' | 'in_progress' | 'completed'
      
      // Get tasks in the new status column
      const targetTasks = tasks
        .filter((task) => task.status === newStatus && task._id !== activeTask._id)
        .sort((a, b) => a.position - b.position)
      
      // Add at the end of the column
      newPosition = targetTasks.length + 1
    }

    // Update task status and position
    if (newStatus !== activeTask.status) {
      if (!workspaceId) return

      await reorderTasks({
        workspaceId,
        taskUpdates: [{
          taskId: activeTask._id,
          status: newStatus,
          position: newPosition,
        }]
      })
    }
  }

  const handleDragOver = (_event: DragOverEvent) => {
    // This will be handled in the drop zone component
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      medium: 'bg-amber-50 text-amber-700 border-amber-200', 
      high: 'bg-red-50 text-red-700 border-red-200',
    }
    return colors[priority as keyof typeof colors] || colors.medium
  }

  const getPriorityIcon = () => {
    return <Flag className="w-3 h-3" />
  }

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    const due = new Date(dueDate)
    const now = new Date()
    return isBefore(due, now)
  }

  const columns = [
    { id: 'todo', title: 'To Do', tasks: todoTasks, color: 'border-slate-200', bgColor: 'bg-slate-50' },
    { id: 'in_progress', title: 'In Progress', tasks: inProgressTasks, color: 'border-blue-200', bgColor: 'bg-blue-50' },
    { id: 'completed', title: 'Completed', tasks: completedTasks, color: 'border-emerald-200', bgColor: 'bg-emerald-50' },
  ] as const

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tasks, descriptions, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            <select
              value={selectedTags.join(',')}
              onChange={(e) => setSelectedTags(e.target.value ? [e.target.value] : [])}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={showOverdue}
                onChange={(e) => setShowOverdue(e.target.checked)}
                className="rounded"
              />
              Show overdue
            </label>
          </div>
        </div>

        {/* Task Statistics */}
        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-200 rounded"></div>
            <span className="text-slate-600">To Do: <strong>{todoTasks.length}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-200 rounded"></div>
            <span className="text-slate-600">In Progress: <strong>{inProgressTasks.length}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-200 rounded"></div>
            <span className="text-slate-600">Completed: <strong>{completedTasks.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              onCreateTask={() => onCreateTask(column.id)}
              getPriorityColor={getPriorityColor}
              getPriorityIcon={getPriorityIcon}
              isOverdue={isOverdue}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onArchiveTask={async (taskId) => {
                await archiveTask({ taskId: taskId as Id<'tasks'>, isArchived: true })
              }}
              onMoveTask={async (taskId, status) => {
                if (!workspaceId) return
                await reorderTasks({
                  workspaceId,
                  taskUpdates: [{ taskId: taskId as Id<'tasks'>, status, position: 1 }],
                })
              }}
              onToggleTimer={async (taskId) => {
                if (!workspaceId) return
                
                if (activeTimer && activeTimer.taskId === taskId) {
                  await stopTimer({ workspaceId })
                } else {
                  if (activeTimer && activeTimer.taskId !== taskId) {
                    if (confirm(`Stop timer on "${activeTimer.taskTitle}" and start new timer?`)) {
                      await startTimer({ workspaceId, taskId: taskId as Id<'tasks'> })
                    }
                  } else {
                    await startTimer({ workspaceId, taskId: taskId as Id<'tasks'> })
                  }
                }
              }}
              activeTimer={activeTimer}
              isDragging={activeId !== null}
            />
          ))}
        </div>
      </DndContext>
    </div>
  )
}

interface KanbanColumnProps {
  column: {
    id: 'todo' | 'in_progress' | 'completed'
    title: string
    tasks: Task[]
    color: string
    bgColor: string
  }
  onCreateTask: () => void
  getPriorityColor: (priority: string) => string
  getPriorityIcon: () => JSX.Element
  isOverdue: (dueDate?: string) => boolean
  onEditTask: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
  onArchiveTask: (taskId: string) => Promise<void>
  onMoveTask: (taskId: string, status: Task['status']) => Promise<void>
  onToggleTimer: (taskId: string) => Promise<void>
  activeTimer: any
  isDragging: boolean
}

function KanbanColumn({
  column,
  onCreateTask,
  getPriorityColor,
  getPriorityIcon,
  isOverdue,
  onEditTask,
  onDeleteTask,
  onArchiveTask,
  onMoveTask,
  onToggleTimer,
  activeTimer,
}: KanbanColumnProps) {
  return (
    <div className={cn("bg-white rounded-lg border-2 border-dashed transition-colors", column.color, column.bgColor)}>
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            {column.title}
            <span className="bg-white text-slate-600 text-xs px-2 py-1 rounded-full border">
              {column.tasks.length}
            </span>
          </h3>
          <Button 
            size="sm" 
            variant="outline"
            onClick={onCreateTask}
            className="h-8"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <SortableContext items={column.tasks.map((task) => task._id as Id<'tasks'>)} strategy={verticalListSortingStrategy}>
        <div className="p-4 space-y-3 min-h-[200px]">
          {column.tasks.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">
              No tasks
            </div>
          ) : (
            column.tasks.map((task: Task) => (
              <SortableTaskCard
                key={task._id}
                task={task}
                getPriorityColor={getPriorityColor}
                getPriorityIcon={getPriorityIcon}
                isOverdue={isOverdue}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
                onArchiveTask={onArchiveTask}
                onMoveTask={onMoveTask}
                onToggleTimer={onToggleTimer}
                activeTimer={activeTimer}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableTaskCardProps {
  task: Task
  getPriorityColor: (priority: string) => string
  getPriorityIcon: () => JSX.Element
  isOverdue: (dueDate?: string) => boolean
  onEditTask: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
  onArchiveTask: (taskId: string) => void
  onMoveTask: (taskId: string, status: Task['status']) => Promise<void>
  onToggleTimer: (taskId: string) => Promise<void>
  activeTimer: any
}

function SortableTaskCard({
  task,
  getPriorityColor,
  getPriorityIcon,
  isOverdue,
  onEditTask,
  onDeleteTask,
  onArchiveTask,
  onMoveTask,
  onToggleTimer,
  activeTimer,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  
  const isTimerActive = activeTimer && activeTimer.taskId === task._id

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all group cursor-pointer",
        isDragging && "rotate-2 shadow-lg ring-2 ring-blue-200",
        isOverdue(task.dueDate) && task.status !== 'completed' && "border-red-200 bg-red-50",
        isTimerActive && "ring-2 ring-blue-400 border-blue-400 shadow-lg"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          {...listeners}
          className="mt-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity hover:text-slate-600"
        >
          <GripVertical className="w-4 h-4 text-slate-400" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-medium text-slate-800 line-clamp-2 flex-1">
              {task.title}
            </h4>
            
            {task.status !== 'completed' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleTimer(task._id)
                }}
                className={cn(
                  "p-1.5 rounded-lg transition-all flex-shrink-0",
                  isTimerActive 
                    ? "bg-blue-500 text-white hover:bg-blue-600 animate-pulse" 
                    : "bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-600"
                )}
                title={isTimerActive ? "Stop timer" : "Start timer"}
              >
                {isTimerActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            )}
          </div>
          
          {isTimerActive && activeTimer && (
            <div className="mb-2 text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
              ⏱️ {Math.floor(activeTimer.elapsedSeconds / 3600)}h {Math.floor((activeTimer.elapsedSeconds % 3600) / 60)}m {activeTimer.elapsedSeconds % 60}s
            </div>
          )}

          {task.description && (
            <p className="text-sm text-slate-600 mb-3 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={cn(
              "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border",
              getPriorityColor(task.priority)
            )}>
              {getPriorityIcon()}
              {task.priority}
            </span>

            {task.ideaId && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md border border-yellow-200">
                <Lightbulb className="w-3 h-3" />
                From Idea
              </span>
            )}

            {task.dueDate && (
              <span className={cn(
                "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md",
                isOverdue(task.dueDate) && task.status !== 'completed'
                  ? "bg-red-100 text-red-700"
                  : "bg-slate-100 text-slate-600"
              )}>
                <Calendar className="w-3 h-3" />
                {format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}

            {task.estimatedHours && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md">
                <Clock className="w-3 h-3" />
                {task.estimatedHours}h
              </span>
            )}

            {/* Time Allocation Badges */}
            {task.dailyAllocation && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md border border-emerald-200">
                <Clock className="w-3 h-3" />
                {task.dailyAllocation}h/day
              </span>
            )}

            {task.weeklyAllocation && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-cyan-100 text-cyan-700 rounded-md border border-cyan-200">
                <Clock className="w-3 h-3" />
                {task.weeklyAllocation}h/wk
              </span>
            )}

            {task.monthlyAllocation && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md border border-indigo-200">
                <Clock className="w-3 h-3" />
                {task.monthlyAllocation}h/mo
              </span>
            )}

            {task.yearlyAllocation && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-violet-100 text-violet-700 rounded-md border border-violet-200">
                <Clock className="w-3 h-3" />
                {task.yearlyAllocation}h/yr
              </span>
            )}

            {task.tags && task.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-md"
              >
                <Hash className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {task.status !== 'todo' && (
                <button
                  onClick={() => onMoveTask(task._id, 'todo')}
                  className="text-xs px-2 py-1 text-slate-600 hover:bg-slate-100 rounded"
                >
                  ← To Do
                </button>
              )}
              {task.status !== 'in_progress' && (
                <button
                  onClick={() => onMoveTask(task._id, 'in_progress')}
                  className="text-xs px-2 py-1 text-slate-600 hover:bg-slate-100 rounded"
                >
                  → In Progress
                </button>
              )}
              {task.status !== 'completed' && (
                <button
                  onClick={() => onMoveTask(task._id, 'completed')}
                  className="text-xs px-2 py-1 text-slate-600 hover:bg-slate-100 rounded"
                >
                  ✓ Complete
                </button>
              )}
            </div>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEditTask(task._id)}
                className="p-1 hover:bg-slate-100 rounded"
                title="Edit task"
              >
                <Edit2 className="w-4 h-4 text-slate-500" />
              </button>
              <button
                onClick={() => onArchiveTask(task._id)}
                className="p-1 hover:bg-slate-100 rounded"
                title="Archive task"
              >
                <Archive className="w-4 h-4 text-slate-500" />
              </button>
              <button
                onClick={() => onDeleteTask(task._id)}
                className="p-1 hover:bg-red-100 rounded"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
