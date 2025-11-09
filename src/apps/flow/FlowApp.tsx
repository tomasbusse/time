import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import TaskBoard, { Task } from './components/TaskBoard'
import IdeaList, { Idea } from './components/IdeaList'
import TaskDetailModal from './components/TaskDetailModal'
import IdeaFormModal from './components/IdeaFormModal'
import IdeaDetailModal from './components/IdeaDetailModal'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useWorkspace } from '@/lib/WorkspaceContext'

type TabType = 'tasks' | 'ideas'
type ModalType = 'create' | 'edit' | null

export default function FlowApp() {
  const { workspaceId, userId } = useWorkspace()
  const [activeTab, setActiveTab] = useState<TabType>('tasks')
  const [taskModalType, setTaskModalType] = useState<ModalType>(null)
  const [ideaModalType, setIdeaModalType] = useState<ModalType>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null)
  const [isIdeaDetailOpen, setIsIdeaDetailOpen] = useState(false)
  const [newTaskStatus, setNewTaskStatus] = useState<'todo' | 'in_progress' | 'completed'>('todo')

  // Tasks & Ideas from Convex
  const tasksData = useQuery(api.flow.listTasks, workspaceId ? { workspaceId } : 'skip') as any[] | 'skip' | undefined
  const tasks: Task[] = Array.isArray(tasksData) ? tasksData : []
  const ideasData = useQuery(api.flow.listIdeas, workspaceId ? { workspaceId } : 'skip') as any[] | 'skip' | undefined
  const ideas: Idea[] = Array.isArray(ideasData) ? ideasData.map((i: any) => ({ 
    id: i._id, 
    title: i.title, 
    description: i.description,
    richDescription: i.richDescription,
    category: i.category,
    tags: i.tags,
    priority: i.priority,
    attachments: i.attachments,
    status: i.status 
  })) : []
  
  // Fetch related tasks for the selected idea
  const relatedTasksData = useQuery(
    selectedIdeaId ? api.flow.getTasksByIdea : 'skip',
    selectedIdeaId ? { ideaId: selectedIdeaId as any } : 'skip'
  ) as any[] | 'skip' | undefined
  
  const relatedTasks = Array.isArray(relatedTasksData) ? relatedTasksData.map((t: any) => ({
    id: t._id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    createdAt: t.createdAt
  })) : []
  
  const createTask = useMutation(api.flow.createTask)
  const updateTask = useMutation(api.flow.updateTask)
  // const updateTaskStatus = useMutation(api.flow.updateTaskStatus)
  const deleteTaskMutation = useMutation(api.flow.deleteTask)
  const createIdea = useMutation(api.flow.createIdea)
  const updateIdea = useMutation(api.flow.updateIdea)
  const updateIdeaStatus = useMutation(api.flow.updateIdeaStatus)
  const deleteIdeaMutation = useMutation(api.flow.deleteIdea)

  const handleCreateTask = (status: 'todo' | 'in_progress' | 'completed') => {
    setNewTaskStatus(status)
    setTaskModalType('create')
  }

  const handleEditTask = (taskId: string) => {
    setSelectedTaskId(taskId)
    setTaskModalType('edit')
  }

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTaskMutation({ taskId: taskId as any })
    }
  }

  const handleSaveTask = async (taskData: any) => {
    if (taskModalType === 'create' && workspaceId && userId) {
      await createTask({
        workspaceId: workspaceId as any,
        userId: userId as any,
        ...taskData,
        status: newTaskStatus,
      })
      setTaskModalType(null)
    } else if (taskModalType === 'edit' && selectedTaskId) {
      await updateTask({
        taskId: selectedTaskId as any,
        ...taskData,
      })
      setTaskModalType(null)
      setSelectedTaskId(null)
    }
  }

  // const handleUpdateTaskStatus = async (
  //   taskId: string,
  //   status: 'todo' | 'in_progress' | 'completed'
  // ) => {
  //   await updateTaskStatus({ taskId: taskId as any, status })
  // }

  const handleCreateIdea = () => {
    setSelectedIdeaId(null)
    setIdeaModalType('create')
  }

  const handleEditIdea = (idea: Idea) => {
    setSelectedIdeaId(idea.id)
    setIdeaModalType('edit')
  }

  const handleSaveIdea = async (ideaData: any) => {
    if (ideaModalType === 'create' && workspaceId && userId) {
      await createIdea({
        workspaceId: workspaceId as any,
        userId: userId as any,
        ...ideaData,
        status: 'new'
      })
      setIdeaModalType(null)
    } else if (ideaModalType === 'edit' && selectedIdeaId) {
      await updateIdea({
        ideaId: selectedIdeaId as any,
        ...ideaData,
      })
      setIdeaModalType(null)
      setSelectedIdeaId(null)
    }
  }

  const handleViewIdeaDetail = (ideaId: string) => {
    setSelectedIdeaId(ideaId)
    setIsIdeaDetailOpen(true)
  }

  const handleCreateMultipleTasks = async (taskTitles: string[]) => {
    if (!workspaceId || !userId || !selectedIdeaId) return
    
    for (const title of taskTitles) {
      if (title.trim()) {
        await createTask({
          workspaceId: workspaceId as any,
          userId: userId as any,
          title: title.trim(),
          description: `Created from idea: ${ideas.find(i => i.id === selectedIdeaId)?.title}`,
          status: 'todo',
          priority: 'medium',
          ideaId: selectedIdeaId as any
        })
      }
    }
    
    // Update idea status to converted
    await updateIdeaStatus({ 
      ideaId: selectedIdeaId as any, 
      status: 'converted' 
    })
  }

  const handleArchiveIdea = async () => {
    if (!selectedIdeaId) return
    await updateIdeaStatus({ 
      ideaId: selectedIdeaId as any, 
      status: 'archived' 
    })
    setIsIdeaDetailOpen(false)
    setSelectedIdeaId(null)
  }

  const handleConvertToTask = async (ideaId: string) => {
    const idea = ideas.find((i) => i.id === ideaId)
    if (!idea || !workspaceId || !userId) return
    await createTask({ 
      workspaceId: workspaceId as any, 
      userId: userId as any, 
      title: idea.title, 
      description: idea.description,
      status: 'todo', 
      priority: 'medium'
    })
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

  const selectedTask = selectedTaskId ? tasks.find(t => t._id === selectedTaskId) : null

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Flow</h1>
              <p className="text-slate-600">
                Sophisticated task management with advanced filtering and organization.
              </p>
            </div>

            {activeTab === 'tasks' && (
              <div className="flex items-center gap-4">
                <div className="text-sm text-slate-500">
                  {taskStats.completed} / {taskStats.total} completed
                </div>
                <Button 
                  onClick={() => handleCreateTask('todo')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Task
                </Button>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="mt-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'tasks'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                Tasks
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                  {taskStats.total}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('ideas')}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'ideas'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                Ideas
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                  {ideas.filter((i) => i.status !== 'archived').length}
                </span>
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {activeTab === 'tasks' && (
          <TaskBoard
            onEditTask={(taskId) => handleEditTask(taskId as string)}
            onDeleteTask={(taskId) => handleDeleteTask(taskId as string)}
            onCreateTask={handleCreateTask}
          />
        )}

        {activeTab === 'ideas' && (
          <IdeaList
            ideas={ideas}
            onAddIdea={handleCreateIdea}
            onEditIdea={handleEditIdea}
            onViewIdeaDetail={handleViewIdeaDetail}
            onDeleteIdea={handleDeleteIdea}
            onConvertToTask={handleConvertToTask}
          />
        )}
      </div>

      {/* Task Detail Modal */}
      {taskModalType && (
        <TaskDetailModal
          isOpen={!!taskModalType}
          onClose={() => {
            setTaskModalType(null)
            setSelectedTaskId(null)
          }}
          onSave={handleSaveTask}
          task={selectedTask || null}
          mode={taskModalType}
        />
      )}

      {/* Idea Form Modal */}
      {ideaModalType && (
        <IdeaFormModal
          isOpen={!!ideaModalType}
          onClose={() => {
            setIdeaModalType(null)
            setSelectedIdeaId(null)
          }}
          onSave={handleSaveIdea}
          idea={selectedIdeaId ? ideas.find(i => i.id === selectedIdeaId) || null : null}
          mode={ideaModalType as 'create' | 'edit'}
        />
      )}

      {/* Idea Detail Modal */}
      <IdeaDetailModal
        isOpen={isIdeaDetailOpen}
        onClose={() => {
          setIsIdeaDetailOpen(false)
          setSelectedIdeaId(null)
        }}
        idea={selectedIdeaId ? ideas.find(i => i.id === selectedIdeaId) || null : null}
        relatedTasks={relatedTasks}
        onEditIdea={() => {
          setIsIdeaDetailOpen(false)
          setIdeaModalType('edit')
        }}
        onArchiveIdea={handleArchiveIdea}
        onCreateTasks={handleCreateMultipleTasks}
        onViewTask={(taskId) => {
          setSelectedTaskId(taskId)
          setTaskModalType('edit')
          setIsIdeaDetailOpen(false)
        }}
      />
    </div>
  )
}
