import { useState, useEffect } from 'react'

export default function Countdown({ startDate, durationDays = 28, size = 120 }) {
  const [daysLeft, setDaysLeft] = useState(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const calc = () => {
      if (!startDate) {
        setDaysLeft(null)
        setProgress(0)
        return
      }
      const start = new Date(startDate.replace(' ', 'T') + 'Z')
      const now = new Date()
      const elapsedMs = now - start
      const totalMs = durationDays * 24 * 60 * 60 * 1000
      const remainingMs = Math.max(0, totalMs - elapsedMs)
      const days = Math.ceil(remainingMs / (24 * 60 * 60 * 1000))
      setDaysLeft(days)
      setProgress(Math.min(1, Math.max(0, elapsedMs / totalMs)))
    }
    calc()
    const interval = setInterval(calc, 60000)
    return () => clearInterval(interval)
  }, [startDate, durationDays])

  if (daysLeft === null) return null

  const strokeWidth = 4
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)

  const isComplete = daysLeft === 0

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isComplete ? '#ef4444' : '#d4ff00'}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 1s ease',
              filter: 'drop-shadow(0 0 6px currentColor)',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold ${isComplete ? 'text-red-500' : 'text-neon'}`} style={{ fontSize: size * 0.32 }}>
            {isComplete ? 'END' : daysLeft}
          </span>
        </div>
      </div>
      <span className={`text-xs uppercase tracking-widest mt-2 font-semibold whitespace-nowrap ${isComplete ? 'text-red-500' : 'text-gray-400'}`}>
        {isComplete ? 'Expired' : (daysLeft === 1 ? 'Day Left' : 'Days Left')}
      </span>
    </div>
  )
}
