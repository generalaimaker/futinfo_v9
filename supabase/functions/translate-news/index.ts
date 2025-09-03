import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { title, description, targetLang = 'KO' } = await req.json()

    if (!title || !description) {
      return new Response(
        JSON.stringify({ error: 'Title and description are required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // GPT 축구 뉴스 전문 번역 프롬프트
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

    // OpenAI API 호출
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
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
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const result = data.choices[0]?.message?.content

    if (!result) {
      throw new Error('No response from GPT')
    }

    const parsed = JSON.parse(result)
    
    return new Response(
      JSON.stringify({
        translatedTitle: parsed.translated_title || title,
        translatedDescription: parsed.translated_description || description,
        service: 'gpt-4o-mini',
        optimized: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Translation error:', error)
    
    // 에러 발생시 원문 반환
    return new Response(
      JSON.stringify({ 
        error: error.message,
        translatedTitle: req.json().title || '',
        translatedDescription: req.json().description || '',
        service: 'fallback'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  }
})