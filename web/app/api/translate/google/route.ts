import { NextRequest, NextResponse } from 'next/server'

// Google Translate API (no key required for basic usage)
async function googleTranslate(text: string, sourceLang: string, targetLang: string) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang.toLowerCase()}&tl=${targetLang.toLowerCase()}&dt=t&q=${encodeURIComponent(text)}`
  
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Google Translate API error: ${response.status}`)
    }
    
    const data = await response.json()
    // Google Translate returns a complex nested array structure
    // The translated text is in data[0][0][0]
    const translatedText = data[0]?.map((item: any) => item[0]).join('') || text
    
    return translatedText
  } catch (error) {
    console.error('[Google Translate] Error:', error)
    return text
  }
}

export async function POST(request: NextRequest) {
  let text = ''
  
  try {
    const body = await request.json()
    text = body.text
    const { sourceLang = 'en', targetLang = 'ko' } = body

    console.log('[Google Translation API] Request:', { 
      textLength: text?.length, 
      sourceLang, 
      targetLang
    })

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // 같은 언어면 번역하지 않음
    if (sourceLang === targetLang) {
      return NextResponse.json({ translatedText: text })
    }

    const translatedText = await googleTranslate(text, sourceLang, targetLang)

    console.log('[Google Translation API] Success:', { 
      originalLength: text.length, 
      translatedLength: translatedText.length 
    })

    return NextResponse.json({ translatedText })
  } catch (error: any) {
    console.error('[Google Translation API] Error:', error.message || error)
    
    // 에러가 발생해도 원문 반환
    return NextResponse.json({ 
      translatedText: text || '',
      error: 'Translation failed, showing original text' 
    })
  }
}