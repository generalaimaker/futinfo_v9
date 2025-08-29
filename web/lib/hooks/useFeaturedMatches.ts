import { useQuery } from '@tanstack/react-query'
import { adminService } from '@/lib/supabase/admin'
import { FootballAPIService } from '@/lib/supabase/football'

export function useFeaturedMatches() {
  return useQuery({
    queryKey: ['featured-matches'],
    queryFn: async () => {
      try {
        // Get admin-selected featured matches
        const featuredMatches = await adminService.getFeaturedMatches()
        
        if (!featuredMatches || featuredMatches.length === 0) {
          return []
        }

        // Get fixture details for each featured match
        const footballService = new FootballAPIService()
        const matchPromises = featuredMatches.map(async (featured) => {
          try {
            const data = await footballService.getFixtureById(featured.fixture_id)
            if (data?.response?.[0]) {
              return {
                ...data.response[0],
                featured_priority: featured.priority,
                featured_id: featured.id
              }
            }
            return null
          } catch (error) {
            console.error(`Error fetching fixture ${featured.fixture_id}:`, error)
            return null
          }
        })

        const matches = await Promise.all(matchPromises)
        return matches
          .filter(Boolean)
          .sort((a, b) => a.featured_priority - b.featured_priority)
      } catch (error) {
        console.error('Error fetching featured matches:', error)
        return []
      }
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  })
}