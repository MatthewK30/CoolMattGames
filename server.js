const express = require('express')
const path = require('path')
const app = express()

app.use(express.static(path.join(__dirname, 'public')))

// Track active sessions by ID — expires after 35s of no ping
const sessions = new Map()
const SESSION_TTL = 35000

function activePlayers() {
  const now = Date.now()
  for (const [id, ts] of sessions) {
    if (now - ts > SESSION_TTL) sessions.delete(id)
  }
  return sessions.size
}

app.post('/api/ping', (req, res) => {
  const id = req.headers['x-session-id']
  if (id && typeof id === 'string' && id.length <= 64) {
    sessions.set(id, Date.now())
  }
  res.json({ players: activePlayers() })
})

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log('Server running on port ' + PORT))
