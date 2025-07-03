/**
 * Production-safe logging utility
 * Reduces console noise in production while maintaining error visibility
 */

const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  // Always log errors
  error: (...args) => {
    console.error('[ERROR]', ...args);
  },

  // Always log warnings
  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },

  // Only log info in development
  info: (...args) => {
    if (!isProduction) {
      console.log('[INFO]', ...args);
    }
  },

  // Only log debug in development
  debug: (...args) => {
    if (!isProduction) {
      console.log('[DEBUG]', ...args);
    }
  },

  // Always log startup/shutdown info
  system: (...args) => {
    console.log('[SYSTEM]', ...args);
  }
};

export default logger;
