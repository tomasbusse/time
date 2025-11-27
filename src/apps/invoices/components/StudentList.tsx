import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useState } from "react";
import { useWorkspace } from "../../../lib/WorkspaceContext";

export default function StudentList({ customerId }: { customerId: Id<"customers"> }) {
    const { workspaceId } = useWorkspace();
    const students = useQuery((api as any).students.listStudents, customerId && workspaceId ? { customerId, workspaceId } : "skip");
    const createStudent = useMutation((api as any).students.createStudent);
    const updateStudent = useMutation((api as any).students.updateStudent);
    const deleteStudent = useMutation((api as any).students.deleteStudent);
    const groups = useQuery((api as any).groups.listGroups, customerId && workspaceId ? { customerId, workspaceId } : "skip");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<any>(null);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        groupId: undefined as string | undefined,
        notes: "",
    });

    const handleOpenModal = (student?: any) => {
        if (student) {
            setEditingStudent(student);
            setFormData({
                firstName: student.firstName,
                lastName: student.lastName,
                email: student.email,
                phone: student.phone || "",
                groupId: student.groupId || undefined,
                notes: student.notes || "",
            });
        } else {
            setEditingStudent(null);
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                groupId: undefined,
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
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                groupId: formData.groupId ? (formData.groupId as Id<"studentGroups">) : undefined,
                notes: formData.notes,
            };

            if (editingStudent) {
                await updateStudent({
                    studentId: editingStudent._id,
                    ...payload,
                });
            } else {
                await createStudent({
                    workspaceId,
                    customerId,
                    ...payload,
                });
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to save student:", error);
            alert("Failed to save student");
        }
    };

    const handleDelete = async (id: Id<"students">) => {
        if (confirm("Are you sure you want to delete this student?")) {
            await deleteStudent({ studentId: id });
        }
    };

    return (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Students</h3>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-3 py-1 bg-dark-blue text-white rounded text-sm hover:opacity-90"
                >
                    + Add Student
                </button>
            </div>

            <div className="bg-white rounded shadow overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Email</th>
                            <th className="px-4 py-2 text-left">Group</th>
                            <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {students?.map((student: any) => {
                            const groupName = groups?.find((g: any) => g._id === student.groupId)?.name || "-";
                            return (
                                <tr key={student._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 font-medium">{student.firstName} {student.lastName}</td>
                                    <td className="px-4 py-2 text-gray-500">{student.email}</td>
                                    <td className="px-4 py-2 text-gray-500">{groupName}</td>
                                    <td className="px-4 py-2">
                                        <button
                                            onClick={() => handleOpenModal(student)}
                                            className="text-blue-600 hover:underline mr-3"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(student._id)}
                                            className="text-red-600 hover:underline"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {students?.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                                    No students found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">{editingStudent ? "Edit Student" : "New Student"}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">First Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.firstName}
                                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                        className="w-full border rounded px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.lastName}
                                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                        className="w-full border rounded px-3 py-2"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Phone</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Group</label>
                                <select
                                    value={formData.groupId || ""}
                                    onChange={e => setFormData({ ...formData, groupId: e.target.value || undefined })}
                                    className="w-full border rounded px-3 py-2"
                                >
                                    <option value="">- No Group -</option>
                                    {groups?.map((g: any) => (
                                        <option key={g._id} value={g._id}>{g.name}</option>
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
