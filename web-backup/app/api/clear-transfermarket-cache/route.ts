import { NextResponse } from 'next/server'

export async function GET() {
  // This would normally clear server-side cache
  // For client-side cache, we need to handle it differently
  
  return NextResponse.json({ 
    message: 'Cache clearing must be done on client side',
    instructions: 'Run localStorage.clear() in browser console or use the button on the transfer page'
  })
}