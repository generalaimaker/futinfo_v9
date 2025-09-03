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

// GPT-4o mini를 사용한 축구 뉴스 최적화 번역
async function translateNewsOptimized(title: string, description: string, targetLang: string = 'ko'): Promise<{ title: string, description: string }> {
  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key not found')
      return { title, description }
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional Korean sports journalist specializing in football news translation. Always respond in valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      return { title, description }
    }

    const data = await response.json()
    const result = data.choices[0]?.message?.content
    
    if (!result) {
      console.error('No response from GPT')
      return { title, description }
    }
    
    try {
      const parsed = JSON.parse(result)
      return {
        title: parsed.translated_title || title,
        description: parsed.translated_description || description
      }
    } catch (parseError) {
      console.error('Failed to parse GPT response:', parseError)
      return { title, description }
    }
  } catch (error) {
    console.error('Translation error:', error)
    return { title, description }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { articleIds, languages = ['ko'] } = await req.json()
    
    if (!articleIds || articleIds.length === 0) {
      throw new Error('No article IDs provided')
    }
    
    console.log(`🌐 Translating ${articleIds.length} articles to Korean...`)
    
    // 기사들 가져오기
    const { data: articles, error: fetchError } = await supabase
      .from('news_articles')
      .select('*')
      .in('id', articleIds)
    
    if (fetchError) throw fetchError
    
    const results = { succeeded: 0, failed: 0 }
    
    for (const article of articles || []) {
      try {
        // 이미 한국어 번역이 있고, 제대로 번역되어 있으면 스킵
        if (article.translations?.ko?.title && 
            article.translations.ko.title !== article.title) {
          console.log(`Article already has Korean translation`)
          results.succeeded++
          continue
        }
        
        // GPT 최적화 번역 사용
        console.log(`🌟 Optimized translating: ${article.title.substring(0, 50)}...`)
        
        const translated = await translateNewsOptimized(
          article.title, 
          article.description || '', 
          'ko'
        )
        await new Promise(resolve => setTimeout(resolve, 300)) // Rate limiting for GPT
        
        // 번역 저장
        const translations = article.translations || {}
        translations.ko = {
          title: translated.title,
          description: translated.description,
          translated_at: new Date().toISOString(),
          optimized: true,
          service: 'gpt-4o-mini'
        }
        
        // DB 업데이트
        const { error: updateError } = await supabase
          .from('news_articles')
          .update({ 
            translations,
            updated_at: new Date().toISOString()
          })
          .eq('id', article.id)
        
        if (updateError) {
          console.error('Update error:', updateError)
          results.failed++
        } else {
          console.log(`✅ Translated successfully`)
          results.succeeded++
        }
        
      } catch (error) {
        console.error(`Error translating article:`, error)
        results.failed++
      }
    }
    
    const response = {
      success: true,
      message: `Translation completed: ${results.succeeded} success, ${results.failed} failed`,
      results,
      timestamp: new Date().toISOString()
    }
    
    console.log('✅ Translation batch completed:', response)
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('❌ Error in translator:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})