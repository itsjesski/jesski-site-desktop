import { API_ENDPOINTS, authApiCall, initializeAuthToken } from './client'
import type { TwitchStreamData, TwitchFollower, TwitchSubscriber, TwitchUser } from '../../types/twitch'

class TwitchAPIClient {
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
    } catch {
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
    try {
      await this.ensureConnection()
      
      if (!this.isConnected) {
        // Fallback to demo mode with cycling live/offline status
        return this.getDemoStreamStatus()
      }
      
      const response = await authApiCall(API_ENDPOINTS.twitch.stream(username))
      return response
    } catch {
      return this.getDemoStreamStatus()
    }
  }

  // Get user information
  async getUserInfo(username: string): Promise<TwitchUser | null> {
    try {
      await this.ensureConnection()
      
      if (!this.isConnected) {
        return this.getDemoUserInfo(username)
      }
      
      const response = await authApiCall(API_ENDPOINTS.twitch.user(username))
      return response
    } catch {
      return this.getDemoUserInfo(username)
    }
  }

  // Get followers (always returns fake data - no backend call needed)
  async getFollowers(limit: number = 20): Promise<TwitchFollower[]> {
    return this.getDemoFollowers(limit)
  }

  // Get subscribers (always returns fake data - no backend call needed)
  async getSubscribers(limit: number = 20): Promise<TwitchSubscriber[]> {
    return this.getDemoSubscribers(limit)
  }

  // Auto-reconnect when stream goes live or on window focus
  async refreshConnection(): Promise<void> {
    this.isConnected = false
    this.lastConnectionAttempt = 0 // Reset retry timer
    await this.connect()
  }

  // Demo mode fallback methods
  private getDemoStreamStatus(): { isLive: boolean; streamData?: TwitchStreamData } {
    // Simulate live stream occasionally (every 10 minutes)
    const now = Date.now()
    const cycleTime = 10 * 60 * 1000 // 10 minutes
    const isLiveCycle = Math.floor(now / cycleTime) % 2 === 0 // Alternate every 10 minutes
    
    if (isLiveCycle) {
      return {
        isLive: true,
        streamData: {
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
        }
      }
    } else {
      return { isLive: false }
    }
  }

  private getDemoUserInfo(username: string): TwitchUser {
    return {
      id: '123456789',
      login: username,
      display_name: username.charAt(0).toUpperCase() + username.slice(1),
      profile_image_url: 'https://via.placeholder.com/300x300.png?text=Demo+User',
      offline_image_url: 'https://via.placeholder.com/1920x1080.jpg?text=Offline',
      type: '',
      broadcaster_type: 'affiliate',
      description: 'Demo user for testing',
      view_count: Math.floor(Math.random() * 5000),
      created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString() // About a year ago
    }
  }

  private getDemoFollowers(limit: number): TwitchFollower[] {
    const now = Date.now()
    const followers = [
      { user_id: '1', user_name: 'CutePuppy123', user_login: 'cutepuppy123', followed_at: new Date(now - 180000).toISOString() }, // 3 min ago
      { user_id: '2', user_name: 'GamerDog99', user_login: 'gamerdog99', followed_at: new Date(now - 720000).toISOString() }, // 12 min ago
      { user_id: '3', user_name: 'StreamFan', user_login: 'streamfan', followed_at: new Date(now - 1800000).toISOString() }, // 30 min ago
      { user_id: '4', user_name: 'NewViewer', user_login: 'newviewer', followed_at: new Date(now - 2700000).toISOString() }, // 45 min ago
      { user_id: '5', user_name: 'DoggieFollower', user_login: 'doggiefollower', followed_at: new Date(now - 3600000).toISOString() }, // 1 hour ago
      { user_id: '6', user_name: 'RetroGamer42', user_login: 'retrogamer42', followed_at: new Date(now - 7200000).toISOString() }, // 2 hours ago
      { user_id: '7', user_name: 'ChillVibes', user_login: 'chillvibes', followed_at: new Date(now - 14400000).toISOString() }, // 4 hours ago
      { user_id: '8', user_name: 'NightOwl88', user_login: 'nightowl88', followed_at: new Date(now - 21600000).toISOString() }, // 6 hours ago
      { user_id: '9', user_name: 'CoffeeAddict', user_login: 'coffeeaddict', followed_at: new Date(now - 43200000).toISOString() }, // 12 hours ago
      { user_id: '10', user_name: 'MorningPerson', user_login: 'morningperson', followed_at: new Date(now - 64800000).toISOString() }, // 18 hours ago
    ]
    return followers.slice(0, limit)
  }

  private getDemoSubscribers(limit: number): TwitchSubscriber[] {
    const now = Date.now()
    const subscribers = [
      { 
        user_id: '11', 
        user_name: 'LoyalViewer', 
        user_login: 'loyalviewer', 
        tier: '1000', 
        is_gift: false,
        subscribed_at: new Date(now - 900000).toISOString() // 15 min ago
      },
      { 
        user_id: '12', 
        user_name: 'SuperFan', 
        user_login: 'superfan', 
        tier: '2000', 
        is_gift: false,
        subscribed_at: new Date(now - 5400000).toISOString() // 1.5 hours ago
      },
      { 
        user_id: '13', 
        user_name: 'GiftedSub', 
        user_login: 'giftedsub', 
        tier: '1000', 
        is_gift: true, 
        gifter_name: 'GenerousViewer',
        subscribed_at: new Date(now - 10800000).toISOString() // 3 hours ago
      },
      { 
        user_id: '14', 
        user_name: 'TierThree', 
        user_login: 'tierthree', 
        tier: '3000', 
        is_gift: false,
        subscribed_at: new Date(now - 86400000).toISOString() // 1 day ago
      },
      { 
        user_id: '15', 
        user_name: 'WeeklySupporter', 
        user_login: 'weeklysupporter', 
        tier: '1000', 
        is_gift: false,
        subscribed_at: new Date(now - 259200000).toISOString() // 3 days ago
      },
      { 
        user_id: '16', 
        user_name: 'BigDonator', 
        user_login: 'bigdonator', 
        tier: '2000', 
        is_gift: false,
        subscribed_at: new Date(now - 432000000).toISOString() // 5 days ago
      },
    ]
    return subscribers.slice(0, limit)
  }
}

// Create a singleton instance
export const twitchAPI = new TwitchAPIClient()

// Export types for use in components
export type { TwitchStreamData, TwitchFollower, TwitchSubscriber, TwitchUser }
