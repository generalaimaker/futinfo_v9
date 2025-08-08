'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { SupabaseProvider } from '@/lib/supabase/provider'
import { ThemeProvider } from '@/lib/theme-context'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => {
      console.log('[Providers] Creating QueryClient')
      return new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 10, // 10 minutes
            retry: (failureCount, error) => {
              console.log('[QueryClient] Retry logic:', { failureCount, error: error?.message })
              // Don't retry on 4xx errors
              if (error instanceof Error && error.message.includes('4')) {
                return false
              }
              // Retry up to 3 times for other errors
              return failureCount < 3
            },
          },
          mutations: {
            retry: 1,
          },
        },
      })
    }
  )

  useEffect(() => {
    console.log('[Providers] Mounted')
    return () => {
      console.log('[Providers] Unmounted')
    }
  }, [])

  return (
    <ThemeProvider>
      <SupabaseProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </SupabaseProvider>
    </ThemeProvider>
  )
}