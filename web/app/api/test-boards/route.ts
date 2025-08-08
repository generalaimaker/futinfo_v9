import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET() {
  try {
    const { data: boards, error } = await supabase
      .from('boards')
      .select('*')
      .limit(10)

    if (error) {
      return NextResponse.json({
        status: 'error',
        error: error.message
      }, { status: 400 })
    }

    return NextResponse.json({
      status: 'success',
      boardsCount: boards?.length || 0,
      boards: boards || []
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}