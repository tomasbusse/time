import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import TaskBoard, { Task } from './components/TaskBoard'
import IdeaList, { Idea } from './components/IdeaList'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useWorkspace } from '@/lib/WorkspaceContext'

type TabType = 'tasks' | 'ideas'

export default function FlowApp() {
  const { workspaceId, userId } = useWorkspace()
  const [activeTab, setActiveTab] = useState<TabType>('tasks')

  // Tasks & Ideas from Convex
  const tasksData = useQuery(api.flow.listTasks, workspaceId ? { workspaceId } : 'skip') as any[] | 'skip' | undefined
  const tasks: Task[] = Array.isArray(tasksData)
    ? tasksData.map((t: any) => ({ id: t._id, title: t.title, status: t.status, priority: t.priority, dueDate: t.dueDate, ideaId: t.ideaId }))
    : []
  const ideasData = useQuery(api.flow.listIdeas, workspaceId ? { workspaceId } : 'skip') as any[] | 'skip' | undefined
  const ideas: Idea[] = Array.isArray(ideasData)
    ? ideasData.map((i: any) => ({ id: i._id, title: i.title, description: i.description, status: i.status }))
    : []
  const createTask = useMutation(api.flow.createTask)
  const updateTaskStatus = useMutation(api.flow.updateTaskStatus)
  const deleteTaskMutation = useMutation(api.flow.deleteTask)
  const createIdea = useMutation(api.flow.createIdea)
  const updateIdeaStatus = useMutation(api.flow.updateIdeaStatus)
  const deleteIdeaMutation = useMutation(api.flow.deleteIdea)

  const handleUpdateTaskStatus = async (
    taskId: string,
    status: 'todo' | 'in_progress' | 'completed'
  ) => {
    await updateTaskStatus({ taskId: taskId as any, status })
  }

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTaskMutation({ taskId: taskId as any })
    }
  }

  const handleConvertToTask = async (ideaId: string) => {
    const idea = ideas.find((i) => i.id === ideaId)
    if (!idea || !workspaceId || !userId) return
    await createTask({ workspaceId: workspaceId as any, userId: userId as any, title: idea.title, status: 'todo', priority: 'medium', ideaId: idea.id as any })
    await updateIdeaStatus({ ideaId: ideaId as any, status: 'converted' })
    setActiveTab('tasks')
  }

  const handleDeleteIdea = async (ideaId: string) => {
    if (confirm('Are you sure you want to delete this idea?')) {
      await deleteIdeaMutation({ ideaId: ideaId as any })
    }
  }

  const taskStats = {
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    total: tasks.length,
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 mb-2">Flow</h1>
            <p className="text-neutral-600">
              Organize your work and life, effortlessly.
            </p>
          </div>

          {activeTab === 'tasks' && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-neutral-500">
                  {taskStats.completed} / {taskStats.total} completed
                </span>
              </div>
              <Button onClick={async () => {
                const title = prompt('Task title')
                if (!title || !workspaceId || !userId) return
                await createTask({ workspaceId: workspaceId as any, userId: userId as any, title, status: 'todo', priority: 'medium' })
              }}>
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-neutral-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'tasks'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-neutral-600 hover:text-neutral-800'
                }`}
              >
                Tasks
                <span className="ml-2 text-xs px-2 py-1 bg-neutral-100 rounded">
                  {taskStats.total}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('ideas')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'ideas'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-neutral-600 hover:text-neutral-800'
                }`}
              >
                Ideas
                <span className="ml-2 text-xs px-2 py-1 bg-neutral-100 rounded">
                  {ideas.filter((i) => i.status !== 'archived').length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'tasks' && (
          <TaskBoard
            tasks={tasks}
            onEditTask={() => alert('Edit Task - Coming soon')}
            onDeleteTask={handleDeleteTask}
            onUpdateStatus={handleUpdateTaskStatus}
          />
        )}

        {activeTab === 'ideas' && (
          <IdeaList
            ideas={ideas}
            onAddIdea={async () => {
              const title = prompt('Idea title')
              if (!title || !workspaceId || !userId) return
              await createIdea({ workspaceId: workspaceId as any, userId: userId as any, title, status: 'new' })
            }}
            onEditIdea={() => alert('Edit Idea - Coming soon')}
            onDeleteIdea={handleDeleteIdea}
            onConvertToTask={handleConvertToTask}
          />
        )}
      </div>
    </div>
  )
}
