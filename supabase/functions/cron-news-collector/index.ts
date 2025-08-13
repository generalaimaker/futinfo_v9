import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 5분마다 실행되는 Cron Job
serve(async (req) => {
  try {
    console.log('Starting scheduled news collection...')
    
    // news-collector-enhanced 함수 호출
    const { data, error } = await supabase.functions.invoke('news-collector-enhanced', {
      body: {
        mode: 'scheduled',
        timestamp: new Date().toISOString()
      }
    })
    
    if (error) {
      throw error
    }
    
    console.log('News collection completed:', data)
    
    // 수집 통계 기록
    await supabase
      .from('collection_logs')
      .insert({
        collected_at: new Date().toISOString(),
        total_articles: data.collected,
        unique_articles: data.unique,
        saved_articles: data.saved,
        breaking_news: data.breaking,
        api_calls: data.api_calls
      })
    
    return new Response(JSON.stringify({
      success: true,
      message: 'News collection completed',
      stats: data
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
    
  } catch (error) {
    console.error('Cron job error:', error)
    
    // 에러 로깅
    await supabase
      .from('error_logs')
      .insert({
        function_name: 'cron-news-collector',
        error_message: error.message,
        occurred_at: new Date().toISOString()
      })
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})