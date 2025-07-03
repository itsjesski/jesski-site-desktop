import React, { useState } from 'react'
import sticker4 from '../assets/stickers/4.png'
import sticker5 from '../assets/stickers/5.png'
import sticker6 from '../assets/stickers/6.png'
import sticker7 from '../assets/stickers/7.png'
import sticker8 from '../assets/stickers/8.png'

interface DraggableStickerProps {
  stickerId: string
  src: string
  initialX: number
  initialY: number
  size?: number
}

const DraggableSticker: React.FC<DraggableStickerProps> = ({ 
  stickerId, 
  src, 
  initialX, 
  initialY, 
  size = 50 
}) => {
  const [position, setPosition] = useState({ x: initialX, y: initialY })
  const [isDragging, setIsDragging] = useState(false)
  const [isWiggling, setIsWiggling] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragDistance, setDragDistance] = useState(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragDistance(0)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    setIsDragging(true)
    setDragDistance(0)
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    })
  }

  const handleClick = () => {
    // Only trigger wiggle if we didn't drag (click without significant movement)
    if (dragDistance < 5) {
      setIsWiggling(true)
      setTimeout(() => setIsWiggling(false), 800)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y
      const distance = Math.sqrt(Math.pow(newX - position.x, 2) + Math.pow(newY - position.y, 2))
      setDragDistance(prev => prev + distance)
      setPosition({ x: newX, y: newY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    // Trigger click if we didn't drag much
    if (dragDistance < 5) {
      handleClick()
    }
  }

  React.useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        const newX = e.clientX - dragStart.x
        const newY = e.clientY - dragStart.y
        const distance = Math.sqrt(Math.pow(newX - position.x, 2) + Math.pow(newY - position.y, 2))
        setDragDistance(prev => prev + distance)
        setPosition({ x: newX, y: newY })
      }

      const handleGlobalTouchMove = (e: TouchEvent) => {
        e.preventDefault()
        const touch = e.touches[0]
        const newX = touch.clientX - dragStart.x
        const newY = touch.clientY - dragStart.y
        const distance = Math.sqrt(Math.pow(newX - position.x, 2) + Math.pow(newY - position.y, 2))
        setDragDistance(prev => prev + distance)
        setPosition({ x: newX, y: newY })
      }

      const handleGlobalMouseUp = () => {
        setIsDragging(false)
      }

      const handleGlobalTouchEnd = () => {
        setIsDragging(false)
      }

      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false })
      document.addEventListener('touchend', handleGlobalTouchEnd)

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove)
        document.removeEventListener('mouseup', handleGlobalMouseUp)
        document.removeEventListener('touchmove', handleGlobalTouchMove)
        document.removeEventListener('touchend', handleGlobalTouchEnd)
      }
    }
  }, [isDragging, dragStart, position])

  return (
    <div
      className={`absolute select-none cursor-move transition-transform duration-150 ${
        isDragging ? 'scale-110 z-50' : 'hover:scale-105 z-10'
      } ${isWiggling ? 'animate-wiggle' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        transformOrigin: 'top center', // Anchor point for wiggle animation
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
    >
      <img
        src={src}
        alt={`Draggable sticker ${stickerId}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          filter: `drop-shadow(${isDragging ? '4px 4px 8px' : '2px 2px 4px'} rgba(0,0,0,0.2))`,
          borderRadius: '8px',
          transformOrigin: 'top center',
        }}
        draggable={false}
      />
    </div>
  )
}

export const StickerPack: React.FC = () => {
  const stickers = [
    { id: 'sticker4', src: sticker4 },
    { id: 'sticker5', src: sticker5 },
    { id: 'sticker6', src: sticker6 },
    { id: 'sticker7', src: sticker7 },
    { id: 'sticker8', src: sticker8 },
  ]

  return (
    <div className="h-full p-4 overflow-y-auto overflow-x-hidden">
      {/* CSS Animation Definition */}
      <style>
        {`
          @keyframes wiggle {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            10% { transform: translate(-50%, -50%) rotate(8deg); }
            20% { transform: translate(-50%, -50%) rotate(-6deg); }
            30% { transform: translate(-50%, -50%) rotate(5deg); }
            40% { transform: translate(-50%, -50%) rotate(-4deg); }
            50% { transform: translate(-50%, -50%) rotate(3deg); }
            60% { transform: translate(-50%, -50%) rotate(-2deg); }
            70% { transform: translate(-50%, -50%) rotate(1deg); }
            80% { transform: translate(-50%, -50%) rotate(-1deg); }
            90% { transform: translate(-50%, -50%) rotate(0.5deg); }
            100% { transform: translate(-50%, -50%) rotate(0deg); }
          }
          
          .animate-wiggle {
            animation: wiggle 0.8s ease-in-out;
          }
        `}
      </style>
      <div className="min-h-full flex flex-col">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          🎨 Cute Stickers
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Drag these stickers around for fun! Click them to make them wiggle! 🎉
        </p>
        <div className="relative flex-1 min-h-96 border-2 border-dashed rounded-lg p-4" style={{ borderColor: 'var(--window-border)' }}>
          <p className="text-xs text-center mb-4 opacity-70" style={{ color: 'var(--text-muted)' }}>
            Sticker playground - drag them around!
          </p>
          {stickers.map((sticker, index) => (
            <DraggableSticker
              key={sticker.id}
              stickerId={sticker.id}
              src={sticker.src}
              initialX={100 + (index * 80)}
              initialY={100 + (index % 2) * 100}
              size={60}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
