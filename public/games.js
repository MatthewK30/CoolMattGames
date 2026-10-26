const GAMES = [
  {
    id: 'paintball',
    name: '2 STEPS AHEAD PAINTBALL',
    description: 'Competitive first person paintball with custom maps, multiplayer, and friend skins.',
    url: 'https://2steps-ahead-paintball.vercel.app',
    creator: 'MATTHEW',
    tags: ['MULTIPLAYER', 'FPS', 'COMPETITIVE'],
    color: '#cc1515',
    featured: true
  },
  {
    id: 'zombie',
    name: 'ZOMBIE SURVIVAL',
    description: 'Multiplayer zombie survival — fight waves and outlast your friends.',
    url: 'https://zombie-liart.vercel.app/?server=wss://zombie-multiplayer-server-gtbt.onrender.com',
    creator: 'MATTHEW',
    tags: ['MULTIPLAYER', 'SURVIVAL', 'HORROR'],
    color: '#22cc22',
    featured: true
  },
  {
    id: 'felt',
    name: 'FELT — PRIVATE POKER',
    description: 'Host a private Texas hold\'em table with blinds, antes, side pots, rebuys, blackjack mini-game, and emotes. Share a 4-letter code — no account needed.',
    url: 'https://doublea-digital.github.io/Felt/',
    creator: 'AARUSH',
    tags: ['MULTIPLAYER', 'CARD GAME', 'STRATEGY'],
    color: '#c9a84c',
    featured: true
  },
  {
    id: 'neon-drop',
    name: 'NEON DROP',
    description: 'Classic block-stacking with neon glow, combos, back-to-back bonuses, and a score multiplier that grows with every level.',
    url: 'https://matteensekander.github.io/my-projects/neon_drop.html',
    creator: 'MATTEEN',
    tags: ['SOLO', 'PUZZLE', 'ARCADE'],
    color: '#00f0f0',
    featured: false
  },
  {
    id: 'shadow-box',
    name: 'SHADOW BOX',
    description: 'Read them. Dodge them. Break them. 2-player online boxing — RPS meets mind games. Real-time WebSocket multiplayer.',
    url: 'https://shadow-box-production.up.railway.app',
    creator: 'AARUSH',
    tags: ['MULTIPLAYER', 'FIGHTING', 'STRATEGY'],
    color: '#a855f7',
    featured: true
  },
  {
    id: 'tour-golf',
    name: 'TOUR GOLF',
    description: 'Full-swing golf with a three-click swing, PGA Tour 98 style. Driver off the tee, pick your iron in, then read the putt. Wind, bunkers and the lie all bite. 1-4 players.',
    url: 'https://doublea-digital.github.io/MiniGolf/tour.html',
    creator: 'AARUSH',
    tags: ['SPORTS', 'SKILL', 'LOCAL MULTIPLAYER'],
    color: '#2f9a3a',
    featured: false
  },
  {
    id: 'mini-golf',
    name: 'MINI GOLF',
    description: 'Host a tournament for as many friends as you want — send one link, everyone putts at once across nine holes that build from easy to brutal. Place well to earn points and unlock special balls.',
    url: 'https://doublea-digital.github.io/MiniGolf/',
    creator: 'AARUSH',
    tags: ['MULTIPLAYER', 'SPORTS', 'TOURNAMENT'],
    color: '#43b14b',
    featured: false
  },
  {
    id: 'cool-matt-brawl',
    name: 'COOL MATT BRAWL',
    description: 'Smash-style platform fighting for 2-4 players, on one keyboard or online with a 4-letter room code. Free-for-all or 2v2 teams. 16 hand-drawn fighters, each with their own specials and supers — freeze foes solid, curse them, vanish into stealth, drain their health, plant countdown bombs, rewind time or fight on the beat. 4 stages with platforms that drift, burn, crumble and retract, a Frenzy finale, Sudden Death on a tie, and CPUs to fill any seat.',
    url: 'https://doublea-digital.github.io/CoolMattBrawl/',
    creator: 'AARUSH',
    tags: ['MULTIPLAYER', 'LOCAL MULTIPLAYER', 'FIGHTING'],
    color: '#ff2e88',
    featured: true
  },
  {
    id: 'prism-clash',
    name: 'PRISM CLASH',
    description: 'Neon battle royale for up to 10 players. Drop in as a chibi hero, loot guns from gray to legendary, break crates, hide in bushes, and draft wild powers and ultimates as the zone closes. Fast 2-4 minute matches across a neon city and crystal wilds. Share a room code, or practice against bots instantly.',
    url: 'https://doublea-digital.github.io/prism-clash/',
    creator: 'AARUSH',
    tags: ['MULTIPLAYER', 'BATTLE ROYALE', 'SHOOTER'],
    color: '#00f0ff',
    featured: true
  },
  {
    id: 'live-interrogation',
    name: 'LIVE INTERROGATION',
    description: 'Real-time text-only noir deduction for 3-8 friends. Interrogate the suspect, pin evidence, and vote in secret. No voice chat, all nerve.',
    url: 'https://live-interrogation.onrender.com',
    creator: 'MATTEEN',
    tags: ['MULTIPLAYER', 'DEDUCTION', 'TEXT'],
    color: '#f2a93b',
    featured: false
  }
]

// To add your game, append an object to this array:
// {
//   id: 'your-game-id',          // unique slug, no spaces
//   name: 'YOUR GAME NAME',      // shown in card header
//   description: 'One sentence', // shown in card body
//   url: 'https://...',          // where to play
//   creator: 'YOUR NAME',        // shown on creator badge
//   tags: ['TAG1', 'TAG2'],      // 1-3 genre tags
//   color: '#hex',               // accent color for thumbnail
//   featured: false              // set true to make card 2-col wide
// }
