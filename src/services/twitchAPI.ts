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
      console.log('Note: Using simulated token for demo purposes')
      console.log('In production, implement a backend proxy for secure Twitch API authentication')
      
      // For demo purposes, we'll simulate a token
      // In production, you need a backend service to handle client credentials securely
      this.accessToken = 'demo_token_' + Date.now()
      this.tokenExpiration = Date.now() + (3600 * 1000) // 1 hour

      return this.accessToken
    } catch (error) {
      console.error('Error getting Twitch access token:', error)
      throw error
    }
  }

  async isStreamLive(username: string): Promise<{
    isLive: boolean
    streamData?: TwitchStreamData
  }> {
    try {
      console.log('Note: Using simulated stream data for demo purposes')
      
      // For demo purposes, randomly simulate stream status
      // In production, you would make real API calls through a backend proxy
      const isLive = Math.random() > 0.7 // 30% chance of being live for demo
      
      if (isLive) {
        const streamData: TwitchStreamData = {
          id: 'demo_stream_id',
          user_id: 'demo_user_id',
          user_login: username,
          user_name: username.charAt(0).toUpperCase() + username.slice(1),
          game_id: '518203',
          game_name: 'Just Chatting',
          type: 'live',
          title: '🐕 Coding and Chatting with my cute doggy ears! 💻✨',
          viewer_count: 0, // Not displayed in UI
          started_at: new Date(Date.now() - Math.random() * 3600000).toISOString(), // Started within last hour
          language: 'en',
          thumbnail_url: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_jesski-{width}x{height}.jpg',
          tag_ids: [],
          is_mature: false
        }
        
        return { isLive: true, streamData }
      }
      
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
