import { Lightbulb, ArrowRight, Trash2, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

export interface Idea {
  id: string
  title: string
  description?: string
  status: 'new' | 'reviewing' | 'converted' | 'archived'
}

interface IdeaListProps {
  ideas: Idea[]
  onAddIdea: () => void
  onEditIdea: (ideaId: string) => void
  onDeleteIdea: (ideaId: string) => void
  onConvertToTask: (ideaId: string) => void
}

export default function IdeaList({
  ideas,
  onAddIdea,
  onEditIdea,
  onDeleteIdea,
  onConvertToTask,
}: IdeaListProps) {
  const getStatusColor = (status: string): string => {
    const colors = {
      new: 'bg-green-100 text-green-700',
      reviewing: 'bg-yellow-100 text-yellow-700',
      converted: 'bg-blue-100 text-blue-700',
      archived: 'bg-neutral-100 text-neutral-700',
    }
    return colors[status as keyof typeof colors] || colors.new
  }

  const activeIdeas = ideas.filter((idea) => idea.status !== 'archived')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-800">Ideas</h2>
        <Button onClick={onAddIdea}>
          <Lightbulb className="w-4 h-4 mr-2" />
          New Idea
        </Button>
      </div>

      {activeIdeas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Lightbulb className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600 mb-4">No ideas yet</p>
            <Button onClick={onAddIdea}>
              <Lightbulb className="w-4 h-4 mr-2" />
              Capture Your First Idea
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeIdeas.map((idea) => (
            <Card key={idea.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    <Lightbulb className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                    <CardTitle className="text-lg">{idea.title}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEditIdea(idea.id)}
                      className="p-1 hover:bg-neutral-100 rounded"
                      title="Edit idea"
                    >
                      <Edit2 className="w-4 h-4 text-neutral-500" />
                    </button>
                    <button
                      onClick={() => onDeleteIdea(idea.id)}
                      className="p-1 hover:bg-neutral-100 rounded"
                      title="Delete idea"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {idea.description && (
                  <p className="text-sm text-neutral-600 mb-4 line-clamp-3">
                    {idea.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs px-2 py-1 rounded ${getStatusColor(
                      idea.status
                    )}`}
                  >
                    {idea.status}
                  </span>

                  {idea.status !== 'converted' && (
                    <Button
                      onClick={() => onConvertToTask(idea.id)}
                      size="sm"
                      variant="outline"
                    >
                      <ArrowRight className="w-4 h-4 mr-1" />
                      To Task
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
