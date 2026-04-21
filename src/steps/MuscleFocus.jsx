import NavButtons from '../components/NavButtons'
import BodyMap from '../components/BodyMap'

export default function MuscleFocus({ formData, updateFormData, next, back }) {
  const toggleMuscle = (muscleId) => {
    const current = formData.muscleFocus
    const updated = current.includes(muscleId)
      ? current.filter((m) => m !== muscleId)
      : [...current, muscleId]
    updateFormData({ muscleFocus: updated })
  }

  return (
    <div className="h-full flex flex-col px-[3vw] py-[1vh]">
      {/* Header */}
      <div className="shrink-0 text-center">
        <h2 className="font-bold" style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)' }}>
          Muscle Focus
        </h2>
        <p className="text-gray-500" style={{ fontSize: 'clamp(0.7rem, 1.3vw, 0.9rem)' }}>
          Tap the muscles you want to target
        </p>
        <p className="text-neon font-semibold" style={{ fontSize: 'clamp(0.65rem, 1.1vw, 0.8rem)' }}>
          {formData.muscleFocus.length} muscle{formData.muscleFocus.length !== 1 ? 's' : ''} selected
        </p>
      </div>

      {/* Two body maps side by side - fill available space */}
      <div className="flex-1 min-h-0 flex items-center justify-center gap-[1vw] overflow-hidden">
        <div className="flex-1 max-w-[45%] relative h-full">
          <div className="absolute top-0 left-0 right-0 text-center z-10">
            <span className="text-gray-500 font-semibold" style={{ fontSize: 'clamp(0.55rem, 1vw, 0.7rem)' }}>FRONT</span>
          </div>
          <div className="h-full w-full">
            <BodyMap
              view="front"
              selectedMuscles={formData.muscleFocus}
              onToggleMuscle={toggleMuscle}
              fitContainer
            />
          </div>
        </div>
        <div className="flex-1 max-w-[45%] relative h-full">
          <div className="absolute top-0 left-0 right-0 text-center z-10">
            <span className="text-gray-500 font-semibold" style={{ fontSize: 'clamp(0.55rem, 1vw, 0.7rem)' }}>BACK</span>
          </div>
          <div className="h-full w-full">
            <BodyMap
              view="back"
              selectedMuscles={formData.muscleFocus}
              onToggleMuscle={toggleMuscle}
              fitContainer
            />
          </div>
        </div>
      </div>

      {/* Nav buttons */}
      <div className="shrink-0 max-w-md mx-auto w-full">
        <NavButtons onNext={next} onBack={back} disableNext={formData.muscleFocus.length === 0} />
      </div>
    </div>
  )
}
