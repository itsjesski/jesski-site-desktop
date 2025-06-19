// Twitch API service for checking stream status

interface TwitchStreamData {
  id: string
  user_id: string
  user_login: string
  user_name: string
  game_id: string
  game_name: string
  type: string
  title: string
  viewer_count: number
  started_at: string
  language: string
  thumbnail_url: string
  tag_ids: string[]
  is_mature: boolean
}

interface TwitchFollower {
  user_id: string
  user_name: string
  user_login: string
  followed_at: string
}

interface TwitchFollowersResponse {
  data: TwitchFollower[]
  total: number
  pagination: {
    cursor?: string
  }
}

interface TwitchSubscriber {
  user_id: string
  user_name: string
  user_login: string
  tier: string
  is_gift: boolean
  gifter_id?: string
  gifter_name?: string
}

interface TwitchSubscribersResponse {
  data: TwitchSubscriber[]
  pagination: {
    cursor?: string
  }
}

class TwitchAPI {
  private clientId: string
  private accessToken: string | null = null
  private tokenExpiration: number = 0

  constructor() {
    this.clientId = import.meta.env.VITE_TWITCH_CLIENT_ID || ''
    
    if (!this.clientId) {
      console.warn('Twitch Client ID not configured')
    }
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiration) {
      return this.accessToken
    }

    try {
      // Try to get a real access token using client credentials flow
      // Note: This will fail in browsers due to CORS and security restrictions
      // In production, you should implement a backend proxy for this
      
      const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: '', // Can't include this in frontend for security
          grant_type: 'client_credentials'
        })
      })

      if (response.ok) {
        const data = await response.json()
        this.accessToken = data.access_token
        this.tokenExpiration = Date.now() + (data.expires_in * 1000)
        console.log('Successfully obtained Twitch access token')
        return this.accessToken!
      } else {
        throw new Error(`Token request failed: ${response.status}`)
      }
    } catch (error) {
      console.warn('Failed to get real Twitch token (expected in browser environment):', error)
      console.log('Using demo mode - implement a backend proxy for real API access')
      
      // Fallback to demo token for development
      this.accessToken = 'demo_token_' + Date.now()
      this.tokenExpiration = Date.now() + (3600 * 1000) // 1 hour
      return this.accessToken
    }
  }

  async isStreamLive(username: string): Promise<{
    isLive: boolean
    streamData?: TwitchStreamData
  }> {
    try {
      // Get access token for API calls
      const accessToken = await this.getAccessToken()
      
      // Check if we're in demo mode (token starts with 'demo_token_')
      if (accessToken.startsWith('demo_token_')) {
        console.log('Demo mode: Using simulated stream status')
        // In demo mode, return offline status unless you want to test
        // Change this line to return { isLive: true, streamData: {...} } to test the stream window
        return { isLive: false }
      }
      
      // Real API mode - make actual calls to Twitch
      console.log('Real API mode: Checking actual stream status for', username)
      
      // First get the user info to get the user ID
      const userResponse = await fetch(
        `https://api.twitch.tv/helix/users?login=${username}`,
        {
          headers: {
            'Client-ID': this.clientId,
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (!userResponse.ok) {
        console.warn('Failed to get user info:', userResponse.status)
        return { isLive: false }
      }

      const userData = await userResponse.json()
      if (!userData.data || userData.data.length === 0) {
        console.warn('User not found:', username)
        return { isLive: false }
      }

      const userId = userData.data[0].id

      // Now check if the stream is live
      const streamResponse = await fetch(
        `https://api.twitch.tv/helix/streams?user_id=${userId}`,
        {
          headers: {
            'Client-ID': this.clientId,
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (!streamResponse.ok) {
        console.warn('Failed to get stream status:', streamResponse.status)
        return { isLive: false }
      }

      const streamData = await streamResponse.json()
      
      if (streamData.data && streamData.data.length > 0) {
        // Stream is live!
        const stream = streamData.data[0]
        const twitchStreamData: TwitchStreamData = {
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
        
        console.log('🔴 Stream is LIVE:', stream.title)
        return { isLive: true, streamData: twitchStreamData }
      }
      
      // Stream is offline
      console.log('⚫ Stream is OFFLINE')
      return { isLive: false }
    } catch (error) {
      console.error('Error checking stream status:', error)
      // Return false on error to gracefully handle API failures
      return { isLive: false }
    }
  }

  async getUserInfo(username: string): Promise<{
    id: string
    login: string
    display_name: string
    profile_image_url: string
  } | null> {
    try {
      const accessToken = await this.getAccessToken()

      const response = await fetch(
        `https://api.twitch.tv/helix/users?login=${username}`,
        {
          headers: {
            'Client-ID': this.clientId,
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to get user info: ${response.status}`)
      }

      const data = await response.json()
      return data.data.length > 0 ? data.data[0] : null
    } catch (error) {
      console.error('Error getting user info:', error)
      return null
    }
  }

  async getFollowers(userId: string = 'default', limit: number = 3): Promise<TwitchFollower[]> {
    try {
      const accessToken = await this.getAccessToken()

      const response = await fetch(
        `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${userId}&first=${limit}`,
        {
          headers: {
            'Client-ID': this.clientId,
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        // Followers endpoint requires special permissions, so fall back to simulated data
        console.warn('Failed to fetch real followers, using simulated data')
        return this.getSimulatedFollowers(limit)
      }

      const data: TwitchFollowersResponse = await response.json()
      return data.data
    } catch (error) {
      console.error('Error getting followers:', error)
      return this.getSimulatedFollowers(limit)
    }
  }

  async getSubscribers(userId: string = 'default', limit: number = 3): Promise<TwitchSubscriber[]> {
    try {
      const accessToken = await this.getAccessToken()

      const response = await fetch(
        `https://api.twitch.tv/helix/subscriptions?broadcaster_id=${userId}&first=${limit}`,
        {
          headers: {
            'Client-ID': this.clientId,
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        // Subscribers endpoint requires special permissions, so fall back to simulated data
        console.warn('Failed to fetch real subscribers, using simulated data')
        return this.getSimulatedSubscribers(limit)
      }

      const data: TwitchSubscribersResponse = await response.json()
      return data.data
    } catch (error) {
      console.error('Error getting subscribers:', error)
      return this.getSimulatedSubscribers(limit)
    }
  }

  private getSimulatedFollowers(limit: number): TwitchFollower[] {
    const now = Date.now()
    const followers = [
      { user_id: '1', user_name: 'CutePuppy123', user_login: 'cutepuppy123', followed_at: new Date(now - 180000).toISOString() }, // 3 min ago
      { user_id: '2', user_name: 'GamerDog99', user_login: 'gamerdog99', followed_at: new Date(now - 720000).toISOString() }, // 12 min ago
      { user_id: '3', user_name: 'StreamFan', user_login: 'streamfan', followed_at: new Date(now - 1800000).toISOString() }, // 30 min ago
      { user_id: '4', user_name: 'NewViewer', user_login: 'newviewer', followed_at: new Date(now - 2700000).toISOString() }, // 45 min ago
      { user_id: '5', user_name: 'DoggieFollower', user_login: 'doggiefollower', followed_at: new Date(now - 3600000).toISOString() }, // 1 hour ago
    ]
    return followers.slice(0, limit)
  }

  private getSimulatedSubscribers(limit: number): TwitchSubscriber[] {
    const subscribers = [
      { user_id: '4', user_name: 'LoyalViewer', user_login: 'loyalviewer', tier: '1000', is_gift: false },
      { user_id: '5', user_name: 'SuperFan', user_login: 'superfan', tier: '2000', is_gift: false },
      { user_id: '6', user_name: 'GiftedSub', user_login: 'giftedsub', tier: '1000', is_gift: true, gifter_name: 'GenerousViewer' },
      { user_id: '7', user_name: 'TierThree', user_login: 'tierthree', tier: '3000', is_gift: false },
    ]
    return subscribers.slice(0, limit)
  }
}

// Create a singleton instance
export const twitchAPI = new TwitchAPI()

// Export types for use in components
export type { TwitchStreamData, TwitchFollower, TwitchSubscriber }
