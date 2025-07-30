'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { User } from 'lucide-react'
import { getPlayerLogo } from '@/lib/football-api/client'

interface PlayerImageProps {
  playerId: number
  playerName: string
  className?: string
  width: number
  height: number
}

export function PlayerImage({ playerId, playerName, className, width, height }: PlayerImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchImage = async () => {
      if (!playerId || playerId === 0) {
        setLoading(false)
        return
      }

      try {
        const data = await getPlayerLogo(playerId)
        if (data?.response?.url) {
          setImageUrl(data.response.url)
        }
      } catch (err) {
        console.error('Error fetching player image:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchImage()
  }, [playerId])

  if (loading || error || !imageUrl) {
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
    />
  )
}