import React, { useState } from 'react'
import { getImageUrl } from '../../utils/imagePreloader'
import { OptimizedImage } from '../../utils/imageOptimizer'

const stickers = [
  { id: 'sticker4', key: 'sticker4' as const, x: '85%', y: '10%', size: 60 },
  { id: 'sticker5', key: 'sticker5' as const, x: '90%', y: '60%', size: 50 },
  { id: 'sticker6', key: 'sticker6' as const, x: '10%', y: '85%', size: 45 },
  { id: 'sticker7', key: 'sticker7' as const, x: '95%', y: '85%', size: 40 },
  { id: 'sticker8', key: 'sticker8' as const, x: '85%', y: '35%', size: 55 },
]

const WiggleSticker: React.FC<{ sticker: typeof stickers[0] }> = ({ sticker }) => {
  const [isWiggling, setIsWiggling] = useState(false)

  const handleClick = () => {
    setIsWiggling(true)
    // Reset animation after it completes
    setTimeout(() => setIsWiggling(false), 800)
  }

  return (
    <div
      className={`absolute cursor-pointer opacity-70 hover:opacity-90 transition-opacity duration-300 ${
        isWiggling ? 'animate-wiggle' : ''
      }`}
      style={{
        left: sticker.x,
        top: sticker.y,
        zIndex: 1,
        transform: 'translate(-50%, -50%)',
        transformOrigin: 'top center', // Anchor point for wiggle animation
      }}
      onClick={handleClick}
    >
      <OptimizedImage
        src={getImageUrl(sticker.key)}
        alt="Decorative sticker"
        className="transition-transform duration-200"
        style={{
          width: `${sticker.size}px`,
          height: `${sticker.size}px`,
          filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.1))',
          borderRadius: '8px',
          transformOrigin: 'top center',
        }}
        draggable={false}
      />
    </div>
  )
}

export const DesktopStickers: React.FC = () => {
  return (
    <>
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
      {stickers.map((sticker) => (
        <WiggleSticker key={sticker.id} sticker={sticker} />
      ))}
    </>
  )
}
