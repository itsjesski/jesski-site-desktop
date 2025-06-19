import React, { useState } from 'react'
import type { LucideIcon } from 'lucide-react'

interface DesktopIconProps {
  icon: LucideIcon
  label: string
  x: number
  y: number
  onDoubleClick: () => void
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({ 
  icon: Icon, 
  label, 
  x, 
  y, 
  onDoubleClick 
}) => {
  const [isSelected, setIsSelected] = useState(false)

  const handleClick = () => {
    setIsSelected(true)
    setTimeout(() => setIsSelected(false), 200)
  }

  return (
    <div
      className={`absolute cursor-pointer select-none group w-20 desktop-icon touch-manipulation`}
      style={{ left: x, top: y, minHeight: '44px', minWidth: '44px' }}
      onClick={handleClick}
      onDoubleClick={onDoubleClick}
      role="button"
      tabIndex={0}
      aria-label={`Open ${label}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onDoubleClick()
        }
      }}
    >
      <div className={`
        flex flex-col items-center p-3 rounded-lg transition-colors w-full min-h-24
        ${isSelected ? 'bg-blue-200 bg-opacity-50' : 'hover:bg-blue-900 hover:bg-opacity-30'}
      `}>
        <div className="bg-white bg-opacity-90 p-3 rounded-lg shadow-md mb-2">
          <Icon size={32} className="text-blue-600" aria-hidden="true" />
        </div>
        <span className="text-white text-xs font-medium text-center leading-tight break-words">
          {label}
        </span>
      </div>
    </div>
  )
}
