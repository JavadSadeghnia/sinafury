// One-time script to clear all edit flags from existing users
const path = require('path')
const fs = require('fs')
const initSqlJs = require('sql.js')

const DB_PATH = path.join(__dirname, 'sinafury.db')

async function run() {
  const SQL = await initSqlJs()
  const buffer = fs.readFileSync(DB_PATH)
  const db = new SQL.Database(buffer)

  db.run("UPDATE users SET profile_edited = 0, edited_sections = '[]'")

  const data = db.export()
  fs.writeFileSync(DB_PATH, Buffer.from(data))
  console.log('Cleared all edit flags.')
  db.close()
}

run()
