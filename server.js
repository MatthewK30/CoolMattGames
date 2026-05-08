const express = require('express')
const path = require('path')
const app = express()

app.use(express.static(path.join(__dirname, 'public')))

// Hub sessions (active browsers on the hub page)
const sessions = new Map()
const SESSION_TTL = 35000

function activePlayers() {
  const now = Date.now()
  for (const [id, ts] of sessions) {
    if (now - ts > SESSION_TTL) sessions.delete(id)
  }
  return sessions.size
}

// Per-game sessions (people who launched a game in the last 30 min)
const gameSessions = new Map() // gameId -> Map(sessionId -> timestamp)
const GAME_TTL = 30 * 60 * 1000

function activeGamePlayers(gameId) {
  const gs = gameSessions.get(gameId)
  if (!gs) return 0
  const now = Date.now()
  for (const [id, ts] of gs) {
    if (now - ts > GAME_TTL) gs.delete(id)
  }
  return gs.size
}

// Hub heartbeat — keeps hub player count alive
app.post('/api/ping', (req, res) => {
  const id = req.headers['x-session-id']
  if (id && typeof id === 'string' && id.length <= 64) {
    sessions.set(id, Date.now())
  }
  res.json({ players: activePlayers() })
})

// Called when a player clicks PLAY NOW on a game
app.post('/api/play', (req, res) => {
  const sid = req.headers['x-session-id']
  const gid = req.headers['x-game-id']
  if (sid && gid && typeof gid === 'string' && gid.length <= 32) {
    if (!gameSessions.has(gid)) gameSessions.set(gid, new Map())
    gameSessions.get(gid).set(sid, Date.now())
  }
  res.json({ ok: true })
})

// Per-game player counts for the hub cards
app.get('/api/stats', (req, res) => {
  const stats = {}
  for (const gameId of gameSessions.keys()) {
    stats[gameId] = activeGamePlayers(gameId)
  }
  res.json(stats)
})

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log('Server running on port ' + PORT))
