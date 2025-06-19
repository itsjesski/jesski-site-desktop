import React from 'react'
import type { WindowState } from '../store/desktopStore'

interface TextViewerProps {
  window: WindowState
}

export const TextViewer: React.FC<TextViewerProps> = ({ window }) => {
  const content = (window.data?.content as string) || 'No content provided'
  const fileName = (window.data?.fileName as string) || 'document.txt'

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-100 px-4 py-2 border-b">
        <span className="text-sm text-gray-600">File: {fileName}</span>
      </div>
      <div className="flex-1 p-4 font-mono text-sm whitespace-pre-wrap overflow-auto">
        {content}
      </div>
    </div>
  )
}
