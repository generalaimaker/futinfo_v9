interface TranslationCache {
  [key: string]: {
    translated: string
    timestamp: number
  }
}

const cache: TranslationCache = {}
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24시간

export interface TranslateOptions {
  sourceLang?: string
  targetLang?: string
  useCache?: boolean
}

// 지원 언어 매핑
const LANGUAGE_MAP: Record<string, string> = {
  'ko': 'KO',
  'en': 'EN',
  'ja': 'JA',
  'zh': 'ZH',
  'es': 'ES',
  'de': 'DE',
  'fr': 'FR',
  'pt': 'PT',
  'ru': 'RU'
}

/**
 * DeepL API를 사용한 텍스트 번역
 */
export async function translateText(
  text: string,
  options: TranslateOptions = {}
): Promise<string> {
  const {
    sourceLang = 'EN',
    targetLang = 'KO',
    useCache = true
  } = options

  // 언어 코드 정규화
  const normalizedTarget = LANGUAGE_MAP[targetLang.toLowerCase()] || targetLang
  const normalizedSource = LANGUAGE_MAP[sourceLang.toLowerCase()] || sourceLang

  // 빈 텍스트 체크
  if (!text || text.trim() === '') {
    return text
  }

  // 같은 언어면 번역하지 않음
  if (normalizedSource === normalizedTarget) {
    return text
  }

  // 캐시 체크
  const cacheKey = `${text}_${normalizedSource}_${normalizedTarget}`
  if (useCache && cache[cacheKey]) {
    const cached = cache[cacheKey]
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.translated
    }
  }

  try {
    // API Route를 통해 번역 (CORS 회피)
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        sourceLang: normalizedSource,
        targetLang: normalizedTarget,
      }),
    })

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`)
    }

    const data = await response.json()
    const translatedText = data.translatedText || text

    // 캐시 저장
    if (useCache) {
      cache[cacheKey] = {
        translated: translatedText,
        timestamp: Date.now()
      }
    }

    return translatedText
  } catch (error) {
    console.error('Translation error:', error)
    return text // 에러 시 원문 반환
  }
}

/**
 * 뉴스 아티클 번역
 */
export async function translateNewsArticle(
  article: {
    title: string
    description: string
    [key: string]: any
  },
  targetLang: string = 'ko'
): Promise<typeof article> {
  try {
    // 병렬로 제목과 설명 번역
    const [translatedTitle, translatedDescription] = await Promise.all([
      translateText(article.title, { targetLang }),
      translateText(article.description, { targetLang })
    ])

    return {
      ...article,
      title: translatedTitle,
      description: translatedDescription,
      originalTitle: article.title,
      originalDescription: article.description,
      isTranslated: true
    }
  } catch (error) {
    console.error('News translation error:', error)
    return {
      ...article,
      isTranslated: false
    }
  }
}

/**
 * 여러 뉴스 아티클 일괄 번역
 */
export async function translateNewsArticles(
  articles: Array<{ title: string; description: string; [key: string]: any }>,
  targetLang: string = 'ko'
): Promise<typeof articles> {
  try {
    // 배치로 번역 처리
    const translatedArticles = await Promise.all(
      articles.map(article => translateNewsArticle(article, targetLang))
    )
    return translatedArticles
  } catch (error) {
    console.error('Batch translation error:', error)
    return articles
  }
}