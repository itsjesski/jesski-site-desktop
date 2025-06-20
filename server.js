import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for development (Digital Ocean will handle this in production)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
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

// Future Twitch API endpoints
app.get('/api/twitch/auth', (req, res) => {
  res.json({ message: 'Twitch auth endpoint - to be implemented' });
});

app.get('/api/twitch/token', (req, res) => {
  res.json({ message: 'Twitch token endpoint - to be implemented' });
});

app.get('/api/twitch/stream/:channel', (req, res) => {
  res.json({ message: `Stream status for ${req.params.channel} - to be implemented` });
});

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
});
