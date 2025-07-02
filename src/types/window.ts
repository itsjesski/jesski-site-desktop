// Window and desktop store types

export interface WindowState {
  id: string
  title: string
  component: string
  isMinimized: boolean
  isMaximized: boolean
  position: { x: number; y: number }
  size: { width: number; height: number }
  zIndex: number
  data?: Record<string, unknown>
}

export interface DesktopState {
  windows: WindowState[]
  nextZIndex: number
  hasShownWelcome: boolean
  showTwitchStream: boolean
  openWindow: (window: Omit<WindowState, 'id' | 'zIndex'>) => void
  closeWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  focusWindow: (id: string) => void
  updateWindowPosition: (id: string, position: { x: number; y: number }) => void
  updateWindowSize: (id: string, size: { width: number; height: number }) => void
  initializeWelcomeWindow: () => void
  setTwitchStreamVisible: (visible: boolean) => void
}
