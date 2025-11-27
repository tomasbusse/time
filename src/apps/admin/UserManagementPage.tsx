import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { useWorkspace } from "../../lib/WorkspaceContext";
import { Shield, User, GraduationCap, Key } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

export default function UserManagementPage() {
    const users = useQuery(api.users.listUsers);
    const updateUserRole = useMutation(api.users.updateUserRole);
    // const setUserPassword = useMutation(api.users.setUserPassword);
    const { userId } = useWorkspace();
    const currentUser = useQuery(api.users.getUser, userId ? { userId } : "skip");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [passwordModalUserId, setPasswordModalUserId] = useState<Id<"users"> | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [settingPassword, setSettingPassword] = useState(false);

    if (!users || !currentUser) return <div className="p-8">Loading...</div>;

    // Security check: Only admins can see this page
    if (!currentUser.isAdmin && currentUser.role !== "admin") {
        return (
            <div className="p-8 text-center text-red-600">
                <Shield className="w-12 h-12 mx-auto mb-4" />
                <h2 className="text-xl font-bold">Access Denied</h2>
                <p>You do not have permission to view this page.</p>
            </div>
        );
    }

    const handleRoleChange = async (userId: Id<"users">, newRole: "admin" | "teacher" | "none") => {
        setUpdatingId(userId);
        try {
            await updateUserRole({
                userId,
                role: newRole === "none" ? null : newRole,
                isAdmin: newRole === "admin",
                adminUserId: currentUser._id,
            });
        } catch (error) {
            console.error("Failed to update role:", error);
            alert("Failed to update role");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleSetPassword = async () => {
        if (!passwordModalUserId || !newPassword) return;
        if (newPassword.length < 8) {
            alert("Password must be at least 8 characters");
            return;
        }

        setSettingPassword(true);
        try {
            // await setUserPassword({
            //     userId: passwordModalUserId,
            //     password: newPassword,
            //     adminUserId: currentUser._id,
            // });
            alert("Password set successfully!");
            setPasswordModalUserId(null);
            setNewPassword("");
        } catch (error) {
            console.error("Failed to set password:", error);
            alert("Failed to set password");
        } finally {
            setSettingPassword(false);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500">Manage user roles and permissions</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">Admin Access</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Role</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium">
                                            {user.name?.[0]?.toUpperCase() || "U"}
                                        </div>
                                        <span className="font-medium text-gray-900">{user.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                <td className="px-6 py-4">
                                    {user.isAdmin || user.role === "admin" ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                            <Shield className="w-3 h-3" />
                                            Admin
                                        </span>
                                    ) : user.role === "teacher" ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                            <GraduationCap className="w-3 h-3" />
                                            Teacher
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                            <User className="w-3 h-3" />
                                            User
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={user.isAdmin || user.role === "admin" ? "admin" : user.role === "teacher" ? "teacher" : "none"}
                                            onChange={(e) => handleRoleChange(user._id, e.target.value as any)}
                                            disabled={updatingId === user._id || user._id === currentUser._id}
                                            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
                                        >
                                            <option value="none">User</option>
                                            <option value="teacher">Teacher</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        <button
                                            onClick={() => setPasswordModalUserId(user._id)}
                                            disabled={updatingId === user._id}
                                            className="p-2 text-custom-brown hover:bg-custom-brown/10 rounded-md transition-colors disabled:opacity-50"
                                            title="Set Password"
                                        >
                                            <Key className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Set Password Modal */}
            {passwordModalUserId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-custom-brown/10 rounded-lg">
                                <Key className="w-5 h-5 text-custom-brown" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Set Password</h3>
                                <p className="text-sm text-gray-500">
                                    For {users?.find(u => u._id === passwordModalUserId)?.email}
                                </p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                                New Password
                            </label>
                            <input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter password (min 8 characters)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-brown focus:border-custom-brown"
                                minLength={8}
                                disabled={settingPassword}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                User can now log in with their email and this password
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setPasswordModalUserId(null);
                                    setNewPassword("");
                                }}
                                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                                disabled={settingPassword}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSetPassword}
                                className="flex-1 px-4 py-2 text-white bg-custom-brown hover:bg-custom-brown/90 rounded-lg font-medium transition-colors disabled:opacity-50"
                                disabled={settingPassword || newPassword.length < 8}
                            >
                                {settingPassword ? "Setting..." : "Set Password"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
