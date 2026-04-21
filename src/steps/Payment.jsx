import { ImagePlus, X, Copy, Check, Loader2 } from 'lucide-react'
import NavButtons from '../components/NavButtons'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

const cards = [
  {
    id: 'mellat',
    name: 'Mellat Card',
    image: '/MellatCard.webp',
    cardNumber: '6104 3378 1274 5621',
    accountOwner: 'Sina Fury',
    bankName: 'Bank Mellat',
    expiryDate: '12/28',
    textColor: 'white',
  },
  {
    id: 'visa',
    name: 'Visa Card',
    image: '/VisaCard.webp',
    cardNumber: '4532 1488 0343 6467',
    accountOwner: 'Sina Fury',
    bankName: 'Visa International',
    expiryDate: '09/27',
    textColor: 'white',
  },
]

export default function Payment({ formData, updateFormData, next, back, saveProfile }) {
  const [errors, setErrors] = useState({})
  const [copied, setCopied] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [selectedCard, setSelectedCard] = useState(cards[0].id)
  const { user } = useAuth()

  const activeIndex = cards.findIndex((c) => c.id === selectedCard)
  const card = cards[activeIndex] || cards[0]

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      updateFormData({ paymentProof: { file, preview: URL.createObjectURL(file), name: file.name } })
      setErrors({})
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer?.files?.[0]
    if (file && file.type.startsWith('image/')) {
      updateFormData({ paymentProof: { file, preview: URL.createObjectURL(file), name: file.name } })
      setErrors({})
    }
  }

  const removeProof = () => updateFormData({ paymentProof: null })

  const handleNext = async () => {
    if (!formData.paymentProof) {
      setErrors({ proof: 'Payment proof is required' })
      return
    }
    setUploading(true)
    try {
      if (formData.paymentProof?.file) await api.uploadFile('payment-proofs', 'payment-proof', formData.paymentProof.file)
      // Save profile data BEFORE setting onboarding complete, so edits aren't flagged
      if (saveProfile) await saveProfile(formData)
      await api.updateProfile({ onboardingComplete: true })
    } catch (err) {
      console.error('Payment upload error:', err)
    }
    setUploading(false)
    next()
  }

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text.replace(/\s/g, ''))
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="h-full flex flex-col px-[5vw] py-[1vh]">
      {/* Header */}
      <div className="shrink-0 text-center mb-[1.5vh]">
        <h2 className="font-bold" style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)' }}>Payment</h2>
        <p className="text-gray-500" style={{ fontSize: 'clamp(0.7rem, 1.3vw, 0.9rem)' }}>
          Select a payment method and upload your receipt
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-auto w-full max-w-md sm:max-w-lg mx-auto">
        {/* Card selector tabs */}
        <div className="flex gap-2 mb-4">
          {cards.map((c) => (
            <button key={c.id} onClick={() => setSelectedCard(c.id)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                selectedCard === c.id
                  ? 'bg-neon text-black border-neon'
                  : 'bg-dark-card text-gray-400 border-dark-border hover:border-gray-500'
              }`}>
              {c.name}
            </button>
          ))}
        </div>

        {/* Card Carousel with vertical dots */}
        <div className="flex items-center gap-3 mb-4">
          {/* Vertical dot indicators */}
          <div className="flex flex-col gap-2 shrink-0">
            {cards.map((c, i) => (
              <div key={c.id} onClick={() => setSelectedCard(c.id)}
                className={`w-2 rounded-full transition-all cursor-pointer ${
                  i === activeIndex ? 'bg-neon h-6' : 'bg-gray-600 h-2'
                }`} />
            ))}
          </div>

          {/* Carousel */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden" style={{ perspective: '1000px', height: 'clamp(220px, 38vh, 320px)' }}>
            {cards.map((c, i) => {
              const offset = i - activeIndex
              const isCenter = offset === 0
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCard(c.id)}
                  className="absolute transition-all duration-500 ease-out cursor-pointer"
                  style={{
                    width: 'clamp(240px, 70vw, 360px)',
                    transform: `translateY(${offset * 55}%) scale(${isCenter ? 1 : 0.82}) translateZ(${isCenter ? 0 : -80}px)`,
                    opacity: Math.abs(offset) > 1 ? 0 : isCenter ? 1 : 0.55,
                    zIndex: isCenter ? 10 : 5 - Math.abs(offset),
                    filter: isCenter ? 'none' : 'brightness(0.7)',
                  }}
                >
                  <div className={`relative aspect-[1.586/1] rounded-2xl overflow-hidden ${isCenter ? 'shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8),0_10px_30px_-5px_rgba(0,0,0,0.6)]' : 'shadow-xl'}`}>
                    <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex flex-col justify-end p-4 text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
                      <div className="flex items-center justify-center mb-2">
                        <p className="font-mono font-bold tracking-wider text-white" style={{
                          fontSize: 'clamp(0.9rem, 3vw, 1.35rem)',
                          letterSpacing: '0.15em',
                        }}>
                          {c.cardNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] uppercase opacity-75 mb-0.5 tracking-wider">Card Holder</p>
                        <p className="font-semibold uppercase" style={{ fontSize: 'clamp(0.7rem, 1.6vw, 0.9rem)' }}>
                          {c.accountOwner}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Copy card number button */}
        <button onClick={() => copyToClipboard(card.cardNumber, 'card')}
          className="mb-5 w-full flex items-center justify-center gap-2 py-2.5 bg-dark-card border border-dark-border rounded-xl text-gray-300 hover:border-neon/50 hover:text-neon transition-colors cursor-pointer text-sm font-semibold">
          {copied === 'card' ? (
            <><Check size={14} className="text-neon" /> Copied!</>
          ) : (
            <><Copy size={14} /> Copy {card.name} Number</>
          )}
        </button>

        {/* Upload section */}
        <div>
          <h3 className="font-semibold text-gray-400 uppercase tracking-wider mb-[1vh]" style={{ fontSize: 'clamp(0.6rem, 1vw, 0.75rem)' }}>
            Upload Payment Receipt
          </h3>
          {formData.paymentProof ? (
            <div className="relative rounded-xl overflow-hidden border-2 border-neon" style={{ maxHeight: '20vh' }}>
              <img src={formData.paymentProof.preview} alt="Payment proof" className="w-full h-full object-cover" />
              <button onClick={removeProof}
                className="absolute top-2 right-2 bg-black/70 rounded-full p-1.5 hover:bg-black transition-colors cursor-pointer">
                <X size={14} />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
                <span className="text-xs text-neon font-medium">Uploaded</span>
              </div>
            </div>
          ) : (
            <div onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}
              onClick={() => document.getElementById('proof-input').click()}
              className={`rounded-xl border-2 border-dashed p-[2.5vh] flex flex-col items-center justify-center gap-[1vh] cursor-pointer transition-colors ${
                errors.proof ? 'border-red-500 bg-red-500/5' : 'border-dark-border hover:border-neon/50 bg-dark-card'
              }`}>
              <ImagePlus size={28} className={errors.proof ? 'text-red-400' : 'text-gray-600'} />
              <p className={`text-center ${errors.proof ? 'text-red-400' : 'text-gray-500'}`}
                style={{ fontSize: 'clamp(0.7rem, 1.2vw, 0.85rem)' }}>
                Click or drag to upload your payment screenshot
              </p>
              <input id="proof-input" type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleFile} />
            </div>
          )}
          {errors.proof && <span className="text-red-400 text-xs mt-1 block">{errors.proof}</span>}
        </div>

        {uploading && (
          <div className="flex items-center justify-center gap-2 mt-[1vh] text-neon text-sm">
            <Loader2 size={16} className="animate-spin" /> Uploading...
          </div>
        )}
      </div>

      {/* Nav buttons - fixed at bottom */}
      <div className="shrink-0 max-w-md mx-auto w-full">
        <NavButtons onNext={handleNext} onBack={back} nextLabel="COMPLETE" disableNext={!formData.paymentProof || uploading} />
      </div>
    </div>
  )
}
