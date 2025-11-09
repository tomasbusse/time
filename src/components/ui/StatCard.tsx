import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatCard({ title, value, subtitle, icon, trend, className }: StatCardProps) {
  return (
    <div className={cn('bg-white rounded-lg p-6 shadow-sm border border-neutral-200', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-neutral-900">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
          {trend && (
            <div className={cn('mt-2 flex items-center gap-1 text-sm font-medium', trend.isPositive ? 'text-green-600' : 'text-red-600')}>
              <span className="material-symbols-outlined text-base">
                {trend.isPositive ? 'trending_up' : 'trending_down'}
              </span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 p-3 bg-neutral-50 rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
