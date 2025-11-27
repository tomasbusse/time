import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Square, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface TimerWidgetProps {
  allocatedDuration: number
  taskName?: string
  autoStart?: boolean
  initialElapsedSeconds?: number
  onPause?: () => void
  onStop?: (elapsedTime: number) => void
  onComplete?: () => void
}

export default function TimerWidget({
  allocatedDuration,
  taskName,
  autoStart = false,
  initialElapsedSeconds = 0,
  onPause,
  onStop,
  onComplete,
}: TimerWidgetProps) {
  const [isRunning, setIsRunning] = useState(autoStart)
  const [elapsedSeconds, setElapsedSeconds] = useState(initialElapsedSeconds)
  const [sessionStart, setSessionStart] = useState<number | null>(autoStart ? Date.now() : null)
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
      intervalRef.current = window.setInterval(() => {
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
      audioRef.current.play().catch(() => { })
    }
  }

  const handlePlayPause = () => {
    if (!isRunning) {
      // Start the timer
      if (!sessionStart) {
        setSessionStart(Date.now())
      }
      setIsRunning(true)
    } else {
      // Pause the timer
      setIsRunning(false)
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
    <div className="bg-white rounded-lg shadow-md p-6 pb-10">
      <div className="flex flex-col items-center">
        {taskName && (
          <h3 className="text-xl font-semibold text-dark-blue mb-6 text-center break-words w-full">{taskName}</h3>
        )}

        <div className="relative w-56 h-56 mb-8">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="112"
              cy="112"
              r="104"
              stroke="#E5E7EB"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="112"
              cy="112"
              r="104"
              stroke="#1D4ED8"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 104}`}
              strokeDashoffset={`${2 * Math.PI * 104 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-custom-brown" />
                <span className="text-xs text-gray">Elapsed</span>
              </div>
              <div className="text-3xl font-bold text-dark-blue mb-3">
                {formatTime(elapsedSeconds)}
              </div>

              <div className="text-xs text-gray">Remaining</div>
              <div className="text-xl font-semibold text-custom-brown">
                {formatTime(remainingSeconds)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full mb-6">
          <Button
            onClick={handlePlayPause}
            variant="default"
            size="default"
            className="flex-1 px-2 h-10"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 mr-1.5" />
                <span className="text-sm font-medium">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1.5" />
                <span className="text-sm font-medium">Start</span>
              </>
            )}
          </Button>

          {elapsedSeconds > 0 && (
            <>
              <Button
                onClick={handleStop}
                variant="secondary"
                size="default"
                className="flex-1 px-2 h-10"
              >
                <Square className="w-4 h-4 mr-1.5" />
                <span className="text-sm font-medium">Log</span>
              </Button>

              <Button
                onClick={handleReset}
                variant="outline"
                size="default"
                className="flex-1 px-2 h-10"
              >
                <span className="text-sm font-medium">Reset</span>
              </Button>
            </>
          )}
        </div>

        {sessionStart && (
          <div className="text-center mt-6">
            <p className="text-xs text-gray">
              Started {new Date(sessionStart).toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>

      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZizcIGWq77+aXTQwNT6bn77RgGgU7k9n1xXEkBSh+zPDakEILGGS56+KJNQYVYrjr56tVFAg+l9v0wm4hBSh9zO/aiz0IG2i56+aXTQwNT6Xm7rVgGgU7lNr1xXEjBCh9y+/ZjDwIGWW76+iJNQYVYbfl5qpUEwg+l9v0wm4hBSh9zO/Zij0IG2m56+aXTQwNTqXm7rVgGgU7ld11xXEjBCh9y+/ZjDwIGWW76+iJNQYVYrfl5axUEwg9ltn0wm4hBSh9zO/Zij0IG2m56+aXTAwLTqXm7rVgGgU7ld11xXEjBCh9y+/ZjTsHF2S76+mJNQYVYrfl5axUEwc9ltn0wm4gBCh9zO/Zij0HG2m56+aXTAwKTqXm7rVgGgQ7ld11xXEjBCh9y+/ZjTsHF2S76+mJNQYVYrfl5axUEwc9ltn0wm4gBCd9zO/Zij0HG2m56+aWTAwKTqXm7rVgGgQ7ld11xXEjAyh9y+/ZjTsHF2S76+mJNQYVYrfl5axUEwc9ltn0wm4gBCd+zO/Zij0HG2m56+aWTAwKTqbm7rVhGgQ7ld11xXAiAyh9y+/ZjTsHF2S76+mJNQYVYrfl5KxUEwc9ltn0wm4gBCd+zO/Zij0HG2m56+aWTAwKTqbm7rVhGgQ7ld11xXAiAyd+y+/ZjTsHF2O76+mJNQYVYrfl5KxUEwc9ltn0wm4gBCd+zO/Zij0HG2m56+aWTAwKTqbm7bVhGgQ7ld11xXAiAyd+y+/ZjTsHF2O76+mJNQYVYrfl5KxUEwc9ld30wm4gBCd+zO/Zij0HG2m56+aWTAwKTqbm7bVhGgQ7ld11xXAiAyd+y+/ZjTsHF2O76+mJNQYVYbfl5KxUEwc9ld30wm4gBCd+zO/Zij0HG2m56+aWTAwKTqbm7bVhGgQ7ld11xXAiAyd+y+/ZjTsHF2O76+mJNQYVYbfl5KxUEwc9ld30wm4gBCd+zO/Zij0HG2m56+aWTAwKTqbm7bVhGgQ7ld11xHAiAyd+y+/ZjTsHF2O76+mJNQYVYbfl5KxUEwc9ld30wm4gBCd+zO/Zij0HG2m56+aWTAwKTqbm7bVhGgQ7ld11xHAiAyd+y+/ZjTsHF2O76+mJNQYVYbfl5KxUEwc9ld30wm4gBCd+zO/Zij0HG2m56+aWTAwKTqbm7bVhGgQ7" type="audio/wav" />
      </audio>
    </div>
  )
}
