import { Ruler, Weight, CalendarDays } from 'lucide-react'
import NavButtons from '../components/NavButtons'
import { useState } from 'react'

const genderImages = {
  male: '/male.png',
  female: '/female.png',
}

export default function PhysicalProfile({ formData, updateFormData, next, back }) {
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!formData.height) e.height = 'Required'
    if (!formData.weight) e.weight = 'Required'
    if (!formData.age) e.age = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (validate()) next()
  }

  const inputClass = (field) =>
    `w-full bg-dark-card border ${
      errors[field] ? 'border-red-500' : 'border-dark-border'
    } rounded-xl px-5 py-[1.5vh] pl-12 text-white placeholder-gray-500 focus:outline-none focus:border-neon transition-colors`

  return (
    <div className="h-full flex flex-col items-center justify-center px-[5vw]">
      <div className="w-full max-w-md sm:max-w-lg">
        <h2 className="font-bold text-center mb-[3vh]" style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)' }}>
          Physical Profile
        </h2>

        {/* Gender Selection */}
        <div className="flex justify-center gap-[5vw] mb-[4vh]">
          {['male', 'female'].map((g) => (
            <button
              key={g}
              onClick={() => updateFormData({ gender: g })}
              className="flex flex-col items-center gap-[1vh] group cursor-pointer"
            >
              <div className={`h-[18vh] rounded-2xl overflow-hidden flex items-center justify-center transition-all ${
                formData.gender === g ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'
              }`}>
                <img src={genderImages[g]} alt={g} className="h-full object-contain" />
              </div>
              <span className={`font-semibold capitalize transition-colors ${
                formData.gender === g ? 'text-neon' : 'text-gray-400'
              }`} style={{ fontSize: 'clamp(0.8rem, 1.5vw, 1rem)' }}>
                {g}
              </span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                formData.gender === g ? 'bg-neon border-neon' : 'border-gray-500'
              }`}>
                {formData.gender === g && <div className="w-2 h-2 rounded-full bg-black" />}
              </div>
            </button>
          ))}
        </div>

        {/* Height, Weight & Age */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-[2vh] sm:gap-[1.5vw]" style={{ fontSize: 'clamp(0.85rem, 1.6vw, 1rem)' }}>
          <div>
            <div className="relative">
              <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input type="number" placeholder="Height (CM)" value={formData.height}
                onChange={(e) => updateFormData({ height: e.target.value })} className={inputClass('height')} />
            </div>
            {errors.height && <span className="text-red-400 text-xs mt-1 ml-1 block">{errors.height}</span>}
          </div>
          <div>
            <div className="relative">
              <Weight className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input type="number" placeholder="Weight (KG)" value={formData.weight}
                onChange={(e) => updateFormData({ weight: e.target.value })} className={inputClass('weight')} />
            </div>
            {errors.weight && <span className="text-red-400 text-xs mt-1 ml-1 block">{errors.weight}</span>}
          </div>
          <div>
            <div className="relative">
              <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input type="number" placeholder="Age" value={formData.age}
                onChange={(e) => updateFormData({ age: e.target.value })} className={inputClass('age')} />
            </div>
            {errors.age && <span className="text-red-400 text-xs mt-1 ml-1 block">{errors.age}</span>}
          </div>
        </div>

        <NavButtons onNext={handleNext} disableNext={!formData.gender || !formData.height || !formData.weight || !formData.age} />
      </div>
    </div>
  )
}
