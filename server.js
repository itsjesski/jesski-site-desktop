import express from 'express';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { twitchService } from './src/services/backend/twitchService.js';
import { affirmationsAPI } from './src/services/backend/affirmationsAPI.js';
import { createServer } from 'http';
import { attachGardenWebSocketServer } from './src/services/websocket/garden/gardenWebSocketServer.js';
import { generateEphemeralToken, validateToken, getSystemStatus } from './src/services/websocket/tokenManager.js';
import { SYSTEM_CONFIG } from './src/config/system.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// Configure Express to trust proxies properly for rate limiting
// Trust first proxy in development, and specific proxies in production
if (process.env.NODE_ENV === 'production') {
  // In production, trust specific proxy IPs or ranges
  app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);
} else {
  // In development, trust first proxy (for local development tools)
  app.set('trust proxy', 1);
}

const authMiddleware = (req, res, next) => {
  if (req.path === '/health' || req.path === '/token' || 
      req.originalUrl === '/api/health' || req.originalUrl === '/api/token') {
    return next();
  }
  
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.replace('Bearer ', '') : (req.query.token || '');
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!(validateToken(token) || (apiKey && process.env.AFFIRMATIONS_API_KEYS && 
        process.env.AFFIRMATIONS_API_KEYS.split(',').map(k => k.trim()).includes(apiKey)))) {
    if (req.originalUrl.includes('/api/garden/')) {
      const now = Date.now();
      const lastGardenAuthLog = global.lastGardenAuthLog || 0;
      if (now - lastGardenAuthLog > 60000) {
        console.log(`Garden API auth failed: ${req.originalUrl} (rate-limited logging)`);
        global.lastGardenAuthLog = now;
      }
    } else {
      console.log(`Authentication failed for ${req.originalUrl}: Missing or invalid token/API key`);
    }
    return res.status(401).json({
      error: 'Unauthorized: Invalid or missing token'
    });
  }
  
  next();
};

// Response caching system (memory-optimized for 512MB environment)
const responseCache = new Map();
const MAX_CACHE_ENTRIES = 50; // Limit cache size
const CACHE_TTL = {
  health: 30 * 1000,
  twitch: 60 * 1000,
  affirmations: 300 * 1000,
  static: 3600 * 1000
};

// Generic cache middleware
const cacheMiddleware = (ttl) => (req, res, next) => {
  const authInfo = req.headers.authorization || req.query.token || req.headers['x-api-key'] || '';
  const key = `${req.originalUrl}|${authInfo}`;
  const cached = responseCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    res.set('X-Cache', 'HIT');
    res.set('Cache-Control', `public, max-age=${Math.floor(ttl / 1000)}`);
    return res.json(cached.data);
  }
  
  const originalJson = res.json;
  res.json = function(data) {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      // Implement LRU-style cache eviction to prevent memory bloat
      if (responseCache.size >= MAX_CACHE_ENTRIES) {
        // Remove oldest entries (simple FIFO for performance)
        const oldestKeys = Array.from(responseCache.keys()).slice(0, Math.floor(MAX_CACHE_ENTRIES * 0.2));
        oldestKeys.forEach(k => responseCache.delete(k));
      }
      responseCache.set(key, { data, timestamp: Date.now() });
    }
    res.set('X-Cache', 'MISS');
    res.set('Cache-Control', `public, max-age=${Math.floor(ttl / 1000)}`);
    return originalJson.call(this, data);
  };
  
  next();
};

// Define public API endpoints that don't need authentication
app.get('/api/health', cacheMiddleware(CACHE_TTL.health), (req, res) => {
  memoryMonitor.check(); // Check memory on health endpoint calls
  
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    service: 'jesski-desktop'
  };
  
  res.status(200).json(healthStatus);
});

// Ephemeral token endpoints (no user accounts, no personal data)
app.post('/api/token', (req, res) => {
  try {
    // Get client IP for rate limiting (temporary, privacy-safe)
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                    req.connection?.remoteAddress || 
                    req.socket?.remoteAddress || 
                    'unknown';
                    
    const token = generateEphemeralToken(clientIP);
    res.json({ token, expiresIn: 3600 });
  } catch (error) {
    console.error('Error generating token:', error.message);
    if (error.message.includes('Too many token requests') || error.message.includes('Server at capacity')) {
      res.status(429).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to generate token' });
    }
  }
});

// Debug GET version of token endpoint for testing
app.get('/api/token', (req, res) => {
  try {
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                    req.connection?.remoteAddress || 
                    req.socket?.remoteAddress || 
                    'unknown';
                    
    const token = generateEphemeralToken(clientIP);
    res.json({ token, expiresIn: 3600, debug: 'GET method' });
  } catch (error) {
    console.error('Error generating token:', error.message);
    if (error.message.includes('Too many token requests') || error.message.includes('Server at capacity')) {
      res.status(429).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to generate token' });
    }
  }
});

// Apply auth middleware to all API routes EXCEPT /health and /token
// The order of middleware is important - this must come BEFORE the routes are defined
const apiPaths = [
  '/api/affirmations', 
  '/api/twitch'
];

apiPaths.forEach(path => {
  app.use(path, authMiddleware);
});

// Memory monitoring for low-memory environment
const memoryMonitor = {
  lastCheck: 0,
  threshold: 400 * 1024 * 1024, // 400MB threshold (80% of 512MB)
  checkInterval: 60000, // Check every minute
  
  check() {
    const now = Date.now();
    if (now - this.lastCheck < this.checkInterval) return;
    
    const memUsage = process.memoryUsage();
    this.lastCheck = now;
    
    if (memUsage.heapUsed > this.threshold) {
      console.warn(`⚠️  High memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
      this.cleanup();
    }
  },
  
  cleanup() {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log('🧹 Forced garbage collection');
    }
    
    // Clear cache if memory is high
    if (responseCache.size > 20) {
      const toRemove = Math.floor(responseCache.size * 0.5);
      const keys = Array.from(responseCache.keys()).slice(0, toRemove);
      keys.forEach(k => responseCache.delete(k));
      console.log(`🧹 Emergency cache cleanup: removed ${toRemove} entries`);
    }
  }
};



// Middleware
app.use(compression()); // Enable gzip compression

// Rate limiting for production using system config
const { rateLimiting } = SYSTEM_CONFIG;

const limiter = rateLimit({
  windowMs: rateLimiting.perIP.windowMs,
  max: process.env.NODE_ENV === 'production' ? rateLimiting.perIP.maxRequests : rateLimiting.global.maxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: `${rateLimiting.perIP.windowMs / 1000 / 60} minutes`
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API-specific rate limiting (stricter)
const apiLimiter = rateLimit({
  windowMs: rateLimiting.api.windowMs,
  max: process.env.NODE_ENV === 'production' ? rateLimiting.api.maxRequests : rateLimiting.global.maxRequests,
  message: {
    error: 'Too many API requests from this IP, please try again later.',
    retryAfter: `${rateLimiting.api.windowMs / 1000 / 60} minutes`
  }
});

// Apply rate limiter to all API routes
app.use('/api/', apiLimiter);

app.use(limiter); // Apply rate limiting to all requests

// Memory monitoring middleware
app.use((req, res, next) => {
  memoryMonitor.check();
  next();
});

// Compression middleware for better performance
app.use(compression());

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

// Security headers for production
app.use((req, res, next) => {
  // Basic security headers
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy (relaxed for Twitch embeds and WebSockets)
  if (process.env.NODE_ENV === 'production') {
    res.header('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://embed.twitch.tv; " +
      "connect-src 'self' wss: ws: https://api.twitch.tv; " +
      "frame-src https://embed.twitch.tv https://www.twitch.tv https://player.twitch.tv https://open.spotify.com; " +
      "img-src 'self' data: https:; " +
      "style-src 'self' 'unsafe-inline';"
    );
  }
  
  next();
});

// API Routes with caching (health endpoint moved to top)

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

// Periodic cache cleanup to prevent memory leaks (optimized for low-memory environment)
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  
  // Clean expired cache entries
  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp > 3600000) { // Remove entries older than 1 hour
      responseCache.delete(key);
      cleaned++;
    }
  }
  
  // Force cleanup if cache is still too large
  if (responseCache.size > MAX_CACHE_ENTRIES) {
    const oldestKeys = Array.from(responseCache.keys()).slice(0, responseCache.size - MAX_CACHE_ENTRIES);
    oldestKeys.forEach(k => responseCache.delete(k));
    cleaned += oldestKeys.length;
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cache cleanup: removed ${cleaned} entries, ${responseCache.size} remaining`);
  }
  
  // Memory check and cleanup
  const memUsage = process.memoryUsage();
  if (memUsage.heapUsed > memoryMonitor.threshold) {
    console.warn(`⚠️  High memory usage detected: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
    memoryMonitor.cleanup();
  }
}, 15 * 60 * 1000); // Clean every 15 minutes

// Graceful shutdown handling for production
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
