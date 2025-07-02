# 🌱 Jesski Community Virtual Garden

Welcome to the **Jesski Community Virtual Garden** — a real-time, collaborative garden grown by everyone! Plant, water, decorate, and watch the garden bloom with emoji visuals. All actions update live for all users, creating a fun, interactive experience.

---

## 🚀 Features

- **Emoji Garden**: Plant, water, fertilize, weed, decorate, and harvest — all with adorable emoji visuals.
- **Global Actions**: Every action affects the whole garden. See changes in real time as the community collaborates.
- **Live Updates**: Powered by a WebSocket-only backend for instant, multi-user updates.
- **Global Stats**: Track total plants, waterings, decorations, and more.
- **Item Limits & Expiry**: The garden enforces limits on plants and decorations. Decorations fade after a set time.
- **No Accounts, No Personal Data**: Access is anonymous, using ephemeral tokens for security and rate limiting.
- **Admin Controls**: Permanent admin token (from environment) for moderation and management.
- **Flat File Storage**: All garden state and stats are stored in a simple JSON file for transparency and easy backup.

---

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite, TailwindCSS, Zustand (state), Lucide Icons, modern UI/UX.
- **Backend**: Node.js, Express, WebSocket (ws), flat file (JSON) storage.
- **Security**: Ephemeral token system for all endpoints and WebSocket connections, with rate limiting. Permanent admin token from environment for admin actions.
- **No Databases**: All persistent data is stored in `src/data/garden/gardenState.json`.

---

## 🌍 How It Works

1. **Get a Token**: The frontend requests an ephemeral token from `/api/garden/token` (no login, no personal info).
2. **Connect via WebSocket**: The app connects to `/garden/ws?token=...` for real-time updates. If WebSockets are unsupported, an error is shown.
3. **Take Action**: Users can plant, water, fertilize, weed, decorate, or harvest. All actions are broadcast to everyone instantly.
4. **Global State**: The garden state is shared by all users and stored in a flat JSON file. Stats and limits are enforced server-side.
5. **Admin**: Admins use a permanent token (from `ADMIN_API_TOKEN` env variable) for moderation and special actions.

---

## ✨ Example UI

![Community Garden Screenshot](docs/garden-screenshot.png)

---

## 📁 Project Structure

- `src/components/garden/` — Frontend garden app (React, emoji visuals, WebSocket logic)
- `src/services/garden/` — Backend logic (WebSocket server, token manager)
- `src/data/garden/gardenState.json` — Flat file storage for garden state and stats
- `server.js` — Main server (Express + WebSocket integration)

---

## 📝 Contributing & Feedback

Pull requests and feedback are welcome! Please open an issue for bugs, suggestions, or feature requests.

---

## 📜 License

MIT License. See [LICENSE](LICENSE) for details.
