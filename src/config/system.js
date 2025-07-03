/**
 * System-level configuration
 * File I/O, WebSocket connections, caching, and other infrastructure settings
 */

export const SYSTEM_CONFIG = {
  // File I/O configuration
  fileIO: {
    paths: {
      dataDirectory: 'public/data',
      tempDirectory: 'temp',
    },
    limits: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxConcurrentWrites: 5,
    },
    timing: {
      writeBatchDelayMs: 1000,
      fileWatchDebounceMs: 500,
    }
  },

  // WebSocket configuration (system-wide)
  websocket: {
    limits: {
      maxConnections: 100,
      maxConnectionsPerIP: 10,
      connectionTimeoutMs: 20 * 60 * 1000, // 20 minutes
      inactiveTimeoutMs: 5 * 60 * 1000, // 5 minutes
    },
    timing: {
      heartbeatIntervalMs: 30000, // 30 seconds
      reconnectDelayMs: 3000,
      maxReconnectAttempts: 5,
      connectionCleanupIntervalMs: 60000, // 1 minute
    }
  },

  // Caching system configuration
  cache: {
    limits: {
      maxMemoryUsageMB: 50,
      maxCacheEntries: 1000,
      maxCacheAgeMs: 10 * 60 * 1000, // 10 minutes
    },
    timing: {
      stateCacheTtlMs: 2000,
      cacheCleanupIntervalMs: 5 * 60 * 1000, // 5 minutes
    }
  },

  // Memory and resource limits (optimized for 512MB RAM environment)
  resources: {
    memory: {
      maxHeapSizeMB: 256,
      warningThresholdMB: 200,
      gcThresholdMB: 180,
    },
    performance: {
      maxEventLoopDelay: 100, // milliseconds
      monitoringIntervalMs: 30000,
    }
  },

  // Rate limiting configuration
  rateLimiting: {
    global: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 1000,
    },
    perIP: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100,
    },
    api: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60,
    }
  }
};
