import type { WindowState } from '../types/window';
import { validateAppParams } from './urlSecurity';

// App name compression dictionary (most common apps get single chars)
const APP_DICT: Record<string, string> = {
  'about': 'a',
  'text-viewer': 't', 
  'website-viewer': 'w',
  'games-library': 'g',
  'sticker-pack': 's',
  'twitch-chat': 'c',
  'streamer-software': 'r'
};

const REVERSE_APP_DICT: Record<string, string> = Object.fromEntries(
  Object.entries(APP_DICT).map(([k, v]) => [v, k])
);

/**
 * Compresses desktop state to minimal format
 */
const compressDesktopState = (routes: AppRoute[], activeApp?: string): string => {
  // Convert to compact format: [app, params_as_string]
  const compact = routes.map(route => {
    const app = APP_DICT[route.app] || route.app;
    if (!route.params || Object.keys(route.params).length === 0) {
      return app;
    }
    
    // Compress params to minimal format
    const paramStr = Object.entries(route.params)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    
    return `${app}:${paramStr}`;
  });
  
  // Add active app if different from first
  let result = compact.join(',');
  if (activeApp && activeApp !== routes[0]?.app) {
    const compressedActive = APP_DICT[activeApp] || activeApp;
    result += `|${compressedActive}`;
  }
  
  return result;
};

/**
 * Decompresses desktop state from minimal format
 */
const decompressDesktopState = (compressed: string): { routes: AppRoute[], activeApp?: string } => {
  const [routePart, activePart] = compressed.split('|');
  const routes: AppRoute[] = [];
  
  for (const routeStr of routePart.split(',')) {
    if (!routeStr) continue;
    
    const [appPart, paramsPart] = routeStr.split(':');
    const app = REVERSE_APP_DICT[appPart] || appPart;
    
    const route: AppRoute = { app };
    
    if (paramsPart) {
      route.params = {};
      for (const param of paramsPart.split('&')) {
        const [key, value] = param.split('=');
        if (key && value) {
          route.params[key] = value;
        }
      }
    }
    
    routes.push(route);
  }
  
  const activeApp = activePart ? (REVERSE_APP_DICT[activePart] || activePart) : undefined;
  
  return { routes, activeApp };
};

/**
 * Base64 encode for URL safety (using URL-safe variant)
 */
const encodeForUrl = (str: string): string => {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, ''); // Remove padding
};

/**
 * Base64 decode from URL-safe format
 */
const decodeFromUrl = (str: string): string => {
  // Add padding back
  const padded = str + '==='.slice((str.length + 3) % 4);
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  return atob(base64);
};

export interface AppRoute {
  app: string;
  params?: Record<string, string>;
}

export interface DesktopRoute {
  windows: AppRoute[];
  activeWindow?: string;
}

/**
 * Converts window state to URL route format
 */
export const windowToRoute = (window: WindowState): AppRoute => {
  const route: AppRoute = {
    app: window.component
  };

  // Add specific parameters based on window type
  if (window.data) {
    if (window.component === 'text-viewer' && window.data.fileName) {
      // Remove .txt extension for cleaner URLs
      const fileName = (window.data.fileName as string).replace('.txt', '');
      route.params = { file: fileName };
    } else if (window.component === 'website-viewer' && window.data.url) {
      route.params = { url: encodeURIComponent(window.data.url as string) };
    } else if (window.component === 'games-library' && window.data.selectedGame) {
      route.params = { game: window.data.selectedGame as string };
    }
  }

  return route;
};

/**
 * Converts URL route to window data format
 */
export const routeToWindowData = (route: AppRoute): Partial<WindowState> => {
  // Validate parameters first
  const validatedParams = route.params ? validateAppParams(route.app, route.params) : null;
  
  const windowData: Partial<WindowState> = {
    component: route.app as any,
    title: getWindowTitle(route.app, validatedParams || undefined),
  };

  // Add specific data based on app type - only if params are valid
  if (validatedParams) {
    switch (route.app) {
      case 'text-viewer':
        if (validatedParams.file) {
          // Add .txt extension back when creating window data
          const fileName = validatedParams.file.endsWith('.txt') ? validatedParams.file : `${validatedParams.file}.txt`;
          windowData.data = { fileName };
        }
        break;
      case 'website-viewer':
        if (validatedParams.url) {
          windowData.data = { url: decodeURIComponent(validatedParams.url) };
        }
        break;
      case 'games-library':
        if (validatedParams.game) {
          windowData.data = { selectedGame: validatedParams.game };
        }
        break;
    }
  }

  return windowData;
};

/**
 * Gets the appropriate window title for an app
 */
const getWindowTitle = (app: string, params?: Record<string, string>): string => {
  switch (app) {
    case 'about':
      return 'About';
    case 'text-viewer':
      return params?.file || 'Text Viewer';
    case 'website-viewer':
      return 'Website Viewer';
    case 'sticker-pack':
      return 'Sticker Pack';
    case 'twitch-chat':
      return 'Twitch Chat';
    case 'games-library':
      return 'Games Library';
    case 'streamer-software':
      return 'Streamer Software';
    default:
      return app.charAt(0).toUpperCase() + app.slice(1);
  }
};

/**
 * Encodes desktop state to URL path
 */
export const encodeDesktopState = (windows: WindowState[], activeWindowId?: string): string => {
  if (windows.length === 0) {
    return '/';
  }

  const routes = windows.map(windowToRoute);
  const activeWindow = activeWindowId ? windows.find(w => w.id === activeWindowId) : undefined;
  
  if (routes.length === 1) {
    const route = routes[0];
    const params = route.params ? 
      '?' + new URLSearchParams(route.params).toString() : '';
    return `/${route.app}${params}`;
  }

  // Multiple windows - use compact encoding
  const desktopRoutes = windows.map(windowToRoute);
  const activeApp = activeWindow ? windowToRoute(activeWindow).app : undefined;
  
  const compactState = compressDesktopState(desktopRoutes, activeApp);
  const encodedState = encodeForUrl(compactState);

  return `/desktop?d=${encodedState}`;
};

/**
 * Decodes URL path to desktop state
 */
export const decodeDesktopState = (pathname: string, search: string): {
  windows: Partial<WindowState>[];
  activeApp?: string;
} => {
  const urlParams = new URLSearchParams(search);
  
  // Handle compact desktop URLs like /desktop?d=encodedState
  if (pathname === '/desktop' && urlParams.has('d')) {
    const encodedState = urlParams.get('d');
    
    if (!encodedState) {
      console.warn('Missing desktop state data');
      return { windows: [] };
    }
    
    try {
      const compactState = decodeFromUrl(encodedState);
      const { routes, activeApp } = decompressDesktopState(compactState);
      
      // Limit number of windows to prevent abuse
      if (routes.length > 10) {
        console.warn('Too many windows in desktop state, limiting to 10');
        routes.splice(10);
      }
      
      // Convert routes to window states
      const windows = routes.map(routeToWindowData);
      
      return { windows, activeApp };
    } catch (error) {
      console.warn('Failed to decode desktop state:', error);
      return { windows: [] };
    }
  }
  
  // Legacy support for hash-based URLs (for backwards compatibility)
  if (pathname === '/desktop' && urlParams.has('s')) {
    console.warn('Legacy hash-based desktop URLs are no longer supported');
    return { windows: [] };
  }

  // Handle single app routes
  if (pathname !== '/' && pathname !== '/desktop') {
    const app = pathname.slice(1); // Remove leading slash
    
    // Validate app name
    if (!/^[a-zA-Z0-9\-_]+$/.test(app) || app.length > 50) {
      console.warn('Invalid app name in URL:', app);
      return { windows: [] };
    }
    
    const params = Object.fromEntries(urlParams.entries());
    
    const route: AppRoute = { app, params: Object.keys(params).length > 0 ? params : undefined };
    
    return {
      windows: [routeToWindowData(route)],
      activeApp: app
    };
  }

  return { windows: [] };
};

/**
 * Gets a shareable URL for the current desktop state
 */
export const getShareableUrl = (windows: WindowState[], activeWindowId?: string): string => {
  const path = encodeDesktopState(windows, activeWindowId);
  return `${globalThis.location.origin}${path}`;
};

/**
 * Gets a shareable URL for a specific window
 */
export const getShareableWindowUrl = (window: WindowState): string => {
  const route = windowToRoute(window);
  const params = route.params ? 
    '?' + new URLSearchParams(route.params).toString() : '';
  return `${globalThis.location.origin}/${route.app}${params}`;
};
