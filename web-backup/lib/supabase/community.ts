import { supabase } from './client'
import type { 
  CommunityBoard, 
  CommunityPost, 
  CommunityComment, 
  UserProfile,
  CreatePostData,
  CreateCommentData,
  PaginatedResponse 
} from '@/lib/types/community'

export class CommunityService {
  // 인기글 가져오기
  static async getPopularPosts(options: { limit?: number } = {}): Promise<CommunityPost[]> {
    const { limit = 10 } = options
    
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles(*),
        board:boards(*)
      `)
      .order('like_count', { ascending: false })
      .order('comment_count', { ascending: false })
      .limit(limit)

    if (error) throw error
    
    return data?.map(this.transformPost) || []
  }

  // 24시간 통계
  static async getStats24Hours(): Promise<{ activeUsers: number; newPosts: number }> {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    // 새 게시글 수
    const { count: newPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString())
    
    // 활성 사용자 수 (게시글이나 댓글 작성한 유저)
    const { data: activeUserIds } = await supabase
      .from('posts')
      .select('author_id')
      .gte('created_at', yesterday.toISOString())
    
    const uniqueUsers = new Set(activeUserIds?.map(p => p.author_id) || [])
    
    return {
      activeUsers: uniqueUsers.size,
      newPosts: newPosts || 0
    }
  }
  // Boards
  static async getBoards(): Promise<CommunityBoard[]> {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .order('member_count', { ascending: false })

    if (error) throw error
    
    return data.map(this.transformBoard)
  }

  static async getBoard(id: string): Promise<CommunityBoard | null> {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    
    return data ? this.transformBoard(data) : null
  }

  // Posts
  static async getPosts(
    boardId: string, 
    page = 1, 
    limit = 20,
    category?: string
  ): Promise<PaginatedResponse<CommunityPost>> {
    let query = supabase
      .from('posts')
      .select(`
        *,
        author:profiles(*)
      `, { count: 'exact' })
      .eq('board_id', boardId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await query
      .range(from, to)

    if (error) throw error

    const posts = data?.map(this.transformPost) || []
    const totalPages = count ? Math.ceil(count / limit) : 0

    return {
      data: posts,
      count: count || 0,
      page,
      totalPages,
      hasMore: page < totalPages
    }
  }

  static async getPost(id: string): Promise<CommunityPost | null> {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    
    return data ? this.transformPost(data) : null
  }

  static async createPost(postData: CreatePostData): Promise<CommunityPost> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get the user's profile to use the correct profile ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) throw new Error('User profile not found')

    const { data, error } = await supabase
      .from('posts')
      .insert({
        board_id: postData.boardId,
        author_id: profile.id,
        title: postData.title,
        content: postData.content,
        category: postData.category,
        tags: postData.tags,
        image_urls: postData.imageUrls,
      })
      .select(`
        *,
        author:profiles(*)
      `)
      .single()

    if (error) {
      console.error('Error creating post:', error)
      throw new Error(`Failed to create post: ${error.message}`)
    }
    
    return this.transformPost(data)
  }

  static async updatePost(id: string, updates: Partial<CreatePostData>): Promise<CommunityPost> {
    const { data, error } = await supabase
      .from('posts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        author:profiles(*)
      `)
      .single()

    if (error) throw error
    
    return this.transformPost(data)
  }

  static async deletePost(id: string): Promise<void> {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  static async incrementViewCount(postId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_post_view_count', {
      post_id: postId
    })

    if (error) console.error('Error incrementing view count:', error)
  }

  // Comments
  static async getComments(postId: string): Promise<CommunityComment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:profiles(*)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) throw error
    
    return data?.map(this.transformComment) || []
  }

  static async createComment(commentData: CreateCommentData): Promise<CommunityComment> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get the user's profile to use the correct profile ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) throw new Error('User profile not found')

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: commentData.postId,
        author_id: profile.id,
        content: commentData.content,
        parent_id: commentData.parentCommentId,
      })
      .select(`
        *,
        author:profiles(*)
      `)
      .single()

    if (error) {
      console.error('Error creating comment:', error)
      throw new Error(`Failed to create comment: ${error.message}`)
    }
    
    return this.transformComment(data)
  }

  // User Profile
  static async getCurrentUserProfile(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) return null
    
    return this.transformProfile(data)
  }

  static async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select('*')
      .single()

    if (error) throw error
    
    return this.transformProfile(data)
  }

  // Realtime subscriptions
  static subscribeToBoard(boardId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`board_${boardId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'posts',
          filter: `board_id=eq.${boardId}`
        },
        callback
      )
      .subscribe()
  }

  static subscribeToPost(postId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`post_${postId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        callback
      )
      .subscribe()
  }

  // Transform functions
  private static transformBoard(data: any): CommunityBoard {
    return {
      id: data.id,
      type: data.type,
      name: data.name,
      teamId: data.team_id,
      leagueId: data.league_id,
      description: data.description,
      iconUrl: data.icon_url,
      postCount: data.post_count,
      memberCount: data.member_count,
    }
  }

  private static transformPost(data: any): CommunityPost {
    return {
      id: data.id,
      boardId: data.board_id,
      authorId: data.author_id,
      author: data.author ? CommunityService.transformProfile(data.author) : undefined,
      title: data.title,
      content: data.content,
      category: data.category,
      tags: data.tags,
      imageUrls: data.image_urls,
      createdAt: new Date(data.created_at),
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
      viewCount: data.view_count,
      likeCount: data.like_count,
      commentCount: data.comment_count,
      isPinned: data.is_pinned,
      isNotice: data.is_notice,
    }
  }

  private static transformComment(data: any): CommunityComment {
    return {
      id: data.id,
      postId: data.post_id,
      authorId: data.author_id,
      author: CommunityService.transformProfile(data.author),
      content: data.content,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      likeCount: data.like_count,
      parentCommentId: data.parent_id,
    }
  }

  private static transformProfile(data: any): UserProfile {
    return {
      id: data.id,
      userId: data.user_id,
      nickname: data.nickname,
      avatarUrl: data.avatar_url,
      favoriteTeamId: data.favorite_team_id,
      favoriteTeamName: data.favorite_team_name,
      language: data.language,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
      joinedAt: data.joined_at ? new Date(data.joined_at) : undefined,
      postCount: data.post_count,
      commentCount: data.comment_count,
    }
  }
}