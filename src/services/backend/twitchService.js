// Backend Twitch API service for secure token management and API proxying
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class TwitchService {
  constructor() {
    this.clientId = process.env.TWITCH_CLIENT_ID;
    this.clientSecret = process.env.TWITCH_CLIENT_SECRET;
    this.redirectUri = process.env.TWITCH_REDIRECT_URI;
    this.accessToken = null;
    this.tokenExpiration = 0;
    this.refreshToken = null;
    
    // Internal caching for API responses
    this.cache = new Map();
    this.CACHE_TTL = {
      stream: 30 * 1000,    // 30 seconds for stream data
      user: 300 * 1000,     // 5 minutes for user data
      token: 3600 * 1000    // 1 hour for tokens
    };

    console.log('🔧 Twitch Service initialized:');
    console.log('   Client ID:', this.clientId ? `${this.clientId.slice(0, 8)}...` : 'NOT SET');

    if (!this.clientId || !this.clientSecret) {
      console.warn('⚠️ Twitch Client ID or Secret not configured. Twitch features will use demo mode.');
    }
    
    // Periodic cache cleanup
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > value.ttl) {
          this.cache.delete(key);
        }
      }
    }, 5 * 60 * 1000); // Clean every 5 minutes
  }
  
  // Generic cache helper
  getCached(key, ttl) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    return null;
  }
  
  setCache(key, data, ttl) {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  // Get app access token using client credentials flow (for public data)
  async getAppAccessToken() {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiration) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      console.warn('Twitch credentials not configured, returning demo token');
      this.accessToken = 'demo_token_' + Date.now();
      this.tokenExpiration = Date.now() + (3600 * 1000); // 1 hour
      return this.accessToken;
    }

    try {
      const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'client_credentials'
        })
      });

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiration = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 min early
      
      return this.accessToken;
    } catch (error) {
      console.error('Failed to get Twitch app access token:', error);
      // Fallback to demo mode
      this.accessToken = 'demo_token_' + Date.now();
      this.tokenExpiration = Date.now() + (3600 * 1000);
      return this.accessToken;
    }
  }

  // Check if we're in demo mode
  isDemoMode(token) {
    return !token || token.startsWith('demo_token_');
  }

  // Make authenticated API call to Twitch
  async makeApiCall(endpoint, userToken = null) {
    const token = userToken || await this.getAppAccessToken();
    
    if (this.isDemoMode(token)) {
      console.log('Demo mode: Returning simulated data for', endpoint);
      return this.getSimulatedResponse(endpoint);
    }

    try {
      const response = await fetch(`https://api.twitch.tv/helix${endpoint}`, {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Twitch API call failed:', error);
      // Fallback to simulated data on error
      return this.getSimulatedResponse(endpoint);
    }
  }

  // Get stream status for a channel with caching
  async getStreamStatus(username) {
    const cacheKey = `stream_${username}`;
    const cached = this.getCached(cacheKey, this.CACHE_TTL.stream);
    if (cached) {
      return { ...cached, cached: true };
    }
    
    try {
      // First get user ID
      const userResponse = await this.makeApiCall(`/users?login=${username}`);
      
      if (!userResponse.data || userResponse.data.length === 0) {
        const result = { isLive: false, error: 'User not found' };
        this.setCache(cacheKey, result, this.CACHE_TTL.stream);
        return result;
      }

      const userId = userResponse.data[0].id;
      
      // Check stream status
      const streamResponse = await this.makeApiCall(`/streams?user_id=${userId}`);
      
      let result;
      if (streamResponse.data && streamResponse.data.length > 0) {
        const stream = streamResponse.data[0];
        result = {
          isLive: true,
          streamData: {
            id: stream.id,
            user_id: stream.user_id,
            user_login: stream.user_login,
            user_name: stream.user_name,
            game_id: stream.game_id,
            game_name: stream.game_name,
            type: stream.type,
            title: stream.title,
            viewer_count: stream.viewer_count,
            started_at: stream.started_at,
            language: stream.language,
            thumbnail_url: stream.thumbnail_url,
            tag_ids: stream.tag_ids || [],
            is_mature: stream.is_mature
          }
        };
      } else {
        result = { isLive: false };
      }
      
      this.setCache(cacheKey, result, this.CACHE_TTL.stream);
      return result;
    } catch (error) {
      console.error('Error getting stream status:', error);
      const result = { isLive: false, error: error.message };
      this.setCache(cacheKey, result, this.CACHE_TTL.stream);
      return result;
    }
  }

  // Get user information with caching
  async getUserInfo(username) {
    const cacheKey = `user_${username}`;
    const cached = this.getCached(cacheKey, this.CACHE_TTL.user);
    if (cached) {
      return { ...cached, cached: true };
    }
    
    try {
      const response = await this.makeApiCall(`/users?login=${username}`);
      const result = response.data && response.data.length > 0 ? response.data[0] : null;
      this.setCache(cacheKey, result, this.CACHE_TTL.user);
      return result;
    } catch (error) {
      console.error('Error getting user info:', error);
      const result = null;
      this.setCache(cacheKey, result, this.CACHE_TTL.user);
      return result;
    }
  }

  // Simulated responses for demo mode
  getSimulatedResponse(endpoint) {
    if (endpoint.includes('/streams')) {
      // Simulate live stream occasionally (every 10 minutes)
      const now = Date.now();
      const cycleTime = 10 * 60 * 1000; // 10 minutes
      const isLiveCycle = Math.floor(now / cycleTime) % 2 === 0; // Alternate every 10 minutes
      
      if (isLiveCycle) {
        return {
          data: [{
            id: 'demo_stream_123',
            user_id: '123456789',
            user_login: 'jesski',
            user_name: 'Jesski',
            game_id: '509658',
            game_name: 'Just Chatting',
            type: 'live',
            title: 'Testing the desktop site! Come hang out!',
            viewer_count: Math.floor(Math.random() * 50) + 20, // 20-70 viewers
            started_at: new Date(now - (Math.random() * 3600000)).toISOString(), // Started 0-1 hours ago
            language: 'en',
            thumbnail_url: 'https://via.placeholder.com/1920x1080.jpg?text=Live+Stream',
            tag_ids: [],
            is_mature: false
          }]
        };
      } else {
        return { data: [] };
      }
    }
    
    if (endpoint.includes('/users')) {
      return {
        data: [{
          id: '123456789',
          login: 'demo_user',
          display_name: 'Demo User',
          profile_image_url: 'https://via.placeholder.com/300x300.png?text=Demo+User'
        }]
      };
    }
    
    return { data: [] };
  }
}

export const twitchService = new TwitchService();
