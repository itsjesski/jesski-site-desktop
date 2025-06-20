import React from 'react'
import type { WindowState } from '../store/desktopStore'
import { useDesktopStore } from '../store/desktopStore'
import { Window, Taskbar, DesktopIcon, TwitchStream, Notification } from '.'
import { StartMenu } from './StartMenu'
import { DesktopStickers } from './DesktopStickers'
import { FileText, User, Folder, Palette, Video, MessageCircle, Trophy, Monitor } from 'lucide-react'
import BackgroundImage from '../images/Background.png'
import { twitchAPI } from '../services/twitchAPI'
import { useNotificationManager } from '../hooks/useNotificationManager'

// Helper function to create window action with defaults
const createWindowAction = (
  title: string,
  component: string,
  data?: Record<string, unknown>
) => () => ({
  title,
  component,
  isMinimized: false,
  isMaximized: false,
  position: { x: 0, y: 0 }, // Will be auto-centered by store
  size: { width: 750, height: 550 }, // Will be auto-sized by store
  ...(data && { data })
})

const desktopIcons = [
  {
    id: 'about',
    label: 'About Me',
    icon: User,
    action: createWindowAction('About Me', 'about', {
      fileName: 'about.txt'
    })
  },
  {
    id: 'readme',
    label: 'README.txt',
    icon: FileText,
    action: createWindowAction('README.txt', 'text-viewer', {
      fileName: 'README.txt'
    })
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: Folder,
    action: createWindowAction('My Projects', 'text-viewer', {
      fileName: 'projects.txt'
    })
  },
  {
    id: 'stickers',
    label: 'Stickers',
    icon: Palette,
    action: createWindowAction('Cute Stickers', 'sticker-pack')
  },  {
    id: 'chat',
    label: 'Chat',
    icon: MessageCircle,
    action: () => ({
      title: 'Twitch Chat',
      component: 'twitch-chat',
      isMinimized: false,
      isMaximized: false,
      position: { x: 0, y: 0 }, // Will be auto-centered
      size: { width: 900, height: 650 }
    })  },  {
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
    id: 'streamer',
    label: 'Streamer Software',
    icon: Monitor,
    action: () => ({
      title: 'Streamer Software',
      component: 'streamer-software',
      isMinimized: false,
      isMaximized: false,
      position: { x: 0, y: 0 }, // Will be auto-centered
      size: { width: 900, height: 650 }
    })
  },
  {
    id: 'twitch',
    label: 'Twitch',
    icon: Video,
    isExternalLink: true,
    url: 'https://twitch.tv/jesski',
    action: () => {
      window.open('https://twitch.tv/jesski', '_blank', 'noopener,noreferrer')
      return null
    }
  }
]

export const Desktop: React.FC = () => {
  const { windows, openWindow, initializeWelcomeWindow, showTwitchStream, setTwitchStreamVisible } = useDesktopStore()
  const { activeNotifications, isMuted, dismissNotification, toggleMute } = useNotificationManager()
  const [isStartMenuOpen, setIsStartMenuOpen] = React.useState(false)
  const [iconColumns, setIconColumns] = React.useState<Array<typeof desktopIcons>>([])
  const [isMobile, setIsMobile] = React.useState(false)

  const handleIconDoubleClick = (iconAction: () => Omit<WindowState, 'id' | 'zIndex'> | null) => {
    const windowData = iconAction()
    if (windowData) {
      openWindow(windowData)
    }
    // If windowData is null, it means the action handled itself (like opening external link)
  }

  const handleStartMenuToggle = () => {
    setIsStartMenuOpen(!isStartMenuOpen)
  }

  const handleStartMenuClose = () => {
    setIsStartMenuOpen(false)
  }

  // Initialize welcome window on first load
  React.useEffect(() => {
    initializeWelcomeWindow()
  }, [initializeWelcomeWindow])

  // Detect mobile and update state
  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  // Calculate responsive icon columns
  React.useEffect(() => {
    const calculateColumns = () => {
      const taskbarHeight = 48
      const padding = 40 // Increased padding for better spacing
      const availableHeight = window.innerHeight - taskbarHeight - padding
      const iconHeight = 110 // Increased to account for icon + label + extra spacing
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
  // Check for live stream status
  React.useEffect(() => {
    const checkStreamStatus = async () => {
      try {
        const twitchChannel = import.meta.env.VITE_TWITCH_CHANNEL || 'jesski'
        const result = await twitchAPI.isStreamLive(twitchChannel)
        console.log(`Stream status check: ${result.isLive ? 'LIVE' : 'OFFLINE'}`)
        setTwitchStreamVisible(result.isLive)
      } catch (error) {
        console.error('Failed to check stream status:', error)
        setTwitchStreamVisible(false)
      }
    }

    // Check immediately on mount
    checkStreamStatus()
    
    // Check every 2 minutes
    const interval = setInterval(checkStreamStatus, 2 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [setTwitchStreamVisible])

  return (
    <div 
      className="fixed inset-0 h-screen w-screen overflow-hidden"
      style={{
        backgroundImage: `url(${BackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >      {/* Desktop Background */}
      <div className="absolute inset-0" style={{ paddingBottom: '52px' }}>
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
              maxHeight: `calc(100vh - 100px)`, // Account for taskbar (48px) + padding
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
              >              {column.map((icon) => (
                <DesktopIcon
                  key={icon.id}
                  icon={icon.icon}
                  label={icon.label}
                  isExternalLink={icon.isExternalLink}
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
      </div>      {/* Taskbar - At the end for proper positioning */}
      <Taskbar 
        isStartMenuOpen={isStartMenuOpen}
        onStartMenuToggle={handleStartMenuToggle}
        isMuted={isMuted}
        onToggleMute={toggleMute}
      />

      {/* Start Menu - Rendered at top level for proper positioning */}
      <StartMenu 
        isOpen={isStartMenuOpen}
        onClose={handleStartMenuClose}
        onOpenWindow={(windowData) => {
          openWindow(windowData)
          handleStartMenuClose()
        }}
      />      {/* Twitch Stream - Desktop only */}
      {!isMobile && showTwitchStream && (
        <TwitchStream onClose={() => setTwitchStreamVisible(false)} />
      )}      {/* Notifications - Bottom right corner */}
      <div className="fixed bottom-16 right-4 z-50">        
        {/* Notification Stack */}
        <div className="space-y-2">
          {activeNotifications.map((notification, index) => (
            <div 
              key={notification.id}
              style={{ 
                transform: `translateY(-${index * 8}px)`,
                zIndex: 50 - index
              }}
            >              <Notification
                title={notification.title}
                message={notification.message}
                onClose={() => dismissNotification(notification.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
