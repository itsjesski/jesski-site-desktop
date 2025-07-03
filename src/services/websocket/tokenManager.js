import crypto from 'crypto';
import { TOKEN_CONFIG } from '../../config/tokenConfig.js';

const {
  tokenExpiryMs,
  rateLimitWindowMs,
  rateLimitMax,
  tokenGenerationLimit,
  tokenGenerationWindowMs,
  maxActiveTokens,
  maxApiCallsPerMinute,
  maxBehaviorActions,
  behaviorTrackingTimeMs,
  suspiciousPatterns
} = TOKEN_CONFIG.limits;

const tokens = new Map();

// Global token generation rate limiting (no IP tracking for privacy)
let tokenGenerationCount = 0;
let lastTokenGenerationReset = Date.now();

// Global resource limits
const globalLimits = {
  maxActiveTokens,
  maxApiCallsPerMinute,
  currentApiCalls: 0,
  lastApiCallReset: Date.now()
};

// Basic behavioral analysis (memory-optimized)
const behaviorTracker = new Map(); // token -> { actions: [], patterns: {} }

export function generateEphemeralToken(clientIP = null) {
  // Check global token generation rate limit
  const now = Date.now();
  if (now - lastTokenGenerationReset >= tokenGenerationWindowMs) {
    tokenGenerationCount = 0;
    lastTokenGenerationReset = now;
  }
  
  if (tokenGenerationCount >= tokenGenerationLimit) {
    // Expire oldest tokens to make room
    expireOldestTokens(1);
  }
  
  // Check global token limit after cleanup
  if (tokens.size >= globalLimits.maxActiveTokens) {
    cleanupTokens(); // Try cleanup first
    if (tokens.size >= globalLimits.maxActiveTokens) {
      // Force expire oldest tokens
      expireOldestTokens(Math.ceil(globalLimits.maxActiveTokens * 0.1)); // Remove 10%
    }
  }

  const token = crypto.randomBytes(24).toString('hex');
  tokens.set(token, { expires: Date.now() + tokenExpiryMs, lastActions: [] });
  
  // Initialize behavior tracking
  behaviorTracker.set(token, { actions: [], patterns: {} });
  
  tokenGenerationCount++;
  return token;
}

function expireOldestTokens(count) {
  const tokenEntries = Array.from(tokens.entries())
    .sort((a, b) => a[1].expires - b[1].expires) // Sort by expiry time (oldest first)
    .slice(0, count);
  
  tokenEntries.forEach(([token]) => {
    tokens.delete(token);
    behaviorTracker.delete(token);
  });
}

export function validateToken(token) {
  if (!token) return false;
  const entry = tokens.get(token);
  if (!entry) return false;
  if (Date.now() > entry.expires) {
    tokens.delete(token);
    behaviorTracker.delete(token);
    return false;
  }
  return true;
}

export function rateLimitToken(token) {
  // Check global API call limit
  const now = Date.now();
  if (now - globalLimits.lastApiCallReset > 60000) { // Reset every minute
    globalLimits.currentApiCalls = 0;
    globalLimits.lastApiCallReset = now;
  }
  
  if (globalLimits.currentApiCalls >= globalLimits.maxApiCallsPerMinute) {
    return false;
  }

  const entry = tokens.get(token);
  if (!entry) return false;
  
  entry.lastActions = entry.lastActions.filter(ts => now - ts < rateLimitWindowMs);
  if (entry.lastActions.length >= rateLimitMax) return false;
  
  // Check for suspicious behavior
  if (isSuspiciousBehavior(token, now)) {
    console.warn(`Suspicious behavior detected for token: ${token.substring(0, 8)}...`);
    return false;
  }
  
  entry.lastActions.push(now);
  globalLimits.currentApiCalls++;
  
  // Update behavior tracking
  updateBehaviorTracking(token, now);
  
  return true;
}

function isSuspiciousBehavior(token, timestamp) {
  const behavior = behaviorTracker.get(token);
  if (!behavior) return false;
  
  // Use smaller time window to reduce memory usage
  const recentActions = behavior.actions.filter(time => timestamp - time < 8000); // Reduced from 10 seconds
  
  if (recentActions.length >= suspiciousPatterns.rapidActions) {
    return true;
  }
  
  // Simplified pattern detection to save memory
  if (recentActions.length >= 3) {
    const intervals = [];
    for (let i = 1; i < Math.min(recentActions.length, 5); i++) { // Limit to 5 intervals max
      intervals.push(recentActions[i] - recentActions[i-1]);
    }
    
    const identicalIntervals = intervals.filter(interval => 
      intervals.filter(i => Math.abs(i - interval) < 100).length >= suspiciousPatterns.identicalTimings
    );
    
    if (identicalIntervals.length >= suspiciousPatterns.identicalTimings) {
      return true;
    }
  }
  
  return false;
}

function updateBehaviorTracking(token, timestamp) {
  const behavior = behaviorTracker.get(token);
  if (!behavior) return;
  
  behavior.actions.push(timestamp);
  
  // Keep only recent actions and limit array size for memory efficiency
  behavior.actions = behavior.actions
    .filter(time => timestamp - time < behaviorTrackingTimeMs)
    .slice(-maxBehaviorActions); // Keep only last N actions
}

export function refreshToken(token) {
  const entry = tokens.get(token);
  if (entry) entry.expires = Date.now() + TOKEN_EXPIRY_MS;
}

export function cleanupTokens() {
  const now = Date.now();
  
  // Cleanup expired tokens
  for (const [token, entry] of tokens.entries()) {
    if (now > entry.expires) {
      tokens.delete(token);
      behaviorTracker.delete(token);
    }
  }
  
  // Cleanup old token request records (keep for 1 hour only)
  for (const [ip, entry] of tokenRequestLimiter.entries()) {
    if (now - entry.lastCleanup > TOKEN_REQUEST_WINDOW) {
      tokenRequestLimiter.delete(ip);
    }
  }
}

// Add method to get system status (for monitoring)
export function getSystemStatus() {
  // Calculate approximate memory usage
  const approxMemoryUsage = {
    tokens: tokens.size * 200, // bytes
    behaviorTracking: behaviorTracker.size * 400, // bytes  
    ipTracking: tokenRequestLimiter.size * 100, // bytes
    total: (tokens.size * 200) + (behaviorTracker.size * 400) + (tokenRequestLimiter.size * 100)
  };

  return {
    activeTokens: tokens.size,
    maxTokens: globalLimits.maxActiveTokens,
    currentApiCalls: globalLimits.currentApiCalls,
    maxApiCallsPerMinute: globalLimits.maxApiCallsPerMinute,
    trackedIPs: tokenRequestLimiter.size,
    memoryUsage: approxMemoryUsage
  };
}

setInterval(() => {
  cleanupTokens();
}, 10 * 60 * 1000);
