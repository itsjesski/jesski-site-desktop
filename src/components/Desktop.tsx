import React from 'react'
import type { WindowState } from '../store/desktopStore'
import { useDesktopStore } from '../store/desktopStore'
import { Window, Taskbar, DesktopIcon } from '.'
import { FileText, Globe, User, Mail, Folder } from 'lucide-react'

const desktopIcons = [
  {
    id: 'about',
    label: 'About Me',
    icon: User,
    x: 30,
    y: 30,
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
    x: 30,
    y: 140,
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
    x: 30,
    y: 250,
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
    x: 30,
    y: 360,
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
    x: 30,
    y: 470,
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
  }
]

export const Desktop: React.FC = () => {
  const { windows, openWindow } = useDesktopStore()

  const handleIconDoubleClick = (iconAction: () => Omit<WindowState, 'id' | 'zIndex'>) => {
    const windowData = iconAction()
    openWindow(windowData)
  }

  return (
    <div className="fixed inset-0 h-screen w-screen bg-gradient-to-br from-blue-400 to-blue-600 overflow-hidden">
      {/* Desktop Background */}
      <div className="absolute inset-0 pb-12">
        {/* Desktop Icons */}
        <div className="relative h-full w-full">
          {desktopIcons.map((icon) => (
            <DesktopIcon
              key={icon.id}
              icon={icon.icon}
              label={icon.label}
              x={icon.x}
              y={icon.y}
              onDoubleClick={() => handleIconDoubleClick(icon.action)}
            />
          ))}
        </div>

        {/* Windows */}
        {windows.map((window) => (
          <Window key={window.id} window={window} />
        ))}
      </div>

      {/* Taskbar */}
      <Taskbar />
    </div>
  )
}
