import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { ListItem } from './ListItem'
import { Lightbulb, Edit2, Trash2 } from 'lucide-react'
import type { Id } from '../../../convex/_generated/dataModel'

interface DashboardIdeasListProps {
    workspaceId: Id<"workspaces">
    onEdit?: (idea: any) => void
    onDelete?: (ideaId: string) => void
}

export function DashboardIdeasList({ workspaceId, onEdit, onDelete }: DashboardIdeasListProps) {
    const ideas = useQuery(api.flow.listIdeas, { workspaceId })

    if (!ideas) {
        return <p className="text-gray-400 text-center py-8">Loading...</p>
    }

    if (ideas.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                <p>No ideas yet</p>
                <p className="text-sm mt-2">Tap the + button to create your first idea</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {ideas.slice(0, 10).map((idea) => (
                <ListItem
                    key={idea._id}
                    icon={Lightbulb}
                    title={idea.title}
                    subtitle={idea.description || undefined}
                    onClick={() => onEdit?.(idea)}
                    actions={
                        <div className="flex items-center gap-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onEdit?.(idea)
                                }}
                                className="p-1.5 text-gray-400 hover:text-dark-blue hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDelete?.(idea._id)
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    }
                />
            ))}
            {ideas.length > 10 && (
                <p className="text-sm text-gray-400 text-center pt-4">
                    Showing 10 of {ideas.length} ideas
                </p>
            )}
        </div>
    )
}
