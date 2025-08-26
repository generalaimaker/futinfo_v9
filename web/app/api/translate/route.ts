import { NextRequest, NextResponse } from 'next/server'
import { simpleTranslate } from '@/lib/translations/football-dictionary'

const DEEPL_API_KEY = process.env.DEEPL_API_KEY || '75869dbd-a539-4026-95f6-997bdce5d232:fx'

// LibreTranslate API (오픈소스, 무료)
async function libreTranslate(text: string, sourceLang: string, targetLang: string) {
  // LibreTranslate 공개 인스턴스 사용
  const url = 'https://libretranslate.de/translate'
  
  try {
    console.log('[LibreTranslate] Requesting translation from', sourceLang, 'to', targetLang)
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: sourceLang.toLowerCase(),
        target: targetLang.toLowerCase(),
        format: 'text'
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error('[LibreTranslate] API error:', response.status, error)
      
      // 대체 번역 서비스 사용 - MyMemory Translation API
      return await myMemoryTranslate(text, sourceLang, targetLang)
    }
    
    const data = await response.json()
    console.log('[LibreTranslate] Success:', data.translatedText?.substring(0, 100))
    return data.translatedText || text
  } catch (error) {
    console.error('[LibreTranslate] Error:', error)
    // 실패시 MyMemory 번역 시도
    return await myMemoryTranslate(text, sourceLang, targetLang)
  }
}

// MyMemory Translation API (백업용, 무료)
async function myMemoryTranslate(text: string, sourceLang: string, targetLang: string) {
  const langPair = `${sourceLang.toLowerCase()}|${targetLang.toLowerCase()}`
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`
  
  try {
    console.log('[MyMemory] Requesting translation from', sourceLang, 'to', targetLang)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`MyMemory API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      console.log('[MyMemory] Success:', data.responseData.translatedText.substring(0, 100))
      return data.responseData.translatedText
    }
    
    return text
  } catch (error) {
    console.error('[MyMemory] Error:', error)
    return text
  }
}

export async function POST(request: NextRequest) {
  let text = ''
  
  try {
    const body = await request.json()
    text = body.text
    const { sourceLang = 'EN', targetLang = 'KO' } = body

    console.log('[Translation API] Request:', { 
      textLength: text?.length, 
      sourceLang, 
      targetLang,
      hasApiKey: !!DEEPL_API_KEY 
    })

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // 같은 언어면 번역하지 않음
    if (sourceLang === targetLang) {
      return NextResponse.json({ translatedText: text })
    }

    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        auth_key: DEEPL_API_KEY,
        text: text,
        source_lang: sourceLang,
        target_lang: targetLang,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Translation API] DeepL error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      
      // Quota exceeded 또는 API 키 문제일 경우 LibreTranslate 사용
      if (response.status === 456 || response.status === 403 || response.status === 401) {
        console.warn('[Translation API] DeepL quota exceeded, using LibreTranslate')
        
        // LibreTranslate 사용 (무료 오픈소스)
        const alternativeTranslated = await libreTranslate(text, sourceLang, targetLang)
        
        return NextResponse.json({ 
          translatedText: alternativeTranslated,
          fallback: 'libre',
          warning: 'Using LibreTranslate due to DeepL quota'
        })
      }
      
      throw new Error(`DeepL API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const translatedText = data.translations[0].text

    console.log('[Translation API] Success:', { 
      originalLength: text.length, 
      translatedLength: translatedText.length 
    })

    return NextResponse.json({ translatedText })
  } catch (error: any) {
    console.error('[Translation API] Error:', error.message || error)
    
    // 에러가 발생해도 원문 반환 (사용자 경험 개선)
    return NextResponse.json({ 
      translatedText: text || '',
      error: 'Translation failed, showing original text' 
    })
  }
}