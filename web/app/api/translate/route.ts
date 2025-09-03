import { NextRequest, NextResponse } from 'next/server'
import { simpleTranslate } from '@/lib/translations/football-dictionary'
import OpenAI from 'openai'

// Microsoft Translator API configuration
const MICROSOFT_TRANSLATOR_KEY = process.env.MICROSOFT_TRANSLATOR_KEY || ''
const MICROSOFT_TRANSLATOR_ENDPOINT = 'https://api.cognitive.microsofttranslator.com/'
const MICROSOFT_TRANSLATOR_REGION = 'koreacentral'

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

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

// GPT 축구 뉴스 전문 번역 (최적화된 번역)
async function gptFootballTranslate(title: string, description: string) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    const prompt = `You are a football news editor.

Task:
- Translate the given English football news title and description into Korean.
- Do NOT literal-translate. Instead, make it natural and optimized for Korean football fans.
- Use proper football terminology:
  - "signing" → "영입"
  - "transfer" → "이적"
  - "transfer record" → "이적 기록"
  - "loan" → "임대"
  - "manager" → "감독"
  - "striker" → "스트라이커"
  - "midfielder" → "미드필더"
  - "defender" → "수비수"
  - "goalkeeper" → "골키퍼"
  - "brace" → "2골"
  - "hat-trick" → "해트트릭"
  - "clean sheet" → "무실점"
  - "penalty" → "페널티킥" or "PK"
  - "injury time" → "추가시간"
  - "VAR" → "VAR"
  - "Champions League" → "챔피언스리그"
  - "Premier League" → "프리미어리그"
  - "La Liga" → "라리가"
  - "Serie A" → "세리에A"
  - "Bundesliga" → "분데스리가"
- Keep the style short, clear, and impactful like real sports headlines.
- The description should be 1-2 short sentences maximum.

Input:
Title: ${title}
Description: ${description}

Output (in JSON):
{
  "translated_title": "번역+최적화된 한국어 제목",
  "translated_description": "번역+최적화된 한국어 설명"
}`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional Korean sports journalist specializing in football news translation."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" }
    })

    const result = completion.choices[0]?.message?.content
    if (!result) {
      throw new Error('No response from GPT')
    }

    const parsed = JSON.parse(result)
    console.log('[GPT Translation] Success:', parsed)
    
    return {
      title: parsed.translated_title || title,
      description: parsed.translated_description || description
    }
  } catch (error) {
    console.error('[GPT Translation] Error:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  let text = ''
  
  try {
    const body = await request.json()
    text = body.text
    const { sourceLang = 'EN', targetLang = 'KO', isNewsArticle = false, title, description } = body

    console.log('[Translation API] Request:', { 
      textLength: text?.length, 
      sourceLang, 
      targetLang,
      hasMicrosoftKey: !!MICROSOFT_TRANSLATOR_KEY,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      isNewsArticle 
    })

    // 뉴스 아티클인 경우 GPT 번역 우선 사용
    if (isNewsArticle && title && description && targetLang === 'KO' && process.env.OPENAI_API_KEY) {
      try {
        const gptResult = await gptFootballTranslate(title, description)
        return NextResponse.json({ 
          translatedTitle: gptResult.title,
          translatedDescription: gptResult.description,
          service: 'gpt',
          optimized: true
        })
      } catch (gptError) {
        console.error('[Translation API] GPT translation failed, falling back:', gptError)
        // GPT 실패시 기존 번역 서비스로 폴백
      }
    }

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