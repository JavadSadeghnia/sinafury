import { useState } from 'react'
import NavButtons from '../components/NavButtons'
import { Coffee, Moon, Activity, Heart, AlertCircle } from 'lucide-react'

const activityLevels = [
  { id: 'sedentary', label: 'Sedentary', desc: 'Mostly sitting' },
  { id: 'lightly-active', label: 'Lightly Active', desc: 'Light exercise 1–3 days/week' },
  { id: 'moderately-active', label: 'Moderately Active', desc: 'Moderate exercise 3–5 days/week' },
  { id: 'very-active', label: 'Very Active', desc: 'Hard exercise 6–7 days/week' },
]

const diseases = [
  'Asthma', 'High Blood Pressure', 'Low Blood Pressure', 'Back Condition',
  'Allergies', 'Joint Pain', 'Bursitis', 'Heart Condition',
  'Hemorrhoids', 'Ulcers', 'Nervous Tension', 'Sinus',
  'Hernia', 'Epilepsy', 'Shortness of Breath', 'Diabetes',
  'Arthritis', 'Fatigue',
]

function YesNo({ value, onChange }) {
  return (
    <div className="flex gap-3">
      {['yes', 'no'].map((opt) => (
        <button key={opt} onClick={() => onChange(opt)}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            value === opt
              ? 'bg-neon text-black'
              : 'bg-dark-surface border border-dark-border text-gray-400 hover:border-gray-500'
          }`}>
          {opt === 'yes' ? 'Yes' : 'No'}
        </button>
      ))}
    </div>
  )
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={18} className="text-neon shrink-0" />
        <h3 className="text-neon font-bold uppercase tracking-wider" style={{ fontSize: 'clamp(0.7rem, 1.2vw, 0.85rem)' }}>
          {title}
        </h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

function Field({ label, children, required }) {
  return (
    <div>
      <label className="text-sm text-gray-300 block mb-2">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass = "w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-neon"
const textareaClass = inputClass + " resize-none"

export default function Information({ formData, updateFormData, next, back }) {
  const info = formData.lifestyleInfo || {}

  const update = (key, value) => {
    updateFormData({ lifestyleInfo: { ...info, [key]: value } })
  }

  const toggleDisease = (disease) => {
    const current = info.diseases || []
    const updated = current.includes(disease)
      ? current.filter((d) => d !== disease)
      : [...current, disease]
    update('diseases', updated)
  }

  const isComplete =
    info.onDiet &&
    info.sleepHours &&
    info.activityLevel &&
    info.hasLimitations &&
    (info.hasLimitations === 'no' || info.limitations?.trim()) &&
    info.onMedication &&
    (info.onMedication === 'no' || info.medication?.trim()) &&
    info.hasHealthConditions &&
    (info.hasHealthConditions === 'no' || info.healthConditions?.trim())

  return (
    <div className="h-full flex flex-col px-[5vw] py-[1vh]">
      <div className="shrink-0 text-center mb-[2vh]">
        <h2 className="font-bold" style={{ fontSize: 'clamp(1.3rem, 3vw, 2rem)' }}>
          Information
        </h2>
        <p className="text-gray-500" style={{ fontSize: 'clamp(0.75rem, 1.5vw, 1rem)' }}>
          Help us understand your lifestyle and health
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-auto w-full max-w-2xl mx-auto pb-4">
        {/* Lifestyle */}
        <Section title="Lifestyle Information" icon={Coffee}>
          <Field label="Are you currently on a diet?" required>
            <YesNo value={info.onDiet} onChange={(v) => update('onDiet', v)} />
          </Field>

          <Field label="What are your eating habits?">
            <textarea rows={2} placeholder="Describe your typical daily meals..."
              value={info.eatingHabits || ''} onChange={(e) => update('eatingHabits', e.target.value)}
              className={textareaClass} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Cigarette packs (daily)">
              <input type="number" placeholder="0" value={info.cigarettes || ''}
                onChange={(e) => update('cigarettes', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Cups of coffee/tea (daily)">
              <input type="number" placeholder="0" value={info.coffeeTea || ''}
                onChange={(e) => update('coffeeTea', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Alcoholic drinks (daily)">
              <input type="number" placeholder="0" value={info.alcohol || ''}
                onChange={(e) => update('alcohol', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Soft drinks (daily)">
              <input type="number" placeholder="0" value={info.softDrinks || ''}
                onChange={(e) => update('softDrinks', e.target.value)} className={inputClass} />
            </Field>
          </div>

          <Field label="Hours of sleep per night (average)" required>
            <input type="number" placeholder="7" value={info.sleepHours || ''}
              onChange={(e) => update('sleepHours', e.target.value)} className={inputClass} />
          </Field>

          <Field label="Daily activity level" required>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activityLevels.map(({ id, label, desc }) => (
                <button key={id} onClick={() => update('activityLevel', id)}
                  className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    info.activityLevel === id
                      ? 'border-neon bg-neon/10 text-neon'
                      : 'border-dark-border bg-dark-surface text-gray-400 hover:border-gray-500'
                  }`}>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </Field>
        </Section>

        {/* Additional */}
        <Section title="Additional Information" icon={Activity}>
          <Field label="Are there any specific exercises or activities you enjoy?">
            <textarea rows={2} placeholder="e.g., swimming, running, yoga..."
              value={info.enjoyedExercises || ''} onChange={(e) => update('enjoyedExercises', e.target.value)}
              className={textareaClass} />
          </Field>

          <Field label="Do you have any physical limitations or discomforts during exercise?" required>
            <YesNo value={info.hasLimitations} onChange={(v) => update('hasLimitations', v)} />
          </Field>

          {info.hasLimitations === 'yes' && (
            <Field label="Please specify your limitations:" required>
              <textarea rows={2} placeholder="Describe any limitations..."
                value={info.limitations || ''} onChange={(e) => update('limitations', e.target.value)}
                className={textareaClass} />
            </Field>
          )}
        </Section>

        {/* Health */}
        <Section title="Health Information" icon={Heart}>
          <Field label="Are you currently on any medication that may affect your training?" required>
            <YesNo value={info.onMedication} onChange={(v) => update('onMedication', v)} />
          </Field>

          {info.onMedication === 'yes' && (
            <Field label="Please specify your medication:" required>
              <textarea rows={2} placeholder="List medications..."
                value={info.medication || ''} onChange={(e) => update('medication', e.target.value)}
                className={textareaClass} />
            </Field>
          )}

          <Field label="Indicate any diseases or illnesses you have had or currently have:">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {diseases.map((disease) => {
                const selected = (info.diseases || []).includes(disease)
                return (
                  <button key={disease} onClick={() => toggleDisease(disease)}
                    className={`text-left px-3 py-2 rounded-lg border text-xs transition-all cursor-pointer ${
                      selected
                        ? 'border-neon bg-neon/10 text-neon'
                        : 'border-dark-border bg-dark-surface text-gray-400 hover:border-gray-500'
                    }`}>
                    {selected ? '✓ ' : ''}{disease}
                  </button>
                )
              })}
            </div>
            <div className="mt-2">
              <input type="text" placeholder="Others (specify)..."
                value={info.otherDiseases || ''} onChange={(e) => update('otherDiseases', e.target.value)}
                className={inputClass} />
            </div>
          </Field>

          <Field label="Do you have any existing health conditions (e.g., heart issues, diabetes, injuries)?" required>
            <YesNo value={info.hasHealthConditions} onChange={(v) => update('hasHealthConditions', v)} />
          </Field>

          {info.hasHealthConditions === 'yes' && (
            <Field label="Please specify your health conditions:" required>
              <textarea rows={2} placeholder="Describe conditions..."
                value={info.healthConditions || ''} onChange={(e) => update('healthConditions', e.target.value)}
                className={textareaClass} />
            </Field>
          )}
        </Section>
      </div>

      <div className="shrink-0 max-w-md mx-auto w-full">
        <NavButtons onNext={next} onBack={back} disableNext={!isComplete} />
      </div>
    </div>
  )
}
