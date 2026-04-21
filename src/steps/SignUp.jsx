import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import NavButtons from '../components/NavButtons'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SignUp({ formData, updateFormData, next, back, goToStep }) {
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const validate = () => {
    const e = {}
    if (!formData.firstName.trim()) e.firstName = 'Required'
    if (!formData.lastName.trim()) e.lastName = 'Required'
    if (!formData.email.trim()) e.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Invalid email'
    if (!formData.password) e.password = 'Required'
    else if (formData.password.length < 6) e.password = 'Min 6 characters'
    if (formData.password !== formData.passwordConfirm)
      e.passwordConfirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const [submitting, setSubmitting] = useState(false)

  const handleNext = async () => {
    if (!validate()) return
    setSubmitting(true)
    const result = await signUp(formData.firstName, formData.lastName, formData.email, formData.password)
    setSubmitting(false)
    if (result.error) {
      setErrors((prev) => ({ ...prev, email: result.error }))
      return
    }
    next()
  }

  const inputClass = (field) =>
    `w-full bg-dark-card border ${
      errors[field] ? 'border-red-500' : 'border-dark-border'
    } rounded-xl px-5 py-[1.5vh] pl-12 text-white placeholder-gray-500 focus:outline-none focus:border-neon transition-colors`

  return (
    <div className="h-screen flex flex-col items-center justify-center px-[5vw] overflow-auto">
      <div className="w-full max-w-md sm:max-w-lg">
        <div className="flex justify-center mb-[1.5vh]">
          <img src="/furylogo.png" alt="Sina Fury" className="h-[8vh]" />
        </div>
        <p className="text-gray-500 text-center mb-[3vh]" style={{ fontSize: 'clamp(0.85rem, 1.8vw, 1.15rem)' }}>
          Create your account
        </p>

        <div className="space-y-[2vh]" style={{ fontSize: 'clamp(0.85rem, 1.6vw, 1rem)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[2vh] sm:gap-[1.5vw]">
            <div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input type="text" placeholder="First Name" value={formData.firstName}
                  onChange={(e) => updateFormData({ firstName: e.target.value })} className={inputClass('firstName')} />
              </div>
              {errors.firstName && <span className="text-red-400 text-xs mt-1 ml-1 block">{errors.firstName}</span>}
            </div>
            <div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input type="text" placeholder="Last Name" value={formData.lastName}
                  onChange={(e) => updateFormData({ lastName: e.target.value })} className={inputClass('lastName')} />
              </div>
              {errors.lastName && <span className="text-red-400 text-xs mt-1 ml-1 block">{errors.lastName}</span>}
            </div>
          </div>

          <div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input type="email" placeholder="Email" value={formData.email}
                onChange={(e) => updateFormData({ email: e.target.value })} className={inputClass('email')} />
            </div>
            {errors.email && <span className="text-red-400 text-xs mt-1 ml-1 block">{errors.email}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[2vh] sm:gap-[1.5vw]">
            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={formData.password}
                  onChange={(e) => updateFormData({ password: e.target.value })} className={inputClass('password')} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span className="text-red-400 text-xs mt-1 ml-1 block">{errors.password}</span>}
            </div>
            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input type={showConfirm ? 'text' : 'password'} placeholder="Password Confirmation" value={formData.passwordConfirm}
                  onChange={(e) => updateFormData({ passwordConfirm: e.target.value })} className={inputClass('passwordConfirm')} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.passwordConfirm && <span className="text-red-400 text-xs mt-1 ml-1 block">{errors.passwordConfirm}</span>}
            </div>
          </div>
        </div>

        <NavButtons onNext={handleNext} onBack={() => goToStep(0)} nextLabel="SIGN UP" backLabel="MAIN PAGE"
          disableNext={!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.password || !formData.passwordConfirm} />

        <p className="text-center text-gray-500 text-sm mt-[2vh]">
          Already registered?{' '}
          <span onClick={() => navigate('/signin')} className="text-neon cursor-pointer hover:underline">Sign In</span>
        </p>
      </div>
    </div>
  )
}
