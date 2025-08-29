import { useState, useEffect } from 'react'
import { CommunityService } from '@/lib/supabase/community'
import { FootballAPIService } from '@/lib/supabase/football'
import { supabase } from '@/lib/supabase/client'

export interface UserPreferences {
  favoriteTeamIds: number[]
  favoriteLeagueIds: number[]
  notificationSettings: {
    matchStart: boolean
    goals: boolean
    matchEnd: boolean
    news: boolean
    communityReplies: boolean
  }
  language: string
  news_language: string
  news_categories: string[]
}

const DEFAULT_PREFERENCES: UserPreferences = {
  favoriteTeamIds: [],
  favoriteLeagueIds: [],
  notificationSettings: {
    matchStart: true,
    goals: true,
    matchEnd: true,
    news: true,
    communityReplies: true
  },
  language: 'ko',
  news_language: 'ko', // 항상 한국어를 기본값으로
  news_categories: ['general', 'transfer', 'injury']
}

// 로딩 중 상태를 추적하는 전역 변수
let isLoadingPreferences = false

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    loadPreferences()
    
    // 인증 상태 변경 감지
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session)
      if (session) {
        loadPreferences()
      } else {
        setPreferences(DEFAULT_PREFERENCES)
      }
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const loadPreferences = async () => {
    // 이미 로딩 중이면 스킵
    if (isLoadingPreferences) {
      return
    }
    
    isLoadingPreferences = true
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // 로그인하지 않은 경우 로컬스토리지에서 불러오기
        const savedPrefs = localStorage.getItem('user_preferences')
        if (savedPrefs) {
          try {
            const parsed = JSON.parse(savedPrefs)
            // news_language가 없으면 기본값 ko 설정
            if (!parsed.news_language) {
              parsed.news_language = 'ko'
            }
            setPreferences(parsed)
          } catch {
            setPreferences(DEFAULT_PREFERENCES)
          }
        } else {
          // localStorage에 기본 설정 저장
          localStorage.setItem('user_preferences', JSON.stringify(DEFAULT_PREFERENCES))
          setPreferences(DEFAULT_PREFERENCES)
        }
        setIsAuthenticated(false)
        isLoadingPreferences = false
        return
      }

      setIsAuthenticated(true)
      // 서버에서 설정 불러오기 - .maybeSingle() 사용으로 레코드가 없어도 에러 없음
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data) {
        setPreferences({
          favoriteTeamIds: data.favorite_team_ids || [],
          favoriteLeagueIds: data.favorite_league_ids || [],
          notificationSettings: data.notification_settings || DEFAULT_PREFERENCES.notificationSettings,
          language: data.language || 'ko',
          news_language: data.news_language || 'ko',
          news_categories: data.news_categories || ['general', 'transfer', 'injury']
        })
      } else if (!error) {
        // 레코드가 없는 경우 기본값으로 새 레코드 생성 - upsert 사용으로 충돌 방지
        const defaultPrefs = {
          user_id: user.id,
          favorite_team_ids: [],
          favorite_league_ids: [],
          notification_settings: DEFAULT_PREFERENCES.notificationSettings,
          language: 'ko',
          news_language: 'ko',
          news_categories: ['general', 'transfer', 'injury'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const { data: newData } = await supabase
          .from('user_preferences')
          .upsert(defaultPrefs, {
            onConflict: 'user_id',
            ignoreDuplicates: true
          })
          .select()
          .maybeSingle()
          
        if (newData) {
          setPreferences({
            favoriteTeamIds: newData.favorite_team_ids || [],
            favoriteLeagueIds: newData.favorite_league_ids || [],
            notificationSettings: newData.notification_settings || DEFAULT_PREFERENCES.notificationSettings,
            language: newData.language || 'ko',
            news_language: newData.news_language || 'ko',
            news_categories: newData.news_categories || ['general', 'transfer', 'injury']
          })
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    } finally {
      setIsLoading(false)
      isLoadingPreferences = false
    }
  }

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    const newPreferences = { ...preferences, ...updates }
    setPreferences(newPreferences)

    // 로컬스토리지에 저장
    localStorage.setItem('user_preferences', JSON.stringify(newPreferences))

    // 로그인한 경우 서버에도 저장
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      try {
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            favorite_team_ids: newPreferences.favoriteTeamIds,
            favorite_league_ids: newPreferences.favoriteLeagueIds,
            notification_settings: newPreferences.notificationSettings,
            language: newPreferences.language,
            news_language: newPreferences.news_language,
            news_categories: newPreferences.news_categories,
            updated_at: new Date().toISOString()
          })
      } catch (error) {
        console.error('Error saving preferences:', error)
      }
    }
  }

  const addFavoriteTeam = async (teamId: number) => {
    if (!preferences.favoriteTeamIds.includes(teamId)) {
      await updatePreferences({
        favoriteTeamIds: [...preferences.favoriteTeamIds, teamId]
      })
    }
  }

  const removeFavoriteTeam = async (teamId: number) => {
    await updatePreferences({
      favoriteTeamIds: preferences.favoriteTeamIds.filter(id => id !== teamId)
    })
  }

  const addFavoriteLeague = async (leagueId: number) => {
    if (!preferences.favoriteLeagueIds.includes(leagueId)) {
      await updatePreferences({
        favoriteLeagueIds: [...preferences.favoriteLeagueIds, leagueId]
      })
    }
  }

  const removeFavoriteLeague = async (leagueId: number) => {
    await updatePreferences({
      favoriteLeagueIds: preferences.favoriteLeagueIds.filter(id => id !== leagueId)
    })
  }

  return {
    preferences,
    isLoading,
    isAuthenticated,
    updatePreferences,
    addFavoriteTeam,
    removeFavoriteTeam,
    addFavoriteLeague,
    removeFavoriteLeague
  }
}

// 개인화된 경기 추천
export function usePersonalizedFixtures() {
  const { preferences } = useUserPreferences()
  const [fixtures, setFixtures] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (preferences.favoriteTeamIds.length === 0 && preferences.favoriteLeagueIds.length === 0) {
      setIsLoading(false)
      return
    }

    const loadFixtures = async () => {
      try {
        const service = new FootballAPIService()
        const today = new Date()
        const allFixtures: any[] = []

        // 좋아하는 팀의 경기 불러오기
        for (const teamId of preferences.favoriteTeamIds) {
          const data = await service.getFixtures({
            team: teamId,
            from: today.toISOString().split('T')[0],
            to: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          })
          if (data?.response) {
            allFixtures.push(...data.response)
          }
        }

        // 좋아하는 리그의 경기 불러오기
        for (const leagueId of preferences.favoriteLeagueIds) {
          const data = await service.getFixtures({
            league: leagueId,
            from: today.toISOString().split('T')[0],
            to: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          })
          if (data?.response) {
            allFixtures.push(...data.response.slice(0, 5))
          }
        }

        // 중복 제거 및 날짜순 정렬
        const uniqueFixtures = Array.from(
          new Map(allFixtures.map(f => [f.fixture.id, f])).values()
        )
        uniqueFixtures.sort((a, b) => 
          new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
        )

        setFixtures(uniqueFixtures.slice(0, 10))
      } catch (error) {
        console.error('Error loading personalized fixtures:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFixtures()
  }, [preferences.favoriteTeamIds, preferences.favoriteLeagueIds])

  return { fixtures, isLoading }
}