import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X } from 'lucide-react'

interface Account {
  id: string
  accountCode: string
  accountName: string
  accountCategory: string
  currentBalance: number
}

interface ValuationEntryProps {
  type: 'asset' | 'liability'
  onSubmit: (date: string, amount: number, accountId: string) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  accounts?: Account[]
}

export function ValuationEntry({
  type,
  onSubmit,
  onCancel,
  isLoading = false,
  accounts = [],
}: ValuationEntryProps) {
  const [valuationDate, setValuationDate] = useState('')
  const [amount, setAmount] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}
    if (!valuationDate) {
      newErrors.date = 'Date is required'
    }
    if (!amount.trim()) {
      newErrors.amount = 'Amount is required'
    } else if (isNaN(Number(amount)) || Number(amount) < 0) {
      newErrors.amount = 'Amount must be a positive number'
    }
    if (!selectedAccountId) {
      newErrors.account = type === 'asset' ? 'Asset account is required' : 'Liability account is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await onSubmit(valuationDate, Number(amount), selectedAccountId)
      setValuationDate('')
      setAmount('')
      setSelectedAccountId('')
      setErrors({})
    } catch (error) {
      console.error('Error submitting valuation:', error)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-dark-blue">
            Record {type === 'asset' ? 'Asset' : 'Liability'} Valuation
          </h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-light-gray rounded-md"
            disabled={isLoading}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="account" className="block text-sm font-medium text-gray mb-1">
              {type === 'asset' ? 'Asset Account' : 'Liability Account'} *
            </label>
            <select
              id="account"
              value={selectedAccountId}
              onChange={(e) => {
                setSelectedAccountId(e.target.value)
                if (errors.account) {
                  setErrors(prev => ({ ...prev, account: '' }))
                }
              }}
              disabled={isLoading || accounts.length === 0}
              className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-off-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.account ? 'border-red-500' : 'border-light-gray'
              }`}
            >
              <option value="">Select account...</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.accountCode} - {account.accountName}
                </option>
              ))}
            </select>
            {errors.account && (
              <p className="text-sm text-red-600 mt-1">{errors.account}</p>
            )}
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray mb-1">
              Valuation Date *
            </label>
            <Input
              id="date"
              type="date"
              value={valuationDate}
              onChange={(e) => {
                setValuationDate(e.target.value)
                if (errors.date) {
                  setErrors(prev => ({ ...prev, date: '' }))
                }
              }}
              max={today}
              disabled={isLoading}
              className={errors.date ? 'border-red-500' : ''}
            />
            {errors.date && (
              <p className="text-sm text-red-600 mt-1">{errors.date}</p>
            )}
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray mb-1">
              Total Value (€) *
            </label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                if (errors.amount) {
                  setErrors(prev => ({ ...prev, amount: '' }))
                }
              }}
              placeholder="0.00"
              disabled={isLoading}
              className={errors.amount ? 'border-red-500' : ''}
            />
            {errors.amount && (
              <p className="text-sm text-red-600 mt-1">{errors.amount}</p>
            )}
          </div>
        </form>

        <div className="p-6 border-t flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 h-10 px-4 rounded-md border border-light-gray disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 h-10 px-4 rounded-md bg-dark-blue text-off-white disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Valuation'}
          </button>
        </div>
      </div>
    </div>
  )
}

