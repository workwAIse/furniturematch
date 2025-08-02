"use client"

import { useEffect, useState } from 'react'

interface ConfettiPiece {
  id: number
  x: number
  y: number
  rotation: number
  rotationSpeed: number
  fallSpeed: number
  color: string
  size: number
  wobble: number
  wobbleSpeed: number
  delay: number
  duration: number
}

const colors = [
  '#ff6b6b', // red
  '#4ecdc4', // teal
  '#45b7d1', // blue
  '#96ceb4', // green
  '#feca57', // yellow
  '#ff9ff3', // pink
  '#54a0ff', // light blue
  '#5f27cd', // purple
  '#00d2d3', // cyan
  '#ff9f43', // orange
  '#ff3838', // bright red
  '#2ed573', // bright green
  '#3742fa', // bright blue
  '#ffa502', // bright orange
  '#ff6348', // tomato
]

export default function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    // Create confetti pieces with staggered timing
    const newPieces: ConfettiPiece[] = []
    for (let i = 0; i < 200; i++) {
      newPieces.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20, // Start above screen
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
        fallSpeed: 0.8 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 12,
        wobble: Math.random() * 30,
        wobbleSpeed: 0.01 + Math.random() * 0.04,
        delay: Math.random() * 1000, // Stagger the start
        duration: 3000 + Math.random() * 2000, // Vary duration
      })
    }
    setPieces(newPieces)

    // Animation loop with better physics
    const animate = () => {
      setPieces(prevPieces => 
        prevPieces.map(piece => {
          const newY = piece.y + piece.fallSpeed
          const newRotation = piece.rotation + piece.rotationSpeed
          const wobbleOffset = Math.sin(piece.y * piece.wobbleSpeed) * piece.wobble * 0.15
          
          return {
            ...piece,
            y: newY,
            rotation: newRotation,
            x: piece.x + wobbleOffset,
          }
        }).filter(piece => piece.y < 110) // Remove pieces that have fallen off screen
      )
    }

    const interval = setInterval(animate, 16) // ~60fps

    // Clean up after 6 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval)
      setPieces([])
    }, 6000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(piece => (
        <div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            transform: `rotate(${piece.rotation}deg)`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.3 ? '50%' : Math.random() > 0.5 ? '25%' : '0%',
            opacity: piece.y > 100 ? 0 : 1,
            transition: 'opacity 0.5s ease-out',
            boxShadow: `0 0 ${piece.size / 2}px ${piece.color}40`,
            animationDelay: `${piece.delay}ms`,
            animationDuration: `${piece.duration}ms`,
          }}
        />
      ))}
    </div>
  )
} 