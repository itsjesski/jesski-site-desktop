const getApiBaseUrl = () => {
  if (import.meta.env.PROD) {
    const currentHost = window.location.host;
    
    if (currentHost.includes('jesski.com')) {
      return `https://${currentHost}`;
    }
    
    if (currentHost.includes('ondigitalocean.app')) {
      return `https://${currentHost}`;
    }
    
    return '';
  }
  
  const currentPort = window.location.port;
  if (currentPort === '5173') {
    return 'http://localhost:8080';
  } else if (currentPort === '8080') {
    return '';
  }
  
  // Default fallback
  return 'http://localhost:8080';
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  health: '/api/health',
  token: '/api/token',
  twitch: {
    stream: (channel: string) => `/api/twitch/stream/${channel}`,
    user: (username: string) => `/api/twitch/user/${username}`,
  },
  affirmations: {
    random: '/api/affirmations/random',
    multiple: '/api/affirmations/multiple',
    info: '/api/affirmations/info'
  },
  garden: {
    ws: '/garden/ws',
    actions: '/api/garden/actions',
    state: '/api/garden/state'
  }
};

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;
let tokenInitialized = false;
let tokenInitializePromise: Promise<string> | null = null;
let tokenRefreshTimer: number | null = null;

// Proactive token refresh - refresh when 15 minutes remain
const TOKEN_REFRESH_THRESHOLD = 15 * 60 * 1000; // 15 minutes in ms

function scheduleTokenRefresh(expiryTime: number) {
  if (tokenRefreshTimer) {
    clearTimeout(tokenRefreshTimer);
  }
  
  const refreshTime = expiryTime - TOKEN_REFRESH_THRESHOLD;
  const now = Date.now();
  
  if (refreshTime > now) {
    tokenRefreshTimer = setTimeout(async () => {
      try {
        console.log('Proactively refreshing token...');
        await getAuthToken(); // This will refresh the token
      } catch (err) {
        console.error('Failed to proactively refresh token:', err);
      }
    }, refreshTime - now);
  }
}

export function initializeAuthToken(): Promise<string> {
  if (tokenInitialized) {
    return Promise.resolve(cachedToken || '');
  }
  
  if (tokenInitializePromise) {
    return tokenInitializePromise;
  }

  tokenInitializePromise = new Promise<string>((resolve, reject) => {
    fetch(`${API_BASE_URL}${API_ENDPOINTS.token}`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to get token: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      cachedToken = data.token;
      tokenExpiry = Date.now() + (data.expiresIn * 1000 || 3600000);
      tokenInitialized = true;
      
      // Schedule proactive refresh
      if (tokenExpiry) {
        scheduleTokenRefresh(tokenExpiry);
      }
      
      resolve(data.token);
    })
    .catch(err => {
      console.error('Error initializing auth token:', err);
      tokenInitializePromise = null;
      reject(err);
    });
  });

  return tokenInitializePromise;
}

export async function getAuthToken(): Promise<string> {
  if (!tokenInitialized) {
    return initializeAuthToken();
  }
  
  const now = Date.now();
  
  if (cachedToken && tokenExpiry && now < tokenExpiry - 300000) {
    return cachedToken;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.token}`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 429) {
        throw new Error(errorData.error || 'Rate limited: Too many requests');
      }
      throw new Error(`Failed to get token: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.token || typeof data.token !== 'string') {
      throw new Error('Invalid token received from server');
    }
    
    cachedToken = data.token;
    tokenExpiry = now + (data.expiresIn * 1000 || 3600000);
    
    // Schedule proactive refresh
    if (tokenExpiry) {
      scheduleTokenRefresh(tokenExpiry);
    }
    
    return data.token;
  } catch (error) {
    console.error('Error fetching auth token:', error);
    throw new Error('Failed to get authentication token');
  }
}

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

// Helper function for authenticated API calls
export async function authApiCall(endpoint: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  
  const authOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  
  return apiCall(endpoint, authOptions);
}
