import { Target, TrendingUp, Edit2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

interface EquityGoalProps {
  currentEquity: number
  targetEquity: number
  targetDate?: string
  canEdit?: boolean
  onEdit?: () => void
}

export default function EquityGoal({
  currentEquity,
  targetEquity,
  targetDate,
  canEdit = false,
  onEdit,
}: EquityGoalProps) {
  const progress = targetEquity > 0 ? (currentEquity / targetEquity) * 100 : 0
  const remaining = targetEquity - currentEquity

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-custom-brown" />
            Equity Goal
          </CardTitle>
          {canEdit && (
            <button
              onClick={onEdit}
              className="p-2 rounded hover:bg-light-gray"
              title="Edit goal"
            >
              <Edit2 className="w-4 h-4 text-gray" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray">Current Equity</div>
              <div className="text-2xl font-semibold text-dark-blue">
                {formatCurrency(currentEquity)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray">Target</div>
              <div className="text-2xl font-semibold text-custom-brown">
                {formatCurrency(targetEquity)}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm text-gray mb-2">
              <span>Progress</span>
              <span className="font-semibold">{Math.min(progress, 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-light-gray rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  progress >= 100 ? 'bg-off-white0' : 'bg-dark-blue'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {progress >= 100 ? (
            <div className="bg-off-white border border-light-gray rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700">
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold">Goal Achieved! 🎉</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                You've exceeded your equity target by {formatCurrency(currentEquity - targetEquity)}
              </p>
            </div>
          ) : (
            <div className="bg-custom-brown/10 border border-custom-brown/40 rounded-lg p-4">
              <div className="text-sm text-custom-brown mb-1">Remaining to Goal</div>
              <div className="text-xl font-semibold text-custom-brown">
                {formatCurrency(remaining)}
              </div>
              {targetDate && (
                <p className="text-xs text-custom-brown mt-2">Target date: {targetDate}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
