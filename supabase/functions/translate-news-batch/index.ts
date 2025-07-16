import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 지원 언어
const SUPPORTED_LANGUAGES = ['ko', 'ja', 'zh', 'es', 'fr', 'de', 'it', 'pt']

// DeepL API (무료 티어: 월 500,000자)
const DEEPL_API_KEY = Deno.env.get('DEEPL_API_KEY')
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate'

// 기본 번역 매핑 (API 절약용)
const BASIC_TRANSLATIONS: Record<string, Record<string, string>> = {
  ko: {
    // 클럽명
    'Manchester United': '맨체스터 유나이티드',
    'Manchester City': '맨체스터 시티',
    'Liverpool': '리버풀',
    'Chelsea': '첼시',
    'Arsenal': '아스날',
    'Tottenham': '토트넘',
    'Real Madrid': '레알 마드리드',
    'Barcelona': '바르셀로나',
    'Bayern Munich': '바이에른 뮌헨',
    'PSG': '파리 생제르맹',
    'Juventus': '유벤투스',
    
    // 기본 용어
    'transfer': '이적',
    'signing': '영입',
    'contract': '계약',
    'manager': '감독',
    'player': '선수',
    'goal': '골',
    'match': '경기',
    'win': '승리',
    'defeat': '패배',
    'draw': '무승부',
    'injury': '부상',
    'return': '복귀',
    'confirms': '확정',
    'official': '공식',
    'breaking': '속보',
    'exclusive': '단독',
    
    // 리그명
    'Premier League': '프리미어리그',
    'La Liga': '라리가',
    'Serie A': '세리에 A',
    'Bundesliga': '분데스리가',
    'Ligue 1': '리그 1',
    'Champions League': '챔피언스리그',
    'Europa League': '유로파리그',
    'World Cup': '월드컵'
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { news, targetLanguages = ['ko'] } = await req.json()
    
    if (!news || !Array.isArray(news)) {
      throw new Error('Invalid news array')
    }

    // Supabase 클라이언트
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log(`🌐 번역 요청: ${news.length}개 뉴스, 언어: ${targetLanguages.join(', ')}`)

    const translatedNews = []

    for (const item of news) {
      // 이미 번역된 내용 확인
      const existing = await checkExistingTranslation(supabase, item.url)
      
      if (existing) {
        translatedNews.push(existing)
        continue
      }

      // 새로 번역
      const translations: Record<string, any> = {
        url: item.url,
        title_en: item.title,
        summary_en: item.summary || item.description
      }

      for (const lang of targetLanguages) {
        if (SUPPORTED_LANGUAGES.includes(lang)) {
          // 제목과 요약만 번역 (비용 절감)
          const translatedTitle = await translateText(item.title, lang, 'title')
          const shortSummary = (item.summary || item.description || '').substring(0, 200)
          const translatedSummary = await translateText(shortSummary, lang, 'summary')

          translations[`title_${lang}`] = translatedTitle
          translations[`summary_${lang}`] = translatedSummary
        }
      }

      translatedNews.push(translations)

      // DB에 저장
      await saveTranslation(supabase, translations)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        translated: translatedNews.length,
        translations: translatedNews
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('번역 오류:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// 기존 번역 확인
async function checkExistingTranslation(supabase: any, url: string) {
  try {
    const { data, error } = await supabase
      .from('news_translations')
      .select('*')
      .eq('url', url)
      .single()

    if (!error && data) {
      return data
    }
  } catch {
    // 없으면 null 반환
  }
  return null
}

// 번역 저장
async function saveTranslation(supabase: any, translation: any) {
  try {
    const { error } = await supabase
      .from('news_translations')
      .upsert(translation, { onConflict: 'url' })

    if (error) {
      console.error('번역 저장 실패:', error)
    }
  } catch (error) {
    console.error('번역 저장 오류:', error)
  }
}

// 텍스트 번역
async function translateText(text: string, targetLang: string, type: 'title' | 'summary'): Promise<string> {
  if (!text || text.trim().length === 0) {
    return ''
  }

  // 1. 기본 매핑 확인 (한국어만)
  if (targetLang === 'ko' && type === 'title') {
    let translated = text
    const mappings = BASIC_TRANSLATIONS.ko
    
    for (const [eng, kor] of Object.entries(mappings)) {
      translated = translated.replace(new RegExp(eng, 'gi'), kor)
    }
    
    // 완전히 번역된 경우 반환
    if (translated !== text) {
      return translated
    }
  }

  // 2. DeepL API 사용 (무료 티어)
  if (DEEPL_API_KEY) {
    try {
      const params = new URLSearchParams({
        auth_key: DEEPL_API_KEY,
        text: text,
        target_lang: targetLang.toUpperCase(),
        source_lang: 'EN'
      })

      const response = await fetch(DEEPL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
      })

      if (response.ok) {
        const data = await response.json()
        return data.translations[0].text
      }
    } catch (error) {
      console.error('DeepL 번역 실패:', error)
    }
  }

  // 3. 간단한 규칙 기반 번역 (폴백)
  if (targetLang === 'ko') {
    return simpleKoreanTranslation(text)
  }

  // 번역 실패시 원문 반환
  return text
}

// 간단한 한국어 번역 (규칙 기반)
function simpleKoreanTranslation(text: string): string {
  let result = text

  // 패턴 기반 번역
  const patterns = [
    { pattern: /(\w+) signs for (\w+)/gi, replacement: '$2, $1 영입' },
    { pattern: /(\w+) completes (£?\d+[mn]?) move to (\w+)/gi, replacement: '$1, $2에 $3 이적 완료' },
    { pattern: /(\w+) confirms (\w+) signing/gi, replacement: '$1, $2 영입 확정' },
    { pattern: /Breaking: (.+)/gi, replacement: '속보: $1' },
    { pattern: /Official: (.+)/gi, replacement: '공식: $1' },
    { pattern: /(\w+) defeats? (\w+) (\d+-\d+)/gi, replacement: '$1, $3으로 $2 꺾어' },
    { pattern: /(\w+) draws? with (\w+) (\d+-\d+)/gi, replacement: '$1, $2와 $3 무승부' },
    { pattern: /(\w+) injury update/gi, replacement: '$1 부상 소식' },
    { pattern: /Transfer news: (.+)/gi, replacement: '이적 뉴스: $1' }
  ]

  for (const { pattern, replacement } of patterns) {
    result = result.replace(pattern, replacement)
  }

  // 기본 단어 치환
  const words = BASIC_TRANSLATIONS.ko
  for (const [eng, kor] of Object.entries(words)) {
    result = result.replace(new RegExp(`\\b${eng}\\b`, 'gi'), kor)
  }

  return result
}

// 번역 테이블 생성 SQL
/*
CREATE TABLE news_translations (
  id SERIAL PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  title_en TEXT,
  summary_en TEXT,
  title_ko TEXT,
  summary_ko TEXT,
  title_ja TEXT,
  summary_ja TEXT,
  title_zh TEXT,
  summary_zh TEXT,
  title_es TEXT,
  summary_es TEXT,
  title_fr TEXT,
  summary_fr TEXT,
  title_de TEXT,
  summary_de TEXT,
  title_it TEXT,
  summary_it TEXT,
  title_pt TEXT,
  summary_pt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_translations_url ON news_translations(url);
CREATE INDEX idx_translations_created ON news_translations(created_at DESC);

-- RLS 정책
ALTER TABLE news_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON news_translations
  FOR SELECT USING (true);

CREATE POLICY "Service role write" ON news_translations
  FOR ALL USING (auth.role() = 'service_role');
*/