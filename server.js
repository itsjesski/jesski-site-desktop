import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { twitchService } from './src/services/backend/twitchService.js';
import { affirmationsAPI } from './src/services/backend/affirmationsAPI.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// API Routes (for future Twitch integration)
app.get('/api/health', (req, res) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    service: 'jesski-desktop'
  };
  
  res.status(200).json(healthStatus);
});

// Simple liveness probe (alternative health check)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Twitch API endpoints
app.get('/api/twitch/stream/:channel', async (req, res) => {
  try {
    const { channel } = req.params;
    const streamStatus = await twitchService.getStreamStatus(channel);
    res.json(streamStatus);
  } catch (error) {
    console.error('Error getting stream status:', error);
    res.status(500).json({ error: 'Failed to get stream status' });
  }
});

app.get('/api/twitch/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const userInfo = await twitchService.getUserInfo(username);
    res.json(userInfo);
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Affirmations API endpoints
app.get('/api/affirmations/info', affirmationsAPI.getInfo);
app.get('/api/affirmations/random', affirmationsAPI.getRandom);
app.get('/api/affirmations/multiple', affirmationsAPI.getMultiple);

// Serve static files from the dist directory
app.use(express.static(join(__dirname, 'dist')));

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
  
  // For all other routes, serve the React app
  try {
    const indexHtml = readFileSync(join(__dirname, 'dist', 'index.html'), 'utf-8');
    res.send(indexHtml);
  } catch (error) {
    console.error('Error loading index.html:', error);
    res.status(500).send('Error loading application');
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

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔌 API: http://localhost:${port}/api/health`);
  console.log(`❤️  Health: http://localhost:${port}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏱️  Started at: ${new Date().toISOString()}`);
  console.log(`🏠 Allowed hosts: ${allowedHosts.join(', ')}`);
});
