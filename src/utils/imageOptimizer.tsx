/**
 * Simplified image optimization utilities
 */

import React, { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  style?: React.CSSProperties
  draggable?: boolean
}

/**
 * Simple optimized image with fade-in effect
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  style = {},
  draggable = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      }`}
      style={style}
      onLoad={() => setIsLoaded(true)}
      loading="eager" // Load immediately for critical images
      decoding="async"
      draggable={draggable}
    />
  )
}
