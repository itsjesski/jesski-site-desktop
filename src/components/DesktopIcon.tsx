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
      className={`absolute cursor-pointer select-none group w-20`}
      style={{ left: x, top: y }}
      onClick={handleClick}
      onDoubleClick={onDoubleClick}
    >
      <div className={`
        flex flex-col items-center p-2 rounded-lg transition-colors w-full h-24
        ${isSelected ? 'bg-blue-200 bg-opacity-50' : 'hover:bg-blue-900 hover:bg-opacity-30'}
      `}>
        <div className="bg-white bg-opacity-90 p-3 rounded-lg shadow-md mb-2">
          <Icon size={32} className="text-blue-600" />
        </div>
        <span className="text-white text-xs font-medium text-center leading-tight break-words">
          {label}
        </span>
      </div>
    </div>
  )
}
