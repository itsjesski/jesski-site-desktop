/**
 * Simplified image preloading for smooth UI transitions
 */

// Import all images that need to be preloaded
import BackgroundImage from '../assets/Background.png'
import ProfilePic from '../assets/profilepic.png'
import sticker4 from '../assets/stickers/4.png'
import sticker5 from '../assets/stickers/5.png'
import sticker6 from '../assets/stickers/6.png'
import sticker7 from '../assets/stickers/7.png'
import sticker8 from '../assets/stickers/8.png'

// Define all critical images that should be preloaded
export const CRITICAL_IMAGES = {
  background: BackgroundImage,
  profilePic: ProfilePic,
  sticker4,
  sticker5,
  sticker6,
  sticker7,
  sticker8,
} as const

export type ImageKey = keyof typeof CRITICAL_IMAGES

/**
 * Preload all critical images
 */
export async function preloadImagesWithRetry(
  _maxRetries = 1, // Keep for compatibility but not used
  onProgress?: (loaded: number, total: number) => void
): Promise<{ success: boolean; loaded: number; total: number }> {
  const imageEntries = Object.entries(CRITICAL_IMAGES)
  const total = imageEntries.length
  let loaded = 0

  // Preload all images in parallel
  const results = await Promise.allSettled(
    imageEntries.map(async ([key, src]) => {
      try {
        await new Promise<void>((resolve, reject) => {
          const img = new Image()
          img.onload = () => resolve()
          img.onerror = () => reject(new Error(`Failed to load ${key}`))
          img.src = src
        })
        loaded++
        onProgress?.(loaded, total)
        return true
      } catch (error) {
        console.warn(`Failed to preload ${key}:`, error)
        return false
      }
    })
  )

  const successful = results.filter(result => 
    result.status === 'fulfilled' && result.value
  ).length

  return {
    success: successful >= total * 0.8, // 80% success rate is acceptable
    loaded: successful,
    total
  }
}

/**
 * Get preloaded image URL
 */
export function getImageUrl(key: ImageKey): string {
  return CRITICAL_IMAGES[key]
}
