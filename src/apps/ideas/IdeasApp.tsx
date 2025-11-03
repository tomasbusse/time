import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Lightbulb, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

interface Idea {
  id: string
  title: string
  description?: string
  category?: string
  createdAt: number
}

export default function IdeasApp() {
  const [searchQuery, setSearchQuery] = useState('')
  const [ideas] = useState<Idea[]>([
    {
      id: '1',
      title: 'Add dark mode support',
      description: 'Implement dark mode toggle for better UX at night',
      category: 'Enhancement',
      createdAt: Date.now() - 86400000,
    },
    {
      id: '2',
      title: 'Mobile app version',
      description: 'Create native mobile apps for iOS and Android',
      category: 'Feature',
      createdAt: Date.now() - 172800000,
    },
    {
      id: '3',
      title: 'Weekly email digest',
      description: 'Send users a summary of their productivity each week',
      category: 'Feature',
      createdAt: Date.now() - 259200000,
    },
    {
      id: '4',
      title: 'Voice input for ideas',
      description: 'Allow capturing ideas using voice recognition',
      category: 'Enhancement',
      createdAt: Date.now() - 345600000,
    },
  ])

  const filteredIdeas = ideas.filter(
    (idea) =>
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getCategoryColor = (category?: string): string => {
    const colors: Record<string, string> = {
      Feature: 'bg-blue-100 text-blue-700',
      Enhancement: 'bg-purple-100 text-purple-700',
      Bug: 'bg-red-100 text-red-700',
      Research: 'bg-green-100 text-green-700',
    }
    return category ? colors[category] || 'bg-neutral-100 text-neutral-700' : 'bg-neutral-100 text-neutral-700'
  }

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 mb-2">Ideas</h1>
            <p className="text-neutral-600">Capture your thoughts and inspiration.</p>
          </div>
          <Button onClick={() => alert('Quick Capture - Coming soon')}>
            <Plus className="w-4 h-4 mr-2" />
            Quick Capture
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search ideas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{ideas.length}</div>
              <div className="text-sm text-neutral-600">Total Ideas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {ideas.filter((i) => i.category === 'Feature').length}
              </div>
              <div className="text-sm text-neutral-600">Features</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {ideas.filter((i) => i.category === 'Enhancement').length}
              </div>
              <div className="text-sm text-neutral-600">Enhancements</div>
            </div>
          </div>
        </div>

        {filteredIdeas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Lightbulb className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-600 mb-4">
                {searchQuery ? 'No ideas match your search' : 'No ideas yet'}
              </p>
              {!searchQuery && (
                <Button onClick={() => alert('Quick Capture - Coming soon')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Capture Your First Idea
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredIdeas.map((idea) => (
              <Card key={idea.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Lightbulb className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{idea.title}</CardTitle>
                      {idea.description && (
                        <p className="text-sm text-neutral-600 mb-3">
                          {idea.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        {idea.category && (
                          <span
                            className={`text-xs px-2 py-1 rounded ${getCategoryColor(
                              idea.category
                            )}`}
                          >
                            {idea.category}
                          </span>
                        )}
                        <span className="text-xs text-neutral-500">
                          {formatDate(idea.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
