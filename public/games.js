const GAMES = [
  {
    id: 'paintball',
    name: '2 STEPS AHEAD PAINTBALL',
    description: 'Competitive first person paintball with custom maps, multiplayer, and friend skins.',
    url: 'https://2steps-ahead-paintball.vercel.app/',
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
    description: 'Host a private Texas hold\'em room and invite friends via a 4-letter code. No server, no account — pure P2P.',
    url: 'https://doublea-digital.github.io/Felt/',
    creator: 'AARUSH',
    tags: ['MULTIPLAYER', 'CARD GAME', 'STRATEGY'],
    color: '#c9a84c',
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
