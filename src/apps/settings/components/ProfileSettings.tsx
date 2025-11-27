import { Button } from "@/components/ui/Button";
import { useWorkspace } from "@/lib/WorkspaceContext";

const ProfileSettings = () => {
  const { userName, userId, workspaceId, isLoading } = useWorkspace();

  const handleSignOut = () => {
    // Clear all local storage
    localStorage.clear();
    // Redirect to login page
    window.location.href = '/login';
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Profile Settings</h2>
      <div className="space-y-4">
        <p>
          <strong>Name:</strong> {userName || "N/A"}
        </p>
        <p>
          <strong>User ID:</strong> {userId || "N/A"}
        </p>
        <p>
          <strong>Workspace:</strong> {workspaceId || "N/A"}
        </p>
        <Button
          onClick={handleSignOut}
          variant="destructive"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default ProfileSettings;