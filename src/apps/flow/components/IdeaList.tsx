import { Lightbulb, ArrowRight, Trash2, Edit2, Tag, Flag, Paperclip, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { useState } from 'react'

export interface Idea {
  id: string
  title: string
  description?: string
  richDescription?: string
  category?: string
  tags?: string[]
  priority?: 'low' | 'medium' | 'high'
  attachments?: Array<{
    url: string
    name: string
    type: string
  }>
  status: 'new' | 'reviewing' | 'converted' | 'archived'
}

interface IdeaListProps {
  ideas: Idea[]
  onAddIdea: () => void
  onEditIdea: (idea: Idea) => void
  onViewIdeaDetail: (ideaId: string) => void
  onDeleteIdea: (ideaId: string) => void
  onConvertToTask: (ideaId: string) => void
}

export default function IdeaList({
  ideas,
  onAddIdea,
  onEditIdea,
  onViewIdeaDetail,
  onDeleteIdea,
  onConvertToTask,
}: IdeaListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedPriority, setSelectedPriority] = useState('')
  const [selectedTag, setSelectedTag] = useState('')

  const getStatusColor = (status: string): string => {
    const colors = {
      new: 'bg-green-100 text-green-700',
      reviewing: 'bg-yellow-100 text-yellow-700',
      converted: 'bg-blue-100 text-blue-700',
      archived: 'bg-neutral-100 text-neutral-700',
    }
    return colors[status as keyof typeof colors] || colors.new
  }

  const getPriorityColor = (priority?: string): string => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  // Get unique categories and tags for filters
  const categories = Array.from(new Set(ideas.map(idea => idea.category).filter(Boolean))) as string[]
  const tags = Array.from(new Set(ideas.flatMap(idea => idea.tags || [])))
  const priorities = ['low', 'medium', 'high']

  // Filter ideas based on search and filters
  const filteredIdeas = ideas.filter((idea) => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = 
        idea.title.toLowerCase().includes(searchLower) ||
        (idea.description && idea.description.toLowerCase().includes(searchLower)) ||
        (idea.richDescription && idea.richDescription.toLowerCase().includes(searchLower)) ||
        (idea.category && idea.category.toLowerCase().includes(searchLower)) ||
        (idea.tags && idea.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      if (!matchesSearch) return false
    }

    if (selectedCategory && idea.category !== selectedCategory) return false
    if (selectedPriority && idea.priority !== selectedPriority) return false
    if (selectedTag && (!idea.tags || !idea.tags.includes(selectedTag))) return false

    return true
  })

  const activeIdeas = filteredIdeas.filter((idea) => idea.status !== 'archived')

  // Stats for active ideas
  const stats = {
    total: activeIdeas.length,
    byCategory: categories.reduce((acc, cat) => {
      acc[cat] = activeIdeas.filter(idea => idea.category === cat).length
      return acc
    }, {} as Record<string, number>),
    byPriority: priorities.reduce((acc, priority) => {
      acc[priority] = activeIdeas.filter(idea => idea.priority === priority).length
      return acc
    }, {} as Record<string, number>),
    withAttachments: activeIdeas.filter(idea => idea.attachments && idea.attachments.length > 0).length,
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setSelectedPriority('')
    setSelectedTag('')
  }

  const hasActiveFilters = searchQuery || selectedCategory || selectedPriority || selectedTag

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-800">Ideas</h2>
        <Button onClick={onAddIdea}>
          <Lightbulb className="w-4 h-4 mr-2" />
          New Idea
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search ideas by title, description, category, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent capitalize"
            >
              <option value="">All Priorities</option>
              {priorities.map(priority => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Tag</label>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Tags</option>
              {tags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline" size="sm" className="w-full">
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-neutral-600">Total Ideas</div>
          </div>
          {categories.slice(0, 3).map(category => (
            <div key={category} className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.byCategory[category]}</div>
              <div className="text-sm text-neutral-600">{category}</div>
            </div>
          ))}
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.withAttachments}</div>
            <div className="text-sm text-neutral-600">With Files</div>
          </div>
        </div>
      </div>

      {/* Ideas Grid */}
      {activeIdeas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Lightbulb className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600 mb-4">
              {hasActiveFilters ? 'No ideas match your filters' : 'No ideas yet'}
            </p>
            {!hasActiveFilters && (
              <Button onClick={onAddIdea}>
                <Lightbulb className="w-4 h-4 mr-2" />
                Capture Your First Idea
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeIdeas.map((idea) => (
            <Card key={idea.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onViewIdeaDetail(idea.id)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    <Lightbulb className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{idea.title}</CardTitle>
                      
                      {/* Priority Badge */}
                      {idea.priority && (
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-2 capitalize border ${getPriorityColor(idea.priority)}`}>
                          <Flag className="w-3 h-3" />
                          {idea.priority}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onEditIdea(idea)}
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
                {/* Description */}
                {(idea.description || idea.richDescription) && (
                  <div className="mb-4">
                    {idea.description && (
                      <p className="text-sm text-neutral-600 mb-2 line-clamp-2">
                        {idea.description}
                      </p>
                    )}
                    {idea.richDescription && (
                      <div className="text-xs text-neutral-500 max-h-16 overflow-y-auto">
                        <pre className="whitespace-pre-wrap font-sans">
                          {idea.richDescription.length > 150 
                            ? idea.richDescription.substring(0, 150) + '...'
                            : idea.richDescription
                          }
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Category */}
                {idea.category && (
                  <div className="mb-3">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {idea.category}
                    </span>
                  </div>
                )}

                {/* Tags */}
                {idea.tags && idea.tags.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {idea.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                      {idea.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{idea.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Attachments indicator */}
                {idea.attachments && idea.attachments.length > 0 && (
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Paperclip className="w-3 h-3" />
                      {idea.attachments.length} attachment{idea.attachments.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs px-2 py-1 rounded ${getStatusColor(idea.status)}`}
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
