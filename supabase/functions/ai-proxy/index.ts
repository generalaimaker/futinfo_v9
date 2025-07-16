import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mock AI response for Perplexity-style news
const mockPerplexityResponse = {
  choices: [{
    message: {
      content: JSON.stringify({
        news: [
          {
            title: "Barcelona signs young talent from La Masia",
            source: "Sport",
            description: "Barcelona promotes another La Masia graduate to the first team.",
            url: "https://www.sport.es/",
            publishedAt: new Date().toISOString()
          },
          {
            title: "Bayern Munich dominates Bundesliga match",
            source: "Kicker",
            description: "Bayern Munich continues their winning streak in the Bundesliga.",
            url: "https://www.kicker.de/",
            publishedAt: new Date().toISOString()
          }
        ]
      })
    }
  }]
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestData = await req.json()
    const { service } = requestData
    
    let responseData;
    
    if (service === 'perplexity') {
      // Return mock Perplexity-style response
      responseData = mockPerplexityResponse
    } else {
      // Default mock response
      responseData = {
        choices: [{
          message: {
            content: "Mock AI response for news processing"
          }
        }]
      }
    }
    
    return new Response(
      JSON.stringify(responseData),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
    
  } catch (error) {
    console.error('Error in ai-proxy:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})