import { supabase } from '@/lib/supabase/client'

export interface TeamPost {
  id: string
  team_id: number
  user_id: string
  title: string
  content: string
  category: 'general' | 'match' | 'transfer' | 'news' | 'discussion'
  likes: number
  views: number
  is_pinned: boolean
  created_at: string
  updated_at: string
  user?: {
    id: string
    email: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
  comments?: TeamComment[]
  is_liked?: boolean
}

export interface TeamComment {
  id: string
  post_id: string
  user_id: string
  content: string
  likes: number
  created_at: string
  updated_at: string
  user?: {
    id: string
    email: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
}

export interface MatchPrediction {
  id: string
  fixture_id: number
  user_id: string
  home_score: number
  away_score: number
  created_at: string
  user?: {
    id: string
    email: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
}

export interface TeamPoll {
  id: string
  team_id: number
  user_id: string
  question: string
  options: { id: string; text: string; votes: number }[]
  votes: Record<string, string[]> // option_id -> user_ids
  ends_at: string
  created_at: string
  user?: {
    id: string
    email: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
  user_vote?: string
}

class TeamCommunityService {
  // 팀 게시글 목록 조회
  async getTeamPosts(teamId: number, category?: string, limit = 10, offset = 0) {
    console.log('[TeamCommunity] Fetching posts for team:', teamId, 'category:', category)
    
    let query = supabase
      .from('team_posts')
      .select('*')
      .eq('team_id', teamId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      console.error('[TeamCommunity] Error fetching posts:', error)
      throw error
    }
    
    console.log('[TeamCommunity] Fetched posts:', data?.length || 0, 'data:', data)

    // 사용자가 좋아요를 눌렀는지 확인
    const user = await this.getCurrentUser()
    if (user && data) {
      const postIds = data.map(post => post.id)
      const { data: likes } = await supabase
        .from('team_post_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds)

      const likedPostIds = new Set(likes?.map(like => like.post_id) || [])
      data.forEach(post => {
        post.is_liked = likedPostIds.has(post.id)
      })
    }

    return data
  }

  // 게시글 상세 조회
  async getPost(postId: string) {
    const { data: post, error } = await supabase
      .from('team_posts')
      .select(`
        *,
        user:auth.users!user_id (
          id,
          email,
          user_metadata:raw_user_meta_data
        ),
        comments:team_comments (
          *,
          user:user_id (
            id,
            email,
            user_metadata
          )
        )
      `)
      .eq('id', postId)
      .single()

    if (error) throw error

    // 조회수 증가
    await supabase
      .from('team_posts')
      .update({ views: (post as any).views + 1 })
      .eq('id', postId)

    // 사용자가 좋아요를 눌렀는지 확인
    const user = await this.getCurrentUser()
    if (user) {
      const { data: like } = await supabase
        .from('team_post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      (post as any).is_liked = !!like
    }

    return post
  }

  // 게시글 작성
  async createPost(data: {
    team_id: number
    title: string
    content: string
    category: TeamPost['category']
  }) {
    console.log('[TeamCommunity] Creating post:', data)
    
    const user = await this.getCurrentUser()
    if (!user) {
      console.error('[TeamCommunity] No user found')
      throw new Error('로그인이 필요합니다')
    }
    
    console.log('[TeamCommunity] User ID:', user.id)

    const { data: post, error } = await supabase
      .from('team_posts')
      .insert({
        ...data,
        user_id: user.id,
        likes: 0,
        views: 0,
        is_pinned: false
      })
      .select()
      .single()

    if (error) {
      console.error('[TeamCommunity] Error creating post:', error)
      throw error
    }
    
    console.log('[TeamCommunity] Post created:', post)
    return post
  }

  // 댓글 작성
  async createComment(postId: string, content: string) {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('로그인이 필요합니다')

    const { data: comment, error } = await supabase
      .from('team_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content
      })
      .select(`
        *,
        user:user_id (
          id,
          email,
          user_metadata
        )
      `)
      .single()

    if (error) throw error
    return comment
  }

  // 게시글 좋아요
  async togglePostLike(postId: string) {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('로그인이 필요합니다')

    // 이미 좋아요를 눌렀는지 확인
    const { data: existingLike } = await supabase
      .from('team_post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single()

    if (existingLike) {
      // 좋아요 취소
      await supabase
        .from('team_post_likes')
        .delete()
        .eq('id', existingLike.id)

      await supabase.rpc('decrement_post_likes', { post_id: postId })
      return false
    } else {
      // 좋아요 추가
      await supabase
        .from('team_post_likes')
        .insert({
          post_id: postId,
          user_id: user.id
        })

      await supabase.rpc('increment_post_likes', { post_id: postId })
      return true
    }
  }

  // 경기 예측 조회
  async getMatchPredictions(fixtureId: number) {
    const { data, error } = await supabase
      .from('match_predictions')
      .select(`
        *,
        user:user_id (
          id,
          email,
          user_metadata
        )
      `)
      .eq('fixture_id', fixtureId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  // 경기 예측 생성/수정
  async createOrUpdatePrediction(fixtureId: number, homeScore: number, awayScore: number) {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('로그인이 필요합니다')

    const { data, error } = await supabase
      .from('match_predictions')
      .upsert({
        fixture_id: fixtureId,
        user_id: user.id,
        home_score: homeScore,
        away_score: awayScore
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 팀 투표 조회
  async getTeamPolls(teamId: number) {
    const { data, error } = await supabase
      .from('team_polls')
      .select(`
        *,
        user:user_id (
          id,
          email,
          user_metadata
        )
      `)
      .eq('team_id', teamId)
      .gte('ends_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error

    // 사용자의 투표 확인
    const user = await this.getCurrentUser()
    if (user && data) {
      data.forEach(poll => {
        for (const [optionId, userIds] of Object.entries(poll.votes)) {
          if ((userIds as string[]).includes(user.id)) {
            poll.user_vote = optionId
            break
          }
        }
      })
    }

    return data
  }

  // 투표하기
  async voteOnPoll(pollId: string, optionId: string) {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('로그인이 필요합니다')

    const { data: poll, error } = await supabase
      .from('team_polls')
      .select('votes')
      .eq('id', pollId)
      .single()

    if (error) throw error

    // 이전 투표 제거
    const votes = poll.votes as Record<string, string[]>
    for (const [opt, userIds] of Object.entries(votes)) {
      const index = userIds.indexOf(user.id)
      if (index > -1) {
        userIds.splice(index, 1)
      }
    }

    // 새 투표 추가
    if (!votes[optionId]) {
      votes[optionId] = []
    }
    votes[optionId].push(user.id)

    // 업데이트
    const { error: updateError } = await supabase
      .from('team_polls')
      .update({ votes })
      .eq('id', pollId)

    if (updateError) throw updateError
    return true
  }

  // 현재 사용자 가져오기
  private async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }
}

// RPC 함수 생성 (마이그레이션에 추가)
export const createRPCFunctions = `
-- 게시글 좋아요 증가
CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE team_posts SET likes = likes + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- 게시글 좋아요 감소
CREATE OR REPLACE FUNCTION decrement_post_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE team_posts SET likes = GREATEST(likes - 1, 0) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;
`

export const teamCommunityService = new TeamCommunityService()