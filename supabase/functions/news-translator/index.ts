import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Supabase 클라이언트 초기화
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// DeepL API 설정
const DEEPL_API_KEY = Deno.env.get('DEEPL_API_KEY')!
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate'

// 지원 언어
const SUPPORTED_LANGUAGES = ['ko', 'ja', 'zh', 'es', 'de', 'fr']

interface TranslationRequest {
  articleIds?: string[]
  priority?: 'high' | 'normal' | 'low'
  languages?: string[]
}

interface NewsArticle {
  id: string
  title: string
  description: string
  translations: any
}

// DeepL API를 사용한 텍스트 번역
async function translateText(
  text: string,
  targetLang: string,
  sourceLang: string = 'EN'
): Promise<string> {
  if (!text || text.trim() === '') return text
  
  // 언어 코드 정규화
  const languageMap: Record<string, string> = {
    'ko': 'KO',
    'ja': 'JA',
    'zh': 'ZH',
    'es': 'ES',
    'de': 'DE',
    'fr': 'FR',
    'en': 'EN'
  }
  
  const normalizedTarget = languageMap[targetLang.toLowerCase()] || targetLang
  const normalizedSource = languageMap[sourceLang.toLowerCase()] || sourceLang
  
  // 같은 언어면 번역 안함
  if (normalizedSource === normalizedTarget) return text
  
  try {
    const response = await fetch(DEEPL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        auth_key: DEEPL_API_KEY,
        text: text,
        source_lang: normalizedSource,
        target_lang: normalizedTarget,
      }),
    })
    
    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.translations[0].text
  } catch (error) {
    console.error(`Translation error for ${targetLang}:`, error)
    return text // 에러 시 원문 반환
  }
}

// 기사 번역
async function translateArticle(
  article: NewsArticle,
  targetLanguages: string[]
): Promise<any> {
  const translations = article.translations || {}
  const newTranslations: any = {}
  
  for (const lang of targetLanguages) {
    // 이미 번역된 경우 스킵
    if (translations[lang]) {
      console.log(`Skipping ${lang} - already translated`)
      continue
    }
    
    try {
      console.log(`Translating article ${article.id} to ${lang}...`)
      
      // 제목과 설명 번역 (병렬 처리)
      const [translatedTitle, translatedDescription] = await Promise.all([
        translateText(article.title, lang),
        translateText(article.description || '', lang)
      ])
      
      newTranslations[lang] = {
        title: translatedTitle,
        description: translatedDescription,
        translated_at: new Date().toISOString()
      }
      
      console.log(`Successfully translated to ${lang}`)
    } catch (error) {
      console.error(`Failed to translate to ${lang}:`, error)
    }
  }
  
  return newTranslations
}

// 배치 번역 처리
async function processBatchTranslation(
  articles: NewsArticle[],
  targetLanguages: string[]
): Promise<void> {
  const batchSize = 10 // 한 번에 처리할 기사 수
  
  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize)
    
    // 배치 병렬 처리
    const translationPromises = batch.map(async (article) => {
      const newTranslations = await translateArticle(article, targetLanguages)
      
      if (Object.keys(newTranslations).length > 0) {
        // 기존 번역과 병합
        const mergedTranslations = {
          ...article.translations,
          ...newTranslations
        }
        
        // DB 업데이트
        const { error } = await supabase
          .from('news_articles')
          .update({ 
            translations: mergedTranslations,
            updated_at: new Date().toISOString()
          })
          .eq('id', article.id)
        
        if (error) {
          console.error(`Error updating article ${article.id}:`, error)
        } else {
          console.log(`Updated translations for article ${article.id}`)
        }
      }
    })
    
    await Promise.all(translationPromises)
    
    // API 레이트 리밋 고려하여 잠시 대기
    if (i + batchSize < articles.length) {
      await new Promise(resolve => setTimeout(resolve, 1000)) // 1초 대기
    }
  }
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting news translation...')
    
    // 요청 파싱
    const body: TranslationRequest = await req.json().catch(() => ({}))
    const targetLanguages = body.languages || SUPPORTED_LANGUAGES
    const priority = body.priority || 'normal'
    
    let query = supabase
      .from('news_articles')
      .select('id, title, description, translations')
    
    // 특정 기사 ID가 제공된 경우
    if (body.articleIds && body.articleIds.length > 0) {
      query = query.in('id', body.articleIds)
    } else {
      // 최근 24시간 내 기사 중 번역 안 된 것들
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)
      
      query = query
        .gte('published_at', oneDayAgo.toISOString())
        .order('published_at', { ascending: false })
        .limit(priority === 'high' ? 50 : 20)
    }
    
    const { data: articles, error } = await query
    
    if (error) throw error
    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No articles to translate',
        processed: 0
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      })
    }
    
    console.log(`Found ${articles.length} articles to process`)
    
    // 번역이 필요한 기사 필터링
    const articlesToTranslate = articles.filter(article => {
      const translations = article.translations || {}
      // 모든 언어로 번역되지 않은 기사
      return targetLanguages.some(lang => !translations[lang])
    })
    
    console.log(`${articlesToTranslate.length} articles need translation`)
    
    if (articlesToTranslate.length > 0) {
      // DeepL API 키 확인
      if (!DEEPL_API_KEY || DEEPL_API_KEY === 'your-deepl-api-key-here') {
        throw new Error('DeepL API key not configured')
      }
      
      // 배치 번역 처리
      await processBatchTranslation(articlesToTranslate, targetLanguages)
    }
    
    // 응답
    const response = {
      success: true,
      processed: articlesToTranslate.length,
      languages: targetLanguages,
      priority: priority,
      timestamp: new Date().toISOString()
    }
    
    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
    
  } catch (error) {
    console.error('Error in news-translator:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
})