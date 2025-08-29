import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Microsoft Translator API configuration
const MICROSOFT_TRANSLATOR_KEY = process.env.MICROSOFT_TRANSLATOR_KEY || ''
const MICROSOFT_TRANSLATOR_ENDPOINT = 'https://api.cognitive.microsofttranslator.com/'
const MICROSOFT_TRANSLATOR_REGION = 'koreacentral'

// Daily translation limit
const DAILY_TRANSLATION_LIMIT = 5

async function microsoftTranslate(text: string, sourceLang: string, targetLang: string) {
  try {
    const langMap: Record<string, string> = {
      'EN': 'en',
      'KO': 'ko',
      'JA': 'ja',
      'ZH': 'zh-Hans',
      'ES': 'es',
      'DE': 'de',
      'FR': 'fr',
      'PT': 'pt',
      'RU': 'ru'
    }
    
    const fromLang = langMap[sourceLang] || sourceLang.toLowerCase()
    const toLang = langMap[targetLang] || targetLang.toLowerCase()
    
    const url = `${MICROSOFT_TRANSLATOR_ENDPOINT}translate?api-version=3.0&from=${fromLang}&to=${toLang}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': MICROSOFT_TRANSLATOR_KEY,
        'Ocp-Apim-Subscription-Region': MICROSOFT_TRANSLATOR_REGION,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{ text }])
    })
    
    if (!response.ok) {
      throw new Error(`Microsoft Translator API error: ${response.status}`)
    }
    
    const data = await response.json()
    return data[0]?.translations[0]?.text || text
  } catch (error) {
    console.error('[Microsoft Translator] Error:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Admin client for database updates (bypasses RLS)
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // 오늘 날짜 (UTC 기준)
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const todayStr = today.toISOString()
    
    // 오늘 이미 번역된 featured news 수 확인
    // translations가 실제로 내용이 있는지 확인 (빈 객체가 아닌지)
    const { data: todayTranslated } = await supabase
      .from('featured_news')
      .select('id, translations, translated_at')
      .gte('translated_at', todayStr)
    
    // 실제로 번역이 있는 항목만 카운트
    const translatedToday = todayTranslated?.filter(item => 
      item.translations && 
      Object.keys(item.translations).length > 0 &&
      item.translations.ko
    ).length || 0
    
    if (translatedToday && translatedToday >= DAILY_TRANSLATION_LIMIT) {
      return NextResponse.json({ 
        message: `Daily translation limit reached (${DAILY_TRANSLATION_LIMIT}/day)`,
        translated: 0 
      })
    }
    
    const remainingLimit = DAILY_TRANSLATION_LIMIT - (translatedToday || 0)
    
    // 번역이 필요한 featured news 가져오기 (관리자가 선택한 것만)
    const { data: allFeaturedNews, error: fetchError } = await supabase
      .from('featured_news')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    
    if (fetchError) {
      throw fetchError
    }
    
    // 번역이 필요한 항목 필터링 (translations가 비어있거나 한국어 번역이 없는 경우)
    console.log(`[Translation] Found ${allFeaturedNews?.length || 0} active featured news`)
    
    const featuredNews = allFeaturedNews?.filter(item => {
      // translations가 null이거나 빈 객체이거나 한국어 번역이 없는 경우
      const needsTranslation = !item.translations || 
             Object.keys(item.translations).length === 0 || 
             !item.translations.ko ||
             (item.translated_at && new Date(item.translated_at) < today)
      
      console.log(`[Translation] News ${item.id}: translations=${JSON.stringify(item.translations)}, needsTranslation=${needsTranslation}`)
      return needsTranslation
    }).slice(0, remainingLimit) || []
    
    console.log(`[Translation] ${featuredNews.length} news items need translation`)
    
    if (!featuredNews || featuredNews.length === 0) {
      return NextResponse.json({ 
        message: 'No featured news to translate',
        translated: 0 
      })
    }
    
    console.log(`[Translation] Translating ${featuredNews.length} featured news items (limit: ${remainingLimit})`)
    
    const translatedItems = []
    
    for (const news of featuredNews) {
      console.log(`[Translation] Processing news ${news.id}: "${news.title}"`)
      try {
        // 제목과 설명만 번역 (본문은 번역하지 않음)
        const [translatedTitle, translatedDescription] = await Promise.all([
          microsoftTranslate(news.title, 'EN', 'KO'),
          news.description ? microsoftTranslate(news.description, 'EN', 'KO') : Promise.resolve('')
        ])
        
        console.log(`[Translation] Translated: "${news.title}" -> "${translatedTitle}"`)
        
        const translations = {
          ko: {
            title: translatedTitle,
            description: translatedDescription,
            translated_at: new Date().toISOString()
          }
        }
        
        // 번역 결과 저장 (일반 업데이트 시도)
        const { data: updateData, error: updateError } = await supabase
          .from('featured_news')
          .update({ 
            translations,
            translated_at: new Date().toISOString()
          })
          .eq('id', news.id)
          .select()
          .single()
        
        if (updateError) {
          console.error(`Failed to update news ${news.id}:`, updateError)
          console.error('Update error details:', JSON.stringify(updateError, null, 2))
        } else {
          console.log(`Successfully updated news ${news.id} with translations`)
          console.log('Updated data:', updateData)
          translatedItems.push({
            id: news.id,
            title: news.title,
            translated_title: translatedTitle,
            translated_description: translatedDescription
          })
        }
      } catch (error) {
        console.error(`Error translating news ${news.id}:`, error)
      }
    }
    
    // news_articles 테이블의 featured 항목도 업데이트 (Admin client 사용)
    if (translatedItems.length > 0) {
      for (const item of translatedItems) {
        const { data: newsArticle } = await supabaseAdmin
          .from('news_articles')
          .select('id, translations')
          .eq('id', item.id)
          .single()
        
        if (newsArticle) {
          const existingTranslations = newsArticle.translations || {}
          
          existingTranslations.ko = {
            title: item.translated_title,
            description: item.translated_description || '',
            translated_at: new Date().toISOString()
          }
          
          await supabaseAdmin
            .from('news_articles')
            .update({ translations: existingTranslations })
            .eq('id', item.id)
        }
      }
    }
    
    return NextResponse.json({ 
      message: `Successfully translated ${translatedItems.length} featured news items`,
      translated: translatedItems.length,
      items: translatedItems,
      dailyLimit: DAILY_TRANSLATION_LIMIT,
      remainingToday: remainingLimit - translatedItems.length
    })
    
  } catch (error: any) {
    console.error('[Translation Featured] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Translation failed' },
      { status: 500 }
    )
  }
}

// GET endpoint to check daily translation status
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const todayStr = today.toISOString()
    
    // 오늘 번역된 수 확인
    const { count: translatedToday } = await supabase
      .from('featured_news')
      .select('*', { count: 'exact', head: true })
      .not('translations', 'is', null)
      .gte('translated_at', todayStr)
    
    // 번역 대기 중인 수 확인
    const { count: pendingTranslation } = await supabase
      .from('featured_news')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .or('translations.is.null,translated_at.lt.' + todayStr)
    
    return NextResponse.json({
      dailyLimit: DAILY_TRANSLATION_LIMIT,
      translatedToday: translatedToday || 0,
      remainingToday: DAILY_TRANSLATION_LIMIT - (translatedToday || 0),
      pendingTranslation: pendingTranslation || 0,
      canTranslate: (translatedToday || 0) < DAILY_TRANSLATION_LIMIT
    })
  } catch (error: any) {
    console.error('[Translation Status] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get translation status' },
      { status: 500 }
    )
  }
}