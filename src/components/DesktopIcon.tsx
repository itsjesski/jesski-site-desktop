import React, { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ExternalLink } from 'lucide-react'

interface DesktopIconProps {
  icon: LucideIcon
  label: string
  isExternalLink?: boolean
  onDoubleClick: () => void
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({ 
  icon: Icon, 
  label, 
  isExternalLink = false,
  onDoubleClick 
}) => {
  const [isSelected, setIsSelected] = useState(false)

  const handleClick = () => {
    setIsSelected(true)
    setTimeout(() => setIsSelected(false), 200)
  }

  return (
    <div
      className={`cursor-pointer select-none group desktop-icon touch-manipulation flex justify-center flex-shrink-0 relative`}
      style={{ minHeight: '44px', minWidth: '44px', width: '90px' }}
      onClick={handleClick}
      onDoubleClick={onDoubleClick}
      role="button"
      tabIndex={2}
      aria-label={`${isExternalLink ? 'Open link to' : 'Open'} ${label}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onDoubleClick()
        }
      }}
    >
      <div className={`
        flex flex-col items-center p-2 rounded-lg transition-colors w-full
        ${isSelected ? 'bg-opacity-50' : 'hover:bg-opacity-30'}
      `}
      style={{
        backgroundColor: isSelected ? 'var(--icon-active)' : 'transparent'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'var(--icon-hover)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'transparent'
        }
      }}
      >
        <div 
          className="p-3 rounded-lg shadow-md mb-2 border relative"
          style={{
            backgroundColor: 'var(--icon-bg)',
            borderColor: 'var(--icon-border)'
          }}
        >
          <Icon size={32} style={{ color: 'var(--icon-text)' }} aria-hidden="true" />
          {/* External link indicator */}
          {isExternalLink && (
            <div 
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
              style={{ backgroundColor: 'var(--color-accent-600)' }}
            >
              <ExternalLink size={10} className="text-white" />
            </div>
          )}
        </div>
        <span 
          className="text-xs font-medium text-center leading-tight break-words drop-shadow-sm"
          style={{ color: 'var(--icon-text)' }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}
