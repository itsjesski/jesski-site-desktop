// Twitch API service for checking stream status
interface TwitchTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
}

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

interface TwitchStreamsResponse {
  data: TwitchStreamData[]
  pagination: {
    cursor?: string
  }
}

class TwitchAPI {
  private clientId: string
  private clientSecret: string
  private accessToken: string | null = null
  private tokenExpiration: number = 0

  constructor() {
    this.clientId = import.meta.env.VITE_TWITCH_CLIENT_ID
    this.clientSecret = import.meta.env.VITE_TWITCH_CLIENT_SECRET

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Twitch API credentials not found in environment variables')
    }
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiration) {
      return this.accessToken
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
          grant_type: 'client_credentials',
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.status}`)
      }

      const data: TwitchTokenResponse = await response.json()
      this.accessToken = data.access_token
      this.tokenExpiration = Date.now() + (data.expires_in * 1000) - 60000 // Refresh 1 minute early

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
      const accessToken = await this.getAccessToken()

      const response = await fetch(
        `https://api.twitch.tv/helix/streams?user_login=${username}`,
        {
          headers: {
            'Client-ID': this.clientId,
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to check stream status: ${response.status}`)
      }

      const data: TwitchStreamsResponse = await response.json()
      const isLive = data.data.length > 0
      const streamData = isLive ? data.data[0] : undefined

      return { isLive, streamData }
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
}

// Create a singleton instance
export const twitchAPI = new TwitchAPI()

// Export types for use in components
export type { TwitchStreamData }
