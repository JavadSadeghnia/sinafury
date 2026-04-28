const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const initSqlJs = require('sql.js')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const multer = require('multer')

const app = express()
const PORT = 3005
const JWT_SECRET = 'sinafury_secret_key_change_in_production_2024'
const DB_PATH = path.join(__dirname, 'sinafury.db')

// TEST MODE: 1 day = 10 seconds (set to 86400000 for real days)
const MS_PER_DAY = 5000

let db

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user?.id
    if (!userId) return cb(new Error('Not authenticated'))

    const bucket = req.params.bucket
    const dir = path.join(__dirname, 'uploads', bucket, String(userId))
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg'
    const name = req.params.filename || file.fieldname
    cb(null, name + ext)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only images are allowed'))
  },
})

// Middleware
app.use(cors())
app.use(express.json())

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Auth middleware
function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Not authenticated' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Initialize database
async function initDB() {
  const SQL = await initSqlJs()

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL DEFAULT '',
      last_name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      gender TEXT DEFAULT '',
      height TEXT DEFAULT '',
      weight TEXT DEFAULT '',
      age TEXT DEFAULT '',
      goals TEXT DEFAULT '[]',
      body_view TEXT DEFAULT 'front',
      muscle_focus TEXT DEFAULT '[]',
      training_days TEXT DEFAULT '[]',
      selected_package TEXT,
      photo_front_path TEXT,
      photo_back_path TEXT,
      photo_side_path TEXT,
      payment_proof_path TEXT,
      onboarding_complete INTEGER DEFAULT 0,
      training_program TEXT,
      completed_days TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  // Add columns if they don't exist (migration for existing DBs)
  try { db.exec("SELECT training_program FROM users LIMIT 1") }
  catch { db.run("ALTER TABLE users ADD COLUMN training_program TEXT") }

  try { db.exec("SELECT completed_days FROM users LIMIT 1") }
  catch { db.run("ALTER TABLE users ADD COLUMN completed_days TEXT DEFAULT '{}'") }

  try { db.exec("SELECT viewed_by_admin FROM users LIMIT 1") }
  catch { db.run("ALTER TABLE users ADD COLUMN viewed_by_admin INTEGER DEFAULT 0") }

  try { db.exec("SELECT program_updated FROM users LIMIT 1") }
  catch { db.run("ALTER TABLE users ADD COLUMN program_updated INTEGER DEFAULT 0") }

  try { db.exec("SELECT last_login FROM users LIMIT 1") }
  catch { db.run("ALTER TABLE users ADD COLUMN last_login TEXT") }

  try { db.exec("SELECT lifestyle_info FROM users LIMIT 1") }
  catch { db.run("ALTER TABLE users ADD COLUMN lifestyle_info TEXT DEFAULT '{}'") }

  try { db.exec("SELECT profile_edited FROM users LIMIT 1") }
  catch { db.run("ALTER TABLE users ADD COLUMN profile_edited INTEGER DEFAULT 0") }

  try { db.exec("SELECT edited_sections FROM users LIMIT 1") }
  catch { db.run("ALTER TABLE users ADD COLUMN edited_sections TEXT DEFAULT '[]'") }

  try { db.exec("SELECT program_start_date FROM users LIMIT 1") }
  catch { db.run("ALTER TABLE users ADD COLUMN program_start_date TEXT") }

  try { db.exec("SELECT program_duration_days FROM users LIMIT 1") }
  catch { db.run("ALTER TABLE users ADD COLUMN program_duration_days INTEGER DEFAULT 28") }

  try { db.exec("SELECT reminder_7day_sent FROM users LIMIT 1") }
  catch { db.run("ALTER TABLE users ADD COLUMN reminder_7day_sent INTEGER DEFAULT 0") }

  try { db.exec("SELECT extend_pending FROM users LIMIT 1") }
  catch { db.run("ALTER TABLE users ADD COLUMN extend_pending INTEGER DEFAULT 0") }

  try { db.exec("SELECT pending_start_date FROM users LIMIT 1") }
  catch { db.run("ALTER TABLE users ADD COLUMN pending_start_date TEXT") }

  // Program cycles archive — saves history of past programs
  db.run(`
    CREATE TABLE IF NOT EXISTS program_cycles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      cycle_number INTEGER NOT NULL,
      training_program TEXT,
      training_days TEXT,
      selected_package TEXT,
      payment_proof_path TEXT,
      program_start_date TEXT,
      program_duration_days INTEGER,
      completed_days TEXT,
      archived_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Fix old default training_days for users who never changed it
  db.run("UPDATE users SET training_days = '[]' WHERE training_days = '[\"Mon\",\"Wed\",\"Fri\"]'")

  // Chat messages table
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      sender TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Track last read message per user (for both user and admin side)
  db.run(`
    CREATE TABLE IF NOT EXISTS chat_read (
      user_id INTEGER NOT NULL,
      reader TEXT NOT NULL,
      last_read_id INTEGER DEFAULT 0,
      PRIMARY KEY (user_id, reader)
    )
  `)

  saveDB()
}

function saveDB() {
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(DB_PATH, buffer)
}

// ============ AUTH ROUTES ============

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
  const { firstName, lastName, email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  // Check if email exists
  const existing = db.exec('SELECT id FROM users WHERE email = ?', [email.toLowerCase()])
  if (existing.length > 0 && existing[0].values.length > 0) {
    return res.status(400).json({ error: 'An account with this email already exists' })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  db.run(
    "INSERT INTO users (first_name, last_name, email, password_hash, gender, training_days, last_login) VALUES (?, ?, ?, ?, '', '[]', datetime('now'))",
    [firstName || '', lastName || '', email.toLowerCase(), passwordHash]
  )
  saveDB()

  const user = db.exec('SELECT id, first_name, last_name, email FROM users WHERE email = ?', [email.toLowerCase()])
  const row = user[0].values[0]
  const userData = { id: row[0], firstName: row[1], lastName: row[2], email: row[3] }

  const token = jwt.sign({ id: userData.id, email: userData.email }, JWT_SECRET, { expiresIn: '30d' })

  res.json({ user: userData, token })
})

// Sign In
app.post('/api/auth/signin', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const result = db.exec('SELECT id, first_name, last_name, email, password_hash FROM users WHERE email = ?', [email.toLowerCase()])
  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const row = result[0].values[0]
  const valid = await bcrypt.compare(password, row[4])
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const userData = { id: row[0], firstName: row[1], lastName: row[2], email: row[3] }
  const token = jwt.sign({ id: userData.id, email: userData.email }, JWT_SECRET, { expiresIn: '30d' })

  // Update last login
  db.run("UPDATE users SET last_login = datetime('now') WHERE id = ?", [userData.id])
  saveDB()

  res.json({ user: userData, token })
})

// Get current user
app.get('/api/auth/me', authenticate, (req, res) => {
  const result = db.exec('SELECT id, first_name, last_name, email FROM users WHERE id = ?', [req.user.id])
  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: 'User not found' })
  }
  const row = result[0].values[0]
  res.json({ user: { id: row[0], firstName: row[1], lastName: row[2], email: row[3] } })
})

// ============ PROFILE ROUTES ============

// Get profile
// Helper: if a user's current plan was scheduled in the future, but the previous plan has ended,
// roll the new plan's start_date forward to now (so its countdown is accurate everywhere)
function rebaseFutureStartIfPreviousEnded(userId, profile) {
  if (!profile.program_start_date) return profile
  const start = new Date(profile.program_start_date.replace(' ', 'T') + 'Z')
  const now = new Date()
  if (start <= now) return profile // Already started, nothing to do

  // Check the most recent archived cycle to see if it ended
  const archRes = db.exec(
    'SELECT program_start_date, program_duration_days FROM program_cycles WHERE user_id = ? ORDER BY cycle_number DESC LIMIT 1',
    [userId]
  )
  if (archRes.length === 0 || archRes[0].values.length === 0) return profile
  const [prevStart, prevDur] = archRes[0].values[0]
  if (!prevStart) return profile
  const pStart = new Date(prevStart.replace(' ', 'T') + 'Z')
  const pEnd = new Date(pStart.getTime() + (prevDur || 28) * MS_PER_DAY)
  if (pEnd > now) return profile // previous still active

  // Previous plan ended. Roll the future plan's start to "now"
  const nowSql = now.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '')
  db.run("UPDATE users SET program_start_date = ? WHERE id = ?", [nowSql, userId])
  saveDB()
  profile.program_start_date = nowSql
  return profile
}

// Helper: send 7-day reminder message if countdown <= 7 days and not already sent
function checkAndSendReminder(userId, profile) {
  if (!profile.program_start_date || profile.reminder_7day_sent) return
  const start = new Date(profile.program_start_date.replace(' ', 'T') + 'Z')
  const now = new Date()
  // If plan hasn't started yet (future scheduled), skip
  if (start > now) return
  const elapsedMs = now - start
  const durationDays = profile.program_duration_days || 28
  const totalMs = durationDays * MS_PER_DAY
  const remainingMs = Math.max(0, totalMs - elapsedMs)
  const daysLeft = Math.ceil(remainingMs / MS_PER_DAY)

  if (daysLeft <= 7 && daysLeft > 0) {
    const message = `Hi! Just a quick reminder — you've been training for 3 weeks, and you have 1 week left in your current program.\n\nIf you'd like to keep your schedule consistent without any gaps, you can extend your program now and secure your next 4 weeks in advance.`
    db.run('INSERT INTO messages (user_id, sender, text) VALUES (?, ?, ?)', [userId, 'admin', message])
    db.run("UPDATE users SET reminder_7day_sent = 1 WHERE id = ?", [userId])
    saveDB()
  }
}

app.get('/api/profile', authenticate, (req, res) => {
  const result = db.exec('SELECT * FROM users WHERE id = ?', [req.user.id])
  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: 'Profile not found' })
  }

  const cols = result[0].columns
  const row = result[0].values[0]
  const profile = {}
  cols.forEach((col, i) => { profile[col] = row[i] })

  // If a future-scheduled plan's previous cycle has now ended, rebase its start to now
  rebaseFutureStartIfPreviousEnded(req.user.id, profile)

  // Check and send 7-day reminder if needed
  checkAndSendReminder(req.user.id, profile)

  // Parse JSON arrays
  try { profile.goals = JSON.parse(profile.goals || '[]') } catch { profile.goals = [] }
  try { profile.muscle_focus = JSON.parse(profile.muscle_focus || '[]') } catch { profile.muscle_focus = [] }
  try { profile.training_days = JSON.parse(profile.training_days || '[]') } catch { profile.training_days = [] }
  try { profile.training_program = JSON.parse(profile.training_program || 'null') } catch { profile.training_program = null }
  try { profile.lifestyle_info = JSON.parse(profile.lifestyle_info || '{}') } catch { profile.lifestyle_info = {} }

  res.json({ profile })
})

// Update profile
app.put('/api/profile', authenticate, (req, res) => {
  const {
    firstName, lastName, gender, height, weight, age,
    goals, bodyView, muscleFocus, trainingDays, selectedPackage, onboardingComplete, lifestyleInfo
  } = req.body

  const updates = []
  const params = []

  if (firstName !== undefined) { updates.push('first_name = ?'); params.push(firstName) }
  if (lastName !== undefined) { updates.push('last_name = ?'); params.push(lastName) }
  if (gender !== undefined) { updates.push('gender = ?'); params.push(gender) }
  if (height !== undefined) { updates.push('height = ?'); params.push(height) }
  if (weight !== undefined) { updates.push('weight = ?'); params.push(weight) }
  if (age !== undefined) { updates.push('age = ?'); params.push(age) }
  if (goals !== undefined) { updates.push('goals = ?'); params.push(JSON.stringify(goals)) }
  if (bodyView !== undefined) { updates.push('body_view = ?'); params.push(bodyView) }
  if (muscleFocus !== undefined) { updates.push('muscle_focus = ?'); params.push(JSON.stringify(muscleFocus)) }
  if (trainingDays !== undefined) {
    updates.push('training_days = ?'); params.push(JSON.stringify(trainingDays))
    // Resize training program to match new day count, preserving existing data
    const existingResult = db.exec('SELECT training_program FROM users WHERE id = ?', [req.user.id])
    let existingProgram = []
    try {
      if (existingResult.length > 0 && existingResult[0].values[0][0]) {
        existingProgram = JSON.parse(existingResult[0].values[0][0])
      }
    } catch {}
    const newCount = trainingDays.length
    const newProgram = Array.from({ length: newCount }, (_, i) => {
      if (i < existingProgram.length) {
        return { ...existingProgram[i], day: `Day ${i + 1}` }
      }
      return {
        day: `Day ${i + 1}`,
        weeks: Array.from({ length: 4 }, () => ({ label: '', description: '' })),
      }
    })
    updates.push('training_program = ?'); params.push(JSON.stringify(newProgram))
  }
  if (selectedPackage !== undefined) { updates.push('selected_package = ?'); params.push(selectedPackage) }
  if (onboardingComplete !== undefined) { updates.push('onboarding_complete = ?'); params.push(onboardingComplete ? 1 : 0) }
  if (lifestyleInfo !== undefined) { updates.push('lifestyle_info = ?'); params.push(JSON.stringify(lifestyleInfo)) }

  // Track which sections actually changed by comparing with current DB values
  const editedSections = new Set()
  try {
    const esResult = db.exec('SELECT edited_sections FROM users WHERE id = ?', [req.user.id])
    if (esResult.length > 0 && esResult[0].values[0][0]) {
      JSON.parse(esResult[0].values[0][0]).forEach(s => editedSections.add(s))
    }
  } catch {}

  // Get current values to compare
  let current = {}
  let wasOnboarded = false
  try {
    const curResult = db.exec('SELECT first_name, last_name, gender, height, weight, age, goals, muscle_focus, training_days, selected_package, lifestyle_info, onboarding_complete FROM users WHERE id = ?', [req.user.id])
    if (curResult.length > 0) {
      const cols = curResult[0].columns
      const row = curResult[0].values[0]
      cols.forEach((col, i) => { current[col] = row[i] })
      wasOnboarded = !!current.onboarding_complete
    }
  } catch {}

  // Skip edit tracking during initial onboarding
  if (!wasOnboarded) {
    updates.push("updated_at = datetime('now')")
    params.push(req.user.id)
    if (updates.length > 1) {
      db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params)
      saveDB()
    }
    return res.json({ success: true })
  }

  // Only mark as edited if a previously non-empty value was changed (not initial fill)
  const isEdit = (newVal, oldVal) => newVal !== oldVal && !!oldVal && oldVal !== ''
  const isJsonEdit = (newVal, oldVal, emptyDefault) => {
    if (newVal === undefined) return false
    const oldStr = oldVal || emptyDefault
    return JSON.stringify(newVal) !== oldStr && oldStr !== emptyDefault
  }

  if (firstName !== undefined && isEdit(firstName, current.first_name)) editedSections.add('FirstName')
  if (lastName !== undefined && isEdit(lastName, current.last_name)) editedSections.add('LastName')
  if (gender !== undefined && isEdit(gender, current.gender)) editedSections.add('Gender')
  if (height !== undefined && isEdit(height, current.height)) editedSections.add('Height')
  if (weight !== undefined && isEdit(weight, current.weight)) editedSections.add('Weight')
  if (age !== undefined && isEdit(age, current.age)) editedSections.add('Age')
  if (isJsonEdit(lifestyleInfo, current.lifestyle_info, '{}')) editedSections.add('Lifestyle & Health')
  if (isJsonEdit(goals, current.goals, '[]')) editedSections.add('Goals')
  if (isJsonEdit(muscleFocus, current.muscle_focus, '[]')) editedSections.add('Muscle Focus')
  if (isJsonEdit(trainingDays, current.training_days, '[]')) {
    editedSections.add('Training Schedule')
    editedSections.add('Program')
  }
  if (selectedPackage !== undefined && isEdit(selectedPackage, current.selected_package)) editedSections.add('Package')

  if (editedSections.size > 0) {
    updates.push("edited_sections = ?"); params.push(JSON.stringify([...editedSections]))
    updates.push("profile_edited = 1")
  }
  updates.push("updated_at = datetime('now')")
  params.push(req.user.id)

  if (updates.length > 1) {
    db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params)
    saveDB()
  }

  res.json({ success: true })
})

// ============ ADMIN ROUTES ============

const ADMIN_USER = 'admin'
const ADMIN_PASS = 'admin'

// Admin sign in
app.post('/api/admin/signin', (req, res) => {
  const { username, password } = req.body
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ id: 'admin', role: 'admin' }, JWT_SECRET, { expiresIn: '30d' })
    return res.json({ token, user: { id: 'admin', role: 'admin', name: 'Sina Fury' } })
  }
  res.status(401).json({ error: 'Invalid admin credentials' })
})

// Admin middleware
function adminAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Not authenticated' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Not authorized' })
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// List all users (summary)
app.get('/api/admin/users', adminAuth, (req, res) => {
  const result = db.exec('SELECT id, first_name, last_name, email, gender, goals, selected_package, onboarding_complete, viewed_by_admin, profile_edited, edited_sections, extend_pending, program_start_date, program_duration_days, training_program, created_at FROM users ORDER BY created_at DESC')
  if (result.length === 0) return res.json({ users: [] })

  // Pre-compute which users have archived program cycles, in one query.
  const cycleRes = db.exec('SELECT user_id, COUNT(*) FROM program_cycles GROUP BY user_id')
  const archivedCount = {}
  if (cycleRes.length > 0) {
    cycleRes[0].values.forEach(([uid, count]) => { archivedCount[uid] = count })
  }

  const cols = result[0].columns
  const users = result[0].values.map(row => {
    const user = {}
    cols.forEach((col, i) => { user[col] = row[i] })
    try { user.goals = JSON.parse(user.goals || '[]') } catch { user.goals = [] }
    try { user.edited_sections = JSON.parse(user.edited_sections || '[]') } catch { user.edited_sections = [] }
    // awaiting_program: the user has previous cycles archived but the current training_program
    // hasn't been written yet — i.e. they're mid-extend. Stays true until admin saves a new program.
    let hasCurrentProgram = false
    try {
      const tp = JSON.parse(user.training_program || 'null')
      hasCurrentProgram = Array.isArray(tp) && tp.some(r => r.weeks?.some(w => w.label || w.description))
    } catch {}
    user.has_current_program = hasCurrentProgram
    user.awaiting_program = (archivedCount[user.id] || 0) > 0 && !hasCurrentProgram
    delete user.training_program
    return user
  })
  res.json({ users })
})

// Get single user full details (admin)
app.get('/api/admin/users/:id', adminAuth, (req, res) => {
  const result = db.exec('SELECT * FROM users WHERE id = ?', [req.params.id])
  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: 'User not found' })
  }

  const cols = result[0].columns
  const row = result[0].values[0]
  const profile = {}
  cols.forEach((col, i) => { profile[col] = row[i] })

  try { profile.goals = JSON.parse(profile.goals || '[]') } catch { profile.goals = [] }
  try { profile.muscle_focus = JSON.parse(profile.muscle_focus || '[]') } catch { profile.muscle_focus = [] }
  try { profile.training_days = JSON.parse(profile.training_days || '[]') } catch { profile.training_days = [] }
  try { profile.training_program = JSON.parse(profile.training_program || 'null') } catch { profile.training_program = null }
  try { profile.completed_days = JSON.parse(profile.completed_days || '{}') } catch { profile.completed_days = {} }
  try { profile.lifestyle_info = JSON.parse(profile.lifestyle_info || '{}') } catch { profile.lifestyle_info = {} }

  try { profile.edited_sections = JSON.parse(profile.edited_sections || '[]') } catch { profile.edited_sections = [] }
  delete profile.password_hash

  res.json({ profile })
})

// Delete user (admin)
app.delete('/api/admin/users/:id', adminAuth, (req, res) => {
  db.run('DELETE FROM messages WHERE user_id = ?', [req.params.id])
  db.run('DELETE FROM chat_read WHERE user_id = ?', [req.params.id])
  db.run('DELETE FROM users WHERE id = ?', [req.params.id])
  saveDB()
  // Clean up uploaded files
  const userDirs = [
    path.join(__dirname, 'uploads', 'photos', req.params.id),
    path.join(__dirname, 'uploads', 'payment-proofs', req.params.id),
    path.join(__dirname, 'uploads', 'chat', req.params.id),
  ]
  userDirs.forEach(dir => { try { fs.rmSync(dir, { recursive: true }) } catch {} })
  res.json({ success: true })
})

// Mark user as viewed by admin
app.post('/api/admin/users/:id/viewed', adminAuth, (req, res) => {
  db.run("UPDATE users SET viewed_by_admin = 1, extend_pending = 0 WHERE id = ?", [req.params.id])
  saveDB()
  res.json({ success: true })
})

// Clear edited flag for a user (optionally specific sections)
app.post('/api/admin/users/:id/clear-edited', adminAuth, (req, res) => {
  const { sections } = req.body || {}
  if (Array.isArray(sections) && sections.length > 0) {
    // Remove only the specified sections
    let current = []
    try {
      const result = db.exec('SELECT edited_sections FROM users WHERE id = ?', [req.params.id])
      if (result.length > 0 && result[0].values[0][0]) current = JSON.parse(result[0].values[0][0])
    } catch {}
    const filtered = current.filter(s => !sections.includes(s))
    const stillEdited = filtered.length > 0 ? 1 : 0
    db.run("UPDATE users SET edited_sections = ?, profile_edited = ? WHERE id = ?",
      [JSON.stringify(filtered), stillEdited, req.params.id])
  } else {
    db.run("UPDATE users SET profile_edited = 0, edited_sections = '[]' WHERE id = ?", [req.params.id])
  }
  saveDB()
  res.json({ success: true })
})

// Set training program for a user
app.put('/api/admin/users/:id/program', adminAuth, (req, res) => {
  const { program } = req.body

  // Get old program and completed days to clear changed cells
  let oldProgram = []
  let completedDays = {}
  try {
    const result = db.exec('SELECT training_program, completed_days FROM users WHERE id = ?', [req.params.id])
    if (result.length > 0 && result[0].values.length > 0) {
      oldProgram = JSON.parse(result[0].values[0][0] || '[]')
      completedDays = JSON.parse(result[0].values[0][1] || '{}')
    }
  } catch {}

  // Clear completed status for cells that changed or became empty
  let changed = false
  program.forEach((row, dayIdx) => {
    row.weeks.forEach((cell, weekIdx) => {
      const cellKey = `${dayIdx}-${weekIdx}`
      const oldCell = oldProgram[dayIdx]?.weeks?.[weekIdx]
      const contentChanged = !oldCell || oldCell.label !== cell.label || oldCell.description !== cell.description
      const isEmpty = !cell.label && !cell.description
      if ((contentChanged || isEmpty) && completedDays[cellKey]) {
        delete completedDays[cellKey]
        changed = true
      }
    })
  })

  // Also clear any completed days beyond the new program size
  Object.keys(completedDays).forEach(key => {
    const [d] = key.split('-').map(Number)
    if (d >= program.length) {
      delete completedDays[key]
      changed = true
    }
  })

  const updates = ["training_program = ?", "program_updated = 1", "updated_at = datetime('now')"]
  const params = [JSON.stringify(program)]

  if (changed) {
    updates.push("completed_days = ?")
    params.push(JSON.stringify(completedDays))
  }

  // Note: program_start_date is set when the user first views their Training Plan
  params.push(req.params.id)
  db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params)
  saveDB()
  res.json({ success: true })
})

// Reset for program extension — archives current cycle, then clears for new one
app.post('/api/profile/reset-payment', authenticate, (req, res) => {
  try {
    // Read full current state
    const cur = db.exec(`SELECT
      training_program, training_days, selected_package, payment_proof_path,
      program_start_date, program_duration_days, completed_days
      FROM users WHERE id = ?`, [req.user.id])

    let pendingStartDate = null
    if (cur.length > 0 && cur[0].values.length > 0) {
      const [tp, td, sp, pp, psd, pdd, cd] = cur[0].values[0]
      // Only archive if user actually had a real plan (program existed)
      if (tp && tp !== 'null') {
        // Find next cycle_number
        const cnRes = db.exec("SELECT COALESCE(MAX(cycle_number), 0) + 1 FROM program_cycles WHERE user_id = ?", [req.user.id])
        const nextCycle = (cnRes.length > 0 && cnRes[0].values.length > 0) ? cnRes[0].values[0][0] : 1
        db.run(`INSERT INTO program_cycles
          (user_id, cycle_number, training_program, training_days, selected_package,
           payment_proof_path, program_start_date, program_duration_days, completed_days)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [req.user.id, nextCycle, tp, td, sp, pp, psd, pdd, cd])

        // Calculate when the old plan ends — that's when the new plan should start
        if (psd) {
          const oldStart = new Date(psd.replace(' ', 'T') + 'Z')
          const oldEnd = new Date(oldStart.getTime() + (pdd || 28) * MS_PER_DAY)
          const now = new Date()
          if (oldEnd > now) {
            pendingStartDate = oldEnd.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '')
          }
        }
      }
    }

    // Note: don't delete the photo file — it's preserved in the archive
    db.run(`UPDATE users SET
      payment_proof_path = NULL,
      selected_package = NULL,
      training_days = '[]',
      training_program = NULL,
      completed_days = '{}',
      program_start_date = NULL,
      pending_start_date = ?,
      reminder_7day_sent = 0,
      extend_pending = 1,
      updated_at = datetime('now')
      WHERE id = ?`, [pendingStartDate, req.user.id])
    saveDB()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get all program cycles for a user (current + archives)
app.get('/api/profile/cycles', authenticate, (req, res) => {
  try {
    const result = db.exec(
      'SELECT cycle_number, training_program, training_days, selected_package, payment_proof_path, program_start_date, program_duration_days, completed_days, archived_at FROM program_cycles WHERE user_id = ? ORDER BY cycle_number ASC',
      [req.user.id]
    )
    const cycles = []
    if (result.length > 0) {
      result[0].values.forEach(row => {
        cycles.push({
          cycle_number: row[0],
          training_program: row[1] ? JSON.parse(row[1]) : null,
          training_days: row[2] ? JSON.parse(row[2]) : [],
          selected_package: row[3],
          payment_proof_path: row[4],
          program_start_date: row[5],
          program_duration_days: row[6],
          completed_days: row[7] ? JSON.parse(row[7]) : {},
          archived_at: row[8],
        })
      })
    }
    res.json({ cycles })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Admin: get cycles for a user
app.get('/api/admin/users/:id/cycles', adminAuth, (req, res) => {
  try {
    const result = db.exec(
      'SELECT cycle_number, training_program, training_days, selected_package, payment_proof_path, program_start_date, program_duration_days, completed_days, archived_at FROM program_cycles WHERE user_id = ? ORDER BY cycle_number ASC',
      [req.params.id]
    )
    const cycles = []
    if (result.length > 0) {
      result[0].values.forEach(row => {
        cycles.push({
          cycle_number: row[0],
          training_program: row[1] ? JSON.parse(row[1]) : null,
          training_days: row[2] ? JSON.parse(row[2]) : [],
          selected_package: row[3],
          payment_proof_path: row[4],
          program_start_date: row[5],
          program_duration_days: row[6],
          completed_days: row[7] ? JSON.parse(row[7]) : {},
          archived_at: row[8],
        })
      })
    }
    res.json({ cycles })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// User starts their countdown by first viewing the Training Plan
app.post('/api/profile/start-countdown', authenticate, (req, res) => {
  try {
    const result = db.exec('SELECT program_start_date, training_program, pending_start_date FROM users WHERE id = ?', [req.user.id])
    if (result.length === 0 || result[0].values.length === 0) return res.status(404).json({ error: 'Not found' })
    const currentStart = result[0].values[0][0]
    const program = result[0].values[0][1]
    const pendingStart = result[0].values[0][2]
    if (currentStart) return res.json({ success: true, alreadyStarted: true })

    // Only start if there's a real program with content
    let hasContent = false
    try {
      const p = JSON.parse(program || '[]')
      hasContent = p.some(row => row.weeks?.some(w => w.label || w.description))
    } catch {}
    if (!hasContent) return res.json({ success: true, alreadyStarted: false })

    // If a pending_start_date exists (extend scenario) and it's in the future, schedule the start there
    let startDateClause = "datetime('now')"
    let params = [req.user.id]
    if (pendingStart) {
      const pStart = new Date(pendingStart.replace(' ', 'T') + 'Z')
      if (pStart > new Date()) {
        startDateClause = "?"
        params = [pendingStart, req.user.id]
      }
    }

    db.run(`UPDATE users SET program_start_date = ${startDateClause}, pending_start_date = NULL WHERE id = ?`, params)
    saveDB()
    res.json({ success: true, started: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============ COMPLETED DAYS ============

// Get completed days (user)
app.get('/api/profile/completed', authenticate, (req, res) => {
  const result = db.exec('SELECT completed_days FROM users WHERE id = ?', [req.user.id])
  if (result.length === 0 || result[0].values.length === 0) return res.json({ completedDays: {} })
  try {
    res.json({ completedDays: JSON.parse(result[0].values[0][0] || '{}') })
  } catch { res.json({ completedDays: {} }) }
})

// Update completed days (user)
app.put('/api/profile/completed', authenticate, (req, res) => {
  const { completedDays } = req.body
  db.run(
    "UPDATE users SET completed_days = ?, updated_at = datetime('now') WHERE id = ?",
    [JSON.stringify(completedDays), req.user.id]
  )
  saveDB()
  res.json({ success: true })
})

// Update completed days for an archived cycle
app.put('/api/profile/cycles/:cycleNumber/completed', authenticate, (req, res) => {
  const { completedDays } = req.body
  const cycleNumber = parseInt(req.params.cycleNumber, 10)
  if (isNaN(cycleNumber)) return res.status(400).json({ error: 'Invalid cycle number' })
  db.run(
    "UPDATE program_cycles SET completed_days = ? WHERE user_id = ? AND cycle_number = ?",
    [JSON.stringify(completedDays), req.user.id, cycleNumber]
  )
  saveDB()
  res.json({ success: true })
})

// ============ ACCOUNT MANAGEMENT ============

// Change password
app.put('/api/auth/password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both fields are required' })
  if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' })

  const result = db.exec('SELECT password_hash FROM users WHERE id = ?', [req.user.id])
  if (result.length === 0 || result[0].values.length === 0) return res.status(404).json({ error: 'User not found' })

  const valid = await bcrypt.compare(currentPassword, result[0].values[0][0])
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' })

  const newHash = await bcrypt.hash(newPassword, 10)
  db.run("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?", [newHash, req.user.id])
  saveDB()
  res.json({ success: true })
})

// Delete own account
app.delete('/api/auth/account', authenticate, (req, res) => {
  const id = req.user.id
  db.run('DELETE FROM messages WHERE user_id = ?', [id])
  db.run('DELETE FROM chat_read WHERE user_id = ?', [id])
  db.run('DELETE FROM users WHERE id = ?', [id])
  saveDB()
  const userDirs = [
    path.join(__dirname, 'uploads', 'photos', String(id)),
    path.join(__dirname, 'uploads', 'payment-proofs', String(id)),
    path.join(__dirname, 'uploads', 'chat', String(id)),
  ]
  userDirs.forEach(dir => { try { fs.rmSync(dir, { recursive: true }) } catch {} })
  res.json({ success: true })
})

// ============ PROGRAM NOTIFICATION ============

// Check if program was updated
app.get('/api/profile/program-updated', authenticate, (req, res) => {
  const result = db.exec('SELECT program_updated FROM users WHERE id = ?', [req.user.id])
  const updated = (result.length > 0 && result[0].values.length > 0) ? result[0].values[0][0] : 0
  res.json({ programUpdated: !!updated })
})

// Mark program as seen
app.post('/api/profile/program-seen', authenticate, (req, res) => {
  db.run("UPDATE users SET program_updated = 0 WHERE id = ?", [req.user.id])
  saveDB()
  res.json({ success: true })
})

// ============ CHAT ROUTES ============

// Get messages (user - their own)
app.get('/api/chat', authenticate, (req, res) => {
  const result = db.exec('SELECT id, sender, text, created_at FROM messages WHERE user_id = ? ORDER BY created_at ASC', [req.user.id])
  if (result.length === 0) return res.json({ messages: [] })
  const cols = result[0].columns
  const messages = result[0].values.map(row => {
    const msg = {}
    cols.forEach((col, i) => { msg[col] = row[i] })
    return msg
  })
  res.json({ messages })
})

// Send message (user)
app.post('/api/chat', authenticate, (req, res) => {
  const { text } = req.body
  if (!text?.trim()) return res.status(400).json({ error: 'Message is required' })
  db.run('INSERT INTO messages (user_id, sender, text) VALUES (?, ?, ?)', [req.user.id, 'user', text.trim()])
  saveDB()
  res.json({ success: true })
})

// Upload chat image (user)
const chatUploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads', 'chat', String(req.user.id))
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg'
    cb(null, `user-${Date.now()}${ext}`)
  },
})
const chatUpload = multer({ storage: chatUploadStorage, limits: { fileSize: 10 * 1024 * 1024 } })

app.post('/api/chat/image', authenticate, chatUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  const relativePath = `chat/${req.user.id}/${req.file.filename}`
  const imageTag = `[image:/uploads/${relativePath}]`
  db.run('INSERT INTO messages (user_id, sender, text) VALUES (?, ?, ?)', [req.user.id, 'user', imageTag])
  saveDB()
  res.json({ success: true })
})

// Get unread count (user - messages from admin they haven't read)
app.get('/api/chat/unread', authenticate, (req, res) => {
  // Check countdown reminder + rebase future starts on every poll
  try {
    const profResult = db.exec('SELECT program_start_date, program_duration_days, reminder_7day_sent FROM users WHERE id = ?', [req.user.id])
    if (profResult.length > 0 && profResult[0].values.length > 0) {
      const cols = profResult[0].columns
      const row = profResult[0].values[0]
      const profile = {}
      cols.forEach((col, i) => { profile[col] = row[i] })
      rebaseFutureStartIfPreviousEnded(req.user.id, profile)
      checkAndSendReminder(req.user.id, profile)
    }
  } catch {}

  const readResult = db.exec("SELECT last_read_id FROM chat_read WHERE user_id = ? AND reader = 'user'", [req.user.id])
  const lastRead = (readResult.length > 0 && readResult[0].values.length > 0) ? readResult[0].values[0][0] : 0
  const countResult = db.exec("SELECT COUNT(*) FROM messages WHERE user_id = ? AND sender = 'admin' AND id > ?", [req.user.id, lastRead])
  const count = (countResult.length > 0 && countResult[0].values.length > 0) ? countResult[0].values[0][0] : 0
  res.json({ unread: count })
})

// Mark as read (user)
app.post('/api/chat/read', authenticate, (req, res) => {
  const maxResult = db.exec("SELECT MAX(id) FROM messages WHERE user_id = ? AND sender = 'admin'", [req.user.id])
  const maxId = (maxResult.length > 0 && maxResult[0].values.length > 0 && maxResult[0].values[0][0]) ? maxResult[0].values[0][0] : 0
  db.run("INSERT OR REPLACE INTO chat_read (user_id, reader, last_read_id) VALUES (?, 'user', ?)", [req.user.id, maxId])
  saveDB()
  res.json({ success: true })
})

// Get messages for a user (admin)
app.get('/api/admin/users/:id/chat', adminAuth, (req, res) => {
  const result = db.exec('SELECT id, sender, text, created_at FROM messages WHERE user_id = ? ORDER BY created_at ASC', [req.params.id])
  if (result.length === 0) return res.json({ messages: [] })
  const cols = result[0].columns
  const messages = result[0].values.map(row => {
    const msg = {}
    cols.forEach((col, i) => { msg[col] = row[i] })
    return msg
  })
  res.json({ messages })
})

// Get unread count per user (admin - messages from users they haven't read)
app.get('/api/admin/unread', adminAuth, (req, res) => {
  // Get all users with unread messages
  const result = db.exec(`
    SELECT m.user_id, COUNT(*) as unread
    FROM messages m
    LEFT JOIN chat_read cr ON cr.user_id = m.user_id AND cr.reader = 'admin'
    WHERE m.sender = 'user' AND m.id > COALESCE(cr.last_read_id, 0)
    GROUP BY m.user_id
  `)
  const unreadMap = {}
  if (result.length > 0) {
    result[0].values.forEach(row => { unreadMap[row[0]] = row[1] })
  }
  res.json({ unread: unreadMap })
})

// Mark as read (admin for a specific user)
app.post('/api/admin/users/:id/chat/read', adminAuth, (req, res) => {
  const maxResult = db.exec("SELECT MAX(id) FROM messages WHERE user_id = ? AND sender = 'user'", [req.params.id])
  const maxId = (maxResult.length > 0 && maxResult[0].values.length > 0 && maxResult[0].values[0][0]) ? maxResult[0].values[0][0] : 0
  db.run("INSERT OR REPLACE INTO chat_read (user_id, reader, last_read_id) VALUES (?, 'admin', ?)", [req.params.id, maxId])
  saveDB()
  res.json({ success: true })
})

// Send message as admin
app.post('/api/admin/users/:id/chat', adminAuth, (req, res) => {
  const { text } = req.body
  if (!text?.trim()) return res.status(400).json({ error: 'Message is required' })
  db.run('INSERT INTO messages (user_id, sender, text) VALUES (?, ?, ?)', [req.params.id, 'admin', text.trim()])
  saveDB()
  res.json({ success: true })
})

// Upload chat image (admin)
const adminUploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads', 'chat', req.params.id)
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg'
    cb(null, `admin-${Date.now()}${ext}`)
  },
})
const adminUpload = multer({ storage: adminUploadStorage, limits: { fileSize: 10 * 1024 * 1024 } })

app.post('/api/admin/users/:id/chat/image', adminAuth, adminUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  const relativePath = `chat/${req.params.id}/${req.file.filename}`
  const imageTag = `[image:/uploads/${relativePath}]`
  db.run('INSERT INTO messages (user_id, sender, text) VALUES (?, ?, ?)', [req.params.id, 'admin', imageTag])
  saveDB()
  res.json({ success: true })
})

// ============ FILE UPLOAD ROUTES ============

// Upload photo
app.post('/api/upload/:bucket/:filename', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

  const relativePath = `${req.params.bucket}/${req.user.id}/${req.file.filename}`

  // Update profile with file path
  const column = {
    front: 'photo_front_path',
    back: 'photo_back_path',
    side: 'photo_side_path',
    'payment-proof': 'payment_proof_path',
  }[req.params.filename]

  if (column) {
    let hadExisting = false
    let wasOnboarded = false
    let editedSections = []
    try {
      const existResult = db.exec(`SELECT ${column}, edited_sections, onboarding_complete FROM users WHERE id = ?`, [req.user.id])
      if (existResult.length > 0 && existResult[0].values.length > 0) {
        hadExisting = !!existResult[0].values[0][0]
        if (existResult[0].values[0][1]) editedSections = JSON.parse(existResult[0].values[0][1])
        wasOnboarded = !!existResult[0].values[0][2]
      }
    } catch {}

    const photoTag = {
      front: 'Photo_Front',
      back: 'Photo_Back',
      side: 'Photo_Side',
      'payment-proof': 'Photo_Payment',
    }[req.params.filename]

    // Only mark as edited if user already onboarded AND photo was previously uploaded
    if (hadExisting && wasOnboarded) {
      if (photoTag && !editedSections.includes(photoTag)) editedSections.push(photoTag)
      if (!editedSections.includes('Photos')) editedSections.push('Photos')
      db.run(`UPDATE users SET ${column} = ?, edited_sections = ?, profile_edited = 1, updated_at = datetime('now') WHERE id = ?`,
        [relativePath, JSON.stringify(editedSections), req.user.id])
    } else {
      db.run(`UPDATE users SET ${column} = ?, updated_at = datetime('now') WHERE id = ?`,
        [relativePath, req.user.id])
    }
    saveDB()
  }

  res.json({ path: relativePath, url: `/uploads/${relativePath}` })
})

// ============ START ============

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
  })
})
