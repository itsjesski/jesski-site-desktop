import { useState, useEffect, useCallback } from 'react'
import { affirmationsService } from '../services/api/affirmationsService'
import type { NotificationMessage, ActiveNotification } from '../types/notifications'
import { secureStorage } from '../utils/secureStorage'

// Helper function to check if notifications are enabled
const areNotificationsEnabled = (): boolean => {
  if (typeof window === 'undefined') return true
  
  try {
    // Check if affirmations are enabled (this controls the notification system now)
    const affirmationsSetting = secureStorage.getItem('jesski-desktop-affirmations')
    return affirmationsSetting !== 'false'
  } catch (error) {
    console.warn('Failed to load affirmations setting from storage:', error)
    return true
  }
}

// Helper function to check if affirmations are enabled
const areAffirmationsEnabled = (): boolean => {
  if (typeof window === 'undefined') return true
  
  try {
    const affirmationsSetting = secureStorage.getItem('jesski-desktop-affirmations')
    return affirmationsSetting !== 'false'
  } catch (error) {
    console.warn('Failed to load affirmations setting from storage:', error)
    return true
  }
}

export const useNotificationManager = () => {
  const [activeNotifications, setActiveNotifications] = useState<ActiveNotification[]>([])

  const showNotification = useCallback(async (notification?: NotificationMessage) => {
    const notificationsEnabled = areNotificationsEnabled()
    const affirmationsEnabled = areAffirmationsEnabled()
    
    // Don't show notifications if disabled
    if (!notificationsEnabled) return
    
    // Only show one notification at a time - if one is active, skip this one
    if (activeNotifications.length > 0) return
    
    let notificationToShow: NotificationMessage
    
    if (notification) {
      notificationToShow = notification
    } else {
      // Don't show affirmations if they're disabled
      if (!affirmationsEnabled) return
      
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
  }, [activeNotifications.length])

  const dismissNotification = useCallback((id: string) => {
    setActiveNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const dismissAllNotifications = useCallback(() => {
    setActiveNotifications([])
  }, [])

  // Random notification system
  useEffect(() => {
    const notificationsEnabled = areNotificationsEnabled()
    const affirmationsEnabled = areAffirmationsEnabled()
    
    // Don't schedule notifications if disabled
    if (!notificationsEnabled || !affirmationsEnabled) return
    
    let currentTimer: ReturnType<typeof setTimeout>

    // Function to schedule next notification
    const scheduleNextNotification = () => {
      // Random interval between 15 seconds to 45 seconds for better frequency
      const minInterval = 15000   // 15 seconds
      const maxInterval = 45000   // 45 seconds
      const randomInterval = Math.random() * (maxInterval - minInterval) + minInterval
      
      currentTimer = setTimeout(() => {
        // Only show notification if there are no active notifications and both settings are still enabled
        if (activeNotifications.length === 0 && areNotificationsEnabled() && areAffirmationsEnabled()) {
          showNotification()
        }
        
        // Schedule the next one
        scheduleNextNotification()
      }, randomInterval)
    }

    // Initial delay before first notification (10 to 30 seconds)
    const initialDelay = Math.random() * 20000 + 10000
    const initialTimer = setTimeout(() => {
      if (activeNotifications.length === 0 && areNotificationsEnabled() && areAffirmationsEnabled()) {
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
  }, [showNotification, activeNotifications.length])

  return {
    activeNotifications,
    showNotification,
    dismissNotification,
    dismissAllNotifications
  }
}
