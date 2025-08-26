'use client'

import { useState, useEffect } from 'react'
import { translateText } from '@/lib/services/translation'

export function useTranslatedNews(article: any) {
  const [translatedTitle, setTranslatedTitle] = useState(article?.title || '')
  const [translatedDescription, setTranslatedDescription] = useState(article?.description || '')
  const [isTranslating, setIsTranslating] = useState(false)

  useEffect(() => {
    if (!article) return

    console.log('[useTranslatedNews] Article:', article.title?.substring(0, 50))

    // 이미 번역이 있으면 사용 (실제로는 없을 가능성이 높음)
    if (article.translations?.ko?.title) {
      console.log('[useTranslatedNews] Using existing translation')
      setTranslatedTitle(article.translations.ko.title)
      setTranslatedDescription(article.translations.ko.description || article.description)
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