// Twitch API related types

export interface TwitchStreamData {
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

export interface TwitchFollower {
  user_id: string
  user_name: string
  user_login: string
  followed_at: string
}

export interface TwitchSubscriber {
  user_id: string
  user_name: string
  user_login: string
  tier: string
  is_gift: boolean
  gifter_id?: string
  gifter_name?: string
  subscribed_at?: string
}

export interface TwitchUser {
  id: string
  login: string
  display_name: string
  type: string
  broadcaster_type: string
  description: string
  profile_image_url: string
  offline_image_url: string
  view_count: number
  created_at: string
}
