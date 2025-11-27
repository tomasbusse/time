import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Plus, Edit2, Trash2 } from "lucide-react";

interface EquityAccount {
  _id: string;
  name: string;
  type: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export function SimpleEquityAccounts() {
  const { workspaceId } = useWorkspace();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EquityAccount | undefined>();
  const [formData, setFormData] = useState({ name: "", type: "", description: "" });

  // Queries
  const accounts: EquityAccount[] =
    useQuery(api.simpleFinance.listSimpleEquityAccounts, workspaceId ? { workspaceId } : "skip") || [];

  // Mutations
  const createAccount = useMutation(api.simpleFinance.createSimpleEquityAccount);
  const updateAccount = useMutation(api.simpleFinance.updateSimpleEquityAccount);
  const deleteAccount = useMutation(api.simpleFinance.deleteSimpleEquityAccount);

  const handleSubmit = async () => {
    if (!workspaceId || !formData.name.trim() || !formData.type.trim()) return;
    if (editing) {
      await updateAccount({
        id: editing._id as any,
        name: formData.name,
        type: formData.type,
        description: formData.description,
      });
    } else {
      await createAccount({
        workspaceId: workspaceId as any,
        name: formData.name,
        type: formData.type,
        description: formData.description || undefined,
      });
    }
    setShowForm(false);
    setEditing(undefined);
    setFormData({ name: "", type: "", description: "" });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this equity account?")) {
      await deleteAccount({ id: id as any });
    }
  };

  if (showForm || editing) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">
            {editing ? "Edit Equity Account" : "Create Equity Account"}
          </h2>
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="flex h-10 w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <input
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              placeholder="e.g. business, personal, investment"
              className="flex h-10 w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="flex w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1 bg-dark-blue text-off-white">
              Save
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-dark-blue">Equity Accounts</h2>
        <Button
          className="flex items-center gap-2"
          onClick={() => {
            setEditing(undefined);
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Add Account
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray">No equity accounts defined yet.</p>
          <Button onClick={() => setShowForm(true)} variant="outline" className="mt-4">
            Add Your First Account
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((acc) => (
            <Card key={acc._id} className="p-4 flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-dark-blue">{acc.name}</h3>
                <p className="text-sm text-gray">{acc.type}</p>
                {acc.description && (
                  <p className="text-sm text-gray mt-1">{acc.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditing(acc);
                    setFormData({
                      name: acc.name,
                      type: acc.type,
                      description: acc.description || "",
                    });
                    setShowForm(true);
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(acc._id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}