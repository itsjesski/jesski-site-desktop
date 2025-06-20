// API configuration for different environments
const getApiBaseUrl = () => {
  // In production, determine base URL from current host
  if (import.meta.env.PROD) {
    const currentHost = window.location.host;
    
    // If we're on the main domain, use that
    if (currentHost.includes('jesski.com')) {
      return `https://${currentHost}`;
    }
    
    // If we're on Digital Ocean, use that
    if (currentHost.includes('ondigitalocean.app')) {
      return `https://${currentHost}`;
    }
    
    // Fallback to relative URLs
    return '';
  }
  
  // Development - check if we're running on Vite dev server
  const currentPort = window.location.port;
  if (currentPort === '5173') {
    // Vite dev server - API server is on 8080
    return 'http://localhost:8080';
  } else if (currentPort === '8080') {
    // Express server serving static files - API is on same port
    return '';
  }
  
  // Default fallback
  return 'http://localhost:8080';
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  health: '/api/health',
  twitch: {
    stream: (channel: string) => `/api/twitch/stream/${channel}`,
    user: (username: string) => `/api/twitch/user/${username}`,
  }
};

// Helper function for API calls
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}
