import { useClerk, useUser, UserProfile } from "@clerk/clerk-react";
import { Button } from "@/components/ui/Button";
import { useWorkspace } from "@/lib/WorkspaceContext";

const ProfileSettings = () => {
  const { userName, userId, workspaceId, isLoading } = useWorkspace();
  const { signOut, openUserProfile } = useClerk();
  const { user } = useUser();

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("Sign out error:", error);
      window.location.href = "/login";
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Profile Settings</h2>
        <div className="space-y-4">
          <p>
            <strong>Name:</strong> {userName || user?.fullName || "N/A"}
          </p>
          <p>
            <strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress || "N/A"}
          </p>
          <p>
            <strong>User ID:</strong> {userId || "N/A"}
          </p>
          <p>
            <strong>Workspace:</strong> {workspaceId || "N/A"}
          </p>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-xl font-semibold mb-4">Manage Account</h3>
        <p className="text-gray-600 mb-4">
          Update your password, email, or other account settings through Clerk.
        </p>
        <Button onClick={() => openUserProfile()}>
          Manage Account Settings
        </Button>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-xl font-semibold mb-4">Sign Out</h3>
        <Button onClick={handleSignOut} variant="destructive">
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default ProfileSettings;
