import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export type SupportedLanguage = 'ko' | 'en' | 'ja' | 'zh' | 'es'

interface UserLanguageSettings {
  language: SupportedLanguage
  autoTranslate: boolean
}

const DEFAULT_SETTINGS: UserLanguageSettings = {
  language: 'ko', // 기본값 한국어
  autoTranslate: true
}

export function useUserLanguage() {
  const [user, setUser] = useState<any>(null)
  const [settings, setSettings] = useState<UserLanguageSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  // Get user from Supabase auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 사용자 언어 설정 불러오기
  useEffect(() => {
    async function loadSettings() {
      if (!user) {
        // 로그인하지 않은 경우 로컬 스토리지에서 읽기
        const saved = localStorage.getItem('language_settings')
        if (saved) {
          setSettings(JSON.parse(saved))
        }
        setIsLoading(false)
        return
      }

      try {
        // Supabase에서 사용자 설정 불러오기
        const { data, error } = await supabase
          .from('user_preferences')
          .select('language, auto_translate')
          .eq('user_id', user.id)
          .single()

        if (data && !error) {
          setSettings({
            language: data.language || DEFAULT_SETTINGS.language,
            autoTranslate: data.auto_translate ?? DEFAULT_SETTINGS.autoTranslate
          })
        }
      } catch (error) {
        console.error('Error loading language settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [user])

  // 언어 설정 업데이트
  const updateLanguage = async (newLanguage: SupportedLanguage) => {
    const newSettings = { ...settings, language: newLanguage }
    setSettings(newSettings)

    // 로컬 스토리지에 저장
    localStorage.setItem('language_settings', JSON.stringify(newSettings))

    if (user) {
      try {
        // Supabase에 저장
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            language: newLanguage,
            updated_at: new Date().toISOString()
          })
      } catch (error) {
        console.error('Error updating language settings:', error)
      }
    }
  }

  // 자동 번역 설정 업데이트
  const updateAutoTranslate = async (enabled: boolean) => {
    const newSettings = { ...settings, autoTranslate: enabled }
    setSettings(newSettings)

    // 로컬 스토리지에 저장
    localStorage.setItem('language_settings', JSON.stringify(newSettings))

    if (user) {
      try {
        // Supabase에 저장
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            auto_translate: enabled,
            updated_at: new Date().toISOString()
          })
      } catch (error) {
        console.error('Error updating auto translate settings:', error)
      }
    }
  }

  return {
    language: settings.language,
    autoTranslate: settings.autoTranslate,
    isLoading,
    updateLanguage,
    updateAutoTranslate
  }
}