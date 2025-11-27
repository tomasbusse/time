import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useUser } from '@clerk/clerk-react'

export default function AllowedUsersSettings() {
    const { user } = useUser()
    const authorizedEmails = useQuery(api.auth.listAuthorizedEmails) || []
    const addEmail = useMutation(api.auth.addAuthorizedEmail)
    const removeEmail = useMutation(api.auth.removeAuthorizedEmail)

    const [newEmail, setNewEmail] = useState('')
    const [notes, setNotes] = useState('')
    const [isAdding, setIsAdding] = useState(false)

    // Check if current user is admin (first authorized email)
    const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase()
    const isAdmin = userEmail === 'tomas@englisch-lehrer.com'

    if (!isAdmin) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
                <p>Only administrators can manage allowed users.</p>
            </div>
        )
    }

    const handleAdd = async () => {
        if (!newEmail.trim()) return

        setIsAdding(true)
        try {
            await addEmail({ email: newEmail.toLowerCase().trim(), notes })
            setNewEmail('')
            setNotes('')
        } catch (error) {
            alert(`Error: ${error}`)
        } finally {
            setIsAdding(false)
        }
    }

    const handleRemove = async (id: any) => {
        if (confirm('Are you sure you want to remove this email?')) {
            await removeEmail({ id })
        }
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Allowed Users</h1>
            <p className="text-gray-600 mb-8">Manage who can access this application</p>

            <Card className="p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Add New Email</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Email Address</label>
                        <Input
                            type="email"
                            placeholder="user@example.com"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                        <Input
                            type="text"
                            placeholder="e.g., Team member, Client, etc."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <Button onClick={handleAdd} disabled={isAdding}>
                        {isAdding ? 'Adding...' : 'Add Email'}
                    </Button>
                </div>
            </Card>

            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Authorized Emails ({authorizedEmails.length})</h2>
                <div className="space-y-2">
                    {authorizedEmails.length === 0 ? (
                        <p className="text-gray-500 italic">No authorized emails yet</p>
                    ) : (
                        authorizedEmails.map((item) => (
                            <div
                                key={item._id}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex-1">
                                    <p className="font-medium">{item.email}</p>
                                    {item.notes && <p className="text-sm text-gray-600">{item.notes}</p>}
                                    <p className="text-xs text-gray-400 mt-1">
                                        Added {new Date(item.addedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                {item.email !== 'tomas@englisch-lehrer.com' && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleRemove(item._id)}
                                    >
                                        Remove
                                    </Button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    )
}
