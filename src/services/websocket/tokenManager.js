// Ephemeral token management for WebSocket and API endpoints
import crypto from 'crypto';

const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_WINDOW_MS = 1000; // 1 second
const RATE_LIMIT_MAX = 3; // 3 actions per second
const tokens = new Map(); // token -> { expires, lastActions: [timestamps] }

export function generateEphemeralToken() {
  const token = crypto.randomBytes(24).toString('hex');
  tokens.set(token, { expires: Date.now() + TOKEN_EXPIRY_MS, lastActions: [] });
  return token;
}

export function validateToken(token) {
  if (!token) return false;
  const entry = tokens.get(token);
  if (!entry) return false;
  if (Date.now() > entry.expires) {
    tokens.delete(token);
    return false;
  }
  return true;
}

export function rateLimitToken(token) {
  const entry = tokens.get(token);
  if (!entry) return false;
  const now = Date.now();
  entry.lastActions = entry.lastActions.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  if (entry.lastActions.length >= RATE_LIMIT_MAX) return false;
  entry.lastActions.push(now);
  return true;
}

export function refreshToken(token) {
  const entry = tokens.get(token);
  if (entry) entry.expires = Date.now() + TOKEN_EXPIRY_MS;
}

export function cleanupTokens() {
  const now = Date.now();
  for (const [token, entry] of tokens.entries()) {
    if (now > entry.expires) tokens.delete(token);
  }
}

// Periodic cleanup to prevent memory leaks
setInterval(() => {
  cleanupTokens();
  console.log(`Token cleanup completed. Active tokens: ${tokens.size}`);
}, 10 * 60 * 1000); // Clean up every 10 minutes
