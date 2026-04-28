import { useState, useEffect } from 'react'

// TEST MODE: 1 day = 10 seconds (set to 86400000 for real days)
// Must match MS_PER_DAY in server/index.cjs.
export const MS_PER_DAY = 5000

export default function Countdown({ startDate, durationDays = 28, size = 120, wasExtended = false, previousPlanEnded = false }) {
  const [daysLeft, setDaysLeft] = useState(null)
  const [progress, setProgress] = useState(0)
  const [isPending, setIsPending] = useState(false)
  const [daysUntilStart, setDaysUntilStart] = useState(0)

  useEffect(() => {
    const calc = () => {
      if (!startDate) {
        setDaysLeft(null)
        setProgress(0)
        return
      }
      const start = new Date(startDate.replace(' ', 'T') + 'Z')
      const now = new Date()

      // If start date is in the future AND the previous plan hasn't ended yet → pending
      if (start > now && !previousPlanEnded) {
        setIsPending(true)
        const untilMs = start - now
        setDaysUntilStart(Math.ceil(untilMs / MS_PER_DAY))
        setDaysLeft(durationDays)
        setProgress(0)
        return
      }

      // If previous plan ended but this plan was scheduled for later → start it from now instead
      const effectiveStart = (start > now && previousPlanEnded) ? now : start

      setIsPending(false)
      const elapsedMs = now - effectiveStart
      const totalMs = durationDays * MS_PER_DAY
      const remainingMs = Math.max(0, totalMs - elapsedMs)
      const days = Math.ceil(remainingMs / MS_PER_DAY)
      setDaysLeft(days)
      setProgress(Math.min(1, Math.max(0, elapsedMs / totalMs)))
    }
    calc()
    const interval = setInterval(calc, 1000)
    return () => clearInterval(interval)
  }, [startDate, durationDays])

  if (daysLeft === null) return null

  const strokeWidth = 4
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)

  const isComplete = !isPending && daysLeft === 0
  // For completed plans that were extended → "Completed" in neon; otherwise → "Expired" in red
  const completedAndExtended = isComplete && wasExtended
  const stroke = isPending
    ? '#3b82f6'
    : isComplete
      ? (completedAndExtended ? '#d4ff00' : '#ef4444')
      : '#d4ff00'
  const numberColor = isPending
    ? 'text-blue-400'
    : isComplete
      ? (completedAndExtended ? 'text-neon' : 'text-red-500')
      : 'text-neon'
  const labelColor = isPending
    ? 'text-blue-400'
    : isComplete
      ? (completedAndExtended ? 'text-neon' : 'text-red-500')
      : 'text-gray-400'
  const numberValue = isPending ? daysUntilStart : (isComplete ? '0' : daysLeft)
  const labelText = isPending
    ? (daysUntilStart === 1 ? 'Day to Start' : 'Days to Start')
    : isComplete
      ? (completedAndExtended ? 'Completed!' : 'Expired')
      : (daysLeft === 1 ? 'Day Left' : 'Days Left')

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
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold ${numberColor}`} style={{ fontSize: size * 0.32 }}>
            {numberValue}
          </span>
        </div>
      </div>
      <span className={`text-xs uppercase tracking-widest mt-2 font-semibold whitespace-nowrap ${labelColor}`}>
        {labelText}
      </span>
    </div>
  )
}
