const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const initSqlJs = require('sql.js')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const multer = require('multer')

const app = express()
const PORT = 3004
const JWT_SECRET = 'sinafury_secret_key_change_in_production_2024'
const DB_PATH = path.join(__dirname, 'sinafury.db')

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
app.get('/api/profile', authenticate, (req, res) => {
  const result = db.exec('SELECT * FROM users WHERE id = ?', [req.user.id])
  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: 'Profile not found' })
  }

  const cols = result[0].columns
  const row = result[0].values[0]
  const profile = {}
  cols.forEach((col, i) => { profile[col] = row[i] })

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
  const result = db.exec('SELECT id, first_name, last_name, email, gender, goals, selected_package, onboarding_complete, viewed_by_admin, profile_edited, edited_sections, created_at FROM users ORDER BY created_at DESC')
  if (result.length === 0) return res.json({ users: [] })

  const cols = result[0].columns
  const users = result[0].values.map(row => {
    const user = {}
    cols.forEach((col, i) => { user[col] = row[i] })
    try { user.goals = JSON.parse(user.goals || '[]') } catch { user.goals = [] }
    try { user.edited_sections = JSON.parse(user.edited_sections || '[]') } catch { user.edited_sections = [] }
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
  db.run("UPDATE users SET viewed_by_admin = 1 WHERE id = ?", [req.params.id])
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

  // Set program_start_date on first program assignment (only if not already set)
  try {
    const startResult = db.exec('SELECT program_start_date FROM users WHERE id = ?', [req.params.id])
    const currentStart = (startResult.length > 0 && startResult[0].values.length > 0) ? startResult[0].values[0][0] : null
    if (!currentStart) {
      // Check if program has any actual content (not all empty)
      const hasContent = program.some(row => row.weeks?.some(w => w.label || w.description))
      if (hasContent) {
        updates.push("program_start_date = datetime('now')")
      }
    }
  } catch {}

  params.push(req.params.id)
  db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params)
  saveDB()
  res.json({ success: true })
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
