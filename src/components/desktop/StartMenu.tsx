import React from 'react'
import ReactDOM from 'react-dom'
import { User, Trophy, Folder, Video } from 'lucide-react'
import type { WindowState } from '../../types/window'

interface StartMenuProps {
  isOpen: boolean
  onClose: () => void
  onOpenWindow: (windowData: Omit<WindowState, 'id' | 'zIndex'>) => void
}

const startMenuItems = [
  {
    id: 'about',
    label: 'About Me',
    icon: User,
    action: () => ({
      title: 'About Me',
      component: 'about',
      isMinimized: false,
      isMaximized: false,
      position: { x: 0, y: 0 }, // Will be auto-centered
      size: { width: 750, height: 600 }
    })
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: Folder,
    action: () => ({
      title: 'My Projects',
      component: 'text-viewer',
      isMinimized: false,
      isMaximized: false,
      position: { x: 0, y: 0 }, // Will be auto-centered
      size: { width: 750, height: 550 },
      data: {
        fileName: 'projects.txt'
      }
    })
  },
  {
    id: 'games',
    label: 'Games',
    icon: Trophy,
    action: () => ({
      title: 'Games',
      component: 'games-library',
      isMinimized: false,
      isMaximized: false,
      position: { x: 0, y: 0 }, // Will be auto-centered
      size: { width: 1000, height: 700 }
    })
  },
  {
    id: 'twitch',
    label: 'Twitch',
    icon: Video,
    action: () => ({
      title: 'Twitch Chat',
      component: 'twitch-chat',
      isMinimized: false,
      isMaximized: false,
      position: { x: 0, y: 0 }, // Will be auto-centered
      size: { width: 900, height: 650 }
    })
  }
]

export const StartMenu: React.FC<StartMenuProps> = ({ isOpen, onClose, onOpenWindow }) => {
  if (!isOpen) return null

  const handleItemClick = (item: typeof startMenuItems[0]) => {
    const windowData = item.action()
    onOpenWindow(windowData)
    onClose()
  }

  const startMenuContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[60]" 
        onClick={onClose}
      />
      
      {/* Start Menu */}
      <div 
        className="border rounded-t-lg shadow-2xl w-72 sm:min-w-80 sm:max-w-96"
        style={{
          backgroundColor: 'var(--start-menu-bg)',
          borderColor: 'var(--start-menu-border)',
          position: 'fixed',
          bottom: '48px',
          left: '8px',
          zIndex: 10000
        }}
        role="menu"
        aria-label="Start menu"
      >
        <div className="p-3 sm:p-5">
          <div 
            className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 px-2 sm:px-3 py-1 sm:py-2" 
            style={{ color: 'var(--start-menu-text)' }}
            role="heading" 
            aria-level={2}
          >
            Quick Access
          </div>
          <div className="flex flex-col gap-1 sm:gap-2" role="group">
            {startMenuItems.map((item) => {
              const IconComponent = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-3 mx-0.5 sm:mx-1 rounded-md transition-colors text-left cursor-pointer"
                  style={{
                    color: 'var(--start-menu-text)',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--start-menu-hover)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                  role="menuitem"
                  aria-label={`Open ${item.label}`}
                >
                  <IconComponent size={16} className="sm:w-4.5 sm:h-4.5" aria-hidden="true" />
                  <span className="text-sm sm:text-base font-medium">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )

  // Render using a portal to bypass any parent container positioning issues
  return ReactDOM.createPortal(startMenuContent, document.body)
}
