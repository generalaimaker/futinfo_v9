import { NextResponse } from 'next/server'
import { getMajorTransfers } from '@/lib/server/cached-transfers'

// Next.js 내장 캐싱 사용
export const revalidate = 7200 // 2시간 캐싱
export const dynamic = 'auto' // 자동 최적화

export async function GET() {
  try {
    const transfers = await getMajorTransfers()
    
    return NextResponse.json({
      transfers,
      cached: true,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      }
    })
  } catch (error) {
    console.error('[API] Error in major transfers route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transfers' },
      { status: 500 }
    )
  }
}