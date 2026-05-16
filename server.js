const express = require('express')
const path = require('path')
const fs = require('fs')
const vm = require('vm')
const crypto = require('crypto')
const { spawnSync } = require('child_process')
const app = express()

function loadLocalGames() {
  const src = fs.readFileSync(path.join(__dirname, 'public', 'games.js'), 'utf8')
  const ctx = {}
  vm.runInNewContext(src.replace(/\bconst\s+GAMES\b/, 'GAMES'), ctx)
  return ctx.GAMES || []
}

// ── Cover check on startup (games.js + gist) ─────────────────────────────────
async function checkCovers() {
  try {
    const local = loadLocalGames()
    const gist = await readGames().catch(e => {
      console.warn('Gist check skipped:', e.message)
      return []
    })
    const all = [...local, ...gist].filter(g => !g.removed)
    const anyMissing = all.some(
      g => g && g.id && !fs.existsSync(path.join(__dirname, 'public', 'images', `${g.id}-cover.png`))
    )
    if (anyMissing) {
      console.log('Cover images missing — running capture script...')
      spawnSync('node', ['scripts/capture.js'], { stdio: 'inherit', cwd: __dirname, env: process.env })
    }
  } catch (e) {
    console.warn('Cover check skipped:', e.message)
  }
}

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

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || 'ea0d9285862de5198a70f53d2c0ce41764c787a846d9d8c9d39fcc2253cfdd52'
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || ADMIN_PASSWORD_HASH

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a))
  const right = Buffer.from(String(b))
  return left.length === right.length && crypto.timingSafeEqual(left, right)
}

function signAdminNonce(nonce) {
  return crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(nonce).digest('hex')
}

function makeAdminToken() {
  const nonce = crypto.randomBytes(24).toString('hex')
  return nonce + '.' + signAdminNonce(nonce)
}

function isAdminToken(token) {
  if (!token || typeof token !== 'string') return false
  const parts = token.split('.')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false
  return safeEqual(parts[1], signAdminNonce(parts[0]))
}

function requireAdmin(req, res, next) {
  if (!isAdminToken(req.headers['x-admin-session'])) return res.status(401).json({ error: 'Unauthorized' })
  next()
}

async function readGames() {
  if (!GIST_ID || !GH_TOKEN) return []
  const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, { headers: GIST_HEADERS() })
  const d = await r.json()
  const content = d.files?.[GIST_FILE]?.content
  return content ? JSON.parse(content) : []
}

async function writeGames(games) {
  if (!GIST_ID || !GH_TOKEN) return
  const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: 'PATCH',
    headers: { ...GIST_HEADERS(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: { [GIST_FILE]: { content: JSON.stringify(games) } } })
  })
  if (!r.ok) throw new Error('Gist write failed')
}

function upsertGame(games, game) {
  const index = games.findIndex(g => g && g.id === game.id)
  if (index === -1) games.push(game)
  else games[index] = game
}

app.post('/api/admin/login', (req, res) => {
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  if (!safeEqual(hashPassword(password), ADMIN_PASSWORD_HASH)) return res.status(401).json({ error: 'Wrong password' })
  res.json({ token: makeAdminToken() })
})

app.get('/api/admin/session', requireAdmin, (req, res) => {
  res.json({ ok: true })
})

app.get('/api/custom-games', async (req, res) => {
  try { res.json(await readGames()) }
  catch (e) { res.json([]) }
})

app.post('/api/custom-games', requireAdmin, async (req, res) => {
  try {
    const game = req.body
    if (!game?.id || !game?.name || !game?.url) return res.status(400).json({ error: 'Missing fields' })
    const games = await readGames()
    games.push(game)
    await writeGames(games)
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: 'Storage error' }) }
})

app.put('/api/custom-games/:id', requireAdmin, async (req, res) => {
  try {
    const game = req.body
    if (!game?.name || !game?.url) return res.status(400).json({ error: 'Missing fields' })
    const games = await readGames()
    delete game.removed
    game.id = req.params.id
    upsertGame(games, game)
    await writeGames(games)
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: 'Storage error' }) }
})

app.delete('/api/custom-games/:id', requireAdmin, async (req, res) => {
  try {
    let games = await readGames()
    const localIds = new Set(loadLocalGames().map(g => g.id))
    if (localIds.has(req.params.id)) {
      upsertGame(games, { id: req.params.id, removed: true })
    } else {
      games = games.filter(g => g.id !== req.params.id)
    }
    await writeGames(games)
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: 'Storage error' }) }
})

// ── Static / SPA fallback ────────────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')))
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')))

const PORT = process.env.PORT || 3000
checkCovers().finally(() => {
  app.listen(PORT, () => console.log('Server running on port ' + PORT))
})
