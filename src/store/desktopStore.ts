import { create } from 'zustand'
import type { WindowState, DesktopState } from '../types/window'
import { soundManager } from '../services/soundManager'

// Utility function to calculate optimal window size
const calculateOptimalWindowSize = (
  component: string,
  viewportWidth: number,
  viewportHeight: number
): { width: number; height: number } => {
  const maxWidth = Math.min(viewportWidth - 100, 1400) // Leave some margin
  const maxHeight = Math.min(viewportHeight - 150, 900) // Account for taskbar and title bar
  
  // Define content-based sizes for different components
  const componentSizes: Record<string, { width: number; height: number }> = {
    'about': { width: 800, height: 650 },
    'text-viewer': { width: 850, height: 600 },
    'website-viewer': { width: 1000, height: 750 },
    'sticker-pack': { width: 750, height: 600 },
    'twitch-chat': { width: 900, height: 650 },
    'games-library': { width: 1000, height: 700 },
    'streamer-software': { width: 900, height: 650 }
  }
  
  const defaultSize = { width: 750, height: 550 }
  const contentSize = componentSizes[component] || defaultSize
  
  return {
    width: Math.min(contentSize.width, maxWidth),
    height: Math.min(contentSize.height, maxHeight)
  }
}

// Utility function to calculate centered window position
const calculateCenteredPosition = (
  windowWidth: number,
  windowHeight: number,
  viewportWidth: number,
  viewportHeight: number
): { x: number; y: number } => {
  // Calculate center position
  const centerX = (viewportWidth - windowWidth) / 2
  const centerY = (viewportHeight - windowHeight - 100) / 2 // Account for taskbar (48px) + extra margin
  
  // Ensure the window doesn't go off-screen or too close to edges
  const minX = 20
  const minY = 20
  const maxX = Math.max(minX, viewportWidth - windowWidth - 20)
  const maxY = Math.max(minY, viewportHeight - windowHeight - 120) // Account for taskbar
  
  return {
    x: Math.max(minX, Math.min(centerX, maxX)),
    y: Math.max(minY, Math.min(centerY, maxY))
  }
}

const normalizeFileName = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  const trimmed = value.trim().toLowerCase()
  return trimmed.endsWith('.txt') ? trimmed : `${trimmed}.txt`
}

const normalizeUrl = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  try {
    return new URL(value).toString()
  } catch {
    return value.trim()
  }
}

const getWindowTargetKey = (windowData: Pick<WindowState, 'component' | 'data'>): string => {
  const { component, data } = windowData

  switch (component) {
    case 'text-viewer': {
      const fileName = normalizeFileName(data?.fileName)
      return fileName ? `${component}|file=${fileName}` : component
    }
    case 'website-viewer': {
      const url = normalizeUrl(data?.url)
      return url ? `${component}|url=${url}` : component
    }
    case 'games-library': {
      const selectedGame = typeof data?.selectedGame === 'string' ? data.selectedGame.trim() : ''
      return selectedGame ? `${component}|game=${selectedGame}` : component
    }
    default:
      return component
  }
}

export const useDesktopStore = create<DesktopState>((set, get) => ({
  windows: [],
  nextZIndex: 100,
  activeWindowId: undefined,
  hasShownWelcome: false,
  showTwitchStream: false, // Will be set to true when stream is detected as live
  
  openWindow: (windowData) => {
    // Play window open sound
    soundManager.play('pop')

    const incomingTargetKey = getWindowTargetKey(windowData)

    set((state) => {
      const currentZIndex = state.nextZIndex
      const existingWindow = state.windows.find(
        (windowEntry) => getWindowTargetKey(windowEntry) === incomingTargetKey
      )

      if (existingWindow) {
        return {
          windows: state.windows.map((windowEntry) =>
            windowEntry.id === existingWindow.id
              ? { ...windowEntry, zIndex: currentZIndex, isMinimized: false }
              : windowEntry
          ),
          nextZIndex: currentZIndex + 1,
          activeWindowId: existingWindow.id,
        }
      }

      const id = `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const isMobile = window.innerWidth < 768

      const optimalSize = calculateOptimalWindowSize(
        windowData.component,
        window.innerWidth,
        window.innerHeight
      )

      const centeredPosition = calculateCenteredPosition(
        optimalSize.width,
        optimalSize.height,
        window.innerWidth,
        window.innerHeight
      )

      const adjustedWindowData = isMobile
        ? {
            ...windowData,
            position: { x: 10, y: 10 },
            size: {
              width: window.innerWidth - 20,
              height: window.innerHeight - 100,
            },
            isMaximized: false,
          }
        : {
            ...windowData,
            size: optimalSize,
            position: centeredPosition,
          }

      const newWindow: WindowState = {
        ...adjustedWindowData,
        id,
        zIndex: currentZIndex,
      }

      return {
        windows: [...state.windows, newWindow],
        nextZIndex: currentZIndex + 1,
        activeWindowId: id,
      }
    })
  },
  
  closeWindow: (id) => {
    // Play window close sound
    soundManager.play('click');
    
    const state = get();
    
    const newWindows = state.windows.filter((w) => w.id !== id);
    const newActiveWindowId = state.activeWindowId === id ? 
      (newWindows.length > 0 ? newWindows[newWindows.length - 1].id : undefined) : 
      state.activeWindowId;
    
    set({
      windows: newWindows,
      activeWindowId: newActiveWindowId,
    });
  },
  
  minimizeWindow: (id) => {
    // Play click sound for minimize
    soundManager.play('click');
    
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMinimized: !w.isMinimized } : w
      ),
    }))
  },
  
  maximizeWindow: (id) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
      ),
    }))
  },
  
  focusWindow: (id) => {
    const currentZIndex = get().nextZIndex
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, zIndex: currentZIndex, isMinimized: false } : w
      ),
      nextZIndex: currentZIndex + 1,
      activeWindowId: id,
    }))
  },
  
  updateWindowPosition: (id, position) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, position } : w
      ),
    }))
  },
  
  updateWindowSize: (id, size) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, size } : w
      ),
    }))
  },

  setTwitchStreamVisible: (visible) => {
    set({ showTwitchStream: visible })
  },
}))
