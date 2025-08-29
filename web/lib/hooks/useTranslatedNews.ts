'use client'

import { useState, useEffect } from 'react'
import { translateText } from '@/lib/services/translation'

export function useTranslatedNews(article: any) {
  // 한국어 번역 우선 확인
  const hasKoreanTranslation = article?.translations?.ko || 
                               article?.translations?.['ko'] ||
                               article?.translations?.['ko-KR']
  
  // 번역이 이미 있으면 그것을 사용
  const koreanData = hasKoreanTranslation 
    ? (article.translations.ko || article.translations['ko'] || article.translations['ko-KR'])
    : null

  // 초기값 설정 - 번역이 있으면 번역 사용, 없으면 원문
  const [translatedTitle, setTranslatedTitle] = useState(
    koreanData?.title || article?.title || ''
  )
  const [translatedDescription, setTranslatedDescription] = useState(
    koreanData?.description || article?.description || ''
  )
  const [isTranslating, setIsTranslating] = useState(false)

  useEffect(() => {
    if (!article) return

    console.log('[useTranslatedNews] Article:', article.title?.substring(0, 50))

    // 한국어 번역이 이미 있으면 사용
    if (hasKoreanTranslation && koreanData) {
      console.log('[useTranslatedNews] Using existing Korean translation')
      setTranslatedTitle(koreanData.title || article.title)
      setTranslatedDescription(koreanData.description || article.description)
      return
    }

    // isTranslated 플래그가 있고 true면 이미 처리된 것으로 간주
    if (article.isTranslated) {
      console.log('[useTranslatedNews] Already translated article')
      setTranslatedTitle(article.title)
      setTranslatedDescription(article.description || '')
      return
    }

    // 번역이 없고 원문이 영어로 보이는 경우에만 번역 실행
    const needsTranslation = !hasKoreanTranslation && 
                            article.title && 
                            !/[\u3131-\uD79F]/.test(article.title) // 한글이 없는 경우

    if (!needsTranslation) {
      console.log('[useTranslatedNews] No translation needed')
      return
    }

    // 번역 실행
    const performTranslation = async () => {
      console.log('[useTranslatedNews] Starting translation for:', article.title?.substring(0, 50))
      setIsTranslating(true)
      try {
        // 제목과 설명을 병렬로 번역
        const [titleResult, descResult] = await Promise.all([
          translateText(article.title, { sourceLang: 'EN', targetLang: 'KO' }),
          article.description ? translateText(article.description, { sourceLang: 'EN', targetLang: 'KO' }) : Promise.resolve('')
        ])

        console.log('[useTranslatedNews] Translation result:', titleResult?.substring(0, 50))
        setTranslatedTitle(titleResult || article.title)
        setTranslatedDescription(descResult || article.description || '')
      } catch (error) {
        console.error('[useTranslatedNews] Translation error:', error)
        // 번역 실패시 원문 사용
        setTranslatedTitle(article.title)
        setTranslatedDescription(article.description || '')
      } finally {
        setIsTranslating(false)
      }
    }

    performTranslation()
  }, [article])

  return {
    title: translatedTitle,
    description: translatedDescription,
    isTranslating
  }
}