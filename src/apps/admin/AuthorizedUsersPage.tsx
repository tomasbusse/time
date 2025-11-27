import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { useWorkspace } from "../../lib/WorkspaceContext";
import { Id } from "../../../convex/_generated/dataModel";
import { Plus, Trash2, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function AuthorizedUsersPage() {
    const { workspaceId } = useWorkspace();
    const authorizedEmails = useQuery(api.auth.listAuthorizedEmails);
    const addEmail = useMutation(api.auth.addAuthorizedEmail);
    const removeEmail = useMutation(api.auth.removeAuthorizedEmail);

    const [newEmail, setNewEmail] = useState("");
    const [notes, setNotes] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState("");

    const handleAddEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsAdding(true);

        try {
            await addEmail({ email: newEmail, notes });
            setNewEmail("");
            setNotes("");
        } catch (err: any) {
            setError(err.message || "Failed to add email");
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveEmail = async (id: Id<"authorizedEmails">) => {
        if (confirm("Are you sure you want to remove this authorized email?")) {
            try {
                await removeEmail({ id });
            } catch (err: any) {
                alert(err.message || "Failed to remove email");
            }
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-dark-blue mb-2">Authorized Users</h1>
                <p className="text-gray">
                    Manage which email addresses are allowed to access the application
                </p>
            </div>

            {/* Add New Email Form */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold text-dark-blue mb-4">Add Authorized Email</h2>
                <form onSubmit={handleAddEmail} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <Input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="user@example.com"
                            required
                            disabled={isAdding}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes (Optional)
                        </label>
                        <Input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g., Team member, Client, etc."
                            disabled={isAdding}
                        />
                    </div>
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}
                    <Button type="submit" disabled={isAdding}>
                        <Plus className="w-4 h-4 mr-2" />
                        {isAdding ? "Adding..." : "Add Email"}
                    </Button>
                </form>
            </div>

            {/* Authorized Emails List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold text-dark-blue">Authorized Emails</h2>
                </div>
                <div className="divide-y">
                    {!authorizedEmails ? (
                        <div className="p-8 text-center text-gray">Loading...</div>
                    ) : authorizedEmails.length === 0 ? (
                        <div className="p-8 text-center text-gray">
                            No authorized emails yet. Add one above to get started.
                        </div>
                    ) : (
                        authorizedEmails.map((item) => (
                            <div
                                key={item._id}
                                className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-dark-blue">{item.email}</p>
                                        {item.notes && (
                                            <p className="text-sm text-gray">{item.notes}</p>
                                        )}
                                        <p className="text-xs text-gray-400">
                                            Added {new Date(item.addedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemoveEmail(item._id)}
                                    className="text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
