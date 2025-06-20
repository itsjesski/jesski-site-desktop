// API configuration for future server integration
export const API_BASE_URL = import.meta.env.PROD 
  ? '' // Use relative URLs in production
  : 'http://localhost:8080'; // Use localhost in development

export const API_ENDPOINTS = {
  health: '/api/health',
  twitch: {
    auth: '/api/twitch/auth',
    token: '/api/twitch/token',
    stream: (channel: string) => `/api/twitch/stream/${channel}`,
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
