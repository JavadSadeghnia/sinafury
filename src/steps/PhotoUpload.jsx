import { ImagePlus, X, Camera, Loader2 } from 'lucide-react'
import NavButtons from '../components/NavButtons'
import { FrontSilhouette, BackSilhouette, SideSilhouette } from '../components/BodySilhouette'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

const silhouettes = {
  photoFront: FrontSilhouette,
  photoBack: BackSilhouette,
  photoSide: SideSilhouette,
}

const slots = [
  { key: 'photoFront', label: 'Front', storageName: 'front' },
  { key: 'photoBack', label: 'Back', storageName: 'back' },
  { key: 'photoSide', label: 'Side', storageName: 'side' },
]

export default function PhotoUpload({ formData, updateFormData, next, back }) {
  const [errors, setErrors] = useState({})
  const [uploading, setUploading] = useState(false)
  const { user } = useAuth()

  const handleFile = (key, e) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      updateFormData({ [key]: { file, preview: URL.createObjectURL(file), name: file.name } })
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    }
  }

  const handleDrop = (key, e) => {
    e.preventDefault()
    const file = e.dataTransfer?.files?.[0]
    if (file && file.type.startsWith('image/')) {
      updateFormData({ [key]: { file, preview: URL.createObjectURL(file), name: file.name } })
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    }
  }

  const removePhoto = (key) => updateFormData({ [key]: null })

  const handleNext = async () => {
    const e = {}
    slots.forEach(({ key, label }) => {
      if (!formData[key]) e[key] = `${label} image is required`
    })
    setErrors(e)
    if (Object.keys(e).length > 0) return

    setUploading(true)
    try {
      for (const { key, storageName } of slots) {
        const photo = formData[key]
        if (photo?.file) await api.uploadFile('photos', storageName, photo.file)
      }
    } catch (err) {
      console.error('Photo upload error:', err)
    }
    setUploading(false)
    next()
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-[5vw]">
      <div className="w-full max-w-md sm:max-w-2xl">
        <h2 className="font-bold text-center mb-[2vh]" style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)' }}>
          Upload Your Images
        </h2>

        <div className="flex items-start gap-3 mb-[3vh] p-[1.5vh] bg-dark-card rounded-xl border border-dark-border">
          <Camera className="text-neon shrink-0 mt-0.5" size={20} />
          <p className="text-gray-400" style={{ fontSize: 'clamp(0.8rem, 1.5vw, 1rem)' }}>
            Please upload your <span className="text-white font-medium">front</span>, <span className="text-white font-medium">back</span>, and <span className="text-white font-medium">side</span> images. All three are required.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-[2vw]">
          {slots.map(({ key, label }) => {
            const photo = formData[key]
            const hasError = errors[key]
            return (
              <div key={key} className="flex flex-col items-center gap-[0.5vh]">
                <span className="font-semibold text-gray-400 uppercase tracking-wider mb-[0.5vh]"
                  style={{ fontSize: 'clamp(0.65rem, 1.2vw, 0.85rem)' }}>{label}</span>
                {photo ? (
                  <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 border-neon group">
                    <img src={photo.preview} alt={label} className="w-full h-full object-cover" />
                    <button onClick={() => removePhoto(key)}
                      className="absolute top-2 right-2 bg-black/70 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <X size={14} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
                      <span className="text-xs text-neon font-medium">{photo.stored ? 'Saved' : 'Ready'}</span>
                    </div>
                  </div>
                ) : (
                  <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(key, e)}
                    onClick={() => document.getElementById(`file-${key}`).click()}
                    className={`w-full aspect-[3/4] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden group ${
                      hasError ? 'border-red-500 bg-red-500/5' : 'border-dark-border hover:border-neon/50 bg-dark-card'
                    }`}>
                    {(() => {
                      const Silhouette = silhouettes[key]
                      return Silhouette ? (
                        <Silhouette className="h-[70%] text-gray-700/40 group-hover:text-gray-600/50 transition-colors" />
                      ) : null
                    })()}
                    <div className="absolute bottom-3 left-0 right-0 flex flex-col items-center gap-1">
                      <ImagePlus size={18} className={hasError ? 'text-red-400' : 'text-gray-500'} />
                      <span className={`text-center px-2 ${hasError ? 'text-red-400' : 'text-gray-500'}`}
                        style={{ fontSize: 'clamp(0.55rem, 1vw, 0.7rem)' }}>Tap to upload</span>
                    </div>
                    <input id={`file-${key}`} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => handleFile(key, e)} />
                  </div>
                )}
                {hasError && <span className="text-red-400 text-[11px] text-center">{errors[key]}</span>}
              </div>
            )
          })}
        </div>

        <p className="text-gray-600 text-xs italic text-center mt-[1vh]">Only *.jpeg and *.png images will be accepted</p>

        {uploading && (
          <div className="flex items-center justify-center gap-2 mt-[1vh] text-neon text-sm">
            <Loader2 size={16} className="animate-spin" /> Uploading photos...
          </div>
        )}

        <NavButtons onNext={handleNext} onBack={back} disableNext={!formData.photoFront || !formData.photoBack || !formData.photoSide || uploading} />
      </div>
    </div>
  )
}
