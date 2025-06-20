import React, { useState, useEffect } from 'react'
import { ExternalLink, VideoOff, Minus, Maximize, X } from 'lucide-react'
import { twitchAPI, type TwitchStreamData } from '../services/twitchAPIClient'

interface TwitchStreamProps {
  onClose: () => void
}

export const TwitchStream: React.FC<TwitchStreamProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [streamData, setStreamData] = useState<TwitchStreamData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const twitchChannel = import.meta.env.VITE_TWITCH_CHANNEL || 'jesski'
  const twitchUrl = `https://twitch.tv/${twitchChannel}`  // Fetch stream data when component mounts (we already know stream is live)
  useEffect(() => {
    const fetchStreamData = async () => {
      try {
        setError(null)
        const result = await twitchAPI.isStreamLive(twitchChannel)
        
        if (result.isLive && result.streamData) {
          setStreamData(result.streamData)        }
      } catch {
        setError('Failed to load stream info')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStreamData()
  }, [twitchChannel])
  const handleOpenTwitch = () => {
    window.open(twitchUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div 
      className={`fixed z-40 rounded-lg shadow-2xl border overflow-hidden`}
      style={{
        backgroundColor: 'var(--color-primary-900)',
        borderColor: 'var(--color-primary-600)',
        width: isMaximized ? 'calc(100vw - 80px)' : '480px',
        height: isMaximized ? 'calc(100vh - 120px)' : (isMinimized ? '40px' : '320px'),
        left: isMaximized ? '40px' : 'auto',
        right: isMaximized ? '40px' : '16px',
        top: isMaximized ? '40px' : 'auto',
        bottom: isMaximized ? '80px' : '80px', // Account for taskbar height
        transition: 'all 0.3s ease-in-out'
      }}
    >
      {/* Title Bar */}
      <div 
        className="px-3 py-2 flex items-center justify-between select-none"
        style={{ 
          backgroundColor: 'var(--window-header-bg)',
          color: 'var(--window-header-text)'
        }}
      >        <span className="text-sm font-medium">
          {isLoading ? 'Loading stream...' : error ? 'Connection Error' : streamData?.game_name ? `Live: ${streamData.game_name}` : 'Live Twitch Feed'}
        </span>
        
        <div className="flex items-center space-x-1" role="group" aria-label="Window controls">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsMinimized(!isMinimized)
            }}
            className="p-2 rounded touch-manipulation cursor-pointer flex items-center justify-center transition-colors"
            style={{ 
              minHeight: '36px', 
              minWidth: '36px',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            aria-label={isMinimized ? 'Restore window' : 'Minimize window'}
            title={isMinimized ? 'Restore window' : 'Minimize window'}
          >
            <Minus size={16} aria-hidden="true" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsMaximized(!isMaximized)
            }}
            className="p-2 rounded touch-manipulation cursor-pointer flex items-center justify-center transition-colors"
            style={{ 
              minHeight: '36px', 
              minWidth: '36px',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
            title={isMaximized ? 'Restore window' : 'Maximize window'}
          >
            <Maximize size={16} aria-hidden="true" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="p-2 rounded touch-manipulation cursor-pointer flex items-center justify-center transition-colors"
            style={{ 
              minHeight: '36px', 
              minWidth: '36px',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.8)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            aria-label="Close window"
            title="Close window"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Stream Content */}
      {!isMinimized && (
        <div 
          className="relative overflow-hidden"
          style={{ 
            height: isMaximized ? 'calc(100vh - 160px)' : '280px', // Account for title bar and margins
            backgroundColor: 'var(--color-primary-900)'
          }}
        >          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div 
                className="text-sm animate-pulse"
                style={{ color: 'var(--text-secondary)' }}
              >
                Connecting to Twitch...
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full px-4">
              <VideoOff 
                size={24} 
                className="mb-2" 
                style={{ color: 'var(--text-secondary)' }}
              />
              <span 
                className="text-sm mb-2 text-center"
                style={{ color: 'var(--text-secondary)' }}
              >
                {error}
              </span>
              <button
                onClick={handleOpenTwitch}
                className="text-xs underline transition-colors"
                style={{ 
                  color: 'var(--color-accent-400)',
                }}
              >
                Visit Twitch Channel
              </button>            </div>
          ) : (
            <>              {/* Twitch Embed */}
              <iframe
                src={`https://player.twitch.tv/?channel=${twitchChannel}&parent=${window.location.hostname}&autoplay=false&muted=false`}
                height="100%"
                width="100%"
                allowFullScreen
                className="border-0"
                title="Jess's Stream"
              />
                {/* Combined Live indicator + Twitch button */}
              <button
                onClick={handleOpenTwitch}
                className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium shadow-lg transition-all hover:scale-105 cursor-pointer"
                style={{
                  backgroundColor: 'rgba(220, 38, 38, 0.95)',
                  color: 'white'
                }}                title="🔴 LIVE - Click to watch on Twitch"
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                <span>LIVE</span>
                <ExternalLink size={10} className="opacity-75" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
