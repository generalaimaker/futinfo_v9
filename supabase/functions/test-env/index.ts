import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const envVars = {
      FOOTBALL_API_KEY: Deno.env.get('FOOTBALL_API_KEY') ? '✓ Set' : '✗ Not set',
      FOOTBALL_API_HOST: Deno.env.get('FOOTBALL_API_HOST') || 'Default: api-football-v1.p.rapidapi.com',
      SUPABASE_URL: Deno.env.get('SUPABASE_URL') ? '✓ Set' : '✗ Not set',
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? '✓ Set' : '✗ Not set',
    }

    return new Response(
      JSON.stringify({ 
        message: 'Environment variables check',
        env: envVars,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})