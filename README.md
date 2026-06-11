# Jesski Desktop

Browser desktop-style site for Jesski. React + TypeScript + Vite frontend, Express backend, Twitch + affirmations API, windowed app UI.

## Current Features

- Desktop UI: draggable/resizable windows, taskbar, start menu, desktop icons
- Apps: About, Text Viewer, Games Library, Twitch Chat, Streamer Software, Music Player, Settings
- URL sync: deep links for opened windows/layout
- Backend APIs: health, token, Twitch, affirmations

## Tech

- React 19, TypeScript, Vite
- Tailwind CSS v4
- Zustand
- Express, ws, helmet, compression, rate limiting

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run build:optimized
```

## Production Start

```bash
npm start
```

## Environment

Create `.env` as needed:

```env
VITE_TWITCH_CHANNEL=jesski
AFFIRMATIONS_API_KEYS=key1,key2
```

## Important Paths

- `server.js` — Express server entry
- `src/components/desktop/` — desktop shell UI
- `src/applications/` — app windows
- `src/services/` — API clients/services
- `public/data/games.csv` — games library data

## License

MIT. See [LICENSE](LICENSE).
