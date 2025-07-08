import React from 'react'

interface ImagePlaceholderProps {
  width?: number | string
  height?: number | string
  className?: string
  style?: React.CSSProperties
}

export const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
  width = 100,
  height = 100,
  className = '',
  style = {}
}) => {
  return (
    <div
      className={`bg-gray-200 animate-pulse rounded-lg ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style
      }}
    >
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )
}

export const StickerPlaceholder: React.FC<{ size: number }> = ({ size }) => {
  return (
    <div
      className="bg-gray-200 animate-pulse rounded-lg opacity-30"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.1))'
      }}
    />
  )
}
