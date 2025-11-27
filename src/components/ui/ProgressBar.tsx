import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  variant?: 'default' | 'success' | 'warning' | 'error'
  showLabel?: boolean
  className?: string
  indicatorClassName?: string
}

export function ProgressBar({ value, max = 100, variant = 'default', showLabel = false, className, indicatorClassName }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)
  
  const variants = {
    default: 'bg-custom-brown',
    success: 'bg-off-white0',
    warning: 'bg-yellow-500',
    error: 'bg-off-white0',
  }

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between mb-1 text-sm text-gray">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
      <div className="w-full bg-light-gray rounded-full h-2">
        <div
          className={cn('h-2 rounded-full transition-all duration-300', variants[variant], indicatorClassName)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
