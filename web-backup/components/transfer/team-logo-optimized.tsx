'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Shield } from 'lucide-react'

interface TeamLogoOptimizedProps {
  teamId: number
  teamName: string
  imageUrl?: string | null
  className?: string
  width: number
  height: number
}

export function TeamLogoOptimized({ 
  teamId, 
  teamName, 
  imageUrl, 
  className, 
  width, 
  height 
}: TeamLogoOptimizedProps) {
  const [error, setError] = useState(false)
  
  // Use api-sports.io URL pattern if no URL provided
  const logoUrl = imageUrl || (teamId && teamId > 0 ? `https://media.api-sports.io/football/teams/${teamId}.png` : null)

  if (!logoUrl || error) {
    return (
      <div className={`bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center ${className}`}>
        <Shield className={`text-muted-foreground ${width > 30 ? 'w-4 h-4' : 'w-3 h-3'}`} />
      </div>
    )
  }

  return (
    <Image
      src={logoUrl}
      alt={teamName}
      width={width}
      height={height}
      className={`object-contain ${className}`}
      onError={() => setError(true)}
      loading="lazy"
    />
  )
}