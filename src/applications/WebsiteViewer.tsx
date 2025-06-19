import React from 'react'
import type { WindowState } from '../store/desktopStore'

interface WebsiteViewerProps {
  window: WindowState
}

export const WebsiteViewer: React.FC<WebsiteViewerProps> = ({ window }) => {
  const url = (window.data?.url as string) || 'https://example.com'
  const siteName = (window.data?.siteName as string) || 'Website'

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-100 px-4 py-2 border-b flex items-center space-x-2">
        <span className="text-sm text-gray-600">Site:</span>
        <span className="text-sm font-medium">{siteName}</span>
        <span className="text-sm text-gray-400">•</span>
        <span className="text-sm text-gray-500">{url}</span>
      </div>
      <div className="flex-1">
        <iframe
          src={url}
          className="w-full h-full border-0"
          title={siteName}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </div>
  )
}
