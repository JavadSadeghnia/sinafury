import { TrendingDown, Dumbbell, Heart, Check } from 'lucide-react'
import NavButtons from '../components/NavButtons'

const goals = [
  { id: 'lose-weight', label: 'Lose Weight', icon: TrendingDown, desc: 'Shed fat and get lean' },
  { id: 'build-muscle', label: 'Build Muscle', icon: Dumbbell, desc: 'Gain strength and mass' },
  { id: 'endurance', label: 'Endurance', icon: Heart, desc: 'Boost stamina and cardio' },
]

export default function GoalSelection({ formData, updateFormData, next, back }) {
  const selected = formData.goals

  const toggleGoal = (id) => {
    const updated = selected.includes(id)
      ? selected.filter((g) => g !== id)
      : [...selected, id]
    updateFormData({ goals: updated })
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-[5vw]">
      <div className="w-full max-w-md sm:max-w-xl">
        <h2 className="font-bold text-center mb-[1vh]" style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)' }}>
          Choose Your Goals
        </h2>
        <p className="text-gray-500 text-center mb-[3vh]" style={{ fontSize: 'clamp(0.85rem, 1.8vw, 1.15rem)' }}>
          Select one or more goals
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-[2vh] sm:gap-[1.5vw]">
          {goals.map(({ id, label, icon: Icon, desc }) => {
            const isSelected = selected.includes(id)
            return (
              <button
                key={id}
                onClick={() => toggleGoal(id)}
                className={`relative flex flex-row sm:flex-col items-center sm:justify-center gap-4 p-[2vh] sm:p-[2.5vh] rounded-2xl text-left sm:text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-neon text-black'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-black/20 rounded-full flex items-center justify-center">
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
                <Icon size={32} strokeWidth={2.5} className="sm:mx-auto shrink-0" />
                <div>
                  <span className="font-bold block" style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)' }}>{label}</span>
                  <span className={`text-sm mt-1 block ${isSelected ? 'text-black/60' : 'text-gray-500'}`}>{desc}</span>
                </div>
              </button>
            )
          })}
        </div>

        <NavButtons onNext={next} onBack={back} disableNext={selected.length === 0} />
      </div>
    </div>
  )
}
