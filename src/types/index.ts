/**
 * Shared TypeScript types for the desktop application
 */

// Garden related types
export interface PlantState {
  id: string;
  type: string;
  stage: number;
  health: number;
  position: {
    x: number;
    y: number;
  };
  plantedAt: number;
  wateredAt?: number;
  fertilizedAt?: number;
  weedFree?: boolean;
  plantedBy?: string;
}

export interface MagicEffect {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  createdAt: number;
  createdBy?: string;
}

export interface GardenState {
  plants: PlantState[];
  magic: MagicEffect[];
  lastActivity: number;
}

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
