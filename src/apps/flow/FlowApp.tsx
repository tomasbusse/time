import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import TaskBoard, { Task } from './components/TaskBoard'
import IdeaList, { Idea } from './components/IdeaList'

type TabType = 'tasks' | 'ideas'

export default function FlowApp() {
  const [activeTab, setActiveTab] = useState<TabType>('tasks')

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Design the Flow mini-app UI',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2025-12-15',
    },
    {
      id: '2',
      title: 'Develop task creation form',
      status: 'todo',
      priority: 'medium',
      dueDate: '2025-12-20',
    },
    {
      id: '3',
      title: 'Setup Convex database',
      status: 'completed',
      priority: 'high',
    },
    {
      id: '4',
      title: 'Write documentation',
      status: 'todo',
      priority: 'low',
    },
  ])

  const [ideas, setIdeas] = useState<Idea[]>([
    {
      id: '1',
      title: 'Add dark mode support',
      description: 'Implement dark mode toggle for better UX at night',
      status: 'new',
    },
    {
      id: '2',
      title: 'Integration with Calendar',
      description: 'Sync tasks with Google Calendar for better planning',
      status: 'reviewing',
    },
    {
      id: '3',
      title: 'Export to CSV',
      description: 'Allow users to export their tasks and time logs',
      status: 'new',
    },
  ])

  const handleUpdateTaskStatus = (
    taskId: string,
    status: 'todo' | 'in_progress' | 'completed'
  ) => {
    setTasks(tasks.map((task) => (task.id === taskId ? { ...task, status } : task)))
  }

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      setTasks(tasks.filter((task) => task.id !== taskId))
    }
  }

  const handleConvertToTask = (ideaId: string) => {
    const idea = ideas.find((i) => i.id === ideaId)
    if (!idea) return

    const newTask: Task = {
      id: Date.now().toString(),
      title: idea.title,
      status: 'todo',
      priority: 'medium',
      ideaId: idea.id,
    }

    setTasks([...tasks, newTask])
    setIdeas(
      ideas.map((i) => (i.id === ideaId ? { ...i, status: 'converted' as const } : i))
    )
    setActiveTab('tasks')
  }

  const handleDeleteIdea = (ideaId: string) => {
    if (confirm('Are you sure you want to delete this idea?')) {
      setIdeas(ideas.filter((idea) => idea.id !== ideaId))
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
              <Button onClick={() => alert('Add Task - Coming soon')}>
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
            onAddIdea={() => alert('Add Idea - Coming soon')}
            onEditIdea={() => alert('Edit Idea - Coming soon')}
            onDeleteIdea={handleDeleteIdea}
            onConvertToTask={handleConvertToTask}
          />
        )}
      </div>
    </div>
  )
}
