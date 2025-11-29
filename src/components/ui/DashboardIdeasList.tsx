import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { ListItem } from './ListItem'
import { Lightbulb } from 'lucide-react'
import type { Id } from '../../../convex/_generated/dataModel'

interface DashboardIdeasListProps {
    workspaceId: Id<"workspaces">
}

export function DashboardIdeasList({ workspaceId }: DashboardIdeasListProps) {
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
