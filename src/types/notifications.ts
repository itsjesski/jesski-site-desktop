// Notification types

export interface NotificationMessage {
  title: string
  message: string
  type: 'default' | 'success' | 'info' | 'warning' | 'error'
  duration?: number
}

export interface ActiveNotification extends NotificationMessage {
  id: string
}
