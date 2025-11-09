import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  variant?: 'default' | 'success' | 'warning' | 'error'
  showLabel?: boolean
  className?: string
}

export function ProgressBar({ value, max = 100, variant = 'default', showLabel = false, className }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)
  
  const variants = {
    default: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  }

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between mb-1 text-sm text-neutral-600">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
      <div className="w-full bg-neutral-200 rounded-full h-2">
        <div
          className={cn('h-2 rounded-full transition-all duration-300', variants[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
