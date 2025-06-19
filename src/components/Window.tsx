import React from 'react'
import { ResizableBox } from 'react-resizable'
import { X, Minus, Maximize2, Minimize2 } from 'lucide-react'
import type { WindowState } from '../store/desktopStore'
import { useDesktopStore } from '../store/desktopStore'
import { ApplicationRegistry } from '.'
import { useDraggable } from '../hooks/useDraggable'

interface WindowProps {
  window: WindowState
}

export const Window: React.FC<WindowProps> = ({ window }) => {
  const { 
    closeWindow, 
    minimizeWindow, 
    maximizeWindow, 
    focusWindow, 
    updateWindowPosition, 
    updateWindowSize 
  } = useDesktopStore()

  const [viewportSize, setViewportSize] = React.useState({
    width: globalThis.window?.innerWidth || 1024,
    height: globalThis.window?.innerHeight || 768
  })

  React.useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: globalThis.window?.innerWidth || 1024,
        height: globalThis.window?.innerHeight || 768
      })
    }

    globalThis.window?.addEventListener('resize', handleResize)
    return () => globalThis.window?.removeEventListener('resize', handleResize)
  }, [])

  const { ref: dragRef, position, dragHandleProps } = useDraggable({
    initialPosition: window.position,
    onDrag: (newPosition) => {
      updateWindowPosition(window.id, newPosition)
    },
    bounds: {
      left: 0,
      top: 0,
      right: Math.max(0, viewportSize.width - window.size.width),
      bottom: Math.max(0, viewportSize.height - window.size.height - 48) // Account for taskbar
    }
  })

  const handleResize = (
    _event: React.SyntheticEvent,
    { size }: { size: { width: number; height: number } }
  ) => {
    updateWindowSize(window.id, size)
  }

  const handleWindowClick = () => {
    focusWindow(window.id)
  }

  if (window.isMinimized) {
    return null
  }

  // Maximized window
  if (window.isMaximized) {
    return (
      <div
        className="fixed top-0 left-0 bg-white border border-gray-300 shadow-lg overflow-hidden z-40"
        style={{
          width: '100vw',
          height: 'calc(100vh - 48px)',
          zIndex: window.zIndex,
        }}
        onClick={handleWindowClick}
      >
        {/* Window Title Bar */}
        <div className="bg-blue-500 text-white px-3 py-2 flex items-center justify-between cursor-move select-none">
          <span className="text-sm font-medium">{window.title}</span>
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                minimizeWindow(window.id)
              }}
              className="p-2 hover:bg-blue-600 rounded touch-manipulation cursor-pointer flex items-center justify-center"
              style={{ minHeight: '36px', minWidth: '36px' }}
            >
              <Minus size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                maximizeWindow(window.id)
              }}
              className="p-2 hover:bg-blue-600 rounded touch-manipulation cursor-pointer flex items-center justify-center"
              style={{ minHeight: '36px', minWidth: '36px' }}
            >
              <Minimize2 size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                closeWindow(window.id)
              }}
              className="p-2 hover:bg-red-600 rounded touch-manipulation cursor-pointer flex items-center justify-center"
              style={{ minHeight: '36px', minWidth: '36px' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Window Content */}
        <div className="overflow-auto bg-white" style={{ height: 'calc(100vh - 88px)' }}>
          <ApplicationRegistry window={window} />
        </div>
      </div>
    )
  }

  // Normal window (not maximized)
  return (
    <div 
      ref={dragRef}
      style={{ 
        position: 'absolute', 
        left: position.x, 
        top: position.y, 
        zIndex: window.zIndex 
      }}
    >
      <ResizableBox
        width={window.size.width}
        height={window.size.height}
        onResize={handleResize}
        minConstraints={[300, 200]}
        maxConstraints={[1200, 800]}
        resizeHandles={['se', 'e', 's']}
      >
        <div
          className="bg-white border border-gray-300 shadow-lg rounded-t-lg overflow-hidden relative"
          onClick={handleWindowClick}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Window Title Bar */}
          <div 
            className="bg-blue-500 text-white px-3 py-2 flex items-center justify-between select-none"
            {...dragHandleProps}
          >
            <span className="text-sm font-medium">{window.title}</span>
            <div className="flex items-center space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  minimizeWindow(window.id)
                }}
                className="p-2 hover:bg-blue-600 rounded touch-manipulation cursor-pointer flex items-center justify-center"
                style={{ minHeight: '36px', minWidth: '36px' }}
              >
                <Minus size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  maximizeWindow(window.id)
                }}
                className="p-2 hover:bg-blue-600 rounded touch-manipulation cursor-pointer flex items-center justify-center"
                style={{ minHeight: '36px', minWidth: '36px' }}
              >
                <Maximize2 size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeWindow(window.id)
                }}
                className="p-2 hover:bg-red-600 rounded touch-manipulation cursor-pointer flex items-center justify-center"
                style={{ minHeight: '36px', minWidth: '36px' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Window Content */}
          <div 
            className="overflow-auto bg-white" 
            style={{ height: `${window.size.height - 40}px` }}
          >
            <ApplicationRegistry window={window} />
          </div>
          
          {/* Resize Handle Indicator - positioned relative to entire window */}
          <div className="absolute bottom-0 right-0 w-4 h-4 pointer-events-none z-10 bg-gray-200 border-l border-t border-gray-300">
            <svg width="16" height="16" viewBox="0 0 16 16" className="absolute bottom-0 right-0">
              <g stroke="#374151" strokeWidth="1.5" opacity="0.8">
                <line x1="6" y1="16" x2="16" y2="6" />
                <line x1="10" y1="16" x2="16" y2="10" />
                <line x1="14" y1="16" x2="16" y2="14" />
              </g>
            </svg>
          </div>
        </div>
      </ResizableBox>
    </div>
  )
}
