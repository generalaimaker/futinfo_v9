import { cn } from '@/lib/utils'

interface SkeletonLoaderProps {
  className?: string
  variant?: 'card' | 'list' | 'text' | 'avatar' | 'stat'
  count?: number
}

export function SkeletonLoader({ 
  className, 
  variant = 'card', 
  count = 1 
}: SkeletonLoaderProps) {
  const items = Array.from({ length: count }, (_, i) => i)
  
  if (variant === 'card') {
    return (
      <div className={cn("space-y-4", className)}>
        {items.map((i) => (
          <div key={i} className="dark-card p-6 space-y-4">
            <div className="h-6 bg-secondary/50 rounded-md animate-pulse w-1/3" />
            <div className="space-y-2">
              <div className="h-4 bg-secondary/50 rounded-md animate-pulse" />
              <div className="h-4 bg-secondary/50 rounded-md animate-pulse w-5/6" />
              <div className="h-4 bg-secondary/50 rounded-md animate-pulse w-4/6" />
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  if (variant === 'list') {
    return (
      <div className={cn("space-y-3", className)}>
        {items.map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-secondary" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-secondary rounded-md w-1/3" />
              <div className="h-3 bg-secondary rounded-md w-1/2" />
            </div>
            <div className="h-8 w-16 bg-secondary rounded-md" />
          </div>
        ))}
      </div>
    )
  }
  
  if (variant === 'stat') {
    return (
      <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4", className)}>
        {items.map((i) => (
          <div key={i} className="dark-card p-4 space-y-2">
            <div className="h-4 bg-secondary/50 rounded-md animate-pulse w-2/3" />
            <div className="h-8 bg-secondary/50 rounded-md animate-pulse w-1/2" />
          </div>
        ))}
      </div>
    )
  }
  
  if (variant === 'avatar') {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        {items.map((i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-secondary/50 animate-pulse" />
            <div className="h-3 bg-secondary/50 rounded-md animate-pulse w-20" />
          </div>
        ))}
      </div>
    )
  }
  
  // Default text variant
  return (
    <div className={cn("space-y-2", className)}>
      {items.map((i) => (
        <div key={i} className="h-4 bg-secondary/50 rounded-md animate-pulse" />
      ))}
    </div>
  )
}