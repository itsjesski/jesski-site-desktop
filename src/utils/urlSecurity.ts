/**
 * Security utilities for URL parameter validation
 */

// URL validation regex patterns
const URL_PATTERN = /^https?:\/\/[^\s<>"{}|\\^`\[\]]+$/;
const SAFE_STRING_PATTERN = /^[a-zA-Z0-9\-_.\s]+$/;

/**
 * Validates a filename parameter for text viewer
 * Only allows files from the text folder, no path traversal
 * Automatically handles .txt extension (can be with or without)
 */
export const validateFileName = (fileName: string): string | null => {
  if (!fileName || typeof fileName !== 'string') {
    return null;
  }

  // Remove any path traversal attempts and normalize
  const cleanFileName = fileName
    .replace(/\.\./g, '')           // Remove ..
    .replace(/[\/\\]/g, '')         // Remove slashes
    .replace(/^\.+/, '')            // Remove leading dots
    .trim();

  // Remove .txt extension if present for validation
  const baseFileName = cleanFileName.replace(/\.txt$/, '');

  // Must be reasonable length
  if (baseFileName.length === 0 || baseFileName.length > 100) {
    return null;
  }

  // Only allow safe characters in filename
  if (!/^[a-zA-Z0-9\-_\s]+$/.test(baseFileName)) {
    return null;
  }

  // Return the base filename without .txt extension (for clean URLs)
  return baseFileName;
};

/**
 * Validates a URL parameter for website viewer
 */
export const validateUrl = (url: string): string | null => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Basic length check
  if (url.length > 2000) {
    return null;
  }

  // Must be HTTP/HTTPS
  if (!URL_PATTERN.test(url)) {
    return null;
  }

  // Additional security checks
  const lowerUrl = url.toLowerCase();
  
  // Block dangerous protocols that might be disguised
  if (lowerUrl.includes('javascript:') || 
      lowerUrl.includes('data:') || 
      lowerUrl.includes('vbscript:') ||
      lowerUrl.includes('file:')) {
    return null;
  }

  // Block common XSS patterns
  if (lowerUrl.includes('<script') || 
      lowerUrl.includes('onerror=') || 
      lowerUrl.includes('onload=')) {
    return null;
  }

  return url;
};

/**
 * Validates a game name parameter
 */
export const validateGameName = (gameName: string): string | null => {
  if (!gameName || typeof gameName !== 'string') {
    return null;
  }

  // Basic sanitization - allow alphanumeric, spaces, hyphens, underscores
  if (!SAFE_STRING_PATTERN.test(gameName)) {
    return null;
  }

  // Length limit
  if (gameName.length > 100) {
    return null;
  }

  return gameName.trim();
};

/**
 * Validates any generic string parameter
 */
export const validateSafeString = (value: string, maxLength: number = 100): string | null => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  if (value.length > maxLength) {
    return null;
  }

  // Allow only safe characters
  if (!SAFE_STRING_PATTERN.test(value)) {
    return null;
  }

  return value.trim();
};

/**
 * Sanitizes and validates URL parameters based on app type
 */
export const validateAppParams = (app: string, params: Record<string, string>): Record<string, string> | null => {
  const validatedParams: Record<string, string> = {};

  switch (app) {
    case 'text-viewer':
      if (params.file) {
        const validFile = validateFileName(params.file);
        if (validFile) {
          validatedParams.file = validFile;
        } else {
          // Invalid file name - reject the params
          return null;
        }
      }
      break;

    case 'website-viewer':
      if (params.url) {
        const validUrl = validateUrl(params.url);
        if (validUrl) {
          validatedParams.url = validUrl;
        } else {
          // Invalid URL - reject the params
          return null;
        }
      }
      break;

    case 'games-library':
      if (params.game) {
        const validGame = validateGameName(params.game);
        if (validGame) {
          validatedParams.game = validGame;
        } else {
          // Invalid game name - reject the params
          return null;
        }
      }
      break;

    default:
      // For unknown apps, validate all params as safe strings
      for (const [key, value] of Object.entries(params)) {
        const validValue = validateSafeString(value);
        if (validValue) {
          validatedParams[key] = validValue;
        }
      }
      break;
  }

  return validatedParams;
};
