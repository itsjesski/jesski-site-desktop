/**
 * URL shortening utilities for desktop states
 */

// Simple hash function for generating short IDs
const generateHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Use 6 characters - sufficient for typical use
  return Math.abs(hash).toString(36).substring(0, 6);
};

// Rate limiting for URL creation
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_URLS_PER_WINDOW = 50;

/**
 * Check if URL creation should be rate limited
 */
const isRateLimited = (): boolean => {
  const now = Date.now();
  const windowStart = Math.floor(now / RATE_LIMIT_WINDOW) * RATE_LIMIT_WINDOW;
  const currentCount = rateLimitMap.get(windowStart.toString()) || 0;
  
  if (currentCount >= MAX_URLS_PER_WINDOW) {
    return true;
  }
  
  // Clean up old entries
  rateLimitMap.clear();
  rateLimitMap.set(windowStart.toString(), currentCount + 1);
  return false;
};

// In-memory storage for desktop states (in a real app, this would be in localStorage or a database)
const stateStorage = new Map<string, string>();

/**
 * Creates a short URL for a desktop state
 */
export const createShortUrl = (desktopStateJson: string): string => {
  // Generate a hash of the state
  const hash = generateHash(desktopStateJson);
  
  // Store the state with the hash as key
  stateStorage.set(hash, desktopStateJson);
  
  return hash;
};

/**
 * Retrieves the desktop state from a short URL hash
 */
export const getDesktopStateFromHash = (hash: string): string | null => {
  return stateStorage.get(hash) || null;
};

/**
 * Creates a short URL for a desktop state (session-only)
 */
export const createPersistentShortUrl = (desktopStateJson: string): string => {
  // Check rate limiting
  if (isRateLimited()) {
    console.warn('Rate limit exceeded for URL creation');
    // Return a fallback hash based on timestamp to prevent blocking
    return generateHash(desktopStateJson + Date.now());
  }
  
  const hash = generateHash(desktopStateJson);
  
  // Store in memory for current session
  stateStorage.set(hash, desktopStateJson);
  
  return hash;
};
