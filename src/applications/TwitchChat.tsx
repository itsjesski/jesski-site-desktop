import React, { useState, useEffect } from 'react'
import { Users, MessageCircle, UserPlus, Crown, Gift } from 'lucide-react'
import { twitchAPI, type TwitchFollower, type TwitchSubscriber } from '../services/api/twitchAPIClient'

export const TwitchChat: React.FC = () => {
  const [activityItems, setActivityItems] = useState<Array<{
    id: string
    type: 'follow' | 'subscribe'
    user_name: string
    timestamp: string
    data?: TwitchFollower | TwitchSubscriber
  }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chatError, setChatError] = useState(false)

  const twitchChannel = import.meta.env.VITE_TWITCH_CHANNEL || 'jesski'

  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        setError(null)
        setIsLoading(true)
        
        // Fetch more followers and subscribers for recent activity
        const [followersData, subscribersData] = await Promise.all([
          twitchAPI.getFollowers(10), // Get more followers
          twitchAPI.getSubscribers(8)  // Get more subscribers
        ])

        // Combine and sort activity by timestamp
        const combinedActivity = [
          ...followersData.map(follower => ({
            id: `follow_${follower.user_id}`,
            type: 'follow' as const,
            user_name: follower.user_name,
            timestamp: follower.followed_at,
            data: follower
          })),
          ...subscribersData.map(subscriber => ({
            id: `sub_${subscriber.user_id}`,
            type: 'subscribe' as const,
            user_name: subscriber.user_name,
            // Use subscribed_at if available, otherwise fall back to current logic
            timestamp: subscriber.subscribed_at || new Date(Date.now() - Math.random() * 86400000).toISOString(),
            data: subscriber
          }))
        ]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 6) // Show only the 6 most recent events

        setActivityItems(combinedActivity)
      } catch {
        setError('Failed to load activity data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivityData()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchActivityData, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const formatTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    
    const days = Math.floor(hours / 24)
    if (days === 1) return 'yesterday'
    if (days < 7) return `${days} days ago`
    
    const weeks = Math.floor(days / 7)
    if (weeks === 1) return 'last week'
    return `${weeks} weeks ago`
  }

  const getTierName = (tier: string) => {
    switch (tier) {
      case '1000': return 'Tier 1'
      case '2000': return 'Tier 2'
      case '3000': return 'Tier 3'
      default: return 'Subscriber'
    }
  }

  return (
    <div className="flex h-full">
      {/* Chat Section - Left Side */}
      <div className="flex-1 min-w-0">
        {chatError ? (
          <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <div className="text-center">
              <MessageCircle size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-300 mb-2">Chat temporarily unavailable</p>
              <button
                onClick={() => setChatError(false)}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <iframe
            src={`https://www.twitch.tv/embed/${twitchChannel}/chat?parent=${globalThis.window?.location.hostname || 'localhost'}&parent=localhost&parent=127.0.0.1&darkpopout`}
            height="100%"
            width="100%"
            className="border-0"
            title="Twitch Chat"
            onError={() => {
              setChatError(true)
            }}
          />
        )}
      </div>

      {/* Activity Section - Right Side */}
      <div 
        className="w-80 border-l p-4 overflow-y-auto"
        style={{ 
          backgroundColor: 'var(--window-content-bg)',
          borderColor: 'var(--window-border)'
        }}
      >
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Recent Activity</h2>
          <p className="text-xs text-gray-500">Latest fake followers and subscriptions</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-gray-500">Loading activity...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-red-500">{error}</div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Recent Activity Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Recent Activity</h3>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>

            {/* Activity Items */}
            <div className="space-y-3">
              {activityItems.map((item) => {
                const timeDiff = Date.now() - new Date(item.timestamp).getTime();
                const isVeryRecent = timeDiff < 3600000; // Less than 1 hour
                
                return (
                <div 
                  key={item.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg border ${isVeryRecent ? 'ring-1 ring-purple-200' : ''}`}
                  style={{ 
                    backgroundColor: item.type === 'follow' 
                      ? 'rgba(147, 51, 234, 0.05)' 
                      : 'rgba(168, 85, 247, 0.05)',
                    borderColor: item.type === 'follow' 
                      ? 'rgba(147, 51, 234, 0.1)' 
                      : 'rgba(168, 85, 247, 0.1)'
                  }}
                >
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 bg-gradient-to-br rounded-full flex items-center justify-center relative ${
                      item.type === 'follow' 
                        ? 'from-pink-400 to-pink-600' 
                        : item.data && 'is_gift' in item.data && item.data.is_gift
                          ? 'from-green-400 to-green-600'
                          : 'from-purple-400 to-purple-600'
                    }`}>
                      {item.type === 'follow' ? (
                        <UserPlus size={14} className="text-white" />
                      ) : item.data && 'is_gift' in item.data && item.data.is_gift ? (
                        <Gift size={14} className="text-white" />
                      ) : (
                        <Crown size={14} className="text-white" />
                      )}
                      {isVeryRecent && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.user_name}
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        item.type === 'follow' 
                          ? 'bg-pink-100 text-pink-800'
                          : item.data && 'is_gift' in item.data && item.data.is_gift
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-purple-100 text-purple-800'
                      }`}>
                        {item.type === 'follow' 
                          ? 'New Follower' 
                          : item.data && 'is_gift' in item.data && item.data.is_gift 
                            ? 'Gift Sub' 
                            : item.data && 'tier' in item.data 
                              ? getTierName(item.data.tier)
                              : 'Subscriber'
                        }
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.type === 'follow' 
                        ? formatTimeAgo(item.timestamp)
                        : item.data && 'is_gift' in item.data && item.data.is_gift && 'gifter_name' in item.data && item.data.gifter_name
                          ? `Gifted by ${item.data.gifter_name} • ${formatTimeAgo(item.timestamp)}`
                          : `Subscribed • ${formatTimeAgo(item.timestamp)}`
                      }
                    </p>
                  </div>
                </div>
                )
              })}

              {/* Empty State */}
              {activityItems.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users size={24} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">No recent activity</p>
                  <p className="text-xs text-gray-400">New follows and subs will appear here</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
