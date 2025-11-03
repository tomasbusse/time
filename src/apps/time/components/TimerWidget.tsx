import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Square, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface TimerWidgetProps {
  allocatedDuration: number
  taskName?: string
  onPause?: () => void
  onStop?: (elapsedTime: number) => void
  onComplete?: () => void
}

export default function TimerWidget({
  allocatedDuration,
  taskName,
  onPause,
  onStop,
  onComplete,
}: TimerWidgetProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [sessionStart, setSessionStart] = useState<number | null>(null)
  const intervalRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const totalSeconds = allocatedDuration * 60
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds)
  const progress = totalSeconds > 0 ? (elapsedSeconds / totalSeconds) * 100 : 0

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  useEffect(() => {
    if (remainingSeconds === 0 && elapsedSeconds > 0) {
      setIsRunning(false)
      playAlarm()
      onComplete?.()
    }
  }, [remainingSeconds, elapsedSeconds, onComplete])

  const playAlarm = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Timer Complete!', {
          body: taskName ? `Time's up for ${taskName}` : 'Your allocated time is complete',
        })
      }
    }
    
    if (audioRef.current) {
      audioRef.current.play().catch(() => {})
    }
  }

  const handlePlayPause = () => {
    if (!isRunning && !sessionStart) {
      setSessionStart(Date.now())
    }
    setIsRunning(!isRunning)
    if (isRunning) {
      onPause?.()
    }
  }

  const handleStop = () => {
    setIsRunning(false)
    onStop?.(elapsedSeconds)
  }

  const handleReset = () => {
    setIsRunning(false)
    setElapsedSeconds(0)
    setSessionStart(null)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="flex flex-col items-center">
        {taskName && (
          <h3 className="text-xl font-semibold text-neutral-800 mb-6">{taskName}</h3>
        )}

        <div className="relative w-64 h-64 mb-8">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="#E5E7EB"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="#1D4ED8"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 120}`}
              strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-neutral-600">Elapsed</span>
              </div>
              <div className="text-4xl font-bold text-neutral-800 mb-4">
                {formatTime(elapsedSeconds)}
              </div>
              
              <div className="text-sm text-neutral-500">Remaining</div>
              <div className="text-2xl font-semibold text-blue-600">
                {formatTime(remainingSeconds)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={handlePlayPause}
            variant="default"
            size="lg"
            className="w-32"
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Start
              </>
            )}
          </Button>

          {elapsedSeconds > 0 && (
            <>
              <Button
                onClick={handleStop}
                variant="secondary"
                size="lg"
              >
                <Square className="w-5 h-5 mr-2" />
                Log Time
              </Button>

              <Button
                onClick={handleReset}
                variant="outline"
                size="lg"
              >
                Reset
              </Button>
            </>
          )}
        </div>

        {elapsedSeconds > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-500">
              Started {sessionStart ? new Date(sessionStart).toLocaleTimeString() : ''}
            </p>
          </div>
        )}
      </div>

      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZizcIGWq77+aXTQwNT6bn77RgGgU7k9n1xXEkBSh+zPDakEILGGS56+KJNQYVYrjr56tVFAg+l9v0wm4hBSh9zO/aiz0IG2i56+aXTQwNT6Xm7rVgGgU7lNr1xXEjBCh9y+/ZjDwIGWW76+iJNQYVYbfl5qpUEwg+l9v0wm4hBSh9zO/Zij0IG2m56+aXTQwNTqXm7rVgGgU7ld11xXEjBCh9y+/ZjDwIGWW76+iJNQYVYrfl5axUEwg9ltn0wm4hBSh9zO/Zij0IG2m56+aXTAwLTqXm7rVgGgU7ld11xXEjBCh9y+/ZjTsHF2S76+mJNQYVYrfl5axUEwc9ltn0wm4gBCh9zO/Zij0HG2m56+aXTAwKTqXm7rVgGgQ7ld11xXEjBCh9y+/ZjTsHF2S76+mJNQYVYrfl5axUEwc9ltn0wm4gBCd9zO/Zij0HG2m56+aWTAwKTqXm7rVgGgQ7ld11xXEjAyh9y+/ZjTsHF2S76+mJNQYVYrfl5axUEwc9ltn0wm4gBCd+zO/Zij0HG2m56+aWTAwKTqbm7rVhGgQ7ld11xXAiAyh9y+/ZjTsHF2S76+mJNQYVYrfl5KxUEwc9ltn0wm4gBCd+zO/Zij0HG2m56+aWTAwKTqbm7rVhGgQ7ld11xXAiAyd+y+/ZjTsHF2O76+mJNQYVYrfl5KxUEwc9ltn0wm4gBCd+zO/Zij0HG2m56+aWTAwKTqbm7bVhGgQ7ld11xXAiAyd+y+/ZjTsHF2O76+mJNQYVYrfl5KxUEwc9ld30wm4gBCd+zO/Zij0HG2m56+aWTAwKTqbm7bVhGgQ7ld11xXAiAyd+y+/ZjTsHF2O76+mJNQYVYbfl5KxUEwc9ld30wm4gBCd+zO/Zij0HG2m56+aWTAwKTqbm7bVhGgQ7ld11xXAiAyd+y+/ZjTsHF2O76+mJNQYVYbfl5KxUEwc9ld30wm4gBCd+zO/Zij0HG2m56+aWTAwKTqbm7bVhGgQ7ld11xXAiAyd+y+/ZjTsHF2O76+mJNQYVYbfl5KxUEwc9ld30wm4gBCd+zO/Zij0HG2m56+aWTAwKTqbm7bVhGgQ7ld11xHAiAyd+y+/ZjTsHF2O76+mJNQYVYbfl5KxUEwc9ld30wm4gBCd+zO/Zij0HG2m56+aWTAwKTqbm7bVhGgQ7ld11xHAiAyd+y+/ZjTsHF2O76+mJNQYVYbfl5KxUEwc9ld30wm4gBCd+zO/Zij0HG2m56+aWTAwKTqbm7bVhGgQ7" type="audio/wav" />
      </audio>
    </div>
  )
}
