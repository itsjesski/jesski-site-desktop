import React from 'react'
import type { WindowState } from '../types/window'
import { ExternalLink, Globe, ArrowUpRight } from 'lucide-react'

interface WebsiteViewerProps {
  window: WindowState
}

export const WebsiteViewer: React.FC<WebsiteViewerProps> = ({ window: windowState }) => {
  const url = (windowState.data?.url as string) || 'https://example.com'
  const siteName = (windowState.data?.siteName as string) || 'Website'
  const description = (windowState.data?.description as string) || 'Click to visit this website in a new tab.'

  const handleOpenSite = () => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto overflow-x-hidden">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto text-center">
        {/* Website Icon */}
        <div className="w-24 h-24 bg-blue-500 rounded-lg mb-6 flex items-center justify-center shadow-lg">
          <Globe size={48} className="text-white" />
        </div>
        
        {/* Site Information */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{siteName}</h1>
        <p className="text-gray-600 mb-2 text-sm">{url}</p>
        <p className="text-gray-700 mb-8 leading-relaxed">{description}</p>
        
        {/* Open Button */}
        <button
          onClick={handleOpenSite}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
        >
          <ExternalLink size={20} />
          <span>Open {siteName}</span>
        </button>
        
        {/* Disclaimer */}
        <p className="text-xs text-gray-500 mt-4 opacity-75">
          This will open in a new browser tab
        </p>
        
        {/* Shortcut Icon in bottom-left corner */}
        <div className="absolute bottom-4 left-4">
          <div className="w-6 h-6 bg-gray-600 rounded-sm flex items-center justify-center shadow-sm">
            <ArrowUpRight size={14} className="text-white" />
          </div>
        </div>
      </div>
    </div>
  )
}
