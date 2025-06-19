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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!elementRef.current) return
    
    setIsDragging(true)
    const rect = elementRef.current.getBoundingClientRect()
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    
    e.preventDefault()
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return

    let newX = e.clientX - dragStart.x
    let newY = e.clientY - dragStart.y

    // Apply bounds if provided
    if (bounds) {
      newX = Math.max(bounds.left, Math.min(bounds.right, newX))
      newY = Math.max(bounds.top, Math.min(bounds.bottom, newY))
    }

    const newPosition = { x: newX, y: newY }
    setPosition(newPosition)
    onDrag?.(newPosition)
  }, [isDragging, dragStart, bounds, onDrag])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Attach global mouse events when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return {
    ref: elementRef,
    position,
    isDragging,
    dragHandleProps: {
      onMouseDown: handleMouseDown,
      style: { cursor: isDragging ? 'grabbing' : 'grab' }
    }
  }
}
