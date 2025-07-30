'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { User } from 'lucide-react'

interface PlayerImageOptimizedProps {
  playerId: number
  playerName: string
  imageUrl?: string | null
  className?: string
  width: number
  height: number
}

export function PlayerImageOptimized({ 
  playerId, 
  playerName, 
  imageUrl, 
  className, 
  width, 
  height 
}: PlayerImageOptimizedProps) {
  const [error, setError] = useState(false)

  // Reset error state when imageUrl changes
  useEffect(() => {
    setError(false)
  }, [imageUrl])

  if (!imageUrl || error) {
    return (
      <div className={`bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center ${className}`}>
        <User className={`text-muted-foreground ${width > 80 ? 'w-12 h-12' : width > 60 ? 'w-10 h-10' : 'w-8 h-8'}`} />
      </div>
    )
  }

  return (
    <Image
      src={imageUrl}
      alt={playerName}
      width={width}
      height={height}
      className={`object-cover ${className}`}
      onError={() => setError(true)}
      loading="lazy"
    />
  )
}