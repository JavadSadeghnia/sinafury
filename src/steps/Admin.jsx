import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import BodyMap from '../components/BodyMap'
import Chat from '../components/Chat'
import Countdown, { MS_PER_DAY } from '../components/Countdown'
import PlanTabs from '../components/PlanTabs'
import {
  Users, User, Mail, Ruler, Weight, Target, Activity, Calendar,
  Package, ArrowLeft, X, Save, Plus, Trash2, LogOut, ChevronRight, ChevronLeft,
  Clock, Dumbbell, Image, Heart,
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

// ============ Admin Login ============
function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async () => {
    setError('')
    try {
      const data = await api.adminSignIn(username, password)
      onLogin(data.user)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center px-[5vw] bg-dark text-white">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <img src="/furylogo.png" alt="Sina Fury" className="h-[8vh]" />
        </div>
        <h2 className="text-2xl font-bold text-center mb-1">Admin Panel</h2>
        <p className="text-gray-500 text-center mb-8 text-sm">Trainer access only</p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-dark-card border border-dark-border rounded-xl px-5 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full bg-dark-card border border-dark-border rounded-xl px-5 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon"
          />
        </div>

        <button onClick={handleSubmit}
          className="w-full mt-6 py-3 bg-neon text-black font-bold rounded-xl hover:bg-neon-dark transition-colors cursor-pointer">
          SIGN IN
        </button>

        <button onClick={() => navigate('/')}
          className="w-full mt-3 py-3 border border-dark-border text-gray-400 rounded-xl hover:bg-dark-card transition-colors flex items-center justify-center gap-2 cursor-pointer">
          <ArrowLeft size={16} /> Back to Site
        </button>
      </div>
    </div>
  )
}

// ============ User List ============
function UserList({ users, onSelectUser, unreadMap = {} }) {
  return (
    <div className="space-y-3">
      {users.map((u) => {
        const unread = unreadMap[u.id] || 0
        const isNew = !u.viewed_by_admin
        const isEdited = !!u.profile_edited
        const isExtending = !!u.extend_pending
        return (
          <div
            key={u.id}
            onClick={() => onSelectUser(u.id)}
            className={`border border-dark-border rounded-xl p-4 flex items-center justify-between hover:border-neon/30 transition-colors cursor-pointer group ${
              isExtending ? 'bg-blue-500/5' : isNew ? 'bg-neon/5' : isEdited ? 'bg-red-500/5' : 'bg-dark-card'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-neon/15 flex items-center justify-center relative">
                <User size={18} className="text-neon" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{u.first_name} {u.last_name}</p>
                  {isExtending && (
                    <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full animate-beat">EXTEND</span>
                  )}
                  {isNew && !isExtending && (
                    <span className="text-[10px] font-bold bg-neon text-black px-2 py-0.5 rounded-full animate-beat">NEW</span>
                  )}
                  {!isNew && !isExtending && isEdited && (
                    <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full animate-beat">EDITED</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{u.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded-full ${
                u.onboarding_complete
                  ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                  : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
              }`}>
                {u.onboarding_complete ? 'Complete' : 'Pending'}
              </span>
              <ChevronRight size={18} className="text-gray-600 group-hover:text-neon transition-colors" />
            </div>
          </div>
        )
      })}
      {users.length === 0 && (
        <div className="text-center text-gray-500 py-12">No users registered yet</div>
      )}
    </div>
  )
}

// ============ User Detail ============
function UserDetail({ userId, onBack, unreadCount = 0 }) {
  const [profile, setProfile] = useState(null)
  const [archivedCycles, setArchivedCycles] = useState([])
  const [programTabIndex, setProgramTabIndex] = useState(-1)
  const [countdownTabIndex, setCountdownTabIndex] = useState(-1)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('info')
  const [program, setProgram] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [, setTick] = useState(0)

  // Tick every second so "Future Plan" label flips to "Current Plan" when previous ends
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    loadUser()
    const interval = setInterval(() => {
      api.adminGetUser(userId).then(({ profile: p }) => {
        setProfile(p)
      }).catch(() => {})
    }, 5000)
    return () => clearInterval(interval)
  }, [userId])

  // Clear edited sections for the tab being left
  const prevTabRef = useRef(tab)
  useEffect(() => {
    const infoSections = ['FirstName', 'LastName', 'Gender', 'Height', 'Weight', 'Age', 'Lifestyle & Health', 'Goals', 'Muscle Focus', 'Training Schedule', 'Package']
    const sectionsByTab = {
      info: infoSections,
      photos: ['Photos', 'Photo_Front', 'Photo_Back', 'Photo_Side', 'Photo_Payment'],
      program: ['Program'],
    }
    const prevTab = prevTabRef.current
    if (prevTab !== tab) {
      const toClear = sectionsByTab[prevTab]
      if (toClear && profile?.edited_sections?.some(s => toClear.includes(s))) {
        api.adminClearEdited(userId, toClear).then(() => {
          setProfile(prev => ({
            ...prev,
            edited_sections: (prev?.edited_sections || []).filter(s => !toClear.includes(s)),
          }))
        }).catch(() => {})
      }
      prevTabRef.current = tab
    }
  }, [tab])

  const loadUser = async () => {
    setLoading(true)
    try {
      const { profile: p } = await api.adminGetUser(userId)
      setProfile(p)
      try {
        const c = await api.adminGetCycles(userId)
        setArchivedCycles(c.cycles || [])
      } catch {}
      if (p.training_program) {
        const prog = p.training_program.map((row, i) => ({
          ...row,
          day: `Day ${i + 1}`,
          weeks: row.weeks?.length >= 4 ? row.weeks : Array.from({ length: 4 }, (_, w) => row.weeks?.[w] || row.weeks?.[0] || { label: '', description: '' }),
        }))
        setProgram(prog)
      } else {
        const count = p.training_days?.length || 3
        setProgram(Array.from({ length: count }, (_, i) => ({
          day: `Day ${i + 1}`,
          weeks: Array.from({ length: 4 }, () => ({ label: '', description: '' })),
        })))
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const updateCell = (dayIdx, weekIdx, field, value) => {
    setProgram((prev) => {
      const updated = [...prev]
      updated[dayIdx] = { ...updated[dayIdx], weeks: [...updated[dayIdx].weeks] }
      updated[dayIdx].weeks[weekIdx] = { ...updated[dayIdx].weeks[weekIdx], [field]: value }
      return updated
    })
    setSaved(false)
  }

  const saveProgram = async (programData) => {
    const dataToSave = programData || program
    setSaving(true)
    try {
      await api.adminSetProgram(userId, dataToSave)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-neon border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) return <div className="text-gray-500 text-center py-20">User not found</div>

  const handleDelete = async () => {
    try {
      await api.adminDeleteUser(userId)
      onBack()
    } catch (err) {
      console.error(err)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never'
    const d = new Date(dateStr + 'Z')
    return d.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack}
            className="p-2 border border-dark-border rounded-lg hover:border-neon/50 transition-colors cursor-pointer">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-xl font-bold">{profile.first_name} {profile.last_name}</h2>
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-500">{profile.email}</p>
              <span className="text-[10px] text-gray-600">·</span>
              <p className="text-xs text-gray-600 flex items-center gap-1">
                <Clock size={10} /> Last login: {formatDate(profile.last_login)}
              </p>
            </div>
          </div>
        </div>
        <button onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-2 px-3 py-2 border border-red-500/30 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer">
          <Trash2 size={14} />
          <span className="hidden sm:inline">Delete</span>
        </button>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-dark-card border border-dark-border rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">Delete User?</h3>
            <p className="text-gray-400 text-sm mb-6">
              This will permanently delete <span className="text-white font-medium">{profile.first_name} {profile.last_name}</span> and all their data including photos, messages, and training program. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 border border-dark-border text-gray-400 rounded-xl hover:bg-dark-surface transition-colors cursor-pointer text-sm">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors cursor-pointer text-sm font-bold">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {(() => {
        const infoPending = !profile.height || !profile.weight || !profile.age ||
          !profile.goals?.length || !profile.selected_package || !profile.muscle_focus?.length ||
          !profile.training_days?.length ||
          !profile.lifestyle_info || Object.keys(profile.lifestyle_info).length === 0
        const photosPending = !profile.photo_front_path || !profile.photo_back_path ||
          !profile.photo_side_path || !profile.payment_proof_path
        const tabPending = { info: infoPending, photos: photosPending }

        const infoEdited = (profile.edited_sections || []).some(s => ['FirstName', 'LastName', 'Gender', 'Height', 'Weight', 'Age', 'Lifestyle & Health', 'Goals', 'Muscle Focus', 'Training Schedule', 'Package'].includes(s))
        const photosEdited = (profile.edited_sections || []).includes('Photos')
        const programEdited = (profile.edited_sections || []).includes('Program')
        const tabEdited = { info: infoEdited, photos: photosEdited, program: programEdited }

        return (
          <div className="flex gap-1 bg-dark-surface rounded-xl p-1 mb-6">
            {['info', 'photos', 'program', 'chat'].map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all cursor-pointer relative ${
                  tab === t ? 'bg-neon text-black' : 'text-gray-400 hover:text-white'
                }`}>
                {t === 'program' ? 'Program' : t}
                {t === 'chat' && unreadCount > 0 && tab !== 'chat' && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                {tabEdited[t] && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center animate-beat">
                    ✎
                  </span>
                )}
                {!tabEdited[t] && tabPending[t] && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-yellow-500 text-black text-[8px] font-bold rounded-full flex items-center justify-center px-0.5">
                    !
                  </span>
                )}
              </button>
            ))}
          </div>
        )
      })()}

      {/* Info Tab */}
      {tab === 'info' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoCard icon={User} label="Gender" value={profile.gender} edited={(profile.edited_sections || []).includes('Gender')} />
            <InfoCard icon={Ruler} label="Height" value={profile.height ? `${profile.height} cm` : null} edited={(profile.edited_sections || []).includes('Height')} />
            <InfoCard icon={Weight} label="Weight" value={profile.weight ? `${profile.weight} kg` : null} edited={(profile.edited_sections || []).includes('Weight')} />
            <InfoCard icon={Clock} label="Age" value={profile.age || null} edited={(profile.edited_sections || []).includes('Age')} />
            <InfoCard icon={Target} label="Goals"
              value={profile.goals?.length > 0 ? profile.goals.map((g) => goalLabels[g] || g).join(', ') : null} edited={(profile.edited_sections || []).includes('Goals')} />
            <InfoCard icon={Calendar} label="Training Days"
              value={profile.training_days?.length > 0 ? `${profile.training_days.length} days/week` : null} edited={(profile.edited_sections || []).includes('Training Schedule')} />
          </div>

          {/* Package + Program Countdown — combined per cycle */}
          {(() => {
            const lastArch = archivedCycles[archivedCycles.length - 1]
            const previousPlanEnded = (() => {
              if (!lastArch?.program_start_date) return true
              const prevStart = new Date(lastArch.program_start_date.replace(' ', 'T') + 'Z')
              const prevEnd = new Date(prevStart.getTime() + (lastArch.program_duration_days || 28) * MS_PER_DAY)
              return new Date() >= prevEnd
            })()
            const currentIsFuture = profile.program_start_date
              ? new Date(profile.program_start_date.replace(' ', 'T') + 'Z') > new Date() && !previousPlanEnded
              : false
            const currentCycle = (profile.selected_package || profile.program_start_date) ? {
              cycle_number: 'current',
              selected_package: profile.selected_package,
              program_start_date: profile.program_start_date,
              program_duration_days: profile.program_duration_days || 28,
              isCurrent: true,
              isFuture: currentIsFuture,
            } : null
            const archivedWithExtended = archivedCycles.map((c, i, arr) => ({
              ...c,
              wasExtended: i < arr.length - 1 || !!currentCycle,
            }))
            const allCycles = [...archivedWithExtended, ...(currentCycle ? [currentCycle] : [])]
            if (allCycles.length === 0) return null
            const lastIdx = allCycles.length - 1
            // Default to previous plan when current is pending future start
            const defaultIdx = (currentIsFuture && allCycles.length > 1) ? lastIdx - 1 : lastIdx
            const safeIdx = countdownTabIndex < 0 ? defaultIdx : Math.min(countdownTabIndex, lastIdx)
            const active = allCycles[safeIdx]
            return (
              <div className={`bg-dark-card border rounded-xl p-5 mt-4 relative ${active.isCurrent && (profile.edited_sections || []).includes('Package') ? 'border-red-500/40' : 'border-dark-border'}`}>
                {active.isCurrent && (profile.edited_sections || []).includes('Package') && (
                  <span className="absolute -top-2 right-2 text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">EDITED</span>
                )}
                <PlanTabs cycles={allCycles} activeIndex={safeIdx} onSelect={setCountdownTabIndex} />
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Package size={18} className="text-neon" />
                      <h3 className="font-bold">Package</h3>
                    </div>
                    {active.selected_package ? (
                      <p className="text-sm font-medium mb-3">{packageLabels[active.selected_package]}</p>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 mb-3 inline-block">Pending</span>
                    )}
                    {active.program_start_date && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Clock size={12} />
                        <span>Started on {new Date(active.program_start_date.replace(' ', 'T') + 'Z').toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  {active.program_start_date && (
                    <Countdown
                      startDate={active.program_start_date}
                      durationDays={active.program_duration_days || 28}
                      size={70}
                      wasExtended={!!active.wasExtended}
                      previousPlanEnded={active.isCurrent ? previousPlanEnded : false}
                    />
                  )}
                </div>
              </div>
            )
          })()}

          <div className={`bg-dark-card border rounded-xl p-5 mt-4 relative ${(profile.edited_sections || []).includes('Muscle Focus') ? 'border-red-500/40' : 'border-dark-border'}`}>
            {(profile.edited_sections || []).includes('Muscle Focus') && (
              <span className="absolute -top-2 right-2 text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">EDITED</span>
            )}
            <div className="flex items-center gap-3 mb-3">
              <Activity size={18} className="text-neon" />
              <h3 className="font-bold">Muscle Focus</h3>
            </div>
            {profile.muscle_focus?.length > 0 ? (
              <div className="flex gap-4 justify-center">
                <div className="max-w-[130px]">
                  <p className="text-[10px] text-gray-500 text-center mb-1">FRONT</p>
                  <BodyMap view="front" selectedMuscles={profile.muscle_focus} onToggleMuscle={() => {}} readOnly />
                </div>
                <div className="max-w-[130px]">
                  <p className="text-[10px] text-gray-500 text-center mb-1">BACK</p>
                  <BodyMap view="back" selectedMuscles={profile.muscle_focus} onToggleMuscle={() => {}} readOnly />
                </div>
              </div>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">Pending</span>
            )}
          </div>

          {/* Lifestyle & Health Info */}
          <div className={`bg-dark-card border rounded-xl p-5 mt-4 relative ${(profile.edited_sections || []).includes('Lifestyle & Health') ? 'border-red-500/40' : 'border-dark-border'}`}>
            {(profile.edited_sections || []).includes('Lifestyle & Health') && (
              <span className="absolute -top-2 right-2 text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">EDITED</span>
            )}
            <div className="flex items-center gap-3 mb-4">
              <Heart size={18} className="text-neon" />
              <h3 className="font-bold">Lifestyle & Health</h3>
            </div>
            {profile.lifestyle_info && Object.keys(profile.lifestyle_info).length > 0 ? (
              <LifestyleInfoCard info={profile.lifestyle_info} inline />
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">Pending</span>
            )}
          </div>
        </>
      )}

      {/* Photos Tab */}
      {tab === 'photos' && (
        <PhotosTab profile={profile} />
      )}

      {/* Program Tab */}
      {tab === 'program' && (() => {
        const currentPlan = (program && program.length > 0) ? {
          cycle_number: 'current',
          training_program: program,
          completed_days: profile.completed_days || {},
          isCurrent: true,
        } : null
        const allCycles = [...archivedCycles, ...(currentPlan ? [currentPlan] : [])]
        const lastIdx = Math.max(0, allCycles.length - 1)
        const safeIdx = programTabIndex < 0 ? lastIdx : Math.min(programTabIndex, lastIdx)
        const active = allCycles[safeIdx]
        const isViewingCurrent = active?.isCurrent

        return (
          <>
            <PlanTabs cycles={allCycles} activeIndex={safeIdx} onSelect={setProgramTabIndex} />
            {isViewingCurrent ? (
              <ProgramEditor
                profile={profile}
                program={program}
                updateCell={updateCell}
                saveProgram={saveProgram}
                completedDays={profile.completed_days || {}}
              />
            ) : active ? (
              <ProgramEditor
                profile={profile}
                program={active.training_program || []}
                updateCell={() => {}}
                saveProgram={() => {}}
                completedDays={active.completed_days || {}}
                readOnly
              />
            ) : null}
          </>
        )
      })()}

      {tab === 'chat' && (
        <AdminChat userId={userId} userName={profile.first_name} />
      )}
    </div>
  )
}

// ============ Admin Chat ============
function AdminChat({ userId, userName }) {
  const [messages, setMessages] = useState([])

  const loadMessages = async () => {
    try {
      const data = await api.adminGetChat(userId)
      setMessages(data.messages || [])
    } catch {}
  }

  useEffect(() => {
    loadMessages()
    api.adminMarkChatRead(userId).catch(() => {})
    // Keep marking as read while chat is open
    const interval = setInterval(() => {
      api.adminMarkChatRead(userId).catch(() => {})
    }, 3000)
    return () => clearInterval(interval)
  }, [userId])

  const handleSend = async (text) => {
    try {
      await api.adminSendChat(userId, text)
      loadMessages()
    } catch {}
  }

  const handleSendImage = async (file) => {
    try {
      await api.adminSendChatImage(userId, file)
      loadMessages()
    } catch {}
  }

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden" style={{ height: '500px' }}>
      <Chat messages={messages} onSend={handleSend} onSendImage={handleSendImage} isAdmin pollMessages={loadMessages} />
    </div>
  )
}

// ============ Photos Tab with Lightbox ============
function PhotosTab({ profile }) {
  const [lightbox, setLightbox] = useState(null)
  const es = profile.edited_sections || []

  const photos = [
    { label: 'Front', path: profile.photo_front_path, tag: 'Photo_Front' },
    { label: 'Back', path: profile.photo_back_path, tag: 'Photo_Back' },
    { label: 'Side', path: profile.photo_side_path, tag: 'Photo_Side' },
  ]

  const allPhotos = [
    ...photos,
    ...(profile.payment_proof_path ? [{ label: 'Payment Proof', path: profile.payment_proof_path }] : []),
  ].filter((p) => p.path)

  const currentIndex = lightbox ? allPhotos.findIndex((p) => p.path === lightbox.path) : -1

  const goNext = () => {
    if (currentIndex < allPhotos.length - 1) setLightbox(allPhotos[currentIndex + 1])
  }
  const goPrev = () => {
    if (currentIndex > 0) setLightbox(allPhotos[currentIndex - 1])
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {photos.map(({ label, path, tag }) => {
          const edited = es.includes(tag)
          return (
            <div key={label} className="flex flex-col items-center gap-2">
              <span className="text-xs text-gray-500 uppercase font-semibold">{label}</span>
              {path ? (
                <div className={`relative w-full rounded-xl border-2 ${edited ? 'border-red-500/60' : 'border-dark-border'}`}>
                  {edited && (
                    <span className="absolute -top-2 right-2 text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full z-10">EDITED</span>
                  )}
                  <img src={api.getFileUrl(path)} alt={label}
                    onClick={() => setLightbox({ label, path })}
                    className="w-full aspect-[3/4] object-cover rounded-lg cursor-pointer hover:opacity-90 transition-all" />
                </div>
              ) : (
                <div className="w-full aspect-[3/4] rounded-xl bg-dark-card border border-dark-border flex flex-col items-center justify-center gap-2">
                  <Image size={24} className="text-gray-600" />
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">Pending</span>
                </div>
              )}
            </div>
          )
        })}
        <div className="sm:col-span-3">
          <span className="text-xs text-gray-500 uppercase font-semibold block mb-2">Payment Proof</span>
          {profile.payment_proof_path ? (
            <div className={`relative inline-block rounded-xl border-2 ${es.includes('Photo_Payment') ? 'border-red-500/60' : 'border-dark-border'}`}>
              {es.includes('Photo_Payment') && (
                <span className="absolute -top-2 right-2 text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full z-10">EDITED</span>
              )}
              <img src={api.getFileUrl(profile.payment_proof_path)} alt="Payment"
                onClick={() => setLightbox({ label: 'Payment Proof', path: profile.payment_proof_path })}
                className="max-h-[300px] object-contain rounded-lg cursor-pointer hover:opacity-90 transition-all" />
            </div>
          ) : (
            <div className="w-full h-32 rounded-xl bg-dark-card border border-dark-border flex flex-col items-center justify-center gap-2">
              <Image size={24} className="text-gray-600" />
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">Pending</span>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
          <div className="relative z-10 max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between w-full mb-4">
              <span className="text-white font-semibold text-sm">{lightbox.label}</span>
              <button onClick={() => setLightbox(null)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                <X size={24} />
              </button>
            </div>

            {/* Image */}
            <div className="relative flex items-center justify-center w-full">
              {currentIndex > 0 && (
                <button onClick={goPrev}
                  className="absolute left-2 z-10 w-10 h-10 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors cursor-pointer">
                  <ChevronLeft size={22} />
                </button>
              )}

              <img src={api.getFileUrl(lightbox.path)} alt={lightbox.label}
                className="max-h-[80vh] max-w-full object-contain rounded-xl" />

              {currentIndex < allPhotos.length - 1 && (
                <button onClick={goNext}
                  className="absolute right-2 z-10 w-10 h-10 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors cursor-pointer">
                  <ChevronRight size={22} />
                </button>
              )}
            </div>

            {/* Dots */}
            <div className="flex gap-2 mt-4">
              {allPhotos.map((p, i) => (
                <button key={i} onClick={() => setLightbox(p)}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                    i === currentIndex ? 'bg-neon w-6' : 'bg-gray-600'
                  }`} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ============ Program Editor with Modal ============
function ProgramEditor({ profile, program, updateCell, saveProgram, completedDays = {}, readOnly = false }) {
  const [editingCell, setEditingCell] = useState(null)
  const [editLabel, setEditLabel] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [saveFeedback, setSaveFeedback] = useState(false)

  const openEditor = (dayIdx, weekIdx) => {
    const cell = program[dayIdx].weeks[weekIdx]
    setEditLabel(cell.label || '')
    setEditDesc(cell.description || '')
    setEditingCell({ dayIdx, weekIdx, dayName: program[dayIdx].day, weekNum: weekIdx + 1 })
  }

  const buildUpdatedProgram = () => {
    if (!editingCell) return program
    const { dayIdx } = editingCell
    return program.map((row, di) => {
      if (di !== dayIdx) return row
      return {
        ...row,
        // Copy the edited content to ALL weeks for this day
        weeks: row.weeks.map(() => ({ label: editLabel, description: editDesc })),
      }
    })
  }

  const applyCurrent = () => {
    if (!editingCell) return
    const { dayIdx } = editingCell
    // Apply to all weeks for this day
    for (let wi = 0; wi < 4; wi++) {
      updateCell(dayIdx, wi, 'label', editLabel)
      updateCell(dayIdx, wi, 'description', editDesc)
    }
  }

  const saveCell = async () => {
    if (editingCell) {
      const updatedProgram = buildUpdatedProgram()
      applyCurrent()
      setEditingCell(null)
      await saveProgram(updatedProgram)
      setSaveFeedback(true)
      setTimeout(() => setSaveFeedback(false), 2000)
    }
  }

  // Get total cells count for navigation
  const totalDays = program.length
  const navigateCell = async (direction) => {
    if (!editingCell) return
    const updatedProgram = buildUpdatedProgram()
    applyCurrent()

    let { dayIdx } = editingCell
    const weekIdx = 0

    if (direction === 'next') {
      dayIdx++
      if (dayIdx >= totalDays) dayIdx = 0
    } else {
      dayIdx--
      if (dayIdx < 0) dayIdx = totalDays - 1
    }

    // Save in background
    saveProgram(updatedProgram)

    // Open next cell
    const nextCell = program[dayIdx]?.weeks[weekIdx] || { label: '', description: '' }
    setEditLabel(nextCell.label || '')
    setEditDesc(nextCell.description || '')
    setEditingCell({ dayIdx, weekIdx, dayName: program[dayIdx].day, weekNum: weekIdx + 1 })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-400 text-sm">
          Click any cell to edit. Program for <span className="text-white font-medium">{profile.first_name}</span>.
        </p>
        {saveFeedback && (
          <span className="text-green-400 text-xs flex items-center gap-1.5 animate-fadeIn">
            <Save size={12} /> Saved!
          </span>
        )}
      </div>

      <div className="rounded-xl border border-dark-border overflow-hidden">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr>
              <th className="bg-neon text-black font-bold text-xs px-2 py-2 text-center border-r border-neon-dark w-[60px]">
                Day
              </th>
              {[1].map((w) => (
                <th key={w} className="bg-neon text-black font-bold text-center text-xs px-1 py-2">
                  Workout
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {program.map((row, dayIdx) => (
              <tr key={dayIdx} className={dayIdx % 2 === 0 ? 'bg-dark-card' : 'bg-dark-surface'}>
                <td className="px-2 py-3 border-r border-dark-border text-center">
                  <span className="text-xs text-gray-400 font-bold">{row.day}</span>
                </td>
                {(() => {
                  const cell = row.weeks[0] || { label: '', description: '' }
                  const hasContent = cell.label || cell.description
                  return (
                    <td
                      onClick={() => { if (!readOnly) openEditor(dayIdx, 0) }}
                      className="px-2 py-2 cursor-pointer hover:bg-neon/5 transition-colors">
                      {hasContent ? (
                        <div>
                          <p className="text-xs font-semibold text-neon line-clamp-1">{cell.label}</p>
                          {cell.description && (
                            <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{cell.description}</p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-1">
                          <Plus size={14} className="text-gray-600" />
                        </div>
                      )}
                    </td>
                  )
                })()}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setEditingCell(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-[0_0_40px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}>

            <button onClick={() => setEditingCell(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors cursor-pointer">
              <X size={20} />
            </button>

            {/* Navigation + Title */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => navigateCell('prev')}
                className="w-9 h-9 rounded-lg border border-dark-border flex items-center justify-center text-gray-400 hover:text-neon hover:border-neon/50 transition-colors cursor-pointer">
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neon flex items-center justify-center shrink-0">
                  <Dumbbell size={20} className="text-black" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold">{editingCell.dayName}</h3>
                  <p className="text-xs text-gray-500">Set the workout for this day</p>
                </div>
              </div>
              <button onClick={() => navigateCell('next')}
                className="w-9 h-9 rounded-lg border border-dark-border flex items-center justify-center text-gray-400 hover:text-neon hover:border-neon/50 transition-colors cursor-pointer">
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold block mb-2">
                  Workout Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Full-Body Strength I"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  autoFocus
                  className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-neon text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold block mb-2">
                  Description / Details
                </label>
                <textarea
                  placeholder="Describe the exercises, sets, reps, rest times..."
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={5}
                  className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-neon text-sm resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingCell(null)}
                className="flex-1 py-3 border border-dark-border text-gray-400 rounded-xl hover:bg-dark-surface transition-colors cursor-pointer text-sm font-medium">
                Cancel
              </button>
              <button onClick={saveCell}
                className="flex-1 py-3 bg-neon text-black rounded-xl hover:bg-neon-dark transition-colors cursor-pointer text-sm font-bold">
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminPendingSections({ profile }) {
  const pending = []
  if (!profile.height || !profile.weight || !profile.age) pending.push('Physical Profile')
  const info = profile.lifestyle_info || {}
  if (!info.onDiet || !info.sleepHours || !info.activityLevel || !info.hasLimitations || !info.onMedication || !info.hasHealthConditions)
    pending.push('Lifestyle & Health')
  if (!profile.goals?.length) pending.push('Goals')
  if (!profile.photo_front_path || !profile.photo_back_path || !profile.photo_side_path) pending.push('Photos')
  if (!profile.muscle_focus?.length) pending.push('Muscle Focus')
  if (!profile.training_days?.length) pending.push('Training Schedule')
  if (!profile.selected_package) pending.push('Package')
  if (!profile.payment_proof_path) pending.push('Payment')

  if (pending.length === 0) return null

  return (
    <div className="mb-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
      <p className="text-yellow-400 text-xs font-semibold uppercase tracking-wider mb-3">Incomplete Sections</p>
      <div className="flex flex-wrap gap-2">
        {pending.map((label) => (
          <span key={label}
            className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-400">
            {label}
          </span>
        ))}
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

function LifestyleInfoCard({ info, inline = false }) {
  const items = []
  if (info.onDiet) items.push({ label: 'On Diet', value: info.onDiet === 'yes' ? 'Yes' : 'No' })
  if (info.eatingHabits) items.push({ label: 'Eating Habits', value: info.eatingHabits })
  if (info.cigarettes) items.push({ label: 'Cigarettes/day', value: info.cigarettes })
  if (info.coffeeTea) items.push({ label: 'Coffee/Tea/day', value: info.coffeeTea })
  if (info.alcohol) items.push({ label: 'Alcohol/day', value: info.alcohol })
  if (info.softDrinks) items.push({ label: 'Soft Drinks/day', value: info.softDrinks })
  if (info.sleepHours) items.push({ label: 'Sleep Hours', value: `${info.sleepHours} hrs/night` })
  if (info.activityLevel) items.push({ label: 'Activity Level', value: activityLabels[info.activityLevel] || info.activityLevel })
  if (info.enjoyedExercises) items.push({ label: 'Enjoyed Exercises', value: info.enjoyedExercises })
  if (info.hasLimitations === 'yes') items.push({ label: 'Physical Limitations', value: info.limitations || 'Yes' })
  if (info.onMedication === 'yes') items.push({ label: 'Medication', value: info.medication || 'Yes' })
  if (info.diseases?.length > 0) items.push({ label: 'Diseases/Illnesses', value: info.diseases.join(', ') })
  if (info.otherDiseases) items.push({ label: 'Other Diseases', value: info.otherDiseases })
  if (info.hasHealthConditions === 'yes') items.push({ label: 'Health Conditions', value: info.healthConditions || 'Yes' })

  if (items.length === 0) return null

  const content = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
    <div className="bg-dark-card border border-dark-border rounded-xl p-5 mt-4">
      <div className="flex items-center gap-3 mb-4">
        <Heart size={18} className="text-neon" />
        <h3 className="font-bold">Lifestyle & Health</h3>
      </div>
      {content}
    </div>
  )
}

function InfoCard({ icon: Icon, label, value, edited }) {
  return (
    <div className={`bg-dark-card border rounded-xl p-4 flex items-start gap-3 relative ${edited ? 'border-red-500/40' : 'border-dark-border'}`}>
      {edited && (
        <span className="absolute -top-2 right-2 text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">EDITED</span>
      )}
      <Icon size={18} className="text-neon shrink-0 mt-0.5" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        {value ? (
          <p className="text-sm font-medium mt-0.5">{value}</p>
        ) : (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 mt-1 inline-block">Pending</span>
        )}
      </div>
    </div>
  )
}

// ============ Main Admin Page ============
export default function Admin() {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [unreadMap, setUnreadMap] = useState({})
  const navigate = useNavigate()

  const loadUnread = () => {
    if (api.adminHasToken()) {
      api.adminGetUnread().then(d => setUnreadMap(d.unread || {})).catch(() => {})
    }
  }

  useEffect(() => {
    if (api.adminHasToken()) {
      api.adminGetUsers()
        .then((data) => {
          setAdmin({ name: 'Sina Fury' })
          setUsers(data.users)
          loadUnread()
        })
        .catch(() => {
          api.adminSignOut()
          navigate('/signin')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
      navigate('/signin')
    }
  }, [])

  // Poll unread and user list every 5 seconds
  useEffect(() => {
    if (!admin) return
    const poll = () => {
      loadUnread()
      if (!selectedUserId) {
        api.adminGetUsers().then((data) => setUsers(data.users)).catch(() => {})
      }
    }
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [admin, selectedUserId])

  const handleSignOut = () => {
    api.adminSignOut()
    setAdmin(null)
    setSelectedUserId(null)
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-neon border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!admin) return null

  return (
    <div className="min-h-screen bg-dark text-white">
      {/* Header */}
      <div className="bg-dark-card border-b border-dark-border px-4 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/furylogo.png" alt="Sina Fury" className="h-10" />
            <div>
              <p className="text-xs text-gray-500">Admin Panel</p>
              <h2 className="font-bold">Sina Fury</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Users size={16} />
              <span>{users.length} users</span>
            </div>
            <button onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 border border-dark-border rounded-xl text-sm text-gray-400 hover:text-red-400 hover:border-red-400/50 transition-colors cursor-pointer">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6">
        {selectedUserId ? (
          <UserDetail userId={selectedUserId} unreadCount={unreadMap[selectedUserId] || 0} onBack={() => {
            api.adminClearEdited(selectedUserId).catch(() => {})
            setSelectedUserId(null)
            api.adminGetUsers().then((data) => setUsers(data.users)).catch(() => {})
          }} />
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-2">Users</h2>
            <p className="text-gray-500 text-sm mb-6">Click on a user to view details and set their training program</p>
            <UserList users={users} onSelectUser={(id) => {
              setSelectedUserId(id)
              api.adminMarkViewed(id).catch(() => {})
              setUsers(prev => prev.map(u => u.id === id ? { ...u, viewed_by_admin: 1 } : u))
            }} unreadMap={unreadMap} />
          </div>
        )}
      </div>
    </div>
  )
}
