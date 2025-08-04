import { API_ENDPOINTS, authApiCall, initializeAuthToken } from './client'
import type { TwitchStreamData, TwitchFollower, TwitchSubscriber, TwitchUser } from '../../types/twitch'

export class TwitchAPIClient {
  private isConnected: boolean = false
  private lastConnectionAttempt: number = 0
  private connectionRetryInterval: number = 300000

  constructor() {
    initializeAuthToken().catch(err => console.error('Failed to initialize token:', err));
    
    this.connect()
    
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        this.refreshConnection()
      })
      
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.refreshConnection()
        }
      })
    }
  }

  // Automatically connect to Twitch (no user auth required)
  private async connect(): Promise<void> {
    // Prevent too frequent connection attempts
    if (Date.now() - this.lastConnectionAttempt < this.connectionRetryInterval) {
      return
    }

    this.lastConnectionAttempt = Date.now()

    try {
      // Test connection by trying to get health endpoint
      await authApiCall('/api/health')
      this.isConnected = true
    } catch (error) {
      this.isConnected = false
    }
  }

  isApiConnected(): boolean {
    return this.isConnected
  }

  private async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      await this.connect()
    }
  }

  async isStreamLive(username: string): Promise<{
    isLive: boolean
    streamData?: TwitchStreamData
  }> {
    await this.ensureConnection()
    const response = await authApiCall(API_ENDPOINTS.twitch.stream(username))
    return response
  }

  // Get user information
  async getUserInfo(username: string): Promise<TwitchUser | null> {
    await this.ensureConnection()
    const response = await authApiCall(API_ENDPOINTS.twitch.user(username))
    return response
  }

  // Get followers (endpoint not available - returns empty data)
  async getFollowers(_limit: number = 20): Promise<TwitchFollower[]> {
    // Followers endpoint not implemented in backend
    return []
  }

  // Get subscribers (endpoint not available - returns empty data)
  async getSubscribers(_limit: number = 20): Promise<TwitchSubscriber[]> {
    // Subscribers endpoint not implemented in backend
    return []
  }

  // Auto-reconnect when stream goes live or on window focus
  async refreshConnection(): Promise<void> {
    this.isConnected = false
    this.lastConnectionAttempt = 0 // Reset retry timer
    await this.connect()
  }
}

// Create a singleton instance
export const twitchAPI = new TwitchAPIClient()

// Export types for use in components
export type { TwitchStreamData, TwitchFollower, TwitchSubscriber, TwitchUser }
