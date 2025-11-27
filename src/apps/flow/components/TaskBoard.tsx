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
  Repeat,
  MoreHorizontal,
  CheckCircle2,
  Circle
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
    todo.sort((a, b) => (a.position || 0) - (b.position || 0))
    inProgress.sort((a, b) => (a.position || 0) - (b.position || 0))
    completed.sort((a, b) => (a.position || 0) - (b.position || 0))

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
        .sort((a, b) => (a.position || 0) - (b.position || 0))

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
      low: 'bg-blue-50 text-blue-700 border-blue-200',
      medium: 'bg-orange-50 text-orange-700 border-orange-200',
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
    { id: 'todo', title: 'To Do', tasks: todoTasks, color: 'border-gray-200', bgColor: 'bg-gray-50/50', icon: Circle },
    { id: 'in_progress', title: 'In Progress', tasks: inProgressTasks, color: 'border-blue-200', bgColor: 'bg-blue-50/30', icon: Clock },
    { id: 'completed', title: 'Completed', tasks: completedTasks, color: 'border-green-200', bgColor: 'bg-green-50/30', icon: CheckCircle2 },
  ] as const

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#384C5A] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 lg:pb-0">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#384C5A] focus:border-transparent bg-white"
            >
              <option value="">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            <select
              value={selectedTags.join(',')}
              onChange={(e) => setSelectedTags(e.target.value ? [e.target.value] : [])}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#384C5A] focus:border-transparent bg-white min-w-[120px]"
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>

            <label className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap cursor-pointer hover:text-gray-900">
              <input
                type="checkbox"
                checked={showOverdue}
                onChange={(e) => setShowOverdue(e.target.checked)}
                className="rounded border-gray-300 text-[#384C5A] focus:ring-[#384C5A]"
              />
              Show overdue
            </label>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
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
    icon: any
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
  const Icon = column.icon

  return (
    <div className={cn("flex flex-col rounded-xl transition-colors h-full max-h-[calc(100vh-200px)]", column.bgColor)}>
      <div className="p-4 flex items-center justify-between sticky top-0 bg-inherit rounded-t-xl z-10">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-5 h-5",
            column.id === 'todo' ? "text-gray-500" :
              column.id === 'in_progress' ? "text-blue-500" : "text-green-500"
          )} />
          <h3 className="font-semibold text-[#384C5A]">
            {column.title}
          </h3>
          <span className="bg-white/50 text-gray-600 text-xs px-2 py-0.5 rounded-full border border-gray-200 font-medium">
            {column.tasks.length}
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCreateTask}
          className="h-8 w-8 p-0 hover:bg-white/50"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <SortableContext items={column.tasks.map((task) => task._id as Id<'tasks'>)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 min-h-[100px]">
            {column.tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-white/30">
                <div className="p-3 bg-white rounded-full mb-3 shadow-sm">
                  <Plus className="w-5 h-5 text-gray-300" />
                </div>
                <p className="text-sm font-medium">No tasks yet</p>
                <button
                  onClick={onCreateTask}
                  className="text-xs text-[#384C5A] hover:underline mt-1"
                >
                  Create one
                </button>
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
        "bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all group relative",
        isDragging && "rotate-2 shadow-xl ring-2 ring-[#384C5A] z-50",
        isOverdue(task.dueDate) && task.status !== 'completed' && "border-red-200 bg-red-50/10",
        isTimerActive && "ring-2 ring-[#384C5A] border-[#384C5A] shadow-md"
      )}
    >
      {/* Drag Handle */}
      <div
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="pl-6"> {/* Add padding for drag handle */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h4 className="font-semibold text-[#384C5A] line-clamp-2 text-sm leading-snug flex-1">
            {task.title}
          </h4>

          {task.status !== 'completed' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleTimer(task._id)
              }}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 shadow-sm",
                isTimerActive
                  ? "bg-[#384C5A] text-white hover:bg-[#2c3b46] animate-pulse"
                  : "bg-white border border-gray-200 text-gray-400 hover:text-[#384C5A] hover:border-[#384C5A]"
              )}
              title={isTimerActive ? "Stop timer" : "Start timer"}
            >
              {isTimerActive ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />}
            </button>
          )}
        </div>

        {isTimerActive && activeTimer && (
          <div className="mb-3 text-xs font-mono text-[#384C5A] bg-gray-100 px-2 py-1 rounded inline-flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {Math.floor(activeTimer.elapsedSeconds / 3600)}h {Math.floor((activeTimer.elapsedSeconds % 3600) / 60)}m {activeTimer.elapsedSeconds % 60}s
          </div>
        )}

        {task.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={cn(
            "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border",
            getPriorityColor(task.priority)
          )}>
            {getPriorityIcon()}
            {task.priority}
          </span>

          {task.ideaId && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-full border border-yellow-200">
              <Lightbulb className="w-3 h-3" />
              Idea
            </span>
          )}

          {task.dueDate && (
            <span className={cn(
              "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border",
              isOverdue(task.dueDate) && task.status !== 'completed'
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-gray-50 text-gray-600 border-gray-200"
            )}>
              <Calendar className="w-3 h-3" />
              {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}

          {task.estimatedHours && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 bg-gray-50 text-gray-600 rounded-full border border-gray-200">
              <Clock className="w-3 h-3" />
              {task.estimatedHours}h
            </span>
          )}
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1">
            {task.status !== 'todo' && (
              <button
                onClick={() => onMoveTask(task._id, 'todo')}
                className="text-[10px] px-1.5 py-1 text-gray-500 hover:bg-gray-100 rounded hover:text-[#384C5A]"
                title="Move to To Do"
              >
                To Do
              </button>
            )}
            {task.status !== 'in_progress' && (
              <button
                onClick={() => onMoveTask(task._id, 'in_progress')}
                className="text-[10px] px-1.5 py-1 text-gray-500 hover:bg-gray-100 rounded hover:text-[#384C5A]"
                title="Move to In Progress"
              >
                In Prog
              </button>
            )}
            {task.status !== 'completed' && (
              <button
                onClick={() => onMoveTask(task._id, 'completed')}
                className="text-[10px] px-1.5 py-1 text-gray-500 hover:bg-gray-100 rounded hover:text-[#384C5A]"
                title="Complete"
              >
                Done
              </button>
            )}
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => onEditTask(task._id)}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-[#384C5A]"
              title="Edit task"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDeleteTask(task._id)}
              className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
              title="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
