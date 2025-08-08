'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Shield } from 'lucide-react'

interface TeamLogoProps {
  teamId: number
  teamName: string
  className?: string
  width: number
  height: number
}

export function TeamLogo({ teamId, teamName, className, width, height }: TeamLogoProps) {
  const [error, setError] = useState(false)
  
  // Use api-sports.io team logo URL pattern (seems to be what the API returns)
  const imageUrl = teamId && teamId > 0 ? `https://media.api-sports.io/football/teams/${teamId}.png` : null

  if (!imageUrl || error) {
    return (
      <div className={`bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center ${className}`}>
        <Shield className={`text-muted-foreground ${width > 30 ? 'w-4 h-4' : 'w-3 h-3'}`} />
      </div>
    )
  }

  return (
    <Image
      src={imageUrl}
      alt={teamName}
      width={width}
      height={height}
      className={`object-contain ${className}`}
      onError={() => setError(true)}
    />
  )
}