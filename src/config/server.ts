/**
 * Server configuration
 * Express server, routing, middleware, and deployment settings
 */

export const SERVER_CONFIG = {
  // Basic server settings
  server: {
    port: 8080, // Will be overridden by environment variable in server.js
    host: '0.0.0.0',
    environment: 'development', // Will be overridden by environment variable in server.js
    version: '1.0.0',
    serviceName: 'jesski-desktop',
  },

  // Security settings
  security: {
    allowedHosts: [
      'jesski-desktop-site-emrcm.ondigitalocean.app',
      'jesski.com',
      'www.jesski.com',
      'localhost',
      '127.0.0.1'
    ],
    allowedOrigins: [
      'https://jesski-desktop-site-emrcm.ondigitalocean.app',
      'https://jesski.com',
      'https://www.jesski.com',
      'http://localhost:5173',
      'http://localhost:8080'
    ],
    corsEnabled: true,
    trustProxy: true,
  },

  // Static file serving
  static: {
    directory: 'dist',
    cacheControl: {
      assets: 'public, max-age=31536000', // 1 year for assets
      html: 'public, max-age=0', // No cache for HTML
      api: 'no-cache, no-store, must-revalidate', // No cache for API
    },
    compression: {
      enabled: true,
      level: 6,
      threshold: 1024, // Only compress files > 1KB
    }
  },

  // Middleware settings
  middleware: {
    bodyParser: {
      jsonLimit: '1mb',
      urlencodedLimit: '1mb',
      extended: true,
    },
    timeout: 30000, // 30 seconds
    helmet: {
      contentSecurityPolicy: false, // Disabled for development
      crossOriginEmbedderPolicy: false,
    }
  },

  // Health check configuration
  health: {
    endpoint: '/health',
    detailedEndpoint: '/api/health',
    checks: {
      uptime: true,
      memory: true,
      cpu: false, // Disabled for performance
      disk: false, // Disabled for performance
    }
  },

  // Error handling
  errors: {
    logErrors: true,
    stackTrace: true, // Will be determined by environment in server.js
    notFoundMessage: 'Not found',
    serverErrorMessage: 'Internal server error',
  }
} as const;
