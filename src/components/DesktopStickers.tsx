import React, { useState } from 'react'
import sticker4 from '../images/stickers/4.png'
import sticker5 from '../images/stickers/5.png'
import sticker6 from '../images/stickers/6.png'
import sticker7 from '../images/stickers/7.png'
import sticker8 from '../images/stickers/8.png'

const stickers = [
  { id: 'sticker4', src: sticker4, x: '85%', y: '10%', size: 60 },
  { id: 'sticker5', src: sticker5, x: '90%', y: '60%', size: 50 },
  { id: 'sticker6', src: sticker6, x: '10%', y: '85%', size: 45 },
  { id: 'sticker7', src: sticker7, x: '95%', y: '85%', size: 40 },
  { id: 'sticker8', src: sticker8, x: '85%', y: '35%', size: 55 },
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
      <img
        src={sticker.src}
        alt="Decorative sticker"
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
