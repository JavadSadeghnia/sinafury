import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import BodyMap from '../components/BodyMap'
import Chat from '../components/Chat'
import Countdown, { MS_PER_DAY } from '../components/Countdown'
import PlanTabs from '../components/PlanTabs'
import {
  Target,
  Dumbbell,
  Calendar,
  Package,
  Activity,
  LayoutDashboard,
  UserCircle,
  MessageCircle,
  X,
  Pencil,
  LogOut,
  Lock,
  Trash2,
  User,
  Eye,
  EyeOff,
} from 'lucide-react'

const goalLabels = {
  'lose-weight': 'Lose Weight',
  'build-muscle': 'Build Muscle',
  endurance: 'Endurance',
}

const packageLabels = {
  custom: 'Custom Package',
  splits: 'Splits & Mobility',
  nutrition: 'Nutrition Plan',
}

const muscleLabels = {
  traps: 'Traps', 'front-shoulders': 'Shoulders', chest: 'Chest', biceps: 'Biceps',
  abdominals: 'Abs', obliques: 'Obliques', forearms: 'Forearms', quads: 'Quads',
  calves: 'Calves', 'rear-shoulders': 'Rear Delts', triceps: 'Triceps', lats: 'Lats',
  'traps-middle': 'Mid Traps', lowerback: 'Lower Back', glutes: 'Glutes', hamstrings: 'Hamstrings',
}

const NUM_WEEKS = 4

const workoutDescriptions = {
  'Full-Body Strength I': 'Compound movements targeting all major muscle groups. Focus on progressive overload with barbell squats, bench press, and deadlifts. Include accessory work for lagging body parts. 4 sets of 8-10 reps per exercise.',
  'Upper Body Power': 'Explosive upper body session with overhead press, weighted pull-ups, and barbell rows. Incorporate plyometric push-ups and medicine ball throws. 5 sets of 5 reps for main lifts.',
  'Lower Body Focus': 'Leg-dominant session with front squats, Romanian deadlifts, leg press, and walking lunges. Finish with calf raises and core work. 4 sets of 10-12 reps.',
  'Full-Body Strength II': 'Variation of Strength I using different movement patterns. Sumo deadlifts, incline press, and pendlay rows. 4 sets of 6-8 reps with heavier loads.',
  'Push / Pull': 'Alternating push and pull exercises in superset fashion. Bench press with rows, overhead press with pull-ups. Great for time efficiency. 3 sets of 10-12 reps.',
  'Core & Conditioning': 'High-intensity circuit combining core exercises with cardio bursts. Planks, Russian twists, mountain climbers, and kettlebell swings. 30 seconds on, 15 seconds off.',
  'Hypertrophy Mix': 'Volume-focused session with moderate weights and higher reps. Isolation exercises for biceps, triceps, shoulders, and legs. 4 sets of 12-15 reps with controlled tempo.',
  'Active Rest Day': 'Light activity to promote recovery. 20-30 minutes of walking, yoga, or light stretching. Keep heart rate below 120 BPM. Focus on mobility and flexibility.',
  'Recovery Day': 'Complete rest or very light foam rolling session. Prioritize sleep, hydration, and nutrition. Optional 10-minute meditation for mental recovery.',
  'Optional Cardio / Steps': 'Low-intensity steady-state cardio. Aim for 30-45 minutes of brisk walking, cycling, or swimming. Target 8,000-10,000 steps throughout the day.',
  'Stretching & Mobility': 'Full-body stretching routine focusing on hip flexors, hamstrings, shoulders, and thoracic spine. Hold each stretch for 30-60 seconds. Include foam rolling.',
}

const workoutTypes = [
  'Full-Body Strength I',
  'Upper Body Power',
  'Lower Body Focus',
  'Full-Body Strength II',
  'Push / Pull',
  'Core & Conditioning',
  'Hypertrophy Mix',
]

const restTypes = [
  'Active Rest Day',
  'Recovery Day',
  'Optional Cardio / Steps',
  'Stretching & Mobility',
]

function buildSchedule(trainingDays) {
  const numTrainingDays = trainingDays?.length || 3
  const grid = []
  let workoutIdx = 0

  for (let dayIdx = 0; dayIdx < numTrainingDays; dayIdx++) {
    const dayLabel = `Day ${dayIdx + 1}`
    const weeks = []

    for (let week = 0; week < NUM_WEEKS; week++) {
      weeks.push({
        type: 'training',
        label: workoutTypes[(workoutIdx + week) % workoutTypes.length],
      })
    }

    workoutIdx++
    grid.push({ day: dayLabel, isTraining: true, weeks })
  }

  return grid
}

function DetailModal({ title, description: customDesc, cellKey, isDone, onToggleDone, onClose }) {
  const description = customDesc || workoutDescriptions[title] || 'No details available for this session.'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_40px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-neon flex items-center justify-center shrink-0">
            <Dumbbell size={16} className="text-black" />
          </div>
          <h3 className="text-lg font-bold text-neon">{title}</h3>
        </div>

        <p className="text-gray-300 text-sm leading-relaxed mb-6">
          {description}
        </p>

        <button
          onClick={() => onToggleDone(cellKey)}
          className={`w-full flex items-center justify-center gap-3 py-3 rounded-xl border-2 transition-all cursor-pointer ${
            isDone
              ? 'bg-green-500/20 border-green-500 text-green-400'
              : 'bg-dark-surface border-dark-border text-gray-400 hover:border-gray-500'
          }`}
        >
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
            isDone ? 'bg-green-500 border-green-500' : 'border-gray-500'
          }`}>
            {isDone && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span className="font-semibold text-sm">{isDone ? 'Completed!' : 'Mark as Done'}</span>
        </button>
      </div>
    </div>
  )
}

function TrainingPage({ formData, goToStep, reloadProfile }) {
  const { user } = useAuth()
  const hasCustomProgram = formData.trainingProgram &&
    formData.trainingProgram.some(row => row.weeks?.some(w => w.label || w.description))
  const [modalInfo, setModalInfo] = useState(null)
  const [completedDays, setCompletedDays] = useState({})
  const [archivedCycles, setArchivedCycles] = useState([])
  const [activeTab, setActiveTab] = useState(0) // index into combined cycles list

  // Build combined list: archives first, then current
  const currentPlan = hasCustomProgram ? {
    cycle_number: 'current',
    training_program: formData.trainingProgram,
    completed_days: completedDays,
    isCurrent: true,
  } : null
  const allCycles = [...archivedCycles, ...(currentPlan ? [currentPlan] : [])]

  // Default to current (last index)
  useEffect(() => {
    setActiveTab(allCycles.length > 0 ? allCycles.length - 1 : 0)
  }, [archivedCycles.length, hasCustomProgram])


  useEffect(() => {
    if (user?.id) {
      api.getCompletedDays()
        .then((data) => setCompletedDays(data.completedDays || {}))
        .catch(() => {})
      api.getCycles()
        .then((data) => setArchivedCycles(data.cycles || []))
        .catch(() => {})
    }
  }, [user?.id])

  // Start the countdown when user first views a real training plan
  useEffect(() => {
    if (hasCustomProgram && !formData.programStartDate) {
      api.startCountdown()
        .then(() => { if (reloadProfile) reloadProfile() })
        .catch(() => {})
    }
  }, [hasCustomProgram, formData.programStartDate, reloadProfile])

  const toggleDone = (cellKey, viewingCycle) => {
    if (viewingCycle?.isCurrent) {
      setCompletedDays(prev => {
        const updated = { ...prev, [cellKey]: !prev[cellKey] }
        api.updateCompletedDays(updated).catch(() => {})
        return updated
      })
    } else if (viewingCycle?.cycle_number) {
      // Archived cycle — update its completed_days locally and on server
      setArchivedCycles(prev => prev.map(c => {
        if (c.cycle_number !== viewingCycle.cycle_number) return c
        const updated = { ...(c.completed_days || {}), [cellKey]: !c.completed_days?.[cellKey] }
        api.updateCycleCompletedDays(c.cycle_number, updated).catch(() => {})
        return { ...c, completed_days: updated }
      }))
    }
  }

  const isProfileIncomplete = !formData.height || !formData.weight || !formData.goals?.length || !formData.selectedPackage || !formData.paymentProof

  if (isProfileIncomplete) {
    return (
      <div className="px-4 sm:px-8 py-6 sm:py-10 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6">Training Plan</h2>
        <div className="flex flex-col items-center justify-center py-16 sm:py-24">
          <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mb-6">
            <Pencil size={36} className="text-yellow-400" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-center mb-3">Complete Your Profile First</h3>
          <p className="text-gray-400 text-center max-w-md leading-relaxed">
            Please fill in your physical details, goals, and select a package so your trainer can create a personalized program for you.
          </p>
          <button
            onClick={() => goToStep(2)}
            className="mt-6 flex items-center gap-2 px-6 py-3 bg-yellow-500/15 border border-yellow-500/50 rounded-xl text-yellow-400 hover:bg-yellow-500/25 transition-colors cursor-pointer font-semibold text-sm"
          >
            <Pencil size={16} />
            Complete Your Profile
          </button>
        </div>
      </div>
    )
  }

  // If there's no current program AND no archives, show the prep message
  if (!hasCustomProgram && archivedCycles.length === 0) {
    return (
      <div className="px-4 sm:px-8 py-6 sm:py-10 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6">Training Plan</h2>
        <div className="flex flex-col items-center justify-center py-16 sm:py-24">
          <div className="w-20 h-20 rounded-full bg-neon/10 flex items-center justify-center mb-6">
            <Dumbbell size={36} className="text-neon" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-center mb-3">Your Program is Being Prepared</h3>
          <p className="text-gray-400 text-center max-w-md leading-relaxed">
            Your information is under review. Your trainer will create a personalized training program tailored to your goals and send it to you soon!
          </p>
          <div className="flex items-center gap-2 mt-6 text-neon/70 text-sm">
            <div className="w-2 h-2 rounded-full bg-neon animate-pulse" />
            <span>In progress</span>
          </div>
        </div>
      </div>
    )
  }

  // Build cycles array — when current is empty (extended, waiting for admin), still show a "Current Plan" placeholder tab
  const placeholderCurrent = !hasCustomProgram ? {
    cycle_number: 'current',
    training_program: null,
    completed_days: {},
    isCurrent: true,
    isPlaceholder: true,
  } : null
  const cyclesWithPlaceholder = placeholderCurrent ? [...archivedCycles, placeholderCurrent] : allCycles
  const safeActiveTab = Math.min(activeTab, cyclesWithPlaceholder.length - 1)
  const activeCycleForRender = cyclesWithPlaceholder[safeActiveTab]
  const isViewingPlaceholder = activeCycleForRender?.isPlaceholder
  const isViewingCurrent = activeCycleForRender?.isCurrent
  const schedule = activeCycleForRender?.training_program || []
  const viewedCompletedDays = isViewingCurrent ? completedDays : (activeCycleForRender?.completed_days || {})

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-10 max-w-5xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold mb-2">Training Plan</h2>
      <p className="text-gray-500 mb-6">Your personalized {NUM_WEEKS}-week schedule</p>

      <PlanTabs
        cycles={cyclesWithPlaceholder}
        activeIndex={safeActiveTab}
        onSelect={setActiveTab}
      />

      {isViewingPlaceholder ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full bg-neon/10 flex items-center justify-center mb-4">
            <Dumbbell size={28} className="text-neon" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-center mb-2">Your New Program is Being Prepared</h3>
          <p className="text-gray-400 text-center max-w-md leading-relaxed text-sm">
            Your trainer is creating your next personalized training program. You can still view your previous plan(s) using the tabs above.
          </p>
          <div className="flex items-center gap-2 mt-4 text-neon/70 text-sm">
            <div className="w-2 h-2 rounded-full bg-neon animate-pulse" />
            <span>In progress</span>
          </div>
        </div>
      ) : (
      /* Table */
      <div className="rounded-2xl border border-dark-border overflow-hidden">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr>
              <th className="bg-neon text-black font-bold text-xs sm:text-sm px-2 py-3 text-center border-r border-neon-dark w-[52px] sm:w-[60px]">
                Days
              </th>
              {Array.from({ length: NUM_WEEKS }, (_, i) => (
                <th
                  key={i}
                  className="bg-neon text-black font-bold text-center text-xs sm:text-sm px-1 py-3 border-r border-neon-dark last:border-r-0"
                >
                  <span className="block text-[9px] sm:text-[10px] opacity-70">Week</span>
                  <span className="text-lg sm:text-xl">{i + 1}</span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {schedule.map((row, rowIdx) => (
              <tr
                key={`${activeTab}-${row.day}`}
                className={rowIdx % 2 === 0 ? 'bg-dark-card' : 'bg-dark-surface'}
              >
                <td className="px-1 py-3 border-r border-dark-border text-center w-[52px] sm:w-[60px]">
                  <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold">{row.day}</span>
                </td>

                {row.weeks.map((cell, wi) => {
                  const cellKey = `${rowIdx}-${wi}`
                  const done = viewedCompletedDays[cellKey]
                  return (
                    <td
                      key={`${activeTab}-${wi}`}
                      className={`px-2 py-3 border-r border-dark-border last:border-r-0 text-center align-middle ${
                        done ? 'bg-green-500/15' : ''
                      }`}
                    >
                      <button
                        onClick={() => setModalInfo({ label: cell.label, description: cell.description, cellKey })}
                        className="w-full text-left group cursor-pointer"
                      >
                        <span
                          className={`text-[11px] sm:text-xs leading-tight block line-clamp-2 ${
                            done
                              ? 'text-green-400 font-semibold'
                              : 'text-neon font-semibold'
                          }`}
                        >
                          {done && '✓ '}{cell.label}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-gray-600 group-hover:text-neon transition-colors mt-0.5 block">
                          show more
                        </span>
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* Modal */}
      {modalInfo && (
        <DetailModal
          title={modalInfo.label}
          description={modalInfo.description}
          cellKey={modalInfo.cellKey}
          isDone={!!viewedCompletedDays[modalInfo.cellKey]}
          onToggleDone={!isViewingPlaceholder ? (cellKey) => toggleDone(cellKey, activeCycleForRender) : null}
          onClose={() => setModalInfo(null)}
        />
      )}
    </div>
  )
}

function getPendingSections(formData) {
  const pending = []
  if (!formData.height || !formData.weight || !formData.age) pending.push({ label: 'Physical Profile', step: 2 })
  const info = formData.lifestyleInfo || {}
  if (!info.onDiet || !info.sleepHours || !info.activityLevel || !info.hasLimitations || !info.onMedication || !info.hasHealthConditions)
    pending.push({ label: 'Lifestyle & Health', step: 3 })
  if (!formData.goals?.length) pending.push({ label: 'Goals', step: 4 })
  if (!formData.photoFront || !formData.photoBack || !formData.photoSide) pending.push({ label: 'Photos', step: 5 })
  if (!formData.muscleFocus?.length) pending.push({ label: 'Muscle Focus', step: 6 })
  if (!formData.trainingDays?.length) pending.push({ label: 'Training Schedule', step: 7 })
  if (!formData.selectedPackage) pending.push({ label: 'Package', step: 8 })
  return pending
}

function PendingSections({ sections, goToStep }) {
  if (sections.length === 0) return null
  return (
    <div className="mb-6 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
      <p className="text-yellow-400 text-xs font-semibold uppercase tracking-wider mb-3">Incomplete Sections</p>
      <div className="flex flex-wrap gap-2">
        {sections.map(({ label, step }) => (
          <button key={label} onClick={() => goToStep(step)}
            className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-400 hover:bg-yellow-500/20 transition-colors cursor-pointer">
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

function ProfilePage({ formData, goToStep, updateFormData, reloadProfile }) {
  const [archivedCycles, setArchivedCycles] = useState([])
  const [packageTabIndex, setPackageTabIndex] = useState(0)
  const [, setTick] = useState(0)

  useEffect(() => {
    api.getCycles().then((d) => setArchivedCycles(d.cycles || [])).catch(() => {})
  }, [formData.programStartDate])

  // Re-evaluate "is future" every second so the tab label flips to "Current Plan" when the previous plan ends.
  // Also reload the profile + cycles so the server-side rebase of program_start_date (when the previous plan ends)
  // and the 7-day reminder are reflected in the UI without needing a manual refresh.
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1)
      if (reloadProfile) reloadProfile()
      api.getCycles().then((d) => setArchivedCycles(d.cycles || [])).catch(() => {})
    }, 1000)
    return () => clearInterval(interval)
  }, [reloadProfile])

  // Check if previous plan has ended
  const lastArchived = archivedCycles[archivedCycles.length - 1]
  const previousPlanEnded = (() => {
    if (!lastArchived?.program_start_date) return true
    const prevStart = new Date(lastArchived.program_start_date.replace(' ', 'T') + 'Z')
    const prevEnd = new Date(prevStart.getTime() + (lastArchived.program_duration_days || 28) * MS_PER_DAY)
    return new Date() >= prevEnd
  })()

  // Current plan is "future" only if it's scheduled in the future AND the previous plan hasn't ended
  const currentPlanIsFuture = formData.programStartDate
    ? new Date(formData.programStartDate.replace(' ', 'T') + 'Z') > new Date() && !previousPlanEnded
    : false

  const currentPlan = (formData.selectedPackage || formData.programStartDate) ? {
    cycle_number: 'current',
    selected_package: formData.selectedPackage,
    program_start_date: formData.programStartDate,
    program_duration_days: formData.programDurationDays || 28,
    isCurrent: true,
    isFuture: currentPlanIsFuture,
  } : null

  // Mark archived cycles whose user replaced them with a new plan as "wasExtended"
  const archivedWithExtended = archivedCycles.map((c, i, arr) => ({
    ...c,
    wasExtended: i < arr.length - 1 || !!currentPlan,
  }))

  const allPackageCycles = [...archivedWithExtended, ...(currentPlan ? [currentPlan] : [])]

  // Default tab: if current plan is in the future and there's a previous plan, point to previous; otherwise current
  useEffect(() => {
    if (allPackageCycles.length === 0) return
    const lastIdx = allPackageCycles.length - 1
    if (currentPlanIsFuture && allPackageCycles.length > 1) {
      setPackageTabIndex(lastIdx - 1)
    } else {
      setPackageTabIndex(lastIdx)
    }
  }, [archivedCycles.length, !!currentPlan, currentPlanIsFuture])

  const activePackage = allPackageCycles[packageTabIndex] || null
  const isViewingCurrentPackage = activePackage?.isCurrent
  const schedule = formData.trainingDays
  const pendingSections = getPendingSections(formData)

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-10 max-w-5xl mx-auto">
      {/* Edit Profile button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl sm:text-3xl font-bold">Profile</h2>
        {(!formData.height || !formData.weight || !formData.goals?.length || !formData.selectedPackage || !formData.paymentProof) ? (
          <button
            onClick={() => goToStep(2)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500/15 border border-yellow-500/50 rounded-xl text-sm text-yellow-400 hover:bg-yellow-500/25 transition-colors cursor-pointer animate-pulse"
          >
            <Pencil size={14} />
            Complete Your Profile
          </button>
        ) : (
          <button
            onClick={() => goToStep(2)}
            className="flex items-center gap-2 px-4 py-2 border border-dark-border rounded-xl text-sm text-gray-400 hover:text-neon hover:border-neon/50 transition-colors cursor-pointer"
          >
            <Pencil size={14} />
            Edit Profile
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
        {[
          { value: formData.height || '—', label: 'Height (cm)' },
          { value: formData.weight || '—', label: 'Weight (kg)' },
          { value: formData.age || '—', label: 'Age' },
          { value: formData.trainingDays.length, label: 'Days/Week' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-dark-card border border-dark-border rounded-xl p-4 sm:p-6 text-center"
          >
            <p className="text-2xl sm:text-4xl font-bold text-neon">{stat.value}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-dark-card border border-dark-border rounded-xl p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-3">
            <Target size={20} className="text-neon" />
            <h3 className="font-bold text-lg">Your Goals</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.goals.length > 0 ? (
              formData.goals.map((g) => (
                <span key={g} className="px-3 py-1.5 bg-neon/10 border border-neon/30 text-neon text-sm rounded-full">
                  {goalLabels[g]}
                </span>
              ))
            ) : (
              <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">Pending</span>
            )}
          </div>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-3">
            <Package size={20} className="text-neon" />
            <h3 className="font-bold text-lg">Your Package</h3>
          </div>

          <PlanTabs
            cycles={allPackageCycles}
            activeIndex={packageTabIndex}
            onSelect={setPackageTabIndex}
          />

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {activePackage?.selected_package ? (
                <p className="text-lg sm:text-xl text-gray-300">{packageLabels[activePackage.selected_package]}</p>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">Pending</span>
              )}
              {isViewingCurrentPackage && (() => {
                if (!formData.programStartDate) return null
                const start = new Date(formData.programStartDate.replace(' ', 'T') + 'Z')
                const now = new Date()
                if (start > now) return null // pending future start — old plan still active
                const elapsedMs = now - start
                const totalMs = (formData.programDurationDays || 28) * MS_PER_DAY
                const daysLeft = Math.ceil(Math.max(0, totalMs - elapsedMs) / MS_PER_DAY)
                if (daysLeft > 7) return null
                return (
                  <button
                    onClick={async () => {
                      try { await api.resetPayment() } catch {}
                      if (updateFormData) updateFormData({
                        paymentProof: null,
                        selectedPackage: null,
                        trainingDays: [],
                        trainingDaysCount: 0,
                        trainingProgram: null,
                        programStartDate: null,
                        programDurationDays: 28,
                      })
                      goToStep(7)
                    }}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-neon/15 border border-neon/50 rounded-xl text-sm text-neon hover:bg-neon/25 transition-colors cursor-pointer animate-pulse"
                  >
                    <Package size={14} />
                    Extend Program
                  </button>
                )
              })()}
            </div>
            {activePackage?.program_start_date && (() => {
              // For the current plan with a future start date, check if the previous plan has ended
              let previousPlanEnded = false
              if (activePackage.isCurrent && archivedCycles.length > 0) {
                const prev = archivedCycles[archivedCycles.length - 1]
                if (prev?.program_start_date) {
                  const prevStart = new Date(prev.program_start_date.replace(' ', 'T') + 'Z')
                  const prevEnd = new Date(prevStart.getTime() + (prev.program_duration_days || 28) * MS_PER_DAY)
                  previousPlanEnded = new Date() >= prevEnd
                }
              }
              return (
                <Countdown
                  startDate={activePackage.program_start_date}
                  durationDays={activePackage.program_duration_days || 28}
                  size={60}
                  wasExtended={!!activePackage.wasExtended}
                  previousPlanEnded={previousPlanEnded}
                />
              )
            })()}
          </div>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-3">
            <Activity size={20} className="text-neon" />
            <h3 className="font-bold text-lg">Muscle Focus</h3>
          </div>
          {formData.muscleFocus?.length > 0 ? (
            <div className="flex gap-4 justify-center">
              <div className="max-w-[130px]">
                <BodyMap view="front" selectedMuscles={formData.muscleFocus} onToggleMuscle={() => {}} readOnly />
              </div>
              <div className="max-w-[130px]">
                <BodyMap view="back" selectedMuscles={formData.muscleFocus} onToggleMuscle={() => {}} readOnly />
              </div>
            </div>
          ) : (
            <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">Pending</span>
          )}
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar size={20} className="text-neon" />
            <h3 className="font-bold text-lg">Training Schedule</h3>
          </div>
          {schedule.length > 0 ? (
            <p className="text-neon text-2xl font-bold">
              {schedule.length} <span className="text-base text-gray-400 font-normal">{schedule.length === 1 ? 'day' : 'days'} per week</span>
            </p>
          ) : (
            <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">Pending</span>
          )}
        </div>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-xl p-5 sm:p-6 mt-4 sm:mt-6">
        <div className="flex items-center gap-3 mb-4">
          <Dumbbell size={20} className="text-neon" />
          <h3 className="font-bold text-lg">Your Photos</h3>
        </div>
        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
          {[
            { photo: formData.photoFront, label: 'Front' },
            { photo: formData.photoBack, label: 'Back' },
            { photo: formData.photoSide, label: 'Side' },
          ].map(({ photo, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="rounded-xl overflow-hidden aspect-[3/4] w-full border border-dark-border">
                {photo ? (
                  <img src={photo.preview} alt={label} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-dark-surface flex flex-col items-center justify-center gap-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">Pending</span>
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lifestyle & Health Info */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5 sm:p-6 mt-4 sm:mt-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity size={20} className="text-neon" />
          <h3 className="font-bold text-lg">Lifestyle & Health</h3>
        </div>
        {formData.lifestyleInfo && Object.keys(formData.lifestyleInfo).length > 0 ? (
          <UserLifestyleCard info={formData.lifestyleInfo} inline />
        ) : (
          <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">Pending</span>
        )}
      </div>
    </div>
  )
}

const activityLabels = {
  'sedentary': 'Sedentary',
  'lightly-active': 'Lightly Active',
  'moderately-active': 'Moderately Active',
  'very-active': 'Very Active',
}

function UserLifestyleCard({ info, inline = false }) {
  const items = []
  if (info.onDiet) items.push({ label: 'On Diet', value: info.onDiet === 'yes' ? 'Yes' : 'No' })
  if (info.eatingHabits) items.push({ label: 'Eating Habits', value: info.eatingHabits })
  if (info.cigarettes) items.push({ label: 'Cigarettes/day', value: info.cigarettes })
  if (info.coffeeTea) items.push({ label: 'Coffee/Tea/day', value: info.coffeeTea })
  if (info.alcohol) items.push({ label: 'Alcohol/day', value: info.alcohol })
  if (info.softDrinks) items.push({ label: 'Soft Drinks/day', value: info.softDrinks })
  if (info.sleepHours) items.push({ label: 'Sleep', value: `${info.sleepHours} hrs/night` })
  if (info.activityLevel) items.push({ label: 'Activity', value: activityLabels[info.activityLevel] || info.activityLevel })
  if (info.enjoyedExercises) items.push({ label: 'Enjoys', value: info.enjoyedExercises })
  if (info.hasLimitations === 'yes') items.push({ label: 'Limitations', value: info.limitations || 'Yes' })
  if (info.onMedication === 'yes') items.push({ label: 'Medication', value: info.medication || 'Yes' })
  if (info.diseases?.length > 0) items.push({ label: 'Conditions', value: info.diseases.join(', ') })
  if (info.otherDiseases) items.push({ label: 'Other', value: info.otherDiseases })
  if (info.hasHealthConditions === 'yes') items.push({ label: 'Health Issues', value: info.healthConditions || 'Yes' })

  if (items.length === 0) return null

  const content = (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map(({ label, value }) => (
        <div key={label} className="bg-dark-surface rounded-lg p-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-sm text-gray-200 mt-1">{value}</p>
          </div>
        ))}
      </div>
  )

  if (inline) return content

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-5 sm:p-6 mt-4 sm:mt-6">
      <div className="flex items-center gap-3 mb-4">
        <Activity size={20} className="text-neon" />
        <h3 className="font-bold text-lg">Lifestyle & Health</h3>
      </div>
      {content}
    </div>
  )
}

function ChatPage() {
  const [messages, setMessages] = useState([])

  const loadMessages = async () => {
    try {
      const data = await api.getMessages()
      setMessages(data.messages || [])
    } catch {}
  }

  useEffect(() => { loadMessages() }, [])

  const handleSend = async (text) => {
    try {
      await api.sendMessage(text)
      loadMessages()
    } catch {}
  }

  const handleSendImage = async (file) => {
    try {
      await api.sendChatImage(file)
      loadMessages()
    } catch {}
  }

  return (
    <div className="max-w-3xl mx-auto" style={{ height: 'calc(100vh - 180px)' }}>
      <div className="px-4 sm:px-8 pt-6">
        <h2 className="text-2xl sm:text-3xl font-bold mb-1">Chat with Trainer</h2>
        <p className="text-gray-500 text-sm mb-4">Ask questions or get support from your trainer</p>
      </div>
      <div className="mx-4 sm:mx-8 bg-dark-card border border-dark-border rounded-xl overflow-hidden" style={{ height: 'calc(100% - 80px)' }}>
        <Chat messages={messages} onSend={handleSend} onSendImage={handleSendImage} pollMessages={loadMessages} />
      </div>
    </div>
  )
}

export default function Dashboard({ formData, goToStep, reloadProfile, updateFormData }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)

  const handleSignOut = () => {
    signOut()
  }

  const getTab = () => {
    if (location.pathname === '/dashboard/training') return 'training'
    if (location.pathname === '/dashboard/chat') return 'chat'
    return 'profile'
  }
  const [activeTab, setActiveTab] = useState(getTab)
  const [unreadCount, setUnreadCount] = useState(0)
  const [programNotif, setProgramNotif] = useState(false)

  // Poll program update notification and auto-reload when detected
  useEffect(() => {
    const checkProgram = () => {
      api.getProgramUpdated().then(d => {
        if (d.programUpdated) {
          // Program updated — reload profile to get latest data
          if (reloadProfile) reloadProfile()
          if (activeTab === 'training') {
            api.markProgramSeen().catch(() => {})
          } else {
            setProgramNotif(true)
          }
        }
      }).catch(() => {})
    }
    checkProgram()
    const interval = setInterval(checkProgram, 5000)
    return () => clearInterval(interval)
  }, [activeTab, reloadProfile])

  // Mark as seen when switching to training tab
  useEffect(() => {
    if (activeTab === 'training') {
      api.markProgramSeen().then(() => setProgramNotif(false)).catch(() => {})
      if (reloadProfile) reloadProfile()
    }
  }, [activeTab])

  // Poll unread count — skip when on chat tab
  useEffect(() => {
    const loadUnread = () => {
      if (activeTab === 'chat') {
        api.markChatRead().catch(() => {})
        setUnreadCount(0)
        return
      }
      api.getUnreadCount().then(d => setUnreadCount(d.unread || 0)).catch(() => {})
    }
    loadUnread()
    const interval = setInterval(loadUnread, 3000)
    return () => clearInterval(interval)
  }, [activeTab])

  // Mark as read immediately when entering chat tab
  useEffect(() => {
    if (activeTab === 'chat') {
      api.markChatRead().then(() => setUnreadCount(0)).catch(() => {})
    }
  }, [activeTab])

  useEffect(() => {
    setActiveTab(getTab())
  }, [location.pathname])

  const switchTab = (tab) => {
    setActiveTab(tab)
    const paths = { training: '/dashboard/training', profile: '/dashboard/profile', chat: '/dashboard/chat' }
    navigate(paths[tab] || '/dashboard/profile')
  }

  return (
    <div className="min-h-screen bg-dark pb-24">
      <div className="bg-dark-card border-b border-dark-border px-4 sm:px-8 py-4 sm:py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/furylogo.png" alt="Sina Fury" className="h-10 sm:h-12" />
            <div>
              <p className="text-gray-500 text-sm">Welcome back,</p>
              <h2 className="text-xl sm:text-2xl font-bold">
                {formData.firstName || 'User'} {formData.lastName}
              </h2>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-neon/15 flex items-center justify-center hover:bg-neon/25 transition-colors cursor-pointer"
            >
              <User size={20} className="text-neon" />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-52 bg-dark-card border border-dark-border rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-dark-border">
                    <p className="text-sm font-semibold truncate">{formData.firstName} {formData.lastName}</p>
                    <p className="text-xs text-gray-500 truncate">{formData.email}</p>
                  </div>
                  <button
                    onClick={() => { setShowUserMenu(false); setShowChangePassword(true) }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-dark-surface transition-colors cursor-pointer"
                  >
                    <Lock size={15} /> Change Password
                  </button>
                  <button
                    onClick={() => { setShowUserMenu(false); setShowDeleteAccount(true) }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 size={15} /> Delete Account
                  </button>
                  <div className="border-t border-dark-border" />
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:bg-dark-surface transition-colors cursor-pointer"
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {activeTab === 'training' && <TrainingPage formData={formData} goToStep={goToStep} reloadProfile={reloadProfile} />}
      {activeTab === 'profile' && <ProfilePage formData={formData} goToStep={goToStep} updateFormData={updateFormData} reloadProfile={reloadProfile} />}
      {activeTab === 'chat' && <ChatPage />}

      <div className="fixed bottom-0 left-0 right-0 bg-dark-card border-t border-dark-border">
        <div className="max-w-5xl mx-auto flex justify-around items-center py-3 sm:py-4">
          <button
            onClick={() => switchTab('training')}
            className={`flex flex-col items-center gap-1 transition-colors cursor-pointer relative ${
              activeTab === 'training' ? 'text-neon' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <div className="relative">
              <LayoutDashboard size={20} />
              {programNotif && (
                <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                  NEW
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-xs">TRAINING</span>
          </button>
          <button
            onClick={() => switchTab('chat')}
            className={`flex flex-col items-center gap-1 transition-colors cursor-pointer relative ${
              activeTab === 'chat' ? 'text-neon' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <div className="relative">
              <MessageCircle size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-xs">CHAT</span>
          </button>
          <button
            onClick={() => switchTab('profile')}
            className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
              activeTab === 'profile' ? 'text-neon' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <UserCircle size={20} />
            <span className="text-[10px] sm:text-xs">PROFILE</span>
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}

      {/* Delete Account Modal */}
      {showDeleteAccount && (
        <DeleteAccountModal
          name={`${formData.firstName} ${formData.lastName}`}
          onClose={() => setShowDeleteAccount(false)}
          onDelete={() => {
            api.deleteAccount().then(() => {
              signOut()
            }).catch(() => {})
          }}
        />
      )}
    </div>
  )
}

function ChangePasswordModal({ onClose }) {
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    setError('')
    if (!currentPw || !newPw || !confirmPw) { setError('All fields are required'); return }
    if (newPw.length < 6) { setError('New password must be at least 6 characters'); return }
    if (newPw !== confirmPw) { setError('New passwords do not match'); return }

    setSaving(true)
    try {
      await api.changePassword(currentPw, newPw)
      setSuccess(true)
      setTimeout(onClose, 1500)
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-dark-card border border-dark-border rounded-2xl p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white cursor-pointer">
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-neon/15 flex items-center justify-center">
            <Lock size={18} className="text-neon" />
          </div>
          <h3 className="text-lg font-bold">Change Password</h3>
        </div>

        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">Password changed successfully!</div>}

        <div className="space-y-3">
          <div className="relative">
            <input type={showCurrent ? 'text' : 'password'} placeholder="Current password" value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-3 pr-10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-neon" />
            <button onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer">
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="relative">
            <input type={showNew ? 'text' : 'password'} placeholder="New password" value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-3 pr-10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-neon" />
            <button onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer">
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <input type="password" placeholder="Confirm new password" value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-neon" />
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-dark-border text-gray-400 rounded-xl hover:bg-dark-surface transition-colors cursor-pointer text-sm">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 bg-neon text-black rounded-xl hover:bg-neon-dark transition-colors cursor-pointer text-sm font-bold disabled:opacity-50">
            {saving ? 'Saving...' : 'Change'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteAccountModal({ name, onClose, onDelete }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-dark-card border border-dark-border rounded-2xl p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-red-400 mb-2">Delete Account</h3>
        <p className="text-gray-400 text-sm mb-6">
          This will permanently delete your account and all data. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-dark-border text-gray-400 rounded-xl hover:bg-dark-surface transition-colors cursor-pointer text-sm">
            Cancel
          </button>
          <button onClick={onDelete}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors cursor-pointer text-sm font-bold">
            Delete Forever
          </button>
        </div>
      </div>
    </div>
  )
}
