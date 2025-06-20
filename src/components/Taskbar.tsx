import React from 'react'
import { useDesktopStore } from '../store/desktopStore'
import { format } from 'date-fns'
import { Menu, FileText, Globe, User, Folder, X } from 'lucide-react'
import { SystemTray } from './SystemTray'

interface TaskbarProps {
  isStartMenuOpen: boolean
  onStartMenuToggle: () => void
  isMuted?: boolean
  onToggleMute?: () => void
}

const getIconForComponent = (component: string) => {
  switch (component) {
    case 'text-viewer':
      return FileText
    case 'website-viewer':
      return Globe
    case 'about':
      return User
    default:
      return Folder
  }
}

export const Taskbar: React.FC<TaskbarProps> = ({ 
  isStartMenuOpen, 
  onStartMenuToggle, 
  isMuted = false, 
  onToggleMute 
}) => {
  const { windows, focusWindow, minimizeWindow, closeWindow } = useDesktopStore()
  const [currentTime, setCurrentTime] = React.useState(new Date())

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleTaskClick = (windowId: string, isMinimized: boolean) => {
    if (isMinimized) {
      focusWindow(windowId)
    } else {
      minimizeWindow(windowId)
    }
  }

  const handleCloseWindow = (e: React.MouseEvent, windowId: string) => {
    e.stopPropagation()
    closeWindow(windowId)
  }

  return (
    <>
      <div 
        className="fixed left-0 right-0 h-12 flex items-center px-2 sm:px-4 border-t" 
        style={{
          backgroundColor: 'var(--taskbar-bg)',
          borderColor: 'var(--taskbar-border)',
          color: 'var(--taskbar-text)',
          bottom: 0,
          top: 'auto',
          position: 'fixed',
          zIndex: 9999
        }}
        role="navigation" 
        aria-label="Taskbar"
      >
        {/* Start Button - Left Section */}
        <div className="flex-shrink-0 mr-2 sm:mr-4">
          <button 
            onClick={onStartMenuToggle}
            className={`flex items-center space-x-1 sm:space-x-2 px-3 py-3 sm:px-3 sm:py-2 rounded text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              isStartMenuOpen ? '' : 'hover:bg-opacity-80'
            }`}
            style={{
              backgroundColor: isStartMenuOpen ? 'var(--taskbar-active)' : 'transparent',
              color: 'var(--taskbar-text)'
            }}
            onMouseEnter={(e) => {
              if (!isStartMenuOpen) {
                e.currentTarget.style.backgroundColor = 'var(--taskbar-hover)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isStartMenuOpen) {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
            aria-label="Start menu"
            aria-expanded={isStartMenuOpen}
            aria-haspopup="menu"
            tabIndex={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onStartMenuToggle()
              }
            }}
          >
            <Menu size={18} className="sm:w-4 sm:h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Start</span>
          </button>
        </div>

        {/* Open Applications - Left aligned with spacing */}
        <div className="flex flex-1 gap-1 sm:gap-3 overflow-x-auto" role="group" aria-label="Open windows">
          {windows.map((window) => {
            const IconComponent = getIconForComponent(window.component)
            return (                <div
                  key={window.id}
                  className="relative flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors border max-w-32 sm:max-w-48 flex-shrink-0"
                  style={{
                    backgroundColor: window.isMinimized ? 'var(--taskbar-hover)' : 'var(--taskbar-active)',
                    color: 'var(--taskbar-text)',
                    borderColor: 'var(--taskbar-border)'
                  }}
                >
                <button
                  onClick={() => handleTaskClick(window.id, window.isMinimized)}
                  className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0 pr-1 cursor-pointer"
                  aria-label={`${window.isMinimized ? 'Restore' : 'Minimize'} ${window.title} window`}
                  title={`${window.isMinimized ? 'Restore' : 'Minimize'} ${window.title}`}
                >
                  <IconComponent size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" aria-hidden="true" />
                  <span className="truncate hidden sm:inline">{window.title}</span>
                </button>
                <button
                  onClick={(e) => handleCloseWindow(e, window.id)}
                  className="flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-20 rounded transition-colors touch-manipulation cursor-pointer"
                  style={{ minHeight: '20px', minWidth: '20px' }}
                  title={`Close ${window.title}`}
                  aria-label={`Close ${window.title} window`}
                >
                  <X size={10} className="sm:w-3 sm:h-3" aria-hidden="true" />
                </button>
              </div>
            )
          })}
        </div>

        {/* System Tray - Right Section */}
        <div className="flex-shrink-0 ml-2 sm:ml-4 flex items-center gap-2">
          {/* System Tray */}
          <SystemTray 
            isMuted={isMuted}
            onToggleMute={onToggleMute}
          />
          
          {/* Date and Time */}
          <div className="text-right px-1 sm:px-3 py-2 text-xs sm:text-sm" style={{ color: 'var(--taskbar-text)' }}>
            <div className="leading-tight">{format(currentTime, 'h:mm a')}</div>
            <div className="text-xs leading-tight hidden sm:block">{format(currentTime, 'MM/dd/yyyy')}</div>
          </div>
        </div>
      </div>
    </>
  )
}
