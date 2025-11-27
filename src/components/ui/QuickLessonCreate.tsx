import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Button } from './Button'
import { Calendar, Clock, Plus } from 'lucide-react'
import type { Id } from '../../../convex/_generated/dataModel'
import { addMinutes } from 'date-fns'

interface QuickLessonCreateProps {
    workspaceId: Id<"workspaces">
    userId: Id<"users">
}

export function QuickLessonCreate({ workspaceId, userId }: QuickLessonCreateProps) {
    const customers = useQuery(api.customers.listCustomers, { workspaceId })
    const createLesson = useMutation(api.lessons.createLesson)

    const [customerId, setCustomerId] = useState<string>('')
    const [date, setDate] = useState('')
    const [time, setTime] = useState('')
    const [duration, setDuration] = useState(60) // in minutes
    const [type, setType] = useState<'online' | 'in_person_office' | 'in_person_company'>('online')
    const [isCreating, setIsCreating] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!customerId || !date || !time) {
            alert('Please fill in all required fields')
            return
        }

        setIsCreating(true)
        try {
            const startDateTime = new Date(`${date}T${time}`)
            const endDateTime = addMinutes(startDateTime, duration)

            await createLesson({
                workspaceId,
                teacherId: userId,
                customerId: customerId as Id<"customers">,
                title: `Lesson - ${customers?.find((c: any) => c._id === customerId)?.name}`,
                start: startDateTime.getTime(),
                end: endDateTime.getTime(),
                type,
            })

            // Reset form
            setCustomerId('')
            setDate('')
            setTime('')
            setDuration(60)
            setType('online')

            alert('Lesson created successfully!')
        } catch (error) {
            console.error('Failed to create lesson:', error)
            alert('Failed to create lesson')
        } finally {
            setIsCreating(false)
        }
    }

    const durationPresets = [30, 45, 60, 90]

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Customer Selection */}
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                    Customer *
                </label>
                <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-brown"
                    required
                >
                    <option value="">Select customer...</option>
                    {customers?.map((customer: any) => (
                        <option key={customer._id} value={customer._id}>
                            {customer.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Date *
                    </label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-brown"
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Time *
                    </label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-brown"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Duration Presets */}
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                    Duration
                </label>
                <div className="grid grid-cols-4 gap-2">
                    {durationPresets.map((preset) => (
                        <button
                            key={preset}
                            type="button"
                            onClick={() => setDuration(preset)}
                            className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${duration === preset
                                ? 'bg-custom-brown text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {preset}m
                        </button>
                    ))}
                </div>
            </div>

            {/* Lesson Type - Hidden to match design */}
            {/* <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                    Type
                </label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setType('online')}
                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${type === 'online'
                            ? 'bg-custom-brown text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Online
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('in_person_office')}
                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${type === 'in_person_office'
                            ? 'bg-custom-brown text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        In Person
                    </button>
                </div>
            </div> */}

            {/* Submit Button */}
            <Button
                type="submit"
                disabled={isCreating || !customers}
                className="w-full flex items-center justify-center gap-2"
            >
                <Plus className="w-4 h-4" />
                {isCreating ? 'Creating...' : 'Create Lesson'}
            </Button>
        </form>
    )
}
