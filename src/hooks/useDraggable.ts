import { useRef, useCallback, useState, useEffect } from 'react'

interface Position {
  x: number
  y: number
}

interface UseDraggableProps {
  initialPosition: Position
  onDrag?: (position: Position) => void
  bounds?: {
    left: number
    top: number
    right: number
    bottom: number
  }
}

export const useDraggable = ({ initialPosition, onDrag, bounds }: UseDraggableProps) => {
  const [position, setPosition] = useState(initialPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const elementRef = useRef<HTMLDivElement>(null)

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (!elementRef.current) return
    
    setIsDragging(true)
    setDragStart({
      x: clientX - position.x,
      y: clientY - position.y
    })
  }, [position])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY)
    e.preventDefault()
  }, [handleStart])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY)
    e.preventDefault()
  }, [handleStart])

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return

    let newX = clientX - dragStart.x
    let newY = clientY - dragStart.y

    // Apply bounds if provided
    if (bounds) {
      newX = Math.max(bounds.left, Math.min(bounds.right, newX))
      newY = Math.max(bounds.top, Math.min(bounds.bottom, newY))
    }

    const newPosition = { x: newX, y: newY }
    setPosition(newPosition)
    onDrag?.(newPosition)
  }, [isDragging, dragStart, bounds, onDrag])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleMove(e.clientX, e.clientY)
  }, [handleMove])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      handleMove(touch.clientX, touch.clientY)
      e.preventDefault() // Prevent scrolling
    }
  }, [handleMove])

  const handleEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Attach global events when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleEnd)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleEnd)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleEnd)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleEnd)
      }
    }
  }, [isDragging, handleMouseMove, handleTouchMove, handleEnd])

  return {
    ref: elementRef,
    position,
    isDragging,
    dragHandleProps: {
      onMouseDown: handleMouseDown,
      onTouchStart: handleTouchStart,
      style: { 
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none' // Prevent scrolling during drag
      }
    }
  }
}
