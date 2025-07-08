import React, { useState, useEffect } from 'react'
import { preloadImagesWithRetry, getImageUrl } from '../../utils/imagePreloader'
import { OptimizedImage } from '../../utils/imageOptimizer'

interface BootLoaderProps {
  onBootComplete: () => void
}

const bootMessages = [
  'Starting JessOS...',
  'Loading images...',
  'Preparing desktop...',
  'Almost ready!'
]

const stickerKeys = ['sticker4', 'sticker5', 'sticker6', 'sticker7', 'sticker8'] as const

export const BootLoader: React.FC<BootLoaderProps> = ({ onBootComplete }) => {
  const [currentMessage, setCurrentMessage] = useState(0)
  const [progress, setProgress] = useState(0)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const showStickers = true // Always show stickers throughout the animation

  useEffect(() => {
    let messageInterval: number
    let progressInterval: number
    let bootTimeout: number

    const startBoot = async () => {
      // Start preloading images immediately
      preloadImagesWithRetry(2, (loaded, total) => {
        // Update progress based on image loading (0-60%)
        const imageProgress = Math.floor((loaded / total) * 60)
        setProgress(Math.max(progress, imageProgress))
      }).then((result) => {
        setImagesLoaded(true)
        console.log(`Image preload completed: ${result.loaded}/${result.total} images loaded`)
      }).catch((error) => {
        console.error('Image preload failed:', error)
        setImagesLoaded(true) // Continue anyway
      })

      // Start message rotation
      messageInterval = window.setInterval(() => {
        setCurrentMessage(prev => {
          if (prev < bootMessages.length - 1) {
            return prev + 1
          }
          return prev
        })
      }, 400)

      // Update progress independently (60-100% after images)
      progressInterval = window.setInterval(() => {
        setProgress(prev => {
          if (prev < 100) {
            const increment = imagesLoaded ? 4 : 2 // Faster after images load
            return Math.min(prev + increment, 100)
          }
          return prev
        })
      }, 50)

      // Complete boot after minimum time and images loaded
      bootTimeout = window.setTimeout(() => {
        // Ensure we wait for images and minimum time
        const checkComplete = () => {
          if (imagesLoaded && progress >= 95) {
            onBootComplete()
          } else {
            setTimeout(checkComplete, 100)
          }
        }
        checkComplete()
      }, 2500) // Slightly longer minimum time
    }

    startBoot()

    return () => {
      if (messageInterval) window.clearInterval(messageInterval)
      if (progressInterval) window.clearInterval(progressInterval)
      if (bootTimeout) window.clearTimeout(bootTimeout)
    }
  }, [onBootComplete, progress, imagesLoaded])

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
            {stickerKeys.map((stickerKey, index) => (
              <OptimizedImage
                key={index}
                src={getImageUrl(stickerKey)}
                alt="Loading sticker"
                className="w-8 h-8 animate-bounce"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animationDuration: '1s'
                }}
                draggable={false}
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
