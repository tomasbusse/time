import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useWorkspace } from "@/lib/WorkspaceContext";
import ApiKeyManager from "@/apps/settings/components/ApiKeyManager";
import UserInvitations from "@/apps/settings/components/UserInvitations";
import ProfileSettings from "@/apps/settings/components/ProfileSettings";
import UserManagementPage from "@/apps/admin/UserManagementPage";
import SimpleFinanceApp from "@/apps/finance/SimpleFinanceApp";
import { Button } from "@/components/ui/Button";

type SettingsTab = "profile" | "apiKeys" | "invitations" | "userAdmin" | "money";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const { userId } = useWorkspace();
  const currentUser = useQuery(api.users.getUser, userId ? { userId } : "skip");

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileSettings />;
      case "apiKeys":
        return <ApiKeyManager />;
      case "invitations":
        return <UserInvitations />;
      case "userAdmin":
        return <UserManagementPage />;
      case "money":
        return <SimpleFinanceApp />;
      default:
        return <ProfileSettings />;
    }
  };

  const isAdmin = currentUser?.isAdmin || currentUser?.role === 'admin';

  if (currentUser === undefined) {
    return <div className="p-8">Loading user profile...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <div className="text-sm text-gray-500">
          Logged in as: {currentUser?.name} ({currentUser?.email}) <br />
          Role: {currentUser?.role || 'User'} | Admin: {currentUser?.isAdmin ? 'Yes' : 'No'}
        </div>
      </div>
      <div className="flex space-x-4 border-b mb-8 overflow-x-auto pb-2">
        <Button variant={activeTab === 'profile' ? 'default' : 'ghost'} onClick={() => setActiveTab('profile')}>Profile</Button>
        <Button variant={activeTab === 'apiKeys' ? 'default' : 'ghost'} onClick={() => setActiveTab('apiKeys')}>API Keys</Button>
        <Button variant={activeTab === 'invitations' ? 'default' : 'ghost'} onClick={() => setActiveTab('invitations')}>User Invitations</Button>
        {isAdmin && (
          <>
            <Button variant={activeTab === 'userAdmin' ? 'default' : 'ghost'} onClick={() => setActiveTab('userAdmin')}>User Admin</Button>
            <Button variant={activeTab === 'money' ? 'default' : 'ghost'} onClick={() => setActiveTab('money')}>Money</Button>
          </>
        )}
      </div>
      <div>
        {renderContent()}
      </div>
    </div>
  );
};

export default SettingsPage;