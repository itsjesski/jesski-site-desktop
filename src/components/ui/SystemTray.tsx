import React from 'react'
import { Settings } from 'lucide-react'
import { AudioControl } from './AudioControl'
import { useDesktopStore } from '../../store/desktopStore'
import { soundManager } from '../../services/soundManager'

export const SystemTray: React.FC = () => {
  const { openWindow } = useDesktopStore()

  const handleSettingsClick = () => {
    soundManager.play('click')
    openWindow({
      title: 'Settings',
      component: 'settings',
      isMinimized: false,
      isMaximized: false,
      position: { x: 100, y: 100 },
      size: { width: 800, height: 600 }
    })
  }

  return (
    <div className="flex items-center gap-1">
      {/* Audio Control */}
      <AudioControl />
      
      {/* Settings Button */}
      <button
        onClick={handleSettingsClick}
        className="p-2 rounded transition-colors cursor-pointer flex items-center justify-center"
        style={{
          minHeight: '32px',
          minWidth: '32px',
          backgroundColor: 'transparent',
          color: 'var(--taskbar-text)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--taskbar-hover)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
        title="Open Settings"
        aria-label="Open Settings"
      >
        <Settings size={14} />
      </button>
    </div>
  )
}
