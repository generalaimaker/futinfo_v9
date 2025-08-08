import { NextResponse } from 'next/server'

export async function GET() {
  // Return public configuration from server-side environment variables
  const config = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    rapidApiKey: process.env.NEXT_PUBLIC_RAPIDAPI_KEY,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  }
  
  // Check if any required variables are missing
  const missing = []
  if (!config.supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!config.supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  
  if (missing.length > 0) {
    return NextResponse.json(
      { 
        error: 'Missing environment variables', 
        missing,
        hint: 'Please set these variables in Vercel Dashboard → Settings → Environment Variables'
      },
      { status: 500 }
    )
  }
  
  return NextResponse.json(config)
}