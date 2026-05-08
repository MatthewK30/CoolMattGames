const express = require('express')
const path = require('path')
const app = express()

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())

// ── Hub session tracking ──────────────────────────────────────────────────────
const sessions = new Map()
const SESSION_TTL = 35000

function activePlayers() {
  const now = Date.now()
  for (const [id, ts] of sessions) {
    if (now - ts > SESSION_TTL) sessions.delete(id)
  }
  return sessions.size
}

const gameSessions = new Map()
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

app.post('/api/ping', (req, res) => {
  const id = req.headers['x-session-id']
  if (id && typeof id === 'string' && id.length <= 64) sessions.set(id, Date.now())
  res.json({ players: activePlayers() })
})

app.post('/api/play', (req, res) => {
  const sid = req.headers['x-session-id']
  const gid = req.headers['x-game-id']
  if (sid && gid && typeof gid === 'string' && gid.length <= 32) {
    if (!gameSessions.has(gid)) gameSessions.set(gid, new Map())
    gameSessions.get(gid).set(sid, Date.now())
  }
  res.json({ ok: true })
})

app.get('/api/stats', (req, res) => {
  const stats = {}
  for (const gameId of gameSessions.keys()) stats[gameId] = activeGamePlayers(gameId)
  res.json(stats)
})

// ── Custom games — stored in a private GitHub Gist ───────────────────────────
const GIST_ID    = process.env.GAMES_GIST_ID
const GH_TOKEN   = process.env.GITHUB_TOKEN
const GIST_FILE  = 'custom-games.json'
const GIST_HEADERS = () => ({
  Authorization: `token ${GH_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
  'User-Agent': 'CoolMattGames'
})

async function readGames() {
  if (!GIST_ID || !GH_TOKEN) return []
  const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, { headers: GIST_HEADERS() })
  const d = await r.json()
  const content = d.files?.[GIST_FILE]?.content
  return content ? JSON.parse(content) : []
}

async function writeGames(games) {
  if (!GIST_ID || !GH_TOKEN) return
  await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: 'PATCH',
    headers: { ...GIST_HEADERS(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: { [GIST_FILE]: { content: JSON.stringify(games) } } })
  })
}

app.get('/api/custom-games', async (req, res) => {
  try { res.json(await readGames()) }
  catch (e) { res.json([]) }
})

app.post('/api/custom-games', async (req, res) => {
  try {
    const game = req.body
    if (!game?.id || !game?.name || !game?.url) return res.status(400).json({ error: 'Missing fields' })
    const games = await readGames()
    games.push(game)
    await writeGames(games)
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: 'Storage error' }) }
})

app.delete('/api/custom-games/:id', async (req, res) => {
  try {
    const games = (await readGames()).filter(g => g.id !== req.params.id)
    await writeGames(games)
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: 'Storage error' }) }
})

// ── Static / SPA fallback ────────────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')))
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log('Server running on port ' + PORT))
