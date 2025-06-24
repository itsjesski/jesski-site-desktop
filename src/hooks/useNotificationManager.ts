import { useState, useEffect, useCallback } from 'react'
import { affirmationsService } from '../services/affirmationsService'

interface NotificationMessage {
  title: string
  message: string
  type: 'default' | 'success' | 'info' | 'warning' | 'error'
  duration?: number
}

interface ActiveNotification extends NotificationMessage {
  id: string
}

const NOTIFICATION_MUTE_KEY = 'jesski-notifications-muted'

// Helper function to load mute status from localStorage
const loadMuteStatus = (): boolean => {
  if (typeof window === 'undefined') return false
  
  try {
    const saved = localStorage.getItem(NOTIFICATION_MUTE_KEY)
    return saved === 'true'
  } catch (error) {
    console.warn('Failed to load notification mute status from localStorage:', error)
    return false
  }
}

// Helper function to save mute status to localStorage
const saveMuteStatus = (isMuted: boolean): void => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(NOTIFICATION_MUTE_KEY, String(isMuted))
  } catch (error) {
    console.warn('Failed to save notification mute status to localStorage:', error)
  }
}

export const useNotificationManager = () => {
  const [activeNotifications, setActiveNotifications] = useState<ActiveNotification[]>([])
  const [isMuted, setIsMuted] = useState<boolean>(loadMuteStatus)

  const showNotification = useCallback(async (notification?: NotificationMessage) => {
    if (isMuted) return // Don't show notifications when muted
    
    // Only show one notification at a time - if one is active, skip this one
    if (activeNotifications.length > 0) return
    
    let notificationToShow: NotificationMessage
    
    if (notification) {
      notificationToShow = notification
    } else {
      // Get a random affirmation from the API
      try {
        const affirmation = await affirmationsService.getRandomAffirmation()
        notificationToShow = {
          title: 'Daily Affirmation',
          message: affirmation,
          type: 'success',
          duration: 5000
        }
      } catch (error) {
        console.error('Failed to get affirmation:', error)
        // If API fails, don't show notification
        return
      }
    }
    
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const activeNotification: ActiveNotification = {
      ...notificationToShow,
      id
    }
    
    setActiveNotifications([activeNotification]) // Always replace with single notification
  }, [isMuted, activeNotifications.length])

  const dismissNotification = useCallback((id: string) => {
    setActiveNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const dismissAllNotifications = useCallback(() => {
    setActiveNotifications([])
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMutedState = !prev
      saveMuteStatus(newMutedState) // Save to localStorage
      return newMutedState
    })
    // If unmuting, dismiss all current notifications for a fresh start
    if (isMuted) {
      setActiveNotifications([])
    }
  }, [isMuted])

  // Random notification system
  useEffect(() => {
    if (isMuted) return // Don't schedule notifications when muted
    
    let currentTimer: ReturnType<typeof setTimeout>

    // Function to schedule next notification
    const scheduleNextNotification = () => {
      // Random interval between 15 seconds to 45 seconds for better frequency
      const minInterval = 15000   // 15 seconds
      const maxInterval = 45000   // 45 seconds
      const randomInterval = Math.random() * (maxInterval - minInterval) + minInterval
      
      currentTimer = setTimeout(() => {
        // Only show notification if there are no active notifications
        if (activeNotifications.length === 0) {
          showNotification()
        }
        
        // Schedule the next one
        scheduleNextNotification()
      }, randomInterval)
    }

    // Initial delay before first notification (10 to 30 seconds)
    const initialDelay = Math.random() * 20000 + 10000
    const initialTimer = setTimeout(() => {
      if (activeNotifications.length === 0) {
        showNotification()
      }
      scheduleNextNotification()
    }, initialDelay)

    return () => {
      clearTimeout(initialTimer)
      if (currentTimer) {
        clearTimeout(currentTimer)
      }
    }
  }, [showNotification, activeNotifications.length, isMuted])

  return {
    activeNotifications,
    isMuted,
    showNotification,
    dismissNotification,
    dismissAllNotifications,
    toggleMute
  }
}
