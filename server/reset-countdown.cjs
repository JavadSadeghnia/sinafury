// Clear program_start_date so countdown starts fresh on next view
const path = require('path')
const fs = require('fs')
const initSqlJs = require('sql.js')

const DB_PATH = path.join(__dirname, 'sinafury.db')

async function run() {
  const SQL = await initSqlJs()
  const buffer = fs.readFileSync(DB_PATH)
  const db = new SQL.Database(buffer)

  db.run("UPDATE users SET program_start_date = NULL")

  const data = db.export()
  fs.writeFileSync(DB_PATH, Buffer.from(data))
  console.log('Cleared program_start_date for all users.')
  db.close()
}

run()
