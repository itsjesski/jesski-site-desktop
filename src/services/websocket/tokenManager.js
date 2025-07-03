import crypto from 'crypto';

const TOKEN_EXPIRY_MS = 60 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 1000;
const RATE_LIMIT_MAX = 3;
const tokens = new Map();

// Token generation rate limiting (privacy-safe, no persistent storage)
const tokenRequestLimiter = new Map(); // IP -> { requests: [], lastCleanup }
const TOKEN_REQUEST_LIMIT = 10; // Max 10 token requests per hour per IP
const TOKEN_REQUEST_WINDOW = 60 * 60 * 1000; // 1 hour

// Global resource limits (optimized for 512MB RAM environment)
const globalLimits = {
  maxActiveTokens: 50, // Reduced from 200 for low-memory environment
  maxApiCallsPerMinute: 500, // Reduced from 1000
  currentApiCalls: 0,
  lastApiCallReset: Date.now()
};

// Basic behavioral analysis (memory-optimized)
const behaviorTracker = new Map(); // token -> { actions: [], patterns: {} }
const SUSPICIOUS_PATTERNS = {
  rapidActions: 8, // Reduced from 10
  identicalTimings: 4, // Reduced from 5
};

// Memory limits
const MEMORY_LIMITS = {
  maxBehaviorActions: 10, // Keep only last 10 actions per token
  maxTrackedIPs: 100, // Limit IP tracking
  behaviorTrackingTime: 120000, // Reduced from 5 minutes to 2 minutes
};

export function generateEphemeralToken(clientIP = null) {
  // Check global token limit
  if (tokens.size >= globalLimits.maxActiveTokens) {
    cleanupTokens(); // Try cleanup first
    if (tokens.size >= globalLimits.maxActiveTokens) {
      throw new Error('Server at capacity, please try again later');
    }
  }

  // Rate limit token generation per IP (if IP provided)
  if (clientIP && !canRequestToken(clientIP)) {
    throw new Error('Too many token requests, please try again later');
  }

  const token = crypto.randomBytes(24).toString('hex');
  tokens.set(token, { expires: Date.now() + TOKEN_EXPIRY_MS, lastActions: [] });
  
  // Initialize behavior tracking
  behaviorTracker.set(token, { actions: [], patterns: {} });
  
  return token;
}

function canRequestToken(ip) {
  const now = Date.now();
  
  // Limit number of tracked IPs to prevent memory bloat
  if (tokenRequestLimiter.size >= MEMORY_LIMITS.maxTrackedIPs) {
    // Remove oldest entries
    const sortedEntries = Array.from(tokenRequestLimiter.entries())
      .sort((a, b) => a[1].lastCleanup - b[1].lastCleanup);
    const toRemove = sortedEntries.slice(0, Math.floor(MEMORY_LIMITS.maxTrackedIPs * 0.2));
    toRemove.forEach(([key]) => tokenRequestLimiter.delete(key));
  }
  
  const entry = tokenRequestLimiter.get(ip);
  
  if (!entry) {
    tokenRequestLimiter.set(ip, { requests: [now], lastCleanup: now });
    return true;
  }
  
  entry.requests = entry.requests.filter(time => now - time < TOKEN_REQUEST_WINDOW);
  
  if (entry.requests.length >= TOKEN_REQUEST_LIMIT) {
    return false;
  }
  
  entry.requests.push(now);
  entry.lastCleanup = now;
  return true;
}

export function validateToken(token) {
  if (!token) return false;
  const entry = tokens.get(token);
  if (!entry) return false;
  if (Date.now() > entry.expires) {
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
  
  entry.lastActions = entry.lastActions.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  if (entry.lastActions.length >= RATE_LIMIT_MAX) return false;
  
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
  
  if (recentActions.length >= SUSPICIOUS_PATTERNS.rapidActions) {
    return true;
  }
  
  // Simplified pattern detection to save memory
  if (recentActions.length >= 3) {
    const intervals = [];
    for (let i = 1; i < Math.min(recentActions.length, 5); i++) { // Limit to 5 intervals max
      intervals.push(recentActions[i] - recentActions[i-1]);
    }
    
    const identicalIntervals = intervals.filter(interval => 
      intervals.filter(i => Math.abs(i - interval) < 100).length >= SUSPICIOUS_PATTERNS.identicalTimings
    );
    
    if (identicalIntervals.length >= SUSPICIOUS_PATTERNS.identicalTimings) {
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
    .filter(time => timestamp - time < MEMORY_LIMITS.behaviorTrackingTime)
    .slice(-MEMORY_LIMITS.maxBehaviorActions); // Keep only last N actions
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
