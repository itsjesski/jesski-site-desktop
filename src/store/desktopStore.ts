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

export const useDesktopStore = create<DesktopState>((set, get) => ({
  windows: [],
  nextZIndex: 100,
  activeWindowId: undefined,
  hasShownWelcome: false,
  showTwitchStream: false, // Will be set to true when stream is detected as live
  
  openWindow: (windowData) => {
    // Play window open sound
    soundManager.play('pop');
    
    // Check if a window with the same component and title already exists (including minimized ones)
    const state = get();
    const existingWindow = state.windows.find(w => 
      w.component === windowData.component && 
      w.title === windowData.title
    );
    
    // If window exists (even if minimized), restore and focus it instead of creating a new one
    if (existingWindow) {
      state.focusWindow(existingWindow.id); // This will also un-minimize if needed
      return;
    }
    
    const id = `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Check if we're on mobile
    const isMobile = window.innerWidth < 768
    
    // Calculate optimal size based on content and viewport
    const optimalSize = calculateOptimalWindowSize(
      windowData.component,
      window.innerWidth,
      window.innerHeight
    )
    
    // Calculate centered position based on the optimal size
    const centeredPosition = calculateCenteredPosition(
      optimalSize.width,
      optimalSize.height,
      window.innerWidth,
      window.innerHeight
    )
    
    // Adjust window properties for mobile or use optimal sizing and centered positioning
    const adjustedWindowData = isMobile ? {
      ...windowData,
      position: { x: 10, y: 10 },
      size: { 
        width: window.innerWidth - 20, // Use almost full width
        height: window.innerHeight - 100 // Leave space for taskbar and some margin
      },
      isMaximized: false // Start non-maximized so users can see it's a window
    } : {
      ...windowData,
      size: optimalSize,
      position: centeredPosition // Use centered position instead of provided position
    }
    
    const currentZIndex = get().nextZIndex;
    const newWindow: WindowState = {
      ...adjustedWindowData,
      id,
      zIndex: currentZIndex,
    }
    
    set((state) => ({
      windows: [...state.windows, newWindow],
      nextZIndex: currentZIndex + 1,
    }))
    
    // Use setTimeout to ensure the window is added to state before focusing
    setTimeout(() => {
      get().focusWindow(id);
    }, 0);
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
