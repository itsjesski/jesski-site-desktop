import React from 'react'
import { useDesktopStore } from '../store/desktopStore'
import { format } from 'date-fns'
import { Menu, FileText, Globe, User, Mail, Folder, X } from 'lucide-react'
import { StartMenu } from './StartMenu'

const getIconForComponent = (component: string) => {
  switch (component) {
    case 'text-viewer':
      return FileText
    case 'website-viewer':
      return Globe
    case 'about':
      return User
    case 'contact':
      return Mail
    default:
      return Folder
  }
}

export const Taskbar: React.FC = () => {
  const { windows, focusWindow, minimizeWindow, closeWindow, openWindow } = useDesktopStore()
  const [currentTime, setCurrentTime] = React.useState(new Date())
  const [isStartMenuOpen, setIsStartMenuOpen] = React.useState(false)

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

  const handleStartClick = () => {
    setIsStartMenuOpen(!isStartMenuOpen)
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 h-12 bg-gray-800 border-t border-gray-600 flex items-center z-50 px-2 sm:px-4">
        {/* Start Button - Left Section */}
        <div className="flex-shrink-0 mr-2 sm:mr-4">
          <button 
            onClick={handleStartClick}
            className={`flex items-center space-x-1 sm:space-x-2 px-3 py-3 sm:px-3 sm:py-2 rounded text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              isStartMenuOpen ? 'bg-gray-600' : 'bg-transparent hover:bg-gray-700'
            }`}
          >
            <Menu size={18} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Start</span>
          </button>
        </div>

        {/* Open Applications - Left aligned with spacing */}
        <div className="flex flex-1 gap-1 sm:gap-3 overflow-x-auto">
          {windows.map((window) => {
            const IconComponent = getIconForComponent(window.component)
            return (
              <div
                key={window.id}
                className={`
                  relative flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors border max-w-32 sm:max-w-48 flex-shrink-0
                  ${window.isMinimized 
                    ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' 
                    : 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500'
                  }
                `}
              >
                <button
                  onClick={() => handleTaskClick(window.id, window.isMinimized)}
                  className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0 pr-1 cursor-pointer"
                >
                  <IconComponent size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                  <span className="truncate hidden sm:inline">{window.title}</span>
                </button>
                <button
                  onClick={(e) => handleCloseWindow(e, window.id)}
                  className="flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-20 rounded transition-colors touch-manipulation cursor-pointer"
                  style={{ minHeight: '20px', minWidth: '20px' }}
                  title="Close"
                >
                  <X size={10} className="sm:w-3 sm:h-3" />
                </button>
              </div>
            )
          })}
        </div>

        {/* System Tray - Right Section */}
        <div className="flex-shrink-0 ml-2 sm:ml-4">
          <div className="text-right px-1 sm:px-3 py-2 text-white text-xs sm:text-sm">
            <div className="leading-tight">{format(currentTime, 'h:mm a')}</div>
            <div className="text-xs leading-tight hidden sm:block">{format(currentTime, 'MM/dd/yyyy')}</div>
          </div>
        </div>
      </div>

      {/* Start Menu */}
      <StartMenu 
        isOpen={isStartMenuOpen}
        onClose={() => setIsStartMenuOpen(false)}
        onOpenWindow={(windowData) => {
          openWindow(windowData)
          setIsStartMenuOpen(false)
        }}
      />
    </>
  )
}
