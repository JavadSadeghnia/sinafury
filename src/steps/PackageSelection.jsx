import { useState, useEffect } from 'react'
import { CheckCircle, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import NavButtons from '../components/NavButtons'

const packages = [
  {
    id: 'custom',
    name: 'CUSTOM PACKAGE',
    price: 123,
    features: ['Dedicated Time', 'Direct Chat', 'Full Time Support', '1 Year Free Updates'],
    popular: true,
  },
  {
    id: 'splits',
    name: 'SPLITS & MOBILITY',
    price: 89,
    features: ['Pre-made Program', 'Video Guides', 'Email Support', '6 Month Access'],
    popular: false,
  },
  {
    id: 'nutrition',
    name: 'NUTRITION PLAN',
    price: 69,
    features: ['Custom Meal Plan', 'Macro Tracking', 'Weekly Check-ins', '3 Month Access'],
    popular: false,
  },
]

export default function PackageSelection({ formData, updateFormData, next, back }) {
  const [activeIndex, setActiveIndex] = useState(() => {
    const idx = packages.findIndex((p) => p.id === formData.selectedPackage)
    return idx >= 0 ? idx : 0
  })

  const goLeft = () => setActiveIndex((i) => Math.max(0, i - 1))
  const goRight = () => setActiveIndex((i) => Math.min(packages.length - 1, i + 1))

  const selectPackage = (id) => updateFormData({ selectedPackage: id })

  // Auto-select when swiping
  useEffect(() => {
    selectPackage(packages[activeIndex].id)
  }, [activeIndex])

  return (
    <div className="h-full flex flex-col px-[3vw] py-[1vh]">
      {/* Header */}
      <div className="shrink-0 text-center mb-[2vh]">
        <h2 className="font-bold" style={{ fontSize: 'clamp(1.3rem, 3vw, 2rem)' }}>
          Choose Your Package
        </h2>
        <p className="text-gray-500 mt-[0.3vh]" style={{ fontSize: 'clamp(0.75rem, 1.5vw, 1rem)' }}>
          Select the plan that suits you best
        </p>
      </div>

      {/* Card Carousel */}
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className="relative w-full max-w-3xl flex items-center justify-center" style={{ perspective: '1000px' }}>
          {packages.map((pkg, i) => {
            const offset = i - activeIndex
            const isCenter = offset === 0
            const selected = formData.selectedPackage === pkg.id

            return (
              <div
                key={pkg.id}
                onClick={() => {
                  setActiveIndex(i)
                  selectPackage(pkg.id)
                }}
                className="absolute transition-all duration-500 ease-out cursor-pointer"
                style={{
                  width: 'clamp(220px, 60vw, 320px)',
                  transform: `translateX(${offset * 85}%) scale(${isCenter ? 1 : 0.85}) translateZ(${isCenter ? 0 : -80}px)`,
                  opacity: Math.abs(offset) > 1 ? 0 : isCenter ? 1 : 0.5,
                  zIndex: isCenter ? 10 : 5 - Math.abs(offset),
                  filter: isCenter ? 'none' : 'brightness(0.6)',
                  pointerEvents: Math.abs(offset) > 1 ? 'none' : 'auto',
                }}
              >
                <div
                  className={`rounded-3xl border p-[2.5vh] transition-all ${
                    isCenter && selected
                      ? 'border-neon bg-dark-card shadow-[0_0_40px_rgba(212,255,0,0.15)]'
                      : 'border-dark-border bg-dark-surface'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-neon text-black text-[10px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1 z-20">
                      <Sparkles size={10} /> POPULAR
                    </div>
                  )}

                  <h3 className="font-bold text-center text-gray-300 mt-1" style={{ fontSize: 'clamp(0.7rem, 1.3vw, 0.9rem)' }}>
                    {pkg.name}
                  </h3>
                  <p className="text-center font-extrabold my-[1.5vh]" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
                    <span className="text-neon">$</span>{pkg.price}
                  </p>

                  <div className="border-t border-dark-border pt-[1.5vh] space-y-[1vh]">
                    {pkg.features.map((f) => (
                      <div key={f} className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-neon shrink-0" />
                        <span className="text-gray-300" style={{ fontSize: 'clamp(0.7rem, 1.2vw, 0.85rem)' }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  <div
                    className={`w-full mt-[2vh] py-[1vh] rounded-xl font-bold text-center transition-all ${
                      isCenter && selected ? 'bg-neon text-black' : 'bg-dark-border text-white'
                    }`}
                    style={{ fontSize: 'clamp(0.75rem, 1.3vw, 0.9rem)' }}
                  >
                    {isCenter && selected ? 'SELECTED' : 'ORDER'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Navigation arrows */}
      <div className="shrink-0 flex items-center justify-center gap-8 mb-[1vh]">
        <button
          onClick={goLeft}
          disabled={activeIndex === 0}
          className="w-10 h-10 rounded-full border border-dark-border flex items-center justify-center text-gray-400 hover:text-neon hover:border-neon/50 transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex gap-2">
          {packages.map((_, i) => (
            <div
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                i === activeIndex ? 'bg-neon w-6' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
        <button
          onClick={goRight}
          disabled={activeIndex === packages.length - 1}
          className="w-10 h-10 rounded-full border border-dark-border flex items-center justify-center text-gray-400 hover:text-neon hover:border-neon/50 transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Nav buttons */}
      <div className="shrink-0 max-w-md mx-auto w-full">
        <NavButtons onNext={next} onBack={back} nextLabel="NEXT" disableNext={!formData.selectedPackage} />
      </div>
    </div>
  )
}
