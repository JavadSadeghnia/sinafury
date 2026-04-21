import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setError('')
    if (!email.trim() || !password) {
      setError('Please fill in all fields')
      return
    }
    setSubmitting(true)

    // Try admin login first
    try {
      await api.adminSignIn(email, password)
      setSubmitting(false)
      navigate('/admin')
      return
    } catch {
      // Not admin, try regular sign in
    }

    const result = await signIn(email, password)
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    navigate('/dashboard/profile')
  }

  const inputClass = (hasErr) =>
    `w-full bg-dark-card border ${
      hasErr ? 'border-red-500' : 'border-dark-border'
    } rounded-xl px-5 py-[1.5vh] pl-12 text-white placeholder-gray-500 focus:outline-none focus:border-neon transition-colors`

  return (
    <div className="h-screen flex flex-col items-center justify-center px-[5vw] bg-dark text-white">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-[1.5vh]">
          <img src="/furylogo.png" alt="Sina Fury" className="h-[8vh]" />
        </div>
        <p className="text-gray-500 text-center mb-[3vh]" style={{ fontSize: 'clamp(0.85rem, 1.8vw, 1.15rem)' }}>
          Welcome back
        </p>

        {error && (
          <div className="mb-[2vh] p-[1.5vh] bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-[2vh]" style={{ fontSize: 'clamp(0.85rem, 1.6vw, 1rem)' }}>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input type="email" placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)} className={inputClass(false)} />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className={inputClass(false)} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="mt-[3vh]">
          <button onClick={handleSubmit} disabled={!email.trim() || !password}
            className="w-full py-[1.5vh] bg-neon text-black font-bold rounded-xl hover:bg-neon-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            style={{ fontSize: 'clamp(0.9rem, 1.8vw, 1.15rem)' }}>
            SIGN IN
          </button>
        </div>

        <button onClick={() => navigate('/')}
          className="w-full mt-[1.5vh] py-[1.5vh] border border-dark-border text-white font-medium rounded-xl hover:bg-dark-card transition-colors flex items-center justify-center gap-2 cursor-pointer"
          style={{ fontSize: 'clamp(0.85rem, 1.6vw, 1.05rem)' }}>
          <ArrowLeft size={18} />
          MAIN PAGE
        </button>

        <p className="text-center text-gray-500 text-sm mt-[2vh]">
          Don't have an account?{' '}
          <span onClick={() => navigate('/signup')} className="text-neon cursor-pointer hover:underline">Sign Up</span>
        </p>
      </div>
    </div>
  )
}
