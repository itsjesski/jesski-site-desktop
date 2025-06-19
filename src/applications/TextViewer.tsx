import React, { useState, useEffect } from 'react'
import type { WindowState } from '../store/desktopStore'
import { getTextFile, type TextFile } from '../utils/textLoader'

interface TextViewerProps {
  window: WindowState
}

export const TextViewer: React.FC<TextViewerProps> = ({ window }) => {
  const [textFile, setTextFile] = useState<TextFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get the filename from window data, fallback to legacy content
  const fileName = (window.data?.fileName as string) || 'README.txt'
  const legacyContent = window.data?.content as string

  useEffect(() => {
    const loadTextFile = async () => {
      setLoading(true)
      setError(null)

      try {
        const file = await getTextFile(fileName)
        
        if (file) {
          setTextFile(file)
        } else if (legacyContent) {
          // Fallback to legacy inline content
          setTextFile({
            fileName,
            displayName: fileName,
            content: legacyContent
          })
        } else {
          setError(`File not found: ${fileName}`)
        }
      } catch (err) {
        setError(`Error loading file: ${fileName}`)
        console.error('TextViewer load error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTextFile()
  }, [fileName, legacyContent])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error || !textFile) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">{error || 'File not found'}</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div 
        className="px-4 py-2 border-b"
        style={{ 
          backgroundColor: 'var(--color-primary-100)',
          borderColor: 'var(--color-primary-200)'
        }}
      >
        <span 
          className="text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          File: {textFile.displayName}
        </span>
      </div>
      <div 
        className="flex-1 p-4 font-mono text-sm whitespace-pre-wrap overflow-auto"
        style={{ 
          backgroundColor: 'var(--window-content-bg)',
          color: 'var(--text-primary)'
        }}
      >
        {textFile.content}
      </div>
    </div>
  )
}
