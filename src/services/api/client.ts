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

  const currentHostname = window.location.hostname;
  const isLocalDevHost = currentHostname === 'localhost' || currentHostname === '127.0.0.1';

  if (isLocalDevHost) {
    return '';
  }

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

type TokenResponse = {
  token: string;
  expiresIn?: number;
};

async function requestTokenFromApi(): Promise<TokenResponse> {
  const tokenUrl = `${API_BASE_URL}${API_ENDPOINTS.token}`;

  const tryParseError = async (response: Response) => {
    const data = await response.json().catch(() => ({}));
    if (data && typeof data.error === 'string') {
      return data.error;
    }
    return `Failed to get token: ${response.status}`;
  };

  let postError: string | null = null;

  try {
    const postResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (postResponse.ok) {
      const data = await postResponse.json();
      if (data?.token && typeof data.token === 'string') {
        return data as TokenResponse;
      }
      throw new Error('Invalid token payload from POST /api/token');
    }

    postError = await tryParseError(postResponse);
  } catch (error) {
    postError = error instanceof Error ? error.message : 'POST /api/token failed';
  }

  const getResponse = await fetch(tokenUrl, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!getResponse.ok) {
    const getError = await tryParseError(getResponse);
    throw new Error(`${postError || 'POST /api/token failed'}; fallback GET failed: ${getError}`);
  }

  const getData = await getResponse.json();
  if (!getData?.token || typeof getData.token !== 'string') {
    throw new Error('Invalid token payload from GET /api/token');
  }

  return getData as TokenResponse;
}

export function initializeAuthToken(): Promise<string> {
  if (tokenInitialized) {
    return Promise.resolve(cachedToken || '');
  }
  
  if (tokenInitializePromise) {
    return tokenInitializePromise;
  }

  tokenInitializePromise = new Promise<string>((resolve, reject) => {
    requestTokenFromApi()
      .then(data => {
        cachedToken = data.token;
        tokenExpiry = Date.now() + ((data.expiresIn || 3600) * 1000);
        tokenInitialized = true;

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
    const data = await requestTokenFromApi();
    
    cachedToken = data.token;
    tokenExpiry = now + ((data.expiresIn || 3600) * 1000);
    
    // Schedule proactive refresh
    if (tokenExpiry) {
      scheduleTokenRefresh(tokenExpiry);
    }
    
    return data.token;
  } catch (error) {
    console.error('Error fetching auth token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown token error';
    throw new Error(`Failed to get authentication token: ${errorMessage}`);
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
