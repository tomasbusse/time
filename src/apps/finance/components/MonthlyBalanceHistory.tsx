import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useWorkspace } from "../../../lib/WorkspaceContext";
import { Id } from "../../../../convex/_generated/dataModel";
import { Trash2 } from "lucide-react";

interface MonthlyBalanceHistoryProps {
  month: string; // YYYY-MM
  onSelectMonth: (month: string) => void;
}

export function MonthlyBalanceHistory({ month, onSelectMonth }: MonthlyBalanceHistoryProps) {
  const { workspaceId } = useWorkspace();
  const balances = useQuery(
    api.simpleFinance.getMonthlyBalances,
    workspaceId ? { workspaceId, month } : "skip"
  );
  const assets = useQuery(
    api.simpleFinance.listSimpleAssets,
    workspaceId ? { workspaceId } : "skip"
  );
  const resetLiquidityHistoryMutation = useMutation(api.simpleFinance.resetLiquidityHistory);
  const deleteMonthlyBalance = useMutation(api.simpleFinance.deleteMonthlyBalance);

  const assetMap = new Map(assets?.map((asset) => [asset._id, asset.name]));

  const changeMonth = (offset: number) => {
    const newDate = new Date(month + "-01");
    newDate.setMonth(newDate.getMonth() + offset);
    onSelectMonth(newDate.toISOString().slice(0, 7));
  };

  const handleDeleteBalance = async (balanceId: Id<"simpleAssetMonthlyBalances">) => {
    if (confirm("Are you sure you want to delete this balance record?")) {
      await deleteMonthlyBalance({ id: balanceId });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">History for {month}</h3>
        <div className="flex space-x-2">
          <button onClick={() => changeMonth(-1)} className="px-2 py-1 border rounded">{'<'}</button>
          <button onClick={() => changeMonth(1)} className="px-2 py-1 border rounded">{'>'}</button>
        </div>
      </div>
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left">Account</th>
            <th className="text-right">Balance</th>
            <th className="text-left">Notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {balances?.map((balance) => (
            <tr key={balance._id}>
              <td>{assetMap.get(balance.assetId) || "Unknown Asset"}</td>
              <td className="text-right">
                {new Intl.NumberFormat("de-DE", {
                  style: "currency",
                }).format(balance.balance || 0)}
              </td>
              <td>{typeof balance.notes === 'string' ? balance.notes : (balance.notes ? String(balance.notes) : '')}</td>
              <td className="text-right">
                <button
                  onClick={() => handleDeleteBalance(balance._id)}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  title="Delete this balance record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}