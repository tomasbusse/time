import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface AccountData {
  id?: string
  name: string
  accountType: 'bank' | 'loan' | 'savings'
  currentBalance: number
  isPrivate: boolean
}

interface AccountFormProps {
  account?: AccountData
  onSave: (account: AccountData) => void
  onClose: () => void
}

export default function AccountForm({ account, onSave, onClose }: AccountFormProps) {
  const [name, setName] = useState(account?.name || '')
  const [accountType, setAccountType] = useState<'bank' | 'loan' | 'savings'>(
    account?.accountType || 'bank'
  )
  const [currentBalance, setCurrentBalance] = useState(
    account?.currentBalance?.toString() || '0'
  )
  const [isPrivate, setIsPrivate] = useState(account?.isPrivate || false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    onSave({
      id: account?.id,
      name,
      accountType,
      currentBalance: parseFloat(currentBalance) || 0,
      isPrivate,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-dark-blue">
            {account ? 'Edit Account' : 'Add Account'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-light-gray rounded">
            <X className="w-5 h-5 text-gray" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray mb-2">
              Account Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Bank Account"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray mb-2">
              Account Type
            </label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as 'bank' | 'loan' | 'savings')}
              className="flex h-10 w-full rounded-md border border-light-gray bg-white px-3 py-2 text-sm"
              required
            >
              <option value="bank">Bank Account</option>
              <option value="savings">Savings</option>
              <option value="loan">Loan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray mb-2">
              Current Balance (€)
            </label>
            <Input
              type="number"
              step="0.01"
              value={currentBalance}
              onChange={(e) => setCurrentBalance(e.target.value)}
              placeholder="0.00"
              required
            />
            <p className="text-xs text-gray mt-1">
              For loans, enter as a negative number (e.g., -10000)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="isPrivate" className="text-sm text-gray">
              Private (hidden from shared users)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="default" className="flex-1">
              {account ? 'Save Changes' : 'Add Account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
