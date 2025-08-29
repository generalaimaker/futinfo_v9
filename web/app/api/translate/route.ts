import { NextRequest, NextResponse } from 'next/server'
import { simpleTranslate } from '@/lib/translations/football-dictionary'

// Microsoft Translator API configuration
const MICROSOFT_TRANSLATOR_KEY = process.env.MICROSOFT_TRANSLATOR_KEY || ''
const MICROSOFT_TRANSLATOR_ENDPOINT = 'https://api.cognitive.microsofttranslator.com/'
const MICROSOFT_TRANSLATOR_REGION = 'koreacentral'

// Microsoft Translator API (Primary)
async function microsoftTranslate(text: string, sourceLang: string, targetLang: string) {
  try {
    // Microsoft Translator 언어 코드 매핑
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
    
    console.log('[Microsoft Translator] Requesting translation from', fromLang, 'to', toLang)
    
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
      const error = await response.text()
      console.error('[Microsoft Translator] API error:', response.status, error)
      throw new Error(`Microsoft Translator API error: ${response.status}`)
    }
    
    const data = await response.json()
    const translatedText = data[0]?.translations[0]?.text || text
    
    console.log('[Microsoft Translator] Success:', translatedText.substring(0, 100))
    return translatedText
  } catch (error) {
    console.error('[Microsoft Translator] Error:', error)
    throw error
  }
}

// LibreTranslate API (오픈소스, 무료 - Backup)
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
      hasMicrosoftKey: !!MICROSOFT_TRANSLATOR_KEY 
    })

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // 같은 언어면 번역하지 않음
    if (sourceLang === targetLang) {
      return NextResponse.json({ translatedText: text })
    }

    try {
      // 1. Microsoft Translator API 사용 (Primary)
      const translatedText = await microsoftTranslate(text, sourceLang, targetLang)
      
      console.log('[Translation API] Success with Microsoft Translator:', { 
        originalLength: text.length, 
        translatedLength: translatedText.length 
      })

      return NextResponse.json({ 
        translatedText,
        service: 'microsoft'
      })
    } catch (microsoftError) {
      console.error('[Translation API] Microsoft Translator failed:', microsoftError)
      
      // 2. Fallback to LibreTranslate
      try {
        console.warn('[Translation API] Falling back to LibreTranslate')
        const alternativeTranslated = await libreTranslate(text, sourceLang, targetLang)
        
        return NextResponse.json({ 
          translatedText: alternativeTranslated,
          service: 'libre',
          fallback: true,
          warning: 'Using LibreTranslate as fallback'
        })
      } catch (libreError) {
        console.error('[Translation API] LibreTranslate failed:', libreError)
        
        // 3. Final fallback to MyMemory
        try {
          console.warn('[Translation API] Final fallback to MyMemory')
          const finalTranslated = await myMemoryTranslate(text, sourceLang, targetLang)
          
          return NextResponse.json({ 
            translatedText: finalTranslated,
            service: 'mymemory',
            fallback: true,
            warning: 'Using MyMemory as final fallback'
          })
        } catch (finalError) {
          console.error('[Translation API] All translation services failed')
          throw finalError
        }
      }
    }
  } catch (error: any) {
    console.error('[Translation API] Error:', error.message || error)
    
    // 에러가 발생해도 원문 반환 (사용자 경험 개선)
    return NextResponse.json({ 
      translatedText: text || '',
      error: 'Translation failed, showing original text' 
    })
  }
}