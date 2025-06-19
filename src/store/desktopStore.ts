import { create } from 'zustand'

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

// Utility function to calculate optimal window size
const calculateOptimalWindowSize = (
  component: string,
  viewportWidth: number,
  viewportHeight: number
): { width: number; height: number } => {
  const maxWidth = Math.min(viewportWidth - 100, 1200) // Leave some margin
  const maxHeight = Math.min(viewportHeight - 150, 800) // Account for taskbar and title bar
  
  // Define content-based sizes for different components
  const componentSizes: Record<string, { width: number; height: number }> = {
    'about': { width: 650, height: 600 },
    'text-viewer': { width: 700, height: 500 },
    'website-viewer': { width: 900, height: 700 },
    'sticker-pack': { width: 650, height: 550 }
  }
  
  const defaultSize = { width: 600, height: 500 }
  const contentSize = componentSizes[component] || defaultSize
  
  return {
    width: Math.min(contentSize.width, maxWidth),
    height: Math.min(contentSize.height, maxHeight)
  }
}

interface DesktopState {
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

export const useDesktopStore = create<DesktopState>((set, get) => ({
  windows: [],
  nextZIndex: 100,
  hasShownWelcome: false,
  showTwitchStream: false, // Will be set to true when stream is detected as live
  
  initializeWelcomeWindow: () => {
    // Always show the welcome window since we're showing boot animation every time
    if (!get().hasShownWelcome) {
      // Calculate center position that avoids desktop icons
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const windowWidth = 700
      const windowHeight = 500
      
      // Position in center-right area to avoid left-side desktop icons
      const centerX = Math.max(300, (viewportWidth - windowWidth) / 2)
      const centerY = Math.max(50, (viewportHeight - windowHeight - 100) / 2) // Account for taskbar
      
      // Open the README.txt welcome window
      const welcomeWindowData = {
        title: 'README.txt',
        component: 'text-viewer',
        isMinimized: false,
        isMaximized: false,
        position: { x: centerX, y: centerY },
        size: { width: windowWidth, height: windowHeight },
        data: {
          fileName: 'README.txt',
          content: `Welcome to Jess's Desktop!

This is a Windows-style desktop interface built with React and TypeScript.

Features:
- Draggable and resizable windows
- Desktop icons
- Taskbar with open applications
- Various applications (About, Text viewer, Projects, Stickers)
- Interactive stickers you can drag around and make wiggle!

Getting Started:
• Double-click on desktop icons to open applications
• Drag windows around to organize your workspace
• Use the taskbar to switch between open applications
• Try the stickers app for some fun interactive elements

Navigation Tips:
• Click the Start button to access all applications
• Windows can be minimized, maximized, and resized
• The interface is fully responsive and touch-friendly

Thanks for visiting! Feel free to explore and have fun with the desktop experience.

Enjoy exploring!`
        }
      }
      
      get().openWindow(welcomeWindowData)
      set({ hasShownWelcome: true })
    }
  },
  
  openWindow: (windowData) => {
    const id = `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Check if we're on mobile
    const isMobile = window.innerWidth < 768
    
    // Calculate optimal size based on content and viewport
    const optimalSize = calculateOptimalWindowSize(
      windowData.component,
      window.innerWidth,
      window.innerHeight
    )
    
    // Adjust window properties for mobile or use optimal sizing
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
      size: optimalSize
    }
    
    const newWindow: WindowState = {
      ...adjustedWindowData,
      id,
      zIndex: get().nextZIndex,
    }
    
    set((state) => ({
      windows: [...state.windows, newWindow],
      nextZIndex: state.nextZIndex + 1,
    }))
  },
  
  closeWindow: (id) => {
    const windowToClose = get().windows.find(w => w.id === id)
    
    // If closing the welcome README window, mark it as seen
    if (windowToClose?.component === 'text-viewer' && 
        windowToClose?.data?.fileName === 'README.txt' && 
        get().hasShownWelcome) {
      localStorage.setItem('jesski-desktop-welcome-seen', 'true')
    }
    
    set((state) => ({
      windows: state.windows.filter((w) => w.id !== id),
    }))
  },
  
  minimizeWindow: (id) => {
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
