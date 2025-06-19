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

interface DesktopState {
  windows: WindowState[]
  nextZIndex: number
  openWindow: (window: Omit<WindowState, 'id' | 'zIndex'>) => void
  closeWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  focusWindow: (id: string) => void
  updateWindowPosition: (id: string, position: { x: number; y: number }) => void
  updateWindowSize: (id: string, size: { width: number; height: number }) => void
}

export const useDesktopStore = create<DesktopState>((set, get) => ({
  windows: [],
  nextZIndex: 100,
  
  openWindow: (windowData) => {
    const id = `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newWindow: WindowState = {
      ...windowData,
      id,
      zIndex: get().nextZIndex,
    }
    
    set((state) => ({
      windows: [...state.windows, newWindow],
      nextZIndex: state.nextZIndex + 1,
    }))
  },
  
  closeWindow: (id) => {
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
}))
