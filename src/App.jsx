import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { api } from './lib/api'
import HeroPage from './steps/HeroPage'
import SignUp from './steps/SignUp'
import SignIn from './steps/SignIn'
import PhysicalProfile from './steps/PhysicalProfile'
import Information from './steps/Information'
import GoalSelection from './steps/GoalSelection'
import PhotoUpload from './steps/PhotoUpload'
import MuscleFocus from './steps/MuscleFocus'
import Frequency from './steps/Frequency'
import PackageSelection from './steps/PackageSelection'
import Payment from './steps/Payment'
import Dashboard from './steps/Dashboard'
import Admin from './steps/Admin'
import ProgressBar from './components/ProgressBar'
import './index.css'

const STEP_PATHS = [
  '/',
  '/signup',
  '/profile',
  '/information',
  '/goals',
  '/photos',
  '/muscles',
  '/schedule',
  '/package',
  '/payment',
  '/dashboard/profile',
]

const PROGRESS_LABELS = ['Profile', 'Info', 'Goal', 'Photos', 'Muscles', 'Schedule', 'Package', 'Payment']

const DEFAULT_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  passwordConfirm: '',
  gender: '',
  height: '',
  weight: '',
  age: '',
  goals: [],
  photoFront: null,
  photoBack: null,
  photoSide: null,
  bodyView: 'front',
  muscleFocus: [],
  trainingDays: [],
  trainingDaysCount: 0,
  lifestyleInfo: {},
  selectedPackage: null,
  paymentProof: null,
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading, isAuthenticated } = useAuth()
  const prevUserIdRef = useRef(null)
  const profileLoadedRef = useRef(false)

  const getStepFromPath = (path) => {
    if (path === '/signin') return -1
    if (path.startsWith('/admin')) return -2
    if (path.startsWith('/dashboard')) return 10
    const idx = STEP_PATHS.indexOf(path)
    return idx >= 0 ? idx : 0
  }

  const [currentStep, setCurrentStep] = useState(() => getStepFromPath(location.pathname))
  const [formData, setFormData] = useState({ ...DEFAULT_FORM })

  // Load profile when user changes
  useEffect(() => {
    const currentId = user?.id || null

    if (currentId !== prevUserIdRef.current) {
      prevUserIdRef.current = currentId
      profileLoadedRef.current = false

      if (currentId) {
        loadProfile()
      } else {
        setFormData({ ...DEFAULT_FORM })
      }
    }
  }, [user])

  const loadProfile = async () => {
    try {
      const { profile } = await api.getProfile()

      setFormData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: profile.email || '',
        password: '',
        passwordConfirm: '',
        gender: profile.gender || '',
        height: profile.height || '',
        weight: profile.weight || '',
        age: profile.age || '',
        goals: profile.goals || [],
        bodyView: profile.body_view || 'front',
        muscleFocus: profile.muscle_focus || [],
        trainingDays: profile.training_days || [],
        trainingDaysCount: profile.training_days?.length || 0,
        selectedPackage: profile.selected_package || null,
        photoFront: profile.photo_front_path ? { preview: api.getFileUrl(profile.photo_front_path), stored: true } : null,
        photoBack: profile.photo_back_path ? { preview: api.getFileUrl(profile.photo_back_path), stored: true } : null,
        photoSide: profile.photo_side_path ? { preview: api.getFileUrl(profile.photo_side_path), stored: true } : null,
        paymentProof: profile.payment_proof_path ? { preview: api.getFileUrl(profile.payment_proof_path), stored: true } : null,
        trainingProgram: profile.training_program || null,
        programStartDate: profile.program_start_date || null,
        programDurationDays: profile.program_duration_days || 28,
        lifestyleInfo: profile.lifestyle_info || {},
      })
    } catch {
      setFormData((prev) => ({
        ...DEFAULT_FORM,
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
      }))
    }
    profileLoadedRef.current = true
  }

  // Save profile to API
  const saveProfile = useCallback(async (data) => {
    if (!user?.id) return
    try {
      await api.updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        height: data.height,
        weight: data.weight,
        age: data.age,
        goals: data.goals,
        bodyView: data.bodyView,
        muscleFocus: data.muscleFocus,
        trainingDays: data.trainingDays,
        selectedPackage: data.selectedPackage,
        lifestyleInfo: data.lifestyleInfo,
      })
    } catch (err) {
      console.error('Save profile error:', err)
    }
  }, [user])

  const updateFormData = useCallback((updates) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }, [])

  const next = useCallback(() => {
    setCurrentStep((s) => {
      const nextStep = Math.min(s + 1, STEP_PATHS.length - 1)
      if (user?.id && profileLoadedRef.current) {
        saveProfile(formData)
      }
      return nextStep
    })
  }, [formData, user, saveProfile])

  const back = () => setCurrentStep((s) => Math.max(s - 1, 0))

  // Reset form when going to signup
  useEffect(() => {
    if (location.pathname === '/signup' && !isAuthenticated) {
      setFormData({ ...DEFAULT_FORM })
      profileLoadedRef.current = false
      prevUserIdRef.current = null
    }
  }, [location.pathname, isAuthenticated])

  // Route protection
  useEffect(() => {
    if (loading) return
    if (location.pathname.startsWith('/dashboard') && !isAuthenticated) {
      navigate('/')
      setCurrentStep(0)
      return
    }
    if (location.pathname === '/signin' && isAuthenticated) {
      navigate('/dashboard/profile')
    }
  }, [location.pathname, isAuthenticated, navigate, loading])

  // Sync URL when step changes
  useEffect(() => {
    if (currentStep === -1) return
    if (location.pathname === '/signin') return
    if (currentStep === 10 && location.pathname.startsWith('/dashboard')) return
    const targetPath = STEP_PATHS[currentStep]
    if (location.pathname !== targetPath) {
      navigate(targetPath)
    }
  }, [currentStep, navigate, location.pathname])

  // Sync step when URL changes
  useEffect(() => {
    const stepFromPath = getStepFromPath(location.pathname)
    if (stepFromPath !== currentStep) {
      setCurrentStep(stepFromPath)
    }
  }, [location.pathname])

  const showProgress = currentStep >= 2 && currentStep <= 9
  const progressStepIndex = currentStep - 2
  const progressPercent = Math.round(((progressStepIndex + 1) / PROGRESS_LABELS.length) * 100)

  const goToStep = (step) => setCurrentStep(step)
  const stepProps = { formData, updateFormData, next, back, goToStep, saveProfile, reloadProfile: loadProfile }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-neon border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (location.pathname.startsWith('/admin')) {
    return <Admin />
  }

  if (location.pathname === '/signin') {
    return <SignIn />
  }

  return (
    <div className="h-screen flex flex-col bg-dark text-white overflow-hidden">
      {showProgress && (
        <ProgressBar
          percent={progressPercent}
          stepIndex={progressStepIndex + 1}
          totalSteps={PROGRESS_LABELS.length}
          labels={PROGRESS_LABELS}
        />
      )}

      <div className="flex-1 overflow-auto animate-fadeIn">
        {currentStep === 0 && <HeroPage {...stepProps} />}
        {currentStep === 1 && <SignUp {...stepProps} />}
        {currentStep === 2 && <PhysicalProfile {...stepProps} />}
        {currentStep === 3 && <Information {...stepProps} />}
        {currentStep === 4 && <GoalSelection {...stepProps} />}
        {currentStep === 5 && <PhotoUpload {...stepProps} />}
        {currentStep === 6 && <MuscleFocus {...stepProps} />}
        {currentStep === 7 && <Frequency {...stepProps} />}
        {currentStep === 8 && <PackageSelection {...stepProps} />}
        {currentStep === 9 && <Payment {...stepProps} />}
        {currentStep === 10 && <Dashboard {...stepProps} />}
      </div>
    </div>
  )
}

export default App
