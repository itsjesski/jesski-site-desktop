import React, { useState, useEffect, useCallback } from 'react'
import { X, Heart } from 'lucide-react'

interface NotificationProps {
  message: string
  title: string
  onClose: () => void
  duration?: number
}

export const Notification: React.FC<NotificationProps> = ({ 
  message, 
  title, 
  onClose, 
  duration = 17000  // Increased to 17 seconds (was 12 seconds)
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  const handleClose = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => {
      onClose()
    }, 300) // Match animation duration
  }, [onClose])

  useEffect(() => {
    // Slide in animation
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Auto dismiss after duration
    const timer = setTimeout(() => {
      handleClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, handleClose])

  return (
    <div
      className={`relative bg-white border border-gray-200 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ease-out ${
        isVisible && !isExiting
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      }`}
      style={{
        backgroundColor: 'var(--window-bg)',
        borderColor: 'var(--window-border)',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ 
          backgroundColor: 'var(--window-header-bg)',
          borderColor: 'var(--window-border)',
          color: 'var(--window-header-text)'
        }}
      >
        <div className="flex items-center space-x-2 flex-1">
          <div 
            className="p-1 rounded"
            style={{ 
              backgroundColor: 'var(--color-accent-500)',
              color: 'white'
            }}
          >
            <Heart size={12} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-medium leading-tight" style={{ color: 'var(--window-header-text)' }}>
              {title}
            </h3>
            <span className="text-xs opacity-75" style={{ color: 'var(--window-header-text)' }}>
              Affirmations.exe
            </span>
          </div>
        </div>
        <div className="flex items-center" role="group" aria-label="Notification controls">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="p-2 rounded touch-manipulation cursor-pointer flex items-center justify-center transition-colors"
            style={{
              minHeight: '32px',
              minWidth: '32px',
              backgroundColor: 'transparent',
              color: 'var(--window-header-text)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            aria-label="Close notification"
            title="Close notification"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {message}
        </p>
      </div>

      {/* Progress bar */}
      <div 
        className="h-1 rounded-b-lg transition-all"
        style={{
          background: 'linear-gradient(90deg, var(--color-accent-500), var(--color-secondary-500))',
          animation: `notification-progress ${duration}ms linear forwards`
        }}
      />
    </div>
  )
}
