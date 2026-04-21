export default function ProgressBar({ percent, stepIndex, totalSteps, labels }) {
  return (
    <div className="bg-dark/90 backdrop-blur-md border-b border-dark-border px-4 py-2 shrink-0">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] text-gray-400">
            Step {stepIndex} of {totalSteps}
          </span>
          <span className="text-[10px] text-neon font-semibold">{percent}%</span>
        </div>
        <div className="w-full h-1.5 bg-dark-border rounded-full overflow-hidden">
          <div
            className="h-full bg-neon rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          {labels.map((label, i) => (
            <span
              key={label}
              className={`text-[9px] sm:text-[10px] transition-colors ${
                i < stepIndex ? 'text-neon' : 'text-gray-600'
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
