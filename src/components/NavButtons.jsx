import { ArrowLeft } from 'lucide-react'

export default function NavButtons({ onNext, onBack, nextLabel = 'NEXT', backLabel = 'BACK', disableNext = false }) {
  return (
    <div className="flex flex-col gap-[1.5vh] w-full mt-[3vh]">
      <button
        onClick={onNext}
        disabled={disableNext}
        className="w-full py-[1.5vh] bg-neon text-black font-bold rounded-xl hover:bg-neon-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        style={{ fontSize: 'clamp(0.9rem, 1.8vw, 1.15rem)' }}
      >
        {nextLabel}
      </button>
      {onBack && (
        <button
          onClick={onBack}
          className="w-full py-[1.5vh] border border-dark-border text-white font-medium rounded-xl hover:bg-dark-card transition-colors flex items-center justify-center gap-2 cursor-pointer"
          style={{ fontSize: 'clamp(0.85rem, 1.6vw, 1.05rem)' }}
        >
          <ArrowLeft size={18} />
          {backLabel}
        </button>
      )}
    </div>
  )
}
