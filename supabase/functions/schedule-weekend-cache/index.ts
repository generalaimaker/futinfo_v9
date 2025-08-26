import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 매주 목요일 밤과 금요일 아침에 실행되도록 설정
    // Supabase Cron: '0 22 * * 4' (목요일 22시)
    // Supabase Cron: '0 6 * * 5' (금요일 06시)
    
    const baseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    
    // precache-weekend 함수 호출
    const response = await fetch(`${baseUrl}/functions/v1/precache-weekend`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    const result = await response.json()
    
    console.log('✅ 주말 캐싱 스케줄 실행 완료:', result)
    
    return new Response(
      JSON.stringify({
        success: true,
        message: '주말 캐싱 스케줄 실행됨',
        result: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('❌ 스케줄 실행 오류:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})