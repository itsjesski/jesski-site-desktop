import React, { useState, useEffect } from 'react'
import sticker4 from '../../assets/stickers/4.png'
import sticker5 from '../../assets/stickers/5.png'
import sticker6 from '../../assets/stickers/6.png'
import sticker7 from '../../assets/stickers/7.png'
import sticker8 from '../../assets/stickers/8.png'

interface BootLoaderProps {
  onBootComplete: () => void
}

const bootMessages = [
  'Starting JessOS...',
  'Loading components...',
  'Preparing desktop...',
  'Almost ready!'
]

const stickerIcons = [sticker4, sticker5, sticker6, sticker7, sticker8]

export const BootLoader: React.FC<BootLoaderProps> = ({ onBootComplete }) => {
  const [currentMessage, setCurrentMessage] = useState(0)
  const [progress, setProgress] = useState(0)
  const showStickers = true // Always show stickers throughout the animation

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => {
        if (prev < bootMessages.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 300) // Faster message transitions

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 100) {
          return Math.min(prev + 3, 100) // Cap at exactly 100%
        }
        return prev
      })
    }, 40) // Smoother progress updates

    // Complete boot after 2 seconds (brief but not rushed)
    const bootTimeout = setTimeout(() => {
      onBootComplete()
    }, 2000)

    return () => {
      clearInterval(messageInterval)
      clearInterval(progressInterval)
      clearTimeout(bootTimeout)
    }
  }, [onBootComplete])

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ 
        backgroundColor: 'var(--color-primary-900)',
        color: 'var(--color-primary-50)'
      }}
    >
      <div className="text-center max-w-md w-full px-6">
        {/* JessOS Logo */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-accent-400)' }}>
            JessOS
          </h1>
          <p className="text-sm opacity-80">Personal Desktop Environment</p>
        </div>

        {/* Animated Stickers */}
        {showStickers && (
          <div className="mb-8 flex justify-center space-x-4">
            {stickerIcons.map((sticker, index) => (
              <img
                key={index}
                src={sticker}
                alt="Loading sticker"
                className="w-8 h-8 animate-bounce"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        )}

        {/* Boot Message */}
        <div className="mb-6">
          <p className="text-lg font-medium mb-2">
            {bootMessages[currentMessage]}
          </p>
          
          {/* Progress Bar */}
          <div 
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--color-primary-700)' }}
          >
            <div
              className="h-full transition-all duration-100 ease-out rounded-full"
              style={{
                backgroundColor: 'var(--color-accent-500)',
                width: `${progress}%`
              }}
            />
          </div>
          <p className="text-xs mt-2 opacity-70">{progress}%</p>
        </div>

        {/* Loading Dots */}
        <div className="flex justify-center space-x-1">
          {[0, 1, 2].map((dot) => (
            <div
              key={dot}
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: 'var(--color-accent-500)',
                animation: `pulse 1.5s ease-in-out ${dot * 0.2}s infinite`
              }}
            />
          ))}
        </div>

        {/* Copyright */}
        <div className="mt-8 text-xs opacity-50">
          <p>JessOS v1.0 • Built with React & TypeScript</p>
        </div>
      </div>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
        `}
      </style>
    </div>
  )
}
