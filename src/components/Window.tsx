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
        className="fixed top-0 left-0 overflow-hidden z-40"
        style={{
          width: '100vw',
          height: 'calc(100vh - 48px)',
          zIndex: window.zIndex,
          backgroundColor: 'var(--window-bg)',
          border: '1px solid var(--window-border)',
          boxShadow: 'var(--window-shadow)'
        }}
        onClick={handleWindowClick}
        role="dialog"
        aria-labelledby={`window-title-${window.id}`}
        aria-describedby={`window-content-${window.id}`}
      >
        {/* Window Title Bar */}
        <div 
          className="px-3 py-2 flex items-center justify-between cursor-move select-none"
          style={{
            backgroundColor: 'var(--window-header-bg)',
            color: 'var(--window-header-text)'
          }}
        >
          <span id={`window-title-${window.id}`} className="text-sm font-medium">{window.title}</span>
          <div className="flex items-center space-x-1" role="group" aria-label="Window controls">
            <button
              onClick={(e) => {
                e.stopPropagation()
                minimizeWindow(window.id)
              }}
              className="p-2 rounded touch-manipulation cursor-pointer flex items-center justify-center transition-colors"
              style={{ 
                minHeight: '36px', 
                minWidth: '36px',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              aria-label={`Minimize ${window.title}`}
              title="Minimize window"
            >
              <Minus size={16} aria-hidden="true" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                maximizeWindow(window.id)
              }}
              className="p-2 rounded touch-manipulation cursor-pointer flex items-center justify-center transition-colors"
              style={{ 
                minHeight: '36px', 
                minWidth: '36px',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              aria-label={window.isMaximized ? `Restore ${window.title}` : `Maximize ${window.title}`}
              title={window.isMaximized ? "Restore window" : "Maximize window"}
            >
              <Minimize2 size={16} aria-hidden="true" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                closeWindow(window.id)
              }}
              className="p-2 rounded touch-manipulation cursor-pointer flex items-center justify-center transition-colors"
              style={{ 
                minHeight: '36px', 
                minWidth: '36px',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.8)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              aria-label={`Close ${window.title}`}
              title="Close window"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Window Content */}
        <div 
          id={`window-content-${window.id}`}
          className="overflow-auto" 
          style={{ 
            height: 'calc(100vh - 88px)',
            backgroundColor: 'var(--window-bg)'
          }}
          role="main"
          aria-label={`${window.title} content`}
        >
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
          className="rounded-t-lg overflow-hidden relative"
          onClick={handleWindowClick}
          style={{ 
            width: '100%', 
            height: '100%',
            backgroundColor: 'var(--window-bg)',
            border: '1px solid var(--window-border)',
            boxShadow: 'var(--window-shadow)'
          }}
          role="dialog"
          aria-labelledby={`window-title-${window.id}`}
          aria-describedby={`window-content-${window.id}`}
        >
          {/* Window Title Bar */}
          <div 
            className="px-3 py-2 flex items-center justify-between select-none"
            {...dragHandleProps}
            style={{
              backgroundColor: 'var(--window-header-bg)',
              color: 'var(--window-header-text)',
              ...dragHandleProps.style
            }}
          >
            <span id={`window-title-${window.id}`} className="text-sm font-medium">{window.title}</span>
            <div className="flex items-center space-x-1" role="group" aria-label="Window controls">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  minimizeWindow(window.id)
                }}
                className="p-2 rounded touch-manipulation cursor-pointer flex items-center justify-center transition-colors"
                style={{ 
                  minHeight: '36px', 
                  minWidth: '36px',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
                aria-label={`Minimize ${window.title}`}
                title="Minimize window"
              >
                <Minus size={16} aria-hidden="true" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  maximizeWindow(window.id)
                }}
                className="p-2 rounded touch-manipulation cursor-pointer flex items-center justify-center transition-colors"
                style={{ 
                  minHeight: '36px', 
                  minWidth: '36px',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
                aria-label={`Maximize ${window.title}`}
                title="Maximize window"
              >
                <Maximize2 size={16} aria-hidden="true" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeWindow(window.id)
                }}
                className="p-2 rounded touch-manipulation cursor-pointer flex items-center justify-center transition-colors"
                style={{ 
                  minHeight: '36px', 
                  minWidth: '36px',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.8)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
                aria-label={`Close ${window.title}`}
                title="Close window"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Window Content */}
          <div 
            id={`window-content-${window.id}`}
            className="overflow-auto" 
            style={{ 
              height: `${window.size.height - 40}px`,
              backgroundColor: 'var(--window-bg)'
            }}
            role="main"
            aria-label={`${window.title} content`}
          >
            <ApplicationRegistry window={window} />
          </div>
          
          {/* Resize Handle Indicator - positioned relative to entire window */}
          <div 
            className="absolute bottom-0 right-0 w-4 h-4 pointer-events-none z-10"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" className="absolute bottom-0 right-0">
              <g stroke="var(--color-primary-600)" strokeWidth="1.5" strokeLinecap="round">
                <line x1="14" y1="16" x2="16" y2="14" />
                <line x1="10" y1="16" x2="16" y2="10" />
                <line x1="6" y1="16" x2="16" y2="6" />
              </g>
            </svg>
          </div>
        </div>
      </ResizableBox>
    </div>
  )
}
