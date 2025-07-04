/**
 * Application configuration
 * Centralizes environment-dependent settings for the frontend
 */

// Re-export organized config modules (from JavaScript files for backend compatibility)
export { GARDEN_CONFIG, DEFAULT_GARDEN_STATE, DEFAULT_COMMUNITY_STATS } from './garden.js'
export { TOKEN_CONFIG } from './token.js'
export { SYSTEM_CONFIG } from './system.js'

// Frontend-specific configuration
export const config = {
  // Environment
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,

  // Server configuration
  server: {
    port: import.meta.env.VITE_PORT || 8080,
    host: import.meta.env.VITE_HOST || 'localhost',
  },

  // WebSocket configuration
  websocket: {
    url: import.meta.env.PROD
      ? (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host
      : 'ws://localhost:8080',
    
    garden: {
      endpoint: '/garden/ws',
      refreshInterval: 3000, // 3 seconds
      maxIdleTime: 60000, // 1 minute
      rateLimitDelay: 1000, // 1 second
    },
  },

  // API configuration
  api: {
    baseUrl: import.meta.env.PROD
      ? window.location.origin
      : 'http://localhost:8080',
    
    endpoints: {
      token: '/api/token',
      health: '/api/health',
      twitch: '/api/twitch',
      affirmations: '/api/affirmations',
    },

    // Cache TTL in milliseconds
    cache: {
      health: 30 * 1000,        // 30 seconds
      twitch: 60 * 1000,        // 1 minute
      affirmations: 300 * 1000, // 5 minutes
      static: 3600 * 1000,      // 1 hour
    },
  },

  // UI configuration
  ui: {
    defaultWindowSize: {
      width: 750,
      height: 550,
    },
    
    mobileBreakpoint: 768,
    
    animations: {
      duration: 150, // milliseconds
    },

    notifications: {
      defaultDuration: 5000, // 5 seconds
    },
  },
} as const;

// Type for configuration object
export type Config = typeof config;
