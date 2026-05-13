const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')
const vm = require('vm')

const ROOT = path.join(__dirname, '..')
const IMAGES_DIR = path.join(ROOT, 'public', 'images')

function loadGames() {
  const src = fs.readFileSync(path.join(ROOT, 'public', 'games.js'), 'utf8')
  const ctx = {}
  vm.runInNewContext(src.replace(/\bconst\s+GAMES\b/, 'GAMES'), ctx)
  return ctx.GAMES || []
}

async function run() {
  const games = loadGames()
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true })

  const missing = games.filter(g => !fs.existsSync(path.join(IMAGES_DIR, `${g.id}-cover.png`)))
  if (missing.length === 0) {
    console.log('All covers present, skipping capture.')
    return
  }

  console.log(`Capturing ${missing.length} cover(s)...`)
  const browser = await chromium.launch()

  for (const game of missing) {
    const out = path.join(IMAGES_DIR, `${game.id}-cover.png`)
    console.log(`  ${game.id}: ${game.url}`)
    try {
      const page = await browser.newPage()
      await page.setViewportSize({ width: 1280, height: 720 })
      await page.goto(game.url, { waitUntil: 'load', timeout: 30000 })
      await new Promise(r => setTimeout(r, 4000))
      await page.screenshot({ path: out })
      await page.close()
      console.log(`  ✓ saved ${game.id}-cover.png`)
    } catch (err) {
      console.error(`  ✗ ${game.id}: ${err.message}`)
    }
  }

  await browser.close()
}

run().catch(err => { console.error(err); process.exit(1) })
