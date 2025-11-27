import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Plus, Calendar, Save, Trash2 } from "lucide-react";

interface SimpleEquityValuation {
  _id: string;
  equityAccountId: string;
  year: number;
  month: number;
  amount: number;
  notes?: string;
  createdAt: number;
}

export function SimpleEquityValuations() {
  const { workspaceId } = useWorkspace();
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const accounts =
    useQuery(api.simpleFinance.listSimpleEquityAccounts, workspaceId ? { workspaceId } : "skip") || [];

  const valuations: SimpleEquityValuation[] =
    useQuery(api.simpleFinance.listEquityValuations, workspaceId ? { workspaceId } : "skip") || [];

  const createValuation = useMutation(api.simpleFinance.createEquityValuation);
  const updateValuation = useMutation(api.simpleFinance.updateEquityValuation);
  const deleteValuation = useMutation(api.simpleFinance.deleteEquityValuation);

  const handleAddValuation = async () => {
    if (!workspaceId || !selectedAccount || amount <= 0) return;
    const d = new Date(date);
    if (!editingId) {
      await createValuation({
        workspaceId: workspaceId as any,
        equityAccountId: selectedAccount as any,
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        amount,
        notes: notes || undefined,
      });
    } else {
      await updateValuation({
        id: editingId as any,
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        amount,
        notes: notes || undefined,
      });
      setEditingId(null);
    }
    setAmount(0);
    setNotes("");
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(n);

  const grouped = accounts.map((acc) => ({
    ...acc,
    valuations: valuations
      .filter((v) => v.equityAccountId === acc._id)
      .sort((a, b) => b.createdAt - a.createdAt),
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-dark-blue">Equity Valuations</h2>

      {/* Form Section */}
      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Select Account</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="h-10 w-full border rounded-md px-2"
            >
              <option value="">Select account</option>
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Amount (€)</label>
            <input
              type="number"
              className="h-10 w-full border rounded-md px-3"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Notes (optional)</label>
            <input
              className="h-10 w-full border rounded-md px-3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Q4 valuation"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Date</label>
            <input
              type="date"
              className="h-10 w-full border rounded-md px-3"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleAddValuation} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            {editingId ? "Update Valuation" : "Save Valuation"}
          </Button>
        </div>
      </Card>

      {/* Display Section */}
      {grouped.map((acc) => (
        <Card key={acc._id} className="p-4 space-y-2">
          <h3 className="text-lg font-semibold text-dark-blue">{acc.name}</h3>
          {acc.valuations.length === 0 ? (
            <p className="text-sm text-gray">No valuations yet.</p>
          ) : (
            <table className="w-full text-sm mt-2">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1 px-2">Period</th>
                  <th className="text-right py-1 px-2">Amount</th>
                  <th className="text-left py-1 px-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {acc.valuations.map((v) => (
                  <tr key={v._id} className="border-b">
                    <td className="py-1 px-2">{`${v.year}-${v.month.toString().padStart(2, "0")}`}</td>
                    <td className="text-right py-1 px-2 font-medium text-green-700">
                      {formatCurrency(v.amount)}
                    </td>
                    <td className="text-left py-1 px-2 text-gray">{v.notes || "-"}</td>
                    <td className="text-right py-1 px-2 flex gap-1 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(v._id);
                          setSelectedAccount(v.equityAccountId);
                          setAmount(v.amount);
                          setNotes(v.notes || "");
                          setDate(`${v.year}-${v.month.toString().padStart(2, "0")}-01`);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        onClick={() => deleteValuation({ id: v._id as any })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      ))}
    </div>
  );
}