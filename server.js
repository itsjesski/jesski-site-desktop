import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { twitchService } from './src/services/backend/twitchService.js';
import { affirmationsAPI } from './src/services/backend/affirmationsAPI.js';
import { createServer } from 'http';
import { attachGardenWebSocketServer } from './src/services/websocket/garden/gardenWebSocketServer.js';
import { generateEphemeralToken } from './src/services/websocket/tokenManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// Response caching system
const responseCache = new Map();
const CACHE_TTL = {
  health: 30 * 1000,        // 30 seconds
  twitch: 60 * 1000,        // 1 minute
  affirmations: 300 * 1000, // 5 minutes
  static: 3600 * 1000       // 1 hour
};

// Generic cache middleware
const cacheMiddleware = (ttl) => (req, res, next) => {
  const key = req.originalUrl;
  const cached = responseCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    // Set cache headers
    res.set('X-Cache', 'HIT');
    res.set('Cache-Control', `public, max-age=${Math.floor(ttl / 1000)}`);
    return res.json(cached.data);
  }
  
  // Override res.json to cache the response
  const originalJson = res.json;
  res.json = function(data) {
    responseCache.set(key, { data, timestamp: Date.now() });
    res.set('X-Cache', 'MISS');
    res.set('Cache-Control', `public, max-age=${Math.floor(ttl / 1000)}`);
    return originalJson.call(this, data);
  };
  
  next();
};

// Periodic cache cleanup
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of responseCache.entries()) {
    // Remove entries older than 1 hour regardless of TTL
    if (now - value.timestamp > 3600000) {
      responseCache.delete(key);
    }
  }
  console.log(`Cache cleanup completed. Active entries: ${responseCache.size}`);
}, 10 * 60 * 1000); // Clean every 10 minutes

// Middleware
app.use(express.json({ limit: '1mb' })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Compression middleware for better performance
app.use((req, res, next) => {
  // Simple compression for JSON responses
  const originalJson = res.json;
  res.json = function(data) {
    res.set('Content-Type', 'application/json; charset=utf-8');
    return originalJson.call(this, data);
  };
  next();
});

// Apply rate limiting to API routes only (removed IP-based tracking for privacy)
// Rate limiting is handled per-token in the WebSocket garden server

// Allowed hosts for security
const allowedHosts = [
  'jesski-desktop-site-emrcm.ondigitalocean.app',
  'jesski.com',
  'www.jesski.com',
  'localhost',
  '127.0.0.1'
];

// Host validation middleware
app.use((req, res, next) => {
  const host = req.get('host');
  
  // Allow requests without host header (like health checks)
  if (!host) {
    return next();
  }
  
  // Remove port from host for comparison
  const hostWithoutPort = host.split(':')[0];
  
  if (allowedHosts.includes(hostWithoutPort)) {
    next();
  } else {
    console.warn(`Blocked request from unauthorized host: ${host}`);
    res.status(403).json({ error: 'Forbidden - Invalid host' });
  }
});

// CORS for development (Digital Ocean will handle this in production)
app.use((req, res, next) => {
  const origin = req.get('origin');
  const allowedOrigins = [
    'https://jesski-desktop-site-emrcm.ondigitalocean.app',
    'https://jesski.com',
    'https://www.jesski.com',
    'http://localhost:5173',
    'http://localhost:8080'
  ];
  
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// API Routes with caching
app.get('/api/health', cacheMiddleware(CACHE_TTL.health), (req, res) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    service: 'jesski-desktop',
    cache: {
      entries: responseCache.size,
      hitRate: res.get('X-Cache') === 'HIT' ? 'cached' : 'fresh'
    }
  };
  
  res.status(200).json(healthStatus);
});

// Simple liveness probe (alternative health check)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Twitch API endpoints with caching
app.get('/api/twitch/stream/:channel', cacheMiddleware(CACHE_TTL.twitch), async (req, res) => {
  try {
    const { channel } = req.params;
    const streamStatus = await twitchService.getStreamStatus(channel);
    res.json(streamStatus);
  } catch (error) {
    console.error('Error getting stream status:', error);
    res.status(500).json({ error: 'Failed to get stream status' });
  }
});

app.get('/api/twitch/user/:username', cacheMiddleware(CACHE_TTL.twitch), async (req, res) => {
  try {
    const { username } = req.params;
    const userInfo = await twitchService.getUserInfo(username);
    res.json(userInfo);
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Affirmations API endpoints with caching
app.get('/api/affirmations/info', cacheMiddleware(CACHE_TTL.affirmations), affirmationsAPI.getInfo);
app.get('/api/affirmations/random', cacheMiddleware(CACHE_TTL.affirmations), affirmationsAPI.getRandom);
app.get('/api/affirmations/multiple', cacheMiddleware(CACHE_TTL.affirmations), affirmationsAPI.getMultiple);

// Serve static files from the dist directory with caching
app.use(express.static(join(__dirname, 'dist'), {
  maxAge: '1h', // Cache static files for 1 hour
  etag: true,
  lastModified: true
}));

// Cache for index.html to avoid repeated file reads
let indexHtmlCache = null;
let indexHtmlTimestamp = 0;
const INDEX_CACHE_TTL = 60 * 1000; // 1 minute

// Handle React routing - serve index.html for all non-API routes
app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // If it's a file request (has extension), let it continue to 404
  if (req.path.includes('.') && !req.path.endsWith('/')) {
    return next();
  }
  
  // For all other routes, serve the React app with caching
  const now = Date.now();
  if (!indexHtmlCache || (now - indexHtmlTimestamp) > INDEX_CACHE_TTL) {
    try {
      indexHtmlCache = readFileSync(join(__dirname, 'dist', 'index.html'), 'utf-8');
      indexHtmlTimestamp = now;
    } catch (error) {
      console.error('Error loading index.html:', error);
      return res.status(500).send('Error loading application');
    }
  }
  
  res.set('Cache-Control', 'no-cache'); // Don't cache the HTML in browsers
  res.send(indexHtmlCache);
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  console.log('GET /api/test called');
  res.json({ message: 'Test endpoint works!' });
});

// Ephemeral token endpoint (no user accounts, no personal data)
// Universal token system for all API endpoints that need authentication
app.post('/api/token', (req, res) => {
  console.log('POST /api/token called');
  try {
    const token = generateEphemeralToken();
    console.log('Token generated successfully:', token.substring(0, 8) + '...');
    res.json({ token, expiresIn: 3600 });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Debug GET version of token endpoint for testing
app.get('/api/token', (req, res) => {
  console.log('GET /api/token called');
  try {
    const token = generateEphemeralToken();
    console.log('Token generated successfully:', token.substring(0, 8) + '...');
    res.json({ token, expiresIn: 3600, debug: 'GET method' });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = createServer(app);

// Attach the garden WebSocket server
attachGardenWebSocketServer(server);

server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Backend Server is running on port ${port}`);
  console.log(`🔌 API: http://localhost:${port}/api/health`);
  console.log(`🔑 Token: http://localhost:${port}/api/token`);
  console.log(`❤️  Health: http://localhost:${port}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏱️  Started at: ${new Date().toISOString()}`);
  console.log(`🏠 Allowed hosts: ${allowedHosts.join(', ')}`);
  console.log(`🌱 Garden WebSocket: ws://localhost:${port}/garden/ws`);
  console.log(`📱 For development, use the Vite dev server (usually http://localhost:5173)`);
});
