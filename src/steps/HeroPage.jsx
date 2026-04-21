import { Dumbbell, Zap, Trophy, LogIn } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const ICON_SIZE = 28

function InstagramIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function YoutubeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
    </svg>
  )
}

function MindsetIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6"/>
      <path d="M10 22h4"/>
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
    </svg>
  )
}

export default function HeroPage({ next }) {
  const navigate = useNavigate()

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      >
        <source src="/instagramvideo.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/60" />

      {/* Top bar — fixed height */}
      <div className="relative z-20 flex items-center justify-between px-[4vw] pt-[2vh]">
        <div className="flex items-center gap-[2vw]">
          <a
            href="https://www.instagram.com/sina_yf_fury?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 flex items-center justify-center text-pink-500 hover:text-pink-400 hover:scale-110 transition-all"
          >
            <InstagramIcon />
          </a>
          <a
            href="https://youtube.com/@sinayadollahifard1392?si=EQDIR0oRK9KCWESK"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-400 hover:scale-110 transition-all"
          >
            <YoutubeIcon />
          </a>
          <a
            href="https://google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 flex items-center justify-center text-green-500 hover:text-green-400 hover:scale-110 transition-all"
          >
            <WhatsAppIcon />
          </a>
          <a
            href="https://google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 flex items-center justify-center text-yellow-400 hover:text-yellow-300 hover:scale-110 transition-all"
          >
            <MindsetIcon />
          </a>
        </div>
        <button
          onClick={() => navigate('/signin')}
          className="flex items-center gap-2 px-4 py-2 border border-dark-border rounded-xl text-sm text-gray-400 hover:text-neon hover:border-neon/50 transition-colors cursor-pointer"
        >
          <LogIn size={16} />
          Sign In
        </button>
      </div>

      {/* Main content — fills remaining space, centered */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-[5vw] text-center">
        <img
          src="/furylogo.png"
          alt="Sina Fury"
          className="h-[10vh] mb-[2vh]"
        />

        <h1
          className="font-extrabold leading-[1.1] mb-[2vh]"
          style={{ fontSize: 'clamp(1.8rem, 5vw, 4.5rem)' }}
        >
          Transform Your Body,{' '}
          <span className="text-neon">Elevate Your Life</span>
        </h1>

        <p
          className="text-gray-400 leading-relaxed mb-[3vh] max-w-xl mx-auto"
          style={{ fontSize: 'clamp(0.85rem, 1.8vw, 1.25rem)' }}
        >
          Your journey to a stronger, healthier you starts here. With fully personalized training programs designed around your body, your goals, and your schedule — every rep, every set, every meal has a purpose. No cookie-cutter plans. Just real results, backed by expert coaching and unwavering support.
        </p>

        <button
          onClick={next}
          className="px-[6vw] py-[1.5vh] bg-neon text-black font-bold rounded-xl hover:bg-neon-dark transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(212,255,0,0.3)] cursor-pointer"
          style={{ fontSize: 'clamp(1rem, 2vw, 1.3rem)' }}
        >
          LETS START
        </button>

        <div className="flex justify-center gap-[5vw] mt-[3vh] text-gray-500">
          <div className="flex flex-col items-center gap-1">
            <Dumbbell size={20} />
            <span className="text-xs">Custom Plans</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Trophy size={20} />
            <span className="text-xs">Proven Results</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Zap size={20} />
            <span className="text-xs">Expert Coach</span>
          </div>
        </div>
      </div>
    </div>
  )
}
