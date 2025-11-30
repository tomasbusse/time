import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Target, Plus, Edit2, Banknote, Trash2, Calendar, BarChart, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { MonthlyBalanceEntry } from './MonthlyBalanceEntry';
import { LiquidityHistoryChart } from './LiquidityHistoryChart';
import { MonthlyBalanceHistory } from './MonthlyBalanceHistory';

// Re-define SimpleAsset interface locally for clarity
interface SimpleAsset {
  _id: string;
  name: string;
  type: string;
  currentValue: number;
}

function AssetForm({
  asset,
  onClose,
}: {
  asset?: SimpleAsset;
  onClose: () => void;
}) {
  const { workspaceId } = useWorkspace();
  const [name, setName] = useState(asset?.name || '');
  const [accountType, setAccountType] = useState<'asset' | 'liability'>('asset');
  const [error, setError] = useState('');

  const createAsset = useMutation(api.simpleFinance.createSimpleAsset);
  const updateAsset = useMutation(api.simpleFinance.updateSimpleAsset);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !name) {
      setError('Account name is required.');
      return;
    }

    try {
      if (asset) {
        await updateAsset({
          id: asset._id as any,
          name,
        });
      } else {
        await createAsset({
          workspaceId: workspaceId as any,
          name,
          type: accountType === 'liability' ? 'bank_account_liability' : 'bank_account',
          currentValue: 0, // Initial value is always 0
        });
      }
      onClose();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">
            {asset ? 'Edit Account' : 'Add Account'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Account Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Checking, Car Loan"
            />
          </div>

          {!asset && (
            <div>
              <label className="block text-sm font-medium mb-3">Account Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAccountType('asset')}
                  className={`p-4 rounded-lg border-2 transition-all ${accountType === 'asset'
                    ? 'border-dark-blue bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="font-semibold text-dark-blue">Asset</div>
                  <div className="text-xs text-gray-500 mt-1">Positive balance (e.g., Bank Account)</div>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('liability')}
                  className={`p-4 rounded-lg border-2 transition-all ${accountType === 'liability'
                    ? 'border-custom-brown bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="font-semibold text-custom-brown">Liability</div>
                  <div className="text-xs text-gray-500 mt-1">Negative balance (e.g., Loan, Debt)</div>
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="pt-4 border-t flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {asset ? 'Save Changes' : 'Add Account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default function NewLiquidityManager() {
  const { workspaceId, userId } = useWorkspace()
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showAssetForm, setShowAssetForm] = useState(false)
  const [editingAsset, setEditingAsset] = useState<SimpleAsset | undefined>()
  const [goalAmount, setGoalAmount] = useState('')
  const [targetDate, setTargetDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Get all simple assets
  const simpleAssets = useQuery(
    api.simpleFinance.listSimpleAssets,
    workspaceId ? { workspaceId } : 'skip'
  )

  const monthlyBalances = useQuery(
    api.simpleFinance.getMonthlyBalances,
    workspaceId ? { workspaceId, month: selectedMonth } : 'skip'
  );

  // Get equity goal progress
  const goalData = useQuery(
    api.simpleFinance.getEquityGoalProgress,
    workspaceId ? { workspaceId } : 'skip'
  )

  // Create/Update goal mutation
  const upsertGoal = useMutation(api.simpleFinance.upsertEquityGoal)
  const deleteAsset = useMutation(api.simpleFinance.deleteSimpleAsset);
  const reorderAssets = useMutation(api.simpleFinance.reorderSimpleAssets);
  const cleanupBalances = useMutation(api.simpleFinance.cleanupOrphanedBalances);

  const handleCleanup = async () => {
    if (!workspaceId) return;
    if (confirm("This will remove all balance records for accounts that no longer exist. Continue?")) {
      const result = await cleanupBalances({ workspaceId });
      alert(result.message);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0 || !workspaceId) return;
    const account = bankAccounts[index];
    await reorderAssets({
      workspaceId,
      assetId: account._id as any,
      direction: "up",
    });
  };

  const handleMoveDown = async (index: number) => {
    if (index === bankAccounts.length - 1 || !workspaceId) return;
    const account = bankAccounts[index];
    await reorderAssets({
      workspaceId,
      assetId: account._id as any,
      direction: "down",
    });
  };

  // Memoize calculations to prevent re-renders
  const { bankAccounts, liabilityAccounts, allAccounts, currentLiquidity, targetEquity, missingAmount, progress } = React.useMemo(() => {
    const allAccounts = simpleAssets || [];
    // Filter and separate assets and liabilities, sort by order
    const filteredBankAccounts = allAccounts
      .filter(asset => asset.type === 'bank_account')
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const filteredLiabilities = allAccounts
      .filter(asset => asset.type === 'bank_account_liability')
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    // Calculate current liquidity based on the selected month's balances
    // For liabilities, the balance should be negative
    const monthlyLiquidity = (monthlyBalances || []).reduce((sum, balance) => {
      const asset = allAccounts.find(a => a._id === balance.assetId);
      // If it's a liability, treat the balance as negative
      if (asset?.type === 'bank_account_liability') {
        return sum - Math.abs(balance.balance);
      }
      return sum + balance.balance;
    }, 0);

    // Use the month-specific liquidity for all calculations
    const equityTarget = goalData?.targetEquity || 0;
    const missing = Math.max(equityTarget - monthlyLiquidity, 0);
    const progressPercent = equityTarget > 0 ? (monthlyLiquidity / equityTarget) * 100 : 0;

    return {
      bankAccounts: filteredBankAccounts,
      liabilityAccounts: filteredLiabilities,
      allAccounts: allAccounts,
      currentLiquidity: monthlyLiquidity,
      targetEquity: equityTarget,
      missingAmount: missing,
      progress: progressPercent,
    };
  }, [simpleAssets, goalData, monthlyBalances]);

  // Format month for display
  const formatMonth = (monthStr: string): string => {
    const date = new Date(monthStr + "-01");
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Format currency to EUR
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  // Handle goal creation/update
  const handleSaveGoal = async () => {
    if (!workspaceId || !userId || !goalAmount || Number(goalAmount) <= 0) return

    await upsertGoal({
      workspaceId: workspaceId as any,
      ownerId: userId as any,
      targetEquity: Number(goalAmount),
      targetDate: targetDate || undefined,
    })

    setShowGoalModal(false)
    setGoalAmount('')
    setTargetDate('')
  }

  if (!simpleAssets || !goalData) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold" style={{ color: '#384C5A' }}>Liquidity Manager</h2>
          <p className="mt-1" style={{ color: '#B6B2B5' }}>A unified dashboard to track liquid assets, monitor monthly progress, and manage goals.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCleanup} className="text-gray-500 border-gray-300 hover:bg-gray-50">
            <Trash2 className="w-4 h-4 mr-2" />
            Cleanup Data
          </Button>
          <Button onClick={() => { setEditingAsset(undefined); setShowAssetForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Goal Summary */}
      <Card style={{ backgroundColor: '#F1F5EE', borderColor: '#A78573' }}>
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
              <div className="text-center md:text-left">
                <div className="text-sm" style={{ color: '#A78573' }}>Current Liquidity</div>
                <div className="text-4xl font-bold" style={{ color: '#384C5A' }}>{formatCurrency(currentLiquidity)}</div>
                <div className="text-xs mt-1" style={{ color: '#B6B2B5' }}>{bankAccounts.length + liabilityAccounts.length} accounts</div>
              </div>
              <div className="text-center">
                <div className="text-sm" style={{ color: '#A78573' }}>Target Goal</div>
                <div className="text-4xl font-bold" style={{ color: '#384C5A' }}>{targetEquity > 0 ? formatCurrency(targetEquity) : 'Not Set'}</div>
                {targetEquity > 0 && <div className="text-xs mt-1" style={{ color: '#B6B2B5' }}>Progress: {progress.toFixed(1)}%</div>}
              </div>
              <div className="text-center md:text-right">
                <div className="text-sm" style={{ color: '#A78573' }}>Missing Amount</div>
                <div className={`text-4xl font-bold`} style={{ color: missingAmount > 0 ? '#A78573' : '#384C5A' }}>{targetEquity > 0 ? formatCurrency(missingAmount) : formatCurrency(0)}</div>
                {missingAmount > 0 && <div className="text-xs mt-1" style={{ color: '#A78573' }}>To reach goal</div>}
              </div>
            </div>
            <Button variant="ghost" onClick={() => setShowGoalModal(true)} className="ml-6">
              <Target className="w-5 h-5" style={{ color: '#384C5A' }} />
            </Button>
          </div>

          {/* Month indicator */}
          <div className="text-center mt-4">
            <div className="text-xs" style={{ color: '#A78573' }}>
              Data shown for: <strong>{formatMonth(selectedMonth)}</strong>
            </div>
          </div>

          {targetEquity > 0 && (
            <div className="w-full rounded-full h-2.5 mt-4" style={{ backgroundColor: '#DDDEE3' }}>
              <div className="h-2.5 rounded-full" style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: '#384C5A' }}></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Balance Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyBalanceEntry
              month={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Balance History</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyBalanceHistory month={selectedMonth} onSelectMonth={setSelectedMonth} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Liquidity History</CardTitle>
          </CardHeader>
          <CardContent>
            <LiquidityHistoryChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {bankAccounts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-dark-blue mb-3">Assets (Positive Balance)</h3>
                <div className="space-y-3">
                  {bankAccounts.map((account, index) => (
                    <div key={account._id} className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: '#F1F5EE' }}>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="p-1 h-6"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === bankAccounts.length - 1}
                            className="p-1 h-6"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </Button>
                        </div>
                        <div>
                          <div className="font-medium" style={{ color: '#384C5A' }}>{account.name}</div>
                          <div className="text-sm" style={{ color: '#B6B2B5' }}>Asset</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setEditingAsset(account); setShowAssetForm(true); }}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-500 hover:bg-off-white hover:text-red-600" onClick={async () => { if (window.confirm(`Are you sure you want to delete "${account.name}"?`)) { await deleteAsset({ id: account._id as any }); } }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {liabilityAccounts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-custom-brown mb-3">Liabilities (Negative Balance)</h3>
                <div className="space-y-3">
                  {liabilityAccounts.map((account, index) => (
                    <div key={account._id} className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: '#FFF5F0' }}>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="p-1 h-6"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === liabilityAccounts.length - 1}
                            className="p-1 h-6"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </Button>
                        </div>
                        <div>
                          <div className="font-medium" style={{ color: '#A78573' }}>{account.name}</div>
                          <div className="text-sm" style={{ color: '#B6B2B5' }}>Liability</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setEditingAsset(account); setShowAssetForm(true); }}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-500 hover:bg-off-white hover:text-red-600" onClick={async () => { if (window.confirm(`Are you sure you want to delete "${account.name}"?`)) { await deleteAsset({ id: account._id as any }); } }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bankAccounts.length === 0 && liabilityAccounts.length === 0 && (
              <div className="text-center py-8 text-gray">
                <p>No accounts yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Asset Form Modal */}
      {showAssetForm && (
        <AssetForm
          asset={editingAsset}
          onClose={() => { setShowAssetForm(false); setEditingAsset(undefined); }}
        />
      )}

      {/* Goal Management Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-dark-blue">
                {targetEquity > 0 ? 'Update Liquidity Goal' : 'Set Liquidity Goal'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray mb-2">
                  Target Amount (€)
                </label>
                <input
                  type="number"
                  min="1"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  placeholder={targetEquity > 0 ? targetEquity.toString() : "Enter target amount"}
                  className="flex h-10 w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray mb-2">
                  Target Date (optional)
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => setShowGoalModal(false)}
                className="flex-1 h-10 px-4 rounded-md border border-light-gray"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGoal}
                className="flex-1 h-10 px-4 rounded-md bg-dark-blue text-off-white"
              >
                {targetEquity > 0 ? 'Update Goal' : 'Set Goal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}