import React from 'react'
import { useDesktopStore } from '../store/desktopStore'
import { format } from 'date-fns'
import { Menu, FileText, Globe, User, Mail, Folder } from 'lucide-react'
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
  const { windows, focusWindow, minimizeWindow, openWindow } = useDesktopStore()
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

  const handleStartClick = () => {
    setIsStartMenuOpen(!isStartMenuOpen)
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 h-12 bg-gray-800 border-t border-gray-600 flex items-center z-50 px-4">
        {/* Start Button - Left Section */}
        <div className="flex-shrink-0 mr-4">
          <button 
            onClick={handleStartClick}
            className={`flex items-center space-x-2 px-3 py-2 rounded text-white text-sm font-medium transition-colors ${
              isStartMenuOpen ? 'bg-gray-600' : 'bg-transparent hover:bg-gray-700'
            }`}
          >
            <Menu size={16} />
            <span>Start</span>
          </button>
        </div>

        {/* Open Applications - Left aligned with spacing */}
        <div className="flex flex-1 gap-3">
          {windows.map((window) => {
            const IconComponent = getIconForComponent(window.component)
            return (
              <button
                key={window.id}
                onClick={() => handleTaskClick(window.id, window.isMinimized)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors border max-w-48 truncate
                  ${window.isMinimized 
                    ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' 
                    : 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500'
                  }
                `}
              >
                <IconComponent size={14} />
                <span className="truncate">{window.title}</span>
              </button>
            )
          })}
        </div>

        {/* System Tray - Right Section */}
        <div className="flex-shrink-0 ml-4">
          <div className="text-right px-3 py-2 text-white text-sm">
            <div className="leading-tight">{format(currentTime, 'h:mm a')}</div>
            <div className="text-xs leading-tight">{format(currentTime, 'MM/dd/yyyy')}</div>
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
