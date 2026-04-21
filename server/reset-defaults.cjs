// One-time script to clear default values from existing users
// who never explicitly chose them
const path = require('path')
const fs = require('fs')
const initSqlJs = require('sql.js')

const DB_PATH = path.join(__dirname, 'sinafury.db')

async function run() {
  const SQL = await initSqlJs()
  const buffer = fs.readFileSync(DB_PATH)
  const db = new SQL.Database(buffer)

  // Clear gender default for users who haven't completed onboarding
  db.run("UPDATE users SET gender = '' WHERE onboarding_complete = 0")

  // Clear old default training_days
  db.run("UPDATE users SET training_days = '[]' WHERE training_days = '[\"Mon\",\"Wed\",\"Fri\"]' OR training_days = '[\"Day 1\",\"Day 2\",\"Day 3\"]'")

  const data = db.export()
  fs.writeFileSync(DB_PATH, Buffer.from(data))
  console.log('Cleared default values for non-onboarded users.')
  db.close()
}

run()
