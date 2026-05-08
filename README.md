# CoolMattGames

A hub for games built by Matthew and friends. Free to play. No ads. No pay to win.

## Adding Your Game

1. Fork or clone this repo
2. Open `public/games.js`
3. Append your game object to the `GAMES` array:

```js
{
  id: 'my-game',
  name: 'MY GAME NAME',
  description: 'One sentence about your game.',
  url: 'https://your-game.vercel.app/',
  creator: 'YOUR NAME',
  tags: ['MULTIPLAYER', 'ACTION'],
  color: '#your-accent-color',
  featured: false
}
```

4. Open a pull request — no backend needed, pure frontend.

## Running Locally

```bash
npm install
npm start
# Open http://localhost:3000
```

## Deployment

Deployed on Vercel. Any push to `main` auto-deploys.

To deploy your own fork:
1. Go to [vercel.com](https://vercel.com)
2. Import `MatthewK30/CoolMattGames`
3. Deploy — no config needed

## Stack

- Express.js static server
- Vanilla JS / Canvas for game thumbnails
- No build step, no framework, no BS
