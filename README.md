# 🖥️ Jesski's Desktop

A nostalgic desktop environment built as a web application, featuring a retro Windows-style interface with interactive applications and a collaborative virtual garden game.

---

## 🌟 Features

### 🖥️ Desktop Environment
- **Retro Windows Interface**: Drag-and-drop windows, taskbar, start menu, and desktop icons
- **Multiple Applications**: Text viewer, games library, Twitch integration, garden game, and more
- **Responsive Design**: Works on both desktop and mobile devices
- **Desktop Stickers**: Interactive sticker system with drag-and-drop functionality

### 🌱 Virtual Garden Game
- **Collaborative Garden**: Real-time multiplayer garden where everyone contributes
- **Emoji Visuals**: Plant, water, fertilize, and decorate with emoji-based graphics
- **Live Updates**: WebSocket-powered real-time synchronization across all users
- **Global Stats**: Community-wide statistics and shared progress
- **Anonymous Access**: No accounts needed, uses ephemeral tokens for security

### 📺 Live Streaming Integration
- **Twitch Integration**: Real-time stream status and information display
- **Stream Embed**: Watch live streams directly in the desktop environment
- **Automatic Updates**: Stream status updates every few minutes

### 🔗 URL Routing & Sharing
- **Deep Linking**: Direct URLs to specific applications and desktop states
- **Shareable Windows**: Every window has a unique URL for easy sharing
- **Compact Multi-Window URLs**: Efficient encoding for complex desktop layouts
- **Clean URLs**: User-friendly paths without technical file extensions
- **Cross-Session Compatibility**: URLs work across different browser sessions

---

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript for type safety and modern features
- **Vite** for fast development and optimized builds
- **Tailwind CSS v4** with custom CSS variables for theming
- **Zustand** for lightweight state management
- **Lucide React** for consistent iconography
- **Custom Drag & Drop** implementation for React 19 compatibility

### Backend
- **Node.js** with Express for the API server
- **WebSocket (ws)** for real-time communication
- **Flat File Storage** using JSON files for simplicity and transparency
- **Token-based Security** with ephemeral tokens and rate limiting

### Development & Deployment
- **TypeScript** for type safety across the entire codebase
- **ESLint** for code quality and consistency
- **PostCSS** for CSS processing
- **Docker** for containerized deployment
- **Digital Ocean** for cloud hosting

---

## Architecture

### Frontend Applications
- **Desktop Environment**: Window management, taskbar, start menu
- **Text Viewer**: Display markdown and text files
- **Games Library**: Showcase of games and projects
- **Twitch Integration**: Live stream status and embedded player
- **Virtual Garden**: Real-time collaborative garden game
- **Sticker Pack**: Interactive desktop decorations

### Configuration System
- **Organized Configs**: Separated concerns for garden, system, server, and token settings
- **Type Safety**: Full TypeScript support with proper typing
- **Environment Handling**: Development and production configurations

### URL Routing System
- **React Router Integration**: Seamless navigation between desktop states
- **Compact Encoding**: Efficient compression for multi-window desktop layouts
- **Security Validation**: Input sanitization and path traversal protection
- **Static Asset Serving**: Optimized text file loading from public directory

### Real-time Features
- **WebSocket Garden**: Real-time multiplayer garden updates
- **Token Management**: Ephemeral tokens for security without accounts
- **Rate Limiting**: Protection against abuse and spam
- **Live Stream Updates**: Automatic Twitch stream status checking

---

## 🚀 Getting Started

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables
Create a `.env` file for Twitch integration:
```env
VITE_TWITCH_CHANNEL=your_channel_name
TWITCH_CLIENT_ID=your_client_id
```

---

## 📁 Project Structure

- `src/components/garden/` — Frontend garden app (React, emoji visuals, WebSocket logic)
- `src/services/garden/` — Backend logic (WebSocket server, token manager)
- `public/data/gardenState.json` — Flat file storage for garden state and stats (auto-created, publicly accessible)
- `public/data/games.csv` — Game data storage (publicly accessible)
- `server.js` — Main server (Express + WebSocket integration)

---

## 📝 Contributing & Feedback

Pull requests and feedback are welcome! Please open an issue for bugs, suggestions, or feature requests.

---

## 📜 License

MIT License. See [LICENSE](LICENSE) for details.
