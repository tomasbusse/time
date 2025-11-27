import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useState } from "react";
import { useWorkspace } from "../../../lib/WorkspaceContext";

export default function GroupList({ customerId }: { customerId: Id<"customers"> }) {
    const { workspaceId } = useWorkspace();
    const groups = useQuery((api as any).groups.listGroups, customerId && workspaceId ? { customerId, workspaceId } : "skip");
    const createGroup = useMutation((api as any).groups.createGroup);
    const updateGroup = useMutation((api as any).groups.updateGroup);
    const deleteGroup = useMutation((api as any).groups.deleteGroup);
    const teachers = useQuery(api.users.listUsers);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: "",
        defaultTeacherId: undefined as string | undefined,
        notes: "",
    });

    const handleOpenModal = (group?: any) => {
        if (group) {
            setEditingGroup(group);
            setFormData({
                name: group.name,
                defaultTeacherId: group.defaultTeacherId || undefined,
                notes: group.notes || "",
            });
        } else {
            setEditingGroup(null);
            setFormData({
                name: "",
                defaultTeacherId: undefined,
                notes: "",
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workspaceId) return;

        try {
            const payload = {
                name: formData.name,
                defaultTeacherId: formData.defaultTeacherId ? (formData.defaultTeacherId as Id<"users">) : undefined,
                notes: formData.notes,
            };

            if (editingGroup) {
                await updateGroup({
                    groupId: editingGroup._id,
                    ...payload,
                });
            } else {
                await createGroup({
                    workspaceId,
                    customerId,
                    ...payload,
                });
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to save group:", error);
            alert("Failed to save group");
        }
    };

    const handleDelete = async (id: Id<"studentGroups">) => {
        if (confirm("Are you sure you want to delete this group? Students in this group will be unassigned.")) {
            await deleteGroup({ groupId: id });
        }
    };

    return (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Groups</h3>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-3 py-1 bg-dark-blue text-white rounded text-sm hover:opacity-90"
                >
                    + Add Group
                </button>
            </div>

            <div className="bg-white rounded shadow overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Default Teacher</th>
                            <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {groups?.map((group: any) => {
                            const teacherName = teachers?.find((t: any) => t._id === group.defaultTeacherId)?.name || "-";
                            return (
                                <tr key={group._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 font-medium">{group.name}</td>
                                    <td className="px-4 py-2 text-gray-500">{teacherName}</td>
                                    <td className="px-4 py-2">
                                        <button
                                            onClick={() => handleOpenModal(group)}
                                            className="text-blue-600 hover:underline mr-3"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(group._id)}
                                            className="text-red-600 hover:underline"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {groups?.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                                    No groups found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">{editingGroup ? "Edit Group" : "New Group"}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Group Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Default Teacher</label>
                                <select
                                    value={formData.defaultTeacherId || ""}
                                    onChange={e => setFormData({ ...formData, defaultTeacherId: e.target.value || undefined })}
                                    className="w-full border rounded px-3 py-2"
                                >
                                    <option value="">- No Teacher -</option>
                                    {teachers?.map((t: any) => (
                                        <option key={t._id} value={t._id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full border rounded px-3 py-2"
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border rounded hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-dark-blue text-white rounded hover:opacity-90"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
