import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET() {
  try {
    // Test Supabase connection
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Test Edge Function
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke('unified-football-api', {
      body: { 
        endpoint: 'fixtures', 
        params: { date: '2025-01-16' } 
      }
    })
    
    return NextResponse.json({
      supabase: {
        connected: !sessionError,
        session: session ? 'Active' : 'None',
        error: sessionError?.message
      },
      edgeFunction: {
        success: !edgeError,
        dataReceived: !!edgeData,
        error: edgeError?.message,
        resultCount: edgeData?.response?.length || 0
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: (error as Error).message 
    }, { status: 500 })
  }
}