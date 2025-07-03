// Central configuration for the garden system and server limits

export const GARDEN_CONFIG = {
  // File paths
  paths: {
    gardenState: 'public/data/gardenState.json',
    communityStats: 'public/data/communityStats.json'
  },

  // Memory and resource limits (optimized for 512MB RAM environment)
  limits: {
    // Garden-specific limits
    maxPlants: 100,
    maxMagicItems: 10,
    maxRecentHarvests: 20,
    
    // WebSocket connection limits
    maxWebSocketClients: 25,
    connectionTimeoutMs: 20 * 60 * 1000, // 20 minutes
    inactiveTimeoutMs: 3 * 60 * 1000, // 3 minutes
    
    // Token system limits
    maxActiveTokens: 50,
    maxApiCallsPerMinute: 500,
    tokenGenerationLimit: 30, // per minute
    tokenGenerationWindowMs: 60 * 1000, // 1 minute
    tokenExpiryMs: 60 * 60 * 1000, // 1 hour
    
    // Rate limiting
    rateLimitWindowMs: 1000,
    rateLimitMax: 3,
    
    // Behavioral analysis limits
    maxBehaviorActions: 10,
    behaviorTrackingTimeMs: 120000, // 2 minutes
    suspiciousPatterns: {
      rapidActions: 8,
      identicalTimings: 4
    }
  },

  // Timing configuration
  timing: {
    // Cache and I/O
    stateCacheTtlMs: 2000,
    writeBatchDelayMs: 1000,
    
    // Plant care timing (more user-friendly)
    plantWaterLossDelayMs: 300000, // 5 minutes
    plantDiseaseLossDelayMs: 600000, // 10 minutes
    fertilizerCooldownMs: 120000, // 2 minutes
    
    // Cleanup intervals
    connectionCleanupIntervalMs: 60000, // 1 minute
    magicCleanupIntervalMs: 60000, // 1 minute
    
    // Client-side timing
    refreshIntervalMs: 5000,
    maxIdleTimeMs: 120000, // 2 minutes
    tokenRefreshThresholdMs: 15 * 60 * 1000 // 15 minutes
  },

  // Plant configuration
  plants: {
    types: [
      { name: 'sunflower', stages: ['🌱', '🌿', '🌻'], growthTime: 120000, waterNeeded: 2 },
      { name: 'rose', stages: ['🌱', '🥀', '🌹'], growthTime: 180000, waterNeeded: 3 },
      { name: 'tulip', stages: ['🌱', '🌿', '🌷'], growthTime: 150000, waterNeeded: 2 },
      { name: 'daisy', stages: ['🌱', '🌿', '🌼'], growthTime: 90000, waterNeeded: 1 },
      { name: 'cherry', stages: ['🌱', '🌿', '🌸'], growthTime: 200000, waterNeeded: 3 }
    ],
    fertilizerGrowthMultiplier: 0.5, // 50% faster growth when fertilized
    healthStates: ['healthy', 'wilted', 'diseased']
  },

  // Magic system configuration
  magic: {
    maxActiveMagic: 5,
    types: [
      // Growth boosters
      { emoji: '🦋', effect: 'growth_boost', strength: 0.2, duration: 300000 },
      { emoji: '🐝', effect: 'harvest_boost', strength: 0.5, duration: 300000 },
      { emoji: '💚', effect: 'health_boost', strength: 1, duration: 300000 },
      // Protection magic
      { emoji: '🛡️', effect: 'disease_protection', strength: 1, duration: 600000 },
      { emoji: '💧', effect: 'water_retention', strength: 0.5, duration: 600000 },
      // Garden-themed magical items
      { emoji: '🌙', effect: 'none', strength: 0, duration: 300000 },
      { emoji: '☀️', effect: 'none', strength: 0, duration: 300000 },
      { emoji: '🌟', effect: 'none', strength: 0, duration: 300000 },
      { emoji: '✨', effect: 'happiness', strength: 0.1, duration: 300000 },
      { emoji: '🍄', effect: 'none', strength: 0, duration: 300000 },
      { emoji: '🌈', effect: 'none', strength: 0, duration: 300000 },
      { emoji: '🐞', effect: 'pest_control', strength: 1, duration: 300000 },
      { emoji: '🦔', effect: 'none', strength: 0, duration: 300000 },
      { emoji: '🐿️', effect: 'none', strength: 0, duration: 300000 }
    ]
  }
};

// Default state structures
export const DEFAULT_GARDEN_STATE = {
  plants: [],
  magic: [],
  stats: {
    totalPlanted: 0,
    totalHarvested: 0,
    totalWatered: 0,
    totalFertilized: 0,
    totalWeedsPulled: 0,
    totalMagicPlaced: 0,
    totalMagicFaded: 0
  },
  recentHarvests: []
};

export const DEFAULT_COMMUNITY_STATS = {
  totalPlanted: 0,
  totalHarvested: 0,
  totalWatered: 0,
  totalFertilized: 0,
  totalWeedsPulled: 0,
  totalMagicPlaced: 0,
  totalMagicFaded: 0,
  lastUpdated: new Date().toISOString()
};
