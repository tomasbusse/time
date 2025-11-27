import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useWorkspace } from "@/lib/WorkspaceContext";

const UserInvitations = () => {
  const { workspaceId, userId } = useWorkspace();
  const currentUser = useQuery(api.users.getUser, userId ? { userId } : "skip");
  const users = useQuery(api.users.listUsers);
  const createUser = useMutation(api.users.createUser);
  const updateUserRole = useMutation(api.users.updateUserRole);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"user" | "teacher" | "admin">("user");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateUser = async () => {
    if (!email || !name) {
      alert("Please enter email and name");
      return;
    }
    setIsLoading(true);
    try {
      const userId = await createUser({
        email,
        name,
        isAdmin: role === "admin",
      });

      // If role is teacher or admin, we might need to update the role explicitly if createUser doesn't handle 'teacher' role
      // createUser only takes isAdmin boolean.
      // So we should update the role after creation if it's 'teacher' or 'admin'
      if (role === "teacher" || role === "admin") {
        await updateUserRole({
          userId,
          role: role === "admin" ? "admin" : "teacher",
          isAdmin: role === "admin",
          adminUserId: currentUser?._id,
        });
      }

      alert(`User ${name} created successfully!`);
      setEmail("");
      setName("");
      setRole("user");
    } catch (error: any) {
      console.error("Failed to create user:", error);
      alert(`Failed to create user: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">User Management</h2>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add New User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "user" | "teacher" | "admin")}
            className="w-full p-2 border rounded"
          >
            <option value="user">User (Standard)</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
          <Button onClick={handleCreateUser} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create User"}
          </Button>
        </CardContent>
      </Card>

      <h3 className="text-xl font-bold mb-4">Existing Users</h3>
      <div className="space-y-4">
        {!users ? (
          <div>Loading users...</div>
        ) : users.length === 0 ? (
          <div>No users found.</div>
        ) : (
          users.map(user => (
            <Card key={user._id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${user.isAdmin || user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'teacher' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                    {user.isAdmin || user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Teacher' : 'User'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default UserInvitations;