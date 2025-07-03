/**
 * Token and authentication system configuration
 */

export const TOKEN_CONFIG = {
  // Token system limits
  limits: {
    maxActiveTokens: 50,
    maxApiCallsPerMinute: 500,
    tokenGenerationLimit: 30, // per minute
    tokenGenerationWindowMs: 60 * 1000, // 1 minute
    tokenExpiryMs: 60 * 60 * 1000, // 1 hour
    
    // Rate limiting per token
    rateLimitWindowMs: 1000,
    rateLimitMax: 3,
    
    // Behavioral analysis limits (privacy-safe, memory-optimized)
    maxBehaviorActions: 10,
    behaviorTrackingTimeMs: 120000, // 2 minutes
    suspiciousPatterns: {
      rapidActions: 8,
      identicalTimings: 4
    }
  },
  
  // Timing configuration for token system
  timing: {
    tokenRefreshThresholdMs: 15 * 60 * 1000, // 15 minutes
    tokenCleanupIntervalMs: 10 * 60 * 1000 // 10 minutes
  }
};
