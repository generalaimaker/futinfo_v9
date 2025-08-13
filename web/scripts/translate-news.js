// 뉴스 번역 스크립트
import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

const SUPABASE_URL = 'https://uutmymaxkkytibuiiaax.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM'
const DEEPL_API_KEY = '75869dbd-a539-4026-95f6-997bdce5d232:fx'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 월간 제한 및 문자 수 추적
const MONTHLY_CHAR_LIMIT = 500000
const BATCH_SIZE = 50 // 한 번에 번역할 기사 수 (증가)

// DeepL API로 텍스트 번역
async function translateText(texts, targetLang = 'KO') {
  try {
    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: texts,
        target_lang: targetLang,
        preserve_formatting: true
      })
    })
    
    if (!response.ok) {
      console.error(`DeepL API error: ${response.status}`)
      return null
    }
    
    const data = await response.json()
    return data.translations.map(t => t.text)
  } catch (error) {
    console.error('Translation error:', error)
    return null
  }
}

// API 사용량 확인
async function checkAPIUsage() {
  try {
    const response = await fetch('https://api-free.deepl.com/v2/usage', {
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log(`DeepL API Usage: ${data.character_count} / ${data.character_limit} characters`)
      return data
    }
  } catch (error) {
    console.error('Failed to check API usage:', error)
  }
  return null
}

async function translateNews() {
  console.log('Starting news translation...')
  
  // API 사용량 확인
  const usage = await checkAPIUsage()
  if (usage && usage.character_count >= usage.character_limit * 0.9) {
    console.log('⚠️ WARNING: API usage is at 90% of monthly limit!')
    return
  }
  
  // 번역되지 않은 기사 가져오기
  // translations 컬럼이 null이거나 ko 키가 없는 기사
  const { data: articles, error } = await supabase
    .from('news_articles')
    .select('id, title, description, translations')
    .is('translations', null)
    .order('published_at', { ascending: false })
    .limit(BATCH_SIZE)
  
  if (error) {
    console.error('Error fetching articles:', error)
    return
  }
  
  if (!articles || articles.length === 0) {
    console.log('No articles to translate')
    return
  }
  
  console.log(`Found ${articles.length} articles to translate`)
  
  let totalChars = 0
  let translatedCount = 0
  
  // 각 기사 번역
  for (const article of articles) {
    // 번역할 텍스트 준비
    const textsToTranslate = [
      article.title,
      article.description || ''
    ].filter(text => text && text.length > 0)
    
    // 문자 수 계산
    const charCount = textsToTranslate.join('').length
    totalChars += charCount
    
    // 월 제한 체크
    if (usage && usage.character_count + totalChars > usage.character_limit) {
      console.log('⚠️ Monthly character limit would be exceeded. Stopping translation.')
      break
    }
    
    console.log(`Translating article: ${article.title.substring(0, 50)}...`)
    
    // DeepL API 호출
    const translations = await translateText(textsToTranslate, 'KO')
    
    if (translations && translations.length > 0) {
      // 기존 translations 객체 가져오기 또는 새로 생성
      const existingTranslations = article.translations || {}
      
      // 한국어 번역 추가
      existingTranslations.ko = {
        title: translations[0],
        description: translations[1] || '',
        translated_at: new Date().toISOString()
      }
      
      // 데이터베이스 업데이트
      const { error: updateError } = await supabase
        .from('news_articles')
        .update({ translations: existingTranslations })
        .eq('id', article.id)
      
      if (updateError) {
        console.error(`Error updating article ${article.id}:`, updateError)
      } else {
        translatedCount++
        console.log(`✅ Translated: ${translations[0].substring(0, 50)}...`)
      }
      
      // API 레이트 리밋 고려 (무료 플랜)
      await new Promise(resolve => setTimeout(resolve, 2000)) // 2초 대기
    }
  }
  
  // API 사용량 기록
  if (totalChars > 0) {
    await supabase
      .from('api_usage')
      .upsert({
        api_name: 'deepl',
        usage_date: new Date().toISOString().split('T')[0],
        usage_count: totalChars,
        details: { translated_articles: translatedCount }
      }, {
        onConflict: 'api_name,usage_date'
      })
  }
  
  console.log(`\n🎉 Translation complete!`)
  console.log(`- Articles translated: ${translatedCount}`)
  console.log(`- Characters used: ${totalChars}`)
  
  // 최종 사용량 확인
  await checkAPIUsage()
}

// 실행
translateNews().catch(console.error)