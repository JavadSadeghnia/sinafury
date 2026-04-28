import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

const VISIBLE = 5

export default function PlanTabs({ cycles, activeIndex, onSelect, pendingExtend = false }) {
  if (!cycles || cycles.length === 0) return null

  const total = cycles.length
  const [start, setStart] = useState(0)

  // Scroll the window so the active tab is visible
  useEffect(() => {
    if (activeIndex < start) setStart(activeIndex)
    else if (activeIndex >= start + VISIBLE) setStart(activeIndex - VISIBLE + 1)
  }, [activeIndex])

  // Clamp start when total changes
  useEffect(() => {
    if (start + VISIBLE > total) setStart(Math.max(0, total - VISIBLE))
  }, [total])

  const showArrows = total > VISIBLE
  const visibleCycles = cycles.slice(start, start + VISIBLE)

  const goPrev = () => setStart(s => Math.max(0, s - 1))
  const goNext = () => setStart(s => Math.min(total - VISIBLE, s + 1))

  return (
    <div className="flex items-center gap-1 mb-4">
      {showArrows && (
        <button
          onClick={goPrev}
          disabled={start === 0}
          className="shrink-0 w-7 h-9 flex items-center justify-center text-gray-400 hover:text-neon disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer rounded-lg hover:bg-dark-surface transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
      )}

      <div className="flex flex-1 gap-1.5 min-w-0">
        {visibleCycles.map((c, i) => {
          const realIdx = start + i
          const isCurrent = realIdx === total - 1
          const isFuture = isCurrent && c?.isFuture
          const label = isCurrent
            ? (isFuture ? 'Future Plan' : 'Current Plan')
            : `Plan ${realIdx + 1}`
          const shortLabel = isCurrent ? (isFuture ? 'Next' : 'Now') : `${realIdx + 1}`
          const isActive = activeIndex === realIdx
          const showSpinner = isCurrent && pendingExtend
          return (
            <button
              key={realIdx}
              onClick={() => onSelect(realIdx)}
              title={showSpinner ? `${label} — awaiting new program` : label}
              className={`min-w-0 px-2 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer rounded-lg border relative ${
                isActive
                  ? 'flex-[2] bg-neon/10 border-neon text-neon shadow-[0_0_12px_rgba(212,255,0,0.15)]'
                  : 'flex-1 bg-dark-card border-dark-border text-gray-400 hover:text-white hover:border-gray-500'
              }`}
            >
              <span className="truncate block">{isActive ? label : shortLabel}</span>
              {showSpinner && (
                <span className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-blue-500 text-white rounded-full flex items-center justify-center">
                  <Loader2 size={11} className="animate-spin" />
                </span>
              )}
            </button>
          )
        })}
      </div>

      {showArrows && (
        <button
          onClick={goNext}
          disabled={start + VISIBLE >= total}
          className="shrink-0 w-7 h-9 flex items-center justify-center text-gray-400 hover:text-neon disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer rounded-lg hover:bg-dark-surface transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  )
}
