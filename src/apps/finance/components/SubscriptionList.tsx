import { Plus, Trash2, Edit2, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

interface Subscription {
  id: string
  name: string
  cost: number
  billingCycle: 'monthly' | 'yearly'
  nextBillingDate: string
  isActive: boolean
}

interface SubscriptionListProps {
  subscriptions: Subscription[]
  onAddSubscription: () => void
  onEditSubscription: (subscriptionId: string) => void
  onDeleteSubscription: (subscriptionId: string) => void
}

export default function SubscriptionList({
  subscriptions,
  onAddSubscription,
  onEditSubscription,
  onDeleteSubscription,
}: SubscriptionListProps) {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const activeSubscriptions = subscriptions.filter((sub) => sub.isActive)
  
  const monthlyTotal = activeSubscriptions.reduce((sum, sub) => {
    return sum + (sub.billingCycle === 'monthly' ? sub.cost : sub.cost / 12)
  }, 0)

  const yearlyTotal = monthlyTotal * 12

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-neutral-500">Monthly Cost</div>
            <div className="text-2xl font-semibold text-neutral-800">
              {formatCurrency(monthlyTotal)}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              {activeSubscriptions.length} active subscription{activeSubscriptions.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-neutral-500">Yearly Cost</div>
            <div className="text-2xl font-semibold text-neutral-800">
              {formatCurrency(yearlyTotal)}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Annual total across all subscriptions
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-800">Subscriptions</h2>
        <Button onClick={onAddSubscription}>
          <Plus className="w-4 h-4 mr-2" />
          Add Subscription
        </Button>
      </div>

      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-neutral-600 mb-4">No subscriptions tracked yet</p>
            <Button onClick={onAddSubscription}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Subscription
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((subscription) => (
            <Card key={subscription.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-neutral-800">
                        {subscription.name}
                      </h3>
                      {!subscription.isActive && (
                        <span className="text-xs px-2 py-1 bg-neutral-200 text-neutral-600 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-neutral-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Next billing: {format(new Date(subscription.nextBillingDate), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded capitalize">
                        {subscription.billingCycle}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-semibold text-neutral-800">
                        {formatCurrency(subscription.cost)}
                      </div>
                      <div className="text-xs text-neutral-500">
                        / {subscription.billingCycle === 'monthly' ? 'month' : 'year'}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onEditSubscription(subscription.id)}
                        className="p-1 hover:bg-neutral-100 rounded"
                      >
                        <Edit2 className="w-4 h-4 text-neutral-500" />
                      </button>
                      <button
                        onClick={() => onDeleteSubscription(subscription.id)}
                        className="p-1 hover:bg-neutral-100 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>

                {subscription.billingCycle === 'yearly' && (
                  <div className="mt-3 pt-3 border-t border-neutral-200">
                    <p className="text-xs text-neutral-500">
                      Monthly equivalent: {formatCurrency(subscription.cost / 12)}/month
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
