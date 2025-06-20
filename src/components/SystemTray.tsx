import React, { useState } from 'react'
import { ChevronUp, Heart } from 'lucide-react'

interface SystemTrayProps {
  isMuted?: boolean
  onToggleMute?: () => void
}

export const SystemTray: React.FC<SystemTrayProps> = ({ 
  isMuted = false, 
  onToggleMute 
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleExpandToggle = () => {
    setIsExpanded(!isExpanded)
  }

  const handleAffirmationsClick = () => {
    if (onToggleMute) {
      onToggleMute()
    }
    // Auto-collapse the tray after clicking
    setTimeout(() => setIsExpanded(false), 300)
  }

  return (
    <div className="relative">
      {/* Expand/Collapse Button */}
      <button
        onClick={handleExpandToggle}
        className="p-2 rounded transition-colors cursor-pointer flex items-center justify-center"
        style={{
          minHeight: '32px',
          minWidth: '32px',
          backgroundColor: isExpanded ? 'var(--taskbar-hover)' : 'transparent',
          color: 'var(--taskbar-text)'
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.backgroundColor = 'var(--taskbar-hover)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.backgroundColor = 'transparent'
          }
        }}
        title="Show hidden icons"
        aria-label="Show hidden icons"
      >
        <ChevronUp 
          size={14} 
          style={{ 
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }} 
        />
      </button>

      {/* System Tray Panel */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-30"
            onClick={() => setIsExpanded(false)}
          />
          
          {/* Tray Panel */}
          <div
            className="absolute bottom-full right-0 mb-2 rounded-lg border shadow-lg"
            style={{
              backgroundColor: 'var(--window-bg)',
              borderColor: 'var(--window-border)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
              minWidth: '140px',
              zIndex: 40
            }}
          >
            <div className="p-3">
              <div className="text-xs mb-3 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                Background apps
              </div>
              
              {/* Affirmations.exe Icon */}
              <div className="flex items-center justify-center">
                <button
                  onClick={handleAffirmationsClick}
                  className="p-2 rounded-lg transition-colors cursor-pointer flex flex-col items-center justify-center"
                  style={{
                    backgroundColor: isMuted ? 'var(--color-accent-100)' : 'transparent',
                    minHeight: '40px',
                    minWidth: '40px',
                    maxWidth: '40px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isMuted) {
                      e.currentTarget.style.backgroundColor = 'var(--taskbar-hover)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isMuted) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                  title={isMuted ? 'Affirmations.exe (Disabled) - Click to enable life tips' : 'Affirmations.exe (Running) - Click to disable life tips'}
                  aria-label={isMuted ? 'Enable Affirmations.exe' : 'Disable Affirmations.exe'}
                >
                  <div 
                    className="p-1.5 rounded relative"
                    style={{
                      backgroundColor: isMuted ? 'var(--color-neutral-400)' : 'var(--color-accent-500)',
                      color: 'white'
                    }}
                  >
                    <Heart size={14} />
                    {!isMuted && (
                      <div 
                        className="absolute -bottom-1 -right-1 w-1.5 h-1.5 rounded-full border border-white"
                        style={{ backgroundColor: 'var(--color-secondary-500)' }}
                        title="Running"
                      />
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
