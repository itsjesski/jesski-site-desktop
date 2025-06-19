import React from 'react'
import { User, Mail, Globe, FileText } from 'lucide-react'
import type { WindowState } from '../store/desktopStore'

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
      position: { x: 100, y: 100 },
      size: { width: 600, height: 500 }
    })
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: Mail,
    action: () => ({
      title: 'Contact',
      component: 'contact',
      isMinimized: false,
      isMaximized: false,
      position: { x: 150, y: 150 },
      size: { width: 500, height: 600 }
    })
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: Globe,
    action: () => ({
      title: 'Portfolio Website',
      component: 'website-viewer',
      isMinimized: false,
      isMaximized: false,
      position: { x: 200, y: 100 },
      size: { width: 800, height: 600 },
      data: {
        url: 'https://github.com',
        siteName: 'GitHub'
      }
    })
  },
  {
    id: 'readme',
    label: 'README',
    icon: FileText,
    action: () => ({
      title: 'README.txt',
      component: 'text-viewer',
      isMinimized: false,
      isMaximized: false,
      position: { x: 250, y: 200 },
      size: { width: 600, height: 400 },
      data: {
        fileName: 'README.txt',
        content: `Welcome to Jess's Desktop!

This is a Windows-style desktop interface built with React and TypeScript.

Features:
- Draggable and resizable windows
- Desktop icons
- Taskbar with open applications
- Various applications (About, Contact, Website viewer, Text viewer)

Double-click on icons to open applications.
Drag windows around to organize your workspace.
Use the taskbar to switch between open applications.

Enjoy exploring!`
      }
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

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[60]" 
        onClick={onClose}
      />
      
      {/* Start Menu */}
      <div className="fixed bottom-12 left-4 z-[70] bg-gray-800 border border-gray-600 rounded-t-lg shadow-2xl min-w-80 max-w-96">
        <div className="p-5">
          <div className="text-white text-lg font-semibold mb-3 px-3 py-2">
            Quick Access
          </div>
          <div className="flex flex-col gap-2">
            {startMenuItems.map((item) => {
              const IconComponent = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="w-full flex items-center gap-3 px-3 py-3 mx-1 text-white hover:bg-gray-700 rounded-md transition-colors text-left"
                >
                  <IconComponent size={18} />
                  <span className="text-base font-medium">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
