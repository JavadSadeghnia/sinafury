import NavButtons from '../components/NavButtons'

export default function Frequency({ formData, updateFormData, next, back }) {
  const selectedCount = formData.trainingDaysCount || formData.trainingDays?.length || 0

  const selectCount = (count) => {
    const days = Array.from({ length: count }, (_, i) => `Day ${i + 1}`)
    updateFormData({ trainingDays: days, trainingDaysCount: count })
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-[5vw]">
      <div className="w-full max-w-md sm:max-w-xl">
        <h2 className="font-bold text-center mb-[1vh]" style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)' }}>
          Training Schedule
        </h2>
        <p className="text-gray-500 text-center mb-[4vh]" style={{ fontSize: 'clamp(0.85rem, 1.8vw, 1.15rem)' }}>
          How many days a week do you want to train?
        </p>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-[1.5vw] mb-[2vh]">
          {[1, 2, 3, 4, 5, 6, 7].map((count) => {
            const isSelected = selectedCount === count
            return (
              <button key={count} onClick={() => selectCount(count)}
                className={`cursor-pointer flex flex-col items-center justify-center py-[2vh] rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'bg-neon border-neon text-black font-bold shadow-[0_0_15px_rgba(212,255,0,0.3)]'
                    : 'bg-dark-card border-dark-border text-gray-400 hover:border-gray-500'
                }`}>
                <span className="font-bold" style={{ fontSize: 'clamp(1.2rem, 2.5vw, 2rem)' }}>{count}</span>
                <span style={{ fontSize: 'clamp(0.65rem, 1.2vw, 0.8rem)' }} className="mt-0.5">
                  {count === 1 ? 'Day' : 'Days'}
                </span>
              </button>
            )
          })}
        </div>

        <p className="text-center text-neon font-semibold mb-[2vh]" style={{ fontSize: 'clamp(0.9rem, 1.8vw, 1.15rem)' }}>
          {selectedCount === 0 ? '?' : selectedCount} {selectedCount === 1 ? 'day' : 'days'} per week
        </p>

        <NavButtons onNext={next} onBack={back} disableNext={selectedCount === 0} />
      </div>
    </div>
  )
}
