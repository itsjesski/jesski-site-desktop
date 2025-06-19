import React from 'react'
import type { WindowState } from '../store/desktopStore'
import { useDesktopStore } from '../store/desktopStore'
import { Window, Taskbar, DesktopIcon } from '.'
import { StartMenu } from './StartMenu'
import { DesktopStickers } from './DesktopStickers'
import { FileText, Globe, User, Mail, Folder, Palette } from 'lucide-react'
import BackgroundImage from '../images/Background.png'

const desktopIcons = [
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
    label: 'README.txt',
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
      position: { x: 300, y: 150 },
      size: { width: 700, height: 500 },
      data: {
        fileName: 'projects.txt',
        content: `My Projects

1. Desktop Website
   - This very website you're looking at!
   - Built with React, TypeScript, and Tailwind CSS
   - Features window management and desktop simulation

2. Future Project Ideas
   - Add more applications (calculator, notepad, file explorer)
   - Implement right-click context menus
   - Add system notifications
   - Create a proper file system simulation
   - Add themes and customization options

3. Technologies I Work With
   - React & TypeScript
   - Node.js & Express
   - Python & Django
   - Database: PostgreSQL, MongoDB
   - Cloud: AWS, Docker

Feel free to reach out if you'd like to collaborate!`
      }
    })
  },
  {
    id: 'stickers',
    label: 'Stickers',
    icon: Palette,
    action: () => ({
      title: 'Cute Stickers',
      component: 'sticker-pack',
      isMinimized: false,
      isMaximized: false,
      position: { x: 200, y: 50 },
      size: { width: 600, height: 500 }
    })
  }
]

export const Desktop: React.FC = () => {
  const { windows, openWindow } = useDesktopStore()
  const [isStartMenuOpen, setIsStartMenuOpen] = React.useState(false)
  const [iconColumns, setIconColumns] = React.useState<Array<typeof desktopIcons>>([])

  const handleIconDoubleClick = (iconAction: () => Omit<WindowState, 'id' | 'zIndex'>) => {
    const windowData = iconAction()
    openWindow(windowData)
  }

  const handleStartMenuToggle = () => {
    setIsStartMenuOpen(!isStartMenuOpen)
  }

  const handleStartMenuClose = () => {
    setIsStartMenuOpen(false)
  }

  // Calculate responsive icon columns
  React.useEffect(() => {
    const calculateColumns = () => {
      const taskbarHeight = 48
      const padding = 32 // Top and bottom padding
      const availableHeight = window.innerHeight - taskbarHeight - padding
      const iconHeight = 100 // Increased to account for icon + label + spacing
      const iconsPerColumn = Math.floor(availableHeight / iconHeight)
      
      // Ensure at least 1 icon per column
      const safeIconsPerColumn = Math.max(1, iconsPerColumn)

      const columns: Array<typeof desktopIcons> = []
      for (let i = 0; i < desktopIcons.length; i += safeIconsPerColumn) {
        columns.push(desktopIcons.slice(i, i + safeIconsPerColumn))
      }
      setIconColumns(columns)
    }

    calculateColumns()
    window.addEventListener('resize', calculateColumns)
    return () => window.removeEventListener('resize', calculateColumns)
  }, [])

  return (
    <div 
      className="fixed inset-0 h-screen w-screen overflow-hidden"
      style={{
        backgroundImage: `url(${BackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Desktop Background */}
      <div className="absolute inset-0" style={{ paddingBottom: '48px' }}>
        {/* Decorative Stickers */}
        <DesktopStickers />
        
        {/* Desktop Icons - Responsive vertical columns like Windows */}
        <main id="main-content" className="relative h-full w-full hidden sm:block p-4" role="main" aria-label="Desktop">
          <div 
            role="group" 
            aria-label="Desktop shortcuts"
            className="flex gap-2 h-full"
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              maxHeight: `calc(100vh - 80px)`, // More conservative height calculation
              overflow: 'visible' // Allow icons to be fully visible
            }}
          >
            {iconColumns.map((column, columnIndex) => (
              <div 
                key={columnIndex}
                className="flex flex-col gap-3"
                style={{ 
                  minWidth: '90px',
                  maxHeight: '100%'
                }}
              >
                {column.map((icon) => (
                  <DesktopIcon
                    key={icon.id}
                    icon={icon.icon}
                    label={icon.label}
                    onDoubleClick={() => handleIconDoubleClick(icon.action)}
                  />
                ))}
              </div>
            ))}
          </div>
        </main>

        {/* Mobile Welcome Screen - Only shown on mobile */}
        <main id="main-content" className="sm:hidden flex items-center justify-center h-full p-6" role="main" aria-label="Mobile welcome screen">
          <div className="text-center" style={{ color: 'var(--text-primary)' }}>
            <div className="mb-4">
              <User size={48} className="mx-auto mb-2 opacity-80" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Welcome to Jess's Desktop</h1>
            <p className="text-sm opacity-90 mb-4">
              Use the Start menu at the bottom to open applications
            </p>
            <div className="flex justify-center">
              <div className="rounded-lg p-3 backdrop-blur-sm" style={{ 
                backgroundColor: 'var(--color-primary-800)', 
                color: 'var(--text-inverse)',
                opacity: 0.9 
              }}>
                <p className="text-xs opacity-80">Tap the Start button ↓</p>
              </div>
            </div>
          </div>
        </main>

        {/* Windows */}
        <div role="region" aria-label="Open windows">
          {windows.map((window) => (
            <Window key={window.id} window={window} />
          ))}
        </div>
      </div>

      {/* Taskbar - At the end for proper positioning */}
      <Taskbar 
        isStartMenuOpen={isStartMenuOpen}
        onStartMenuToggle={handleStartMenuToggle}
      />

      {/* Start Menu - Rendered at top level for proper positioning */}
      <StartMenu 
        isOpen={isStartMenuOpen}
        onClose={handleStartMenuClose}
        onOpenWindow={(windowData) => {
          openWindow(windowData)
          handleStartMenuClose()
        }}
      />
    </div>
  )
}
