import React, { useState, useEffect } from 'react'
import { ExternalLink, VideoOff, Minus, Maximize, X } from 'lucide-react'
import { twitchAPI, type TwitchStreamData } from '../services/twitchAPIClient'
import { useDraggable } from '../hooks/useDraggable'

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
  const twitchUrl = `https://twitch.tv/${twitchChannel}`

  // Add drag functionality
  const { ref: dragRef, position, dragHandleProps, isDragging } = useDraggable({
    initialPosition: { x: window.innerWidth - 500, y: 100 }, // Start near top-right
    bounds: {
      left: 0,
      top: 0,
      right: window.innerWidth - 480,
      bottom: window.innerHeight - 320
    }
  })

  // Fetch stream data when component mounts (we already know stream is live)
  useEffect(() => {
    const fetchStreamData = async () => {
      try {
        setError(null)
        const result = await twitchAPI.isStreamLive(twitchChannel)
        
        if (result.isLive && result.streamData) {
          setStreamData(result.streamData)
        }
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
      ref={dragRef}
      className={`fixed z-40 rounded-lg shadow-2xl border overflow-hidden ${isDragging ? 'select-none' : ''}`}
      style={{
        backgroundColor: 'var(--color-primary-900)',
        borderColor: 'var(--color-primary-600)',
        width: isMaximized ? 'calc(100vw - 80px)' : '480px',
        height: isMaximized ? 'calc(100vh - 120px)' : (isMinimized ? '40px' : '320px'),
        left: isMaximized ? '40px' : position.x,
        top: isMaximized ? '40px' : position.y,
        right: isMaximized ? '40px' : 'auto',
        bottom: isMaximized ? '80px' : 'auto',
        transition: isDragging ? 'none' : 'all 0.3s ease-in-out',
        willChange: isDragging ? 'transform' : 'auto'
      }}
    >
      {/* Title Bar */}
      <div 
        {...dragHandleProps}
        className="px-3 py-2 flex items-center justify-between select-none cursor-move"
        style={{ 
          backgroundColor: 'var(--window-header-bg)',
          color: 'var(--window-header-text)'
        }}
      >
        <span className="text-sm font-medium">
          {isLoading ? 'Loading stream...' : error ? 'Connection Error' : streamData?.game_name ? `Live: ${streamData.game_name}` : 'Live Twitch Feed'}
        </span>
        
        <div className="flex items-center space-x-1" role="group" aria-label="Window controls">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsMinimized(!isMinimized)
            }}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            title={isMinimized ? "Restore" : "Minimize"}
            aria-label={isMinimized ? "Restore window" : "Minimize window"}
          >
            <Minus size={14} />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsMaximized(!isMaximized)
            }}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            title={isMaximized ? "Restore" : "Maximize"}
            aria-label={isMaximized ? "Restore window" : "Maximize window"}
          >
            <Maximize size={14} />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="p-1 rounded hover:bg-red-500/20 transition-colors"
            title="Close"
            aria-label="Close stream window"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="relative h-full" style={{ height: 'calc(100% - 40px)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-secondary)' }}>
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-current border-t-transparent mx-auto mb-2"></div>
                <span className="text-sm">Loading stream...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center" style={{ color: 'var(--text-secondary)' }}>
              <VideoOff size={32} className="mb-3 opacity-50" />
              <span className="text-sm mb-3">
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
              </button>
            </div>
          ) : (
            <div className="relative h-full">
              {/* Twitch Embed */}
              <iframe
                src={`https://player.twitch.tv/?channel=${twitchChannel}&parent=${window.location.hostname}&autoplay=false&muted=false`}
                height="100%"
                width="100%"
                allowFullScreen
                className="border-0"
                title="Jess's Stream"
              />
              
              {/* Drag overlay to prevent iframe from interfering with drag events */}
              {isDragging && (
                <div 
                  className="absolute inset-0 z-10 bg-transparent cursor-grabbing"
                  style={{ pointerEvents: 'all' }}
                />
              )}

              {/* Combined Live indicator + Twitch button */}
              <button
                onClick={handleOpenTwitch}
                className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium shadow-lg transition-all hover:scale-105 cursor-pointer"
                style={{
                  backgroundColor: 'rgba(220, 38, 38, 0.95)',
                  color: 'white'
                }}
                title="🔴 LIVE - Click to watch on Twitch"
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                <span>LIVE</span>
                <ExternalLink size={10} className="opacity-75" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
