/**
 * Shared TypeScript types for the desktop application
 */

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  data?: unknown;
  error?: string;
}

// Window management types
export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Token types
export interface TokenResponse {
  token: string;
  expiresAt: number;
}

// Notification types
export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}
