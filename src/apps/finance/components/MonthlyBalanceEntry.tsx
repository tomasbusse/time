import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useWorkspace } from "../../../lib/WorkspaceContext";

interface MonthlyBalanceEntryProps {
  month: string; // YYYY-MM
  onMonthChange?: (newMonth: string) => void; // Callback to notify parent of month changes
}

export function MonthlyBalanceEntry({ month, onMonthChange }: MonthlyBalanceEntryProps) {
  const { workspaceId, userId } = useWorkspace();
  const [currentDate, setCurrentDate] = useState(
    new Date(`${month}-01`)
  );

  // Sync with parent when month prop changes
  useEffect(() => {
    const newDate = new Date(`${month}-01`);
    setCurrentDate(newDate);
  }, [month]);

  // Current active month string - this is what we use for everything
  const activeMonth = currentDate.toISOString().slice(0, 7);

  // Query balances for ONLY the current active month
  const monthlyBalances = useQuery(
    api.simpleFinance.getMonthlyBalances,
    workspaceId ? { workspaceId, month: activeMonth } : "skip"
  );

  const assets = useQuery(
    api.simpleFinance.listSimpleAssets,
    workspaceId ? { workspaceId } : "skip"
  );

  // Filter for bank accounts and liabilities, sort by order
  const bankAccounts = (assets || [])
    .filter(a => a.type === 'bank_account')
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const liabilities = (assets || [])
    .filter(a => a.type === 'bank_account_liability')
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const recordMonthlyBalance = useMutation(api.simpleFinance.recordMonthlyBalance);

  // State for the current active month only
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  // Load data when monthlyBalances changes or activeMonth changes
  useEffect(() => {
    if (!monthlyBalances) return;

    const newBalances: Record<string, number> = {};
    const newNotes: Record<string, string> = {};

    for (const mb of monthlyBalances) {
      newBalances[mb.assetId] = mb.balance;
      newNotes[mb.assetId] = mb.notes || "";
    }

    setBalances(newBalances);
    setNotes(newNotes);
  }, [monthlyBalances, activeMonth]);

  const handleSave = async () => {
    if (!assets || !workspaceId || !userId) return;
    const allAccounts = [...bankAccounts, ...liabilities];
    for (const asset of allAccounts) {
      if (balances[asset._id] !== undefined) {
        await recordMonthlyBalance({
          workspaceId,
          assetId: asset._id,
          month: activeMonth, // Save to the current active month only
          balance: balances[asset._id],
          notes: notes[asset._id],
          userId: userId,
        });
      }
    }
  };

  // Month navigation - update both local state and notify parent
  const handleNextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
    const newMonth = next.toISOString().slice(0, 7);
    if (onMonthChange) {
      onMonthChange(newMonth); // Notify parent of month change
    }
    // Immediately clear state - each month starts fresh
    setBalances({});
    setNotes({});
  };

  const handlePrevMonth = () => {
    const prev = new Date(currentDate);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentDate(prev);
    const newMonth = prev.toISOString().slice(0, 7);
    if (onMonthChange) {
      onMonthChange(newMonth); // Notify parent of month change
    }
    // Immediately clear state - each month starts fresh
    setBalances({});
    setNotes({});
  };

  if (!assets || !workspaceId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevMonth}
          className="px-3 py-1 bg-light-gray rounded hover:bg-off-white"
        >
          ← Prev
        </button>
        <h3 className="text-lg font-medium">
          Balances for {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={handleNextMonth}
          className="px-3 py-1 bg-light-gray rounded hover:bg-off-white"
        >
          Next →
        </button>
      </div>

      <div className="space-y-4">
        {bankAccounts.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-dark-blue mb-2">Assets (Positive Balance)</h4>
            <div className="space-y-2">
              {bankAccounts.map((asset) => (
                <div key={asset._id} className="grid grid-cols-2 gap-4 items-center p-2 rounded" style={{ backgroundColor: '#F1F5EE' }}>
                  <label htmlFor={`balance-${asset._id}`} className="font-medium">
                    {asset.name}
                  </label>
                  <input
                    type="number"
                    id={`balance-${asset._id}`}
                    value={
                      (balances && balances[asset._id] !== undefined)
                        ? balances[asset._id]
                        : ""
                    }
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setBalances(prev => ({
                        ...prev,
                        [asset._id]: isNaN(value) ? 0 : value
                      }));
                    }}
                    className="p-2 border rounded w-full"
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {liabilities.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-custom-brown mb-2">Liabilities (Negative Balance)</h4>
            <div className="space-y-2">
              {liabilities.map((asset) => (
                <div key={asset._id} className="grid grid-cols-2 gap-4 items-center p-2 rounded" style={{ backgroundColor: '#FFF5F0' }}>
                  <label htmlFor={`balance-${asset._id}`} className="font-medium">
                    {asset.name}
                  </label>
                  <input
                    type="number"
                    id={`balance-${asset._id}`}
                    value={
                      (balances && balances[asset._id] !== undefined)
                        ? balances[asset._id]
                        : ""
                    }
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setBalances(prev => ({
                        ...prev,
                        [asset._id]: isNaN(value) ? 0 : Math.abs(value) // Always store as positive, will be negated in calculations
                      }));
                    }}
                    className="p-2 border rounded w-full"
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <button
        onClick={handleSave}
        className="px-4 py-2 bg-dark-blue text-off-white rounded hover:bg-dark-blue"
      >
        Save Balances
      </button>
      <div className="text-center text-gray mt-4">
        <p className="text-sm italic">
          Viewing data for:&nbsp;
          <strong>
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </strong>
        </p>
      </div>
    </div>
  );
}