import { Plus, Trash2, Edit2, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

interface Subscription {
  id: string
  name: string
  cost: number
  yearlyAmount?: number
  billingCycle: 'monthly' | 'yearly'
  nextBillingDate: string
  isActive: boolean
  isNecessary?: boolean
  classification: 'business' | 'private'
  type?: 'subscription' | 'bill' | 'rent' | 'insurance' | 'loan' | 'other'
  category?: string
  subcategory?: string
}

interface SubscriptionListProps {
  subscriptions: Subscription[]
  onAddSubscription: () => void
  onEditSubscription: (subscriptionId: string) => void
  onDeleteSubscription: (subscriptionId: string) => void
  onToggleNecessary: (subscriptionId: string, isNecessary: boolean) => void
  onToggleActive: (subscriptionId: string, isActive: boolean) => void
  classificationFilter: 'all' | 'business' | 'private'
}

export default function SubscriptionList({
  subscriptions,
  onAddSubscription,
  onEditSubscription,
  onDeleteSubscription,
  onToggleNecessary,
  onToggleActive,
  classificationFilter,
}: SubscriptionListProps) {
  const getBadgeClass = () => {
    switch (classificationFilter) {
      case 'business':
        return 'bg-blue-100 text-blue-800';
      case 'private':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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

  const yearlyTotal = activeSubscriptions.reduce((sum, sub) => {
    // Use yearlyAmount if provided, otherwise calculate from cost
    if (sub.yearlyAmount !== undefined) {
      return sum + sub.yearlyAmount
    }
    return sum + (sub.billingCycle === 'yearly' ? sub.cost : sub.cost * 12)
  }, 0)

  // Calculate potential savings from optional subscriptions
  const optionalSubscriptions = activeSubscriptions.filter(sub => sub.isNecessary === false)
  const potentialMonthlySavings = optionalSubscriptions.reduce((sum, sub) => {
    return sum + (sub.billingCycle === 'monthly' ? sub.cost : sub.cost / 12)
  }, 0)

  const potentialYearlySavings = optionalSubscriptions.reduce((sum, sub) => {
    if (sub.yearlyAmount !== undefined) {
      return sum + sub.yearlyAmount
    }
    return sum + (sub.billingCycle === 'yearly' ? sub.cost : sub.cost * 12)
  }, 0)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Responsive Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="text-xs sm:text-sm text-gray">Monthly Cost</div>
            <div className="text-xl sm:text-2xl font-semibold text-dark-blue">
              {formatCurrency(monthlyTotal)}
            </div>
            <p className="text-xs text-gray mt-1">
              {activeSubscriptions.length} active subscription{activeSubscriptions.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="text-xs sm:text-sm text-gray">Yearly Cost</div>
            <div className="text-xl sm:text-2xl font-semibold text-dark-blue">
              {formatCurrency(yearlyTotal)}
            </div>
            <p className="text-xs text-gray mt-1">
              Annual total across all subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="text-xs sm:text-sm text-gray">Potential Monthly Savings</div>
            <div className="text-xl sm:text-2xl font-semibold text-green-600">
              {formatCurrency(potentialMonthlySavings)}
            </div>
            <p className="text-xs text-gray mt-1">
              By canceling {optionalSubscriptions.length} optional subscription{optionalSubscriptions.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="text-xs sm:text-sm text-gray">Potential Yearly Savings</div>
            <div className="text-xl sm:text-2xl font-semibold text-green-600">
              {formatCurrency(potentialYearlySavings)}
            </div>
            <p className="text-xs text-gray mt-1">
              Annual savings potential
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Responsive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <h2 className="text-lg sm:text-xl font-semibold text-dark-blue">Regular Outgoings</h2>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBadgeClass()}`}>
            {classificationFilter.charAt(0).toUpperCase() + classificationFilter.slice(1)}
          </span>
        </div>
        <Button onClick={onAddSubscription} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden xs:inline">Add Outgoing</span>
          <span className="xs:hidden">Add</span>
        </Button>
      </div>

      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray mb-4">No subscriptions tracked yet</p>
            <Button onClick={onAddSubscription}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Subscription
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {subscriptions
            .filter((subscription) => {
              if (classificationFilter === 'all') return true
              return subscription.classification === classificationFilter
            })
            .map((subscription) => (
              <Card key={subscription.id}>
                <CardContent className="pt-4 sm:pt-6">
                  {/* Responsive Layout: Stack on mobile, side-by-side on desktop */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold text-dark-blue text-base sm:text-lg">
                          {subscription.name}
                        </h3>
                        {!subscription.isActive && (
                          <span className="text-xs px-2 py-1 bg-light-gray text-gray rounded">
                            Inactive
                          </span>
                        )}
                      </div>

                      {/* Billing Info - Stack on mobile */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="truncate">
                            Next: {format(new Date(subscription.nextBillingDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <span className="text-xs px-2 py-1 bg-light-gray text-custom-brown rounded capitalize w-fit">
                          {subscription.billingCycle}
                        </span>
                        {subscription.type && (
                          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded capitalize w-fit">
                            {subscription.type}
                          </span>
                        )}
                      </div>

                      {/* Quick Toggle Controls - Responsive */}
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={subscription.isNecessary !== false}
                            onChange={(e) => onToggleNecessary(subscription.id, e.target.checked)}
                            className="w-4 h-4 text-green-600 rounded border-light-gray focus:ring-green-500"
                          />
                          <span className="text-xs text-gray whitespace-nowrap">Necessary</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={subscription.isActive}
                            onChange={(e) => onToggleActive(subscription.id, e.target.checked)}
                            className="w-4 h-4 text-custom-brown rounded border-light-gray focus:ring-custom-brown"
                          />
                          <span className="text-xs text-gray whitespace-nowrap">Active</span>
                        </div>
                        <div className="text-xs text-gray">
                          <div className="whitespace-nowrap">Monthly: {formatCurrency(
                            subscription.billingCycle === 'monthly'
                              ? subscription.cost
                              : subscription.cost / 12
                          )}</div>
                          <div className="whitespace-nowrap">Yearly: {formatCurrency(
                            subscription.yearlyAmount !== undefined
                              ? subscription.yearlyAmount
                              : subscription.billingCycle === 'yearly'
                                ? subscription.cost
                                : subscription.cost * 12
                          )}</div>
                        </div>
                      </div>
                    </div>

                    {/* Price and Actions - Responsive */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-4">
                      <div className="text-left sm:text-right">
                        <div className="text-xl sm:text-2xl font-semibold text-dark-blue">
                          {formatCurrency(subscription.cost)}
                        </div>
                        <div className="text-xs text-gray">
                          / {subscription.billingCycle === 'monthly' ? 'month' : 'year'}
                        </div>
                        {subscription.yearlyAmount !== undefined && (
                          <div className="text-xs text-gray hidden sm:block">
                            Yearly: {formatCurrency(subscription.yearlyAmount)}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 sm:gap-2">
                        <button
                          onClick={() => onEditSubscription(subscription.id)}
                          className="p-1.5 sm:p-2 hover:bg-light-gray rounded transition-colors"
                          aria-label="Edit subscription"
                        >
                          <Edit2 className="w-4 h-4 text-gray" />
                        </button>
                        <button
                          onClick={() => onDeleteSubscription(subscription.id)}
                          className="p-1.5 sm:p-2 hover:bg-light-gray rounded transition-colors"
                          aria-label="Delete subscription"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info - Responsive */}
                  {subscription.yearlyAmount !== undefined && subscription.billingCycle === 'monthly' && (
                    <div className="mt-3 pt-3 border-t border-light-gray">
                      <p className="text-xs text-gray">
                        Yearly amount: {formatCurrency(subscription.yearlyAmount)}
                        <span className="hidden sm:inline"> (Monthly: {formatCurrency(subscription.yearlyAmount / 12)}/month)</span>
                      </p>
                    </div>
                  )}

                  {subscription.billingCycle === 'yearly' && (
                    <div className="mt-3 pt-3 border-t border-light-gray">
                      <p className="text-xs text-gray">
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
