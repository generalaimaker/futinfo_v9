import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Azure Translator 설정
const AZURE_TRANSLATOR_KEY = Deno.env.get('AZURE_TRANSLATOR_KEY')!
const AZURE_TRANSLATOR_ENDPOINT = Deno.env.get('AZURE_TRANSLATOR_ENDPOINT') || 'https://api.cognitive.microsofttranslator.com'
const AZURE_TRANSLATOR_REGION = 'koreacentral'

// 지원 언어
const SUPPORTED_LANGUAGES = ['ko', 'ja', 'zh-Hans', 'es', 'de', 'fr']

interface TranslationRequest {
  articleIds: string[] // 필수: 번역할 기사 ID 목록
  languages?: string[] // 옵션: 번역할 언어 (기본값: 한국어만)
}

interface NewsArticle {
  id: string
  title: string
  description: string
  translations: any
}

// Azure Translator API를 사용한 텍스트 번역
async function translateWithAzure(
  texts: string[],
  targetLang: string,
  sourceLang: string = 'en'
): Promise<string[]> {
  if (!texts || texts.length === 0) return texts
  
  // 빈 텍스트 필터링
  const validTexts = texts.map(t => t || '')
  
  try {
    const response = await fetch(`${AZURE_TRANSLATOR_ENDPOINT}/translate?api-version=3.0&from=${sourceLang}&to=${targetLang}`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_TRANSLATOR_KEY,
        'Ocp-Apim-Subscription-Region': AZURE_TRANSLATOR_REGION,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(validTexts.map(text => ({ text })))
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Azure Translator error: ${response.status} - ${error}`)
    }
    
    const results = await response.json()
    return results.map((result: any) => result.translations[0].text)
  } catch (error) {
    console.error(`Translation error for ${targetLang}:`, error)
    return texts // 에러 시 원문 반환
  }
}

// 기사 번역 (수동 선택된 기사만)
async function translateArticle(
  article: NewsArticle,
  targetLanguages: string[]
): Promise<any> {
  const translations = article.translations || {}
  const newTranslations: any = {}
  
  for (const lang of targetLanguages) {
    // 이미 번역된 경우 스킵 (옵션)
    if (translations[lang]) {
      console.log(`Article ${article.id}: ${lang} translation already exists`)
      continue
    }
    
    try {
      console.log(`Translating article ${article.id} to ${lang}...`)
      
      // 제목과 설명을 한 번에 번역 (API 호출 최적화)
      const textsToTranslate = [
        article.title,
        article.description || ''
      ]
      
      const translatedTexts = await translateWithAzure(textsToTranslate, lang)
      
      newTranslations[lang] = {
        title: translatedTexts[0],
        description: translatedTexts[1],
        translated_at: new Date().toISOString()
      }
      
      console.log(`Successfully translated article ${article.id} to ${lang}`)
    } catch (error) {
      console.error(`Failed to translate article ${article.id} to ${lang}:`, error)
    }
  }
  
  return newTranslations
}

// 선택된 기사들 번역 처리
async function processSelectedTranslations(
  articleIds: string[],
  targetLanguages: string[]
): Promise<{ success: number; failed: number; details: any[] }> {
  const results = {
    success: 0,
    failed: 0,
    details: [] as any[]
  }
  
  // 선택된 기사들 가져오기
  const { data: articles, error } = await supabase
    .from('news_articles')
    .select('id, title, description, translations')
    .in('id', articleIds)
  
  if (error) {
    throw new Error(`Failed to fetch articles: ${error.message}`)
  }
  
  if (!articles || articles.length === 0) {
    throw new Error('No articles found with provided IDs')
  }
  
  console.log(`Processing ${articles.length} selected articles for translation`)
  
  // 각 기사 번역 처리
  for (const article of articles) {
    try {
      const newTranslations = await translateArticle(article, targetLanguages)
      
      if (Object.keys(newTranslations).length > 0) {
        // 기존 번역과 병합
        const mergedTranslations = {
          ...article.translations,
          ...newTranslations
        }
        
        // DB 업데이트
        const { error: updateError } = await supabase
          .from('news_articles')
          .update({ 
            translations: mergedTranslations,
            updated_at: new Date().toISOString()
          })
          .eq('id', article.id)
        
        if (updateError) {
          console.error(`Error updating article ${article.id}:`, updateError)
          results.failed++
          results.details.push({
            id: article.id,
            status: 'failed',
            error: updateError.message
          })
        } else {
          console.log(`Updated translations for article ${article.id}`)
          results.success++
          results.details.push({
            id: article.id,
            status: 'success',
            languages: Object.keys(newTranslations)
          })
        }
      } else {
        results.details.push({
          id: article.id,
          status: 'skipped',
          reason: 'Already translated or no new translations'
        })
      }
    } catch (error) {
      console.error(`Failed to process article ${article.id}:`, error)
      results.failed++
      results.details.push({
        id: article.id,
        status: 'failed',
        error: error.message
      })
    }
  }
  
  return results
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting manual news translation...')
    
    // 요청 파싱
    const body: TranslationRequest = await req.json()
    
    // 필수 파라미터 검증
    if (!body.articleIds || body.articleIds.length === 0) {
      throw new Error('articleIds is required and must not be empty')
    }
    
    // 번역 언어 설정 (기본값: 한국어만)
    const targetLanguages = body.languages || ['ko']
    
    console.log(`Received request to translate ${body.articleIds.length} articles to ${targetLanguages.join(', ')}`)
    
    // Azure API 키 확인
    if (!AZURE_TRANSLATOR_KEY) {
      throw new Error('Azure Translator API key not configured')
    }
    
    // 선택된 기사들 번역 처리
    const results = await processSelectedTranslations(body.articleIds, targetLanguages)
    
    // 응답
    const response = {
      success: true,
      message: `Translated ${results.success} articles successfully`,
      results: {
        total: body.articleIds.length,
        succeeded: results.success,
        failed: results.failed,
        languages: targetLanguages,
        details: results.details
      },
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