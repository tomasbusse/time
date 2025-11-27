import { useState, useEffect } from 'react'
import { Clock, Square } from 'lucide-react'
import { Button } from './ui/Button'

interface ActiveTimerProps {
  taskTitle: string
  startTime: number
  onStop: () => void
  compact?: boolean
}

export function ActiveTimer({ taskTitle, startTime, onStop, compact = false }: ActiveTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    const updateElapsed = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setElapsedSeconds(elapsed)
    }

    updateElapsed()
    const interval = setInterval(updateElapsed, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  const hours = Math.floor(elapsedSeconds / 3600)
  const minutes = Math.floor((elapsedSeconds % 3600) / 60)
  const seconds = elapsedSeconds % 60

  const formatTime = () => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-custom-brown/10 border border-custom-brown/40 rounded-lg px-3 py-2">
        <Clock className="w-4 h-4 text-custom-brown animate-pulse" />
        <div className="flex-1 min-w-0">
          <div className="text-xs text-custom-brown font-medium truncate">{taskTitle}</div>
          <div className="text-sm font-mono font-bold text-dark-blue">{formatTime()}</div>
        </div>
        <button
          onClick={onStop}
          className="p-1 hover:bg-light-gray rounded transition-colors"
          title="Stop timer"
        >
          <Square className="w-4 h-4 text-custom-brown fill-custom-brown" />
        </button>
      </div>
    )
  }

  return (
    <div className="bg-[#B6B2B5] rounded-lg p-6 text-dark-blue shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-dark-blue/20 rounded-full flex items-center justify-center animate-pulse">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm text-dark-blue/80">Active Timer</div>
            <div className="font-semibold text-lg line-clamp-1">{taskTitle}</div>
          </div>
        </div>
      </div>
      
      <div className="text-center mb-4">
        <div className="text-5xl font-mono font-bold tracking-tight">
          {formatTime()}
        </div>
        <div className="text-sm text-dark-blue/80 mt-2">
          {hours > 0 && `${hours} hour${hours !== 1 ? 's' : ''} `}
          {minutes > 0 && `${minutes} minute${minutes !== 1 ? 's' : ''} `}
          {seconds} second{seconds !== 1 ? 's' : ''}
        </div>
      </div>

      <Button
        onClick={onStop}
        className="w-full bg-dark-blue/20 hover:bg-dark-blue/30 text-dark-blue border border-dark-blue/30"
      >
        <Square className="w-4 h-4 mr-2 fill-dark-blue" />
        Stop Timer
      </Button>
    </div>
  )
}
