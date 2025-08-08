import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST() {
  try {
    // Create a test post
    // 먼저 사용 가능한 사용자를 찾거나 익명 사용자 UUID 사용
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single()
    
    const authorId = profiles?.id || '00000000-0000-0000-0000-000000000000' // 익명 사용자 UUID
    
    const testPost = {
      title: `웹 테스트 게시글 - ${new Date().toLocaleString('ko-KR')}`,
      content: 'iOS와 웹 간의 실시간 동기화를 테스트하는 게시글입니다.',
      board_id: 'team_168', // 실제 존재하는 게시판 ID 사용
      author_id: authorId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      view_count: 0,
      comment_count: 0
    }

    const { data, error } = await supabase
      .from('posts')
      .insert([testPost])
      .select()
      .single()

    if (error) {
      return NextResponse.json({
        status: 'error',
        error: error.message
      }, { status: 400 })
    }

    return NextResponse.json({
      status: 'success',
      message: '테스트 게시글이 생성되었습니다',
      post: data
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get recent posts to verify sync
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json({
        status: 'error',
        error: error.message
      }, { status: 400 })
    }

    return NextResponse.json({
      status: 'success',
      postsCount: posts?.length || 0,
      posts: posts || []
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}