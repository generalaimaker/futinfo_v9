import { getSupabaseClient } from './client-singleton'
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
  // Get supabase client for each method call
  private static getClient() {
    return getSupabaseClient()
  }

  // Transform raw data from database
  private static transformPost(post: any): CommunityPost {
    return {
      ...post,
      author: post.author || post.profiles || null,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      commentCount: post.comment_count || 0,
      likeCount: post.like_count || 0,
      viewCount: post.view_count || 0
    }
  }

  private static transformComment(comment: any): CommunityComment {
    return {
      ...comment,
      author: comment.author || comment.profiles || null,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at
    }
  }

  private static transformProfile(profile: any): UserProfile {
    return {
      id: profile.id,
      userId: profile.user_id,
      email: profile.email,
      nickname: profile.nickname,
      avatarUrl: profile.avatar_url,
      favoriteTeamId: profile.favorite_team_id,
      favoriteTeamName: profile.favorite_team_name,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    }
  }

  // Popular posts for homepage
  static async getPopularPosts(options: { limit?: number } = {}): Promise<CommunityPost[]> {
    const supabase = this.getClient()
    const { limit = 3 } = options
    
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles(*)
      `)
      .order('like_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data?.map(this.transformPost) || []
  }

  // Stats for homepage
  static async getStats24Hours(): Promise<{ activeUsers: number; newPosts: number }> {
    const supabase = this.getClient()
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const [postsResult, usersResult] = await Promise.all([
      supabase
        .from('posts')
        .select('id', { count: 'exact' })
        .gte('created_at', twentyFourHoursAgo),
      supabase
        .from('posts')
        .select('author_id')
        .gte('created_at', twentyFourHoursAgo)
    ])

    const uniqueUsers = new Set(usersResult.data?.map(p => p.author_id) || [])
    
    return {
      activeUsers: uniqueUsers.size,
      newPosts: postsResult.count || 0
    }
  }

  // Board operations
  static async getBoards(): Promise<CommunityBoard[]> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async getBoard(id: string): Promise<CommunityBoard | null> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  // Post operations  
  static async getPosts(
    boardId: string, 
    page = 1, 
    limit = 20,
    category?: string
  ): Promise<PaginatedResponse<CommunityPost>> {
    const supabase = this.getClient()
    let query = supabase
      .from('posts')
      .select(`
        *,
        author:profiles(*)
      `, { count: 'exact' })
      .eq('board_id', boardId)
      .order('created_at', { ascending: false })

    if (category && category !== '전체') {
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
    const supabase = this.getClient()
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

  static async createPost(postData: CreatePostData, customClient?: any): Promise<CommunityPost> {
    console.log('[CommunityService] createPost called with userId:', postData.userId)
    const supabase = customClient || this.getClient()
    
    let userId: string | undefined = postData.userId
    
    // userId가 없으면 세션에서 가져오기 시도
    if (!userId) {
      console.log('[CommunityService] No userId provided, checking session')
      
      // 먼저 세션 확인
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('[CommunityService] Session check:', !!session, sessionError)
      
      if (session?.user) {
        userId = session.user.id
        console.log('[CommunityService] Using userId from session:', userId)
      } else {
        // getUser를 fallback으로 시도
        const { data: { user: fallbackUser } } = await supabase.auth.getUser()
        if (fallbackUser) {
          userId = fallbackUser.id
          console.log('[CommunityService] Using userId from getUser:', userId)
        }
      }
    }
    
    if (!userId) {
      throw new Error('User not authenticated - no userId available')
    }
    
    console.log('[CommunityService] Final userId:', userId)

    // Get the user's profile to use the correct profile ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!profile) throw new Error('User profile not found')

    // Convert camelCase to snake_case for database
    const dbData: any = {
      board_id: postData.boardId,
      title: postData.title,
      content: postData.content,
      category: postData.category,
      author_id: profile.id
    }
    
    if (postData.tags) dbData.tags = postData.tags
    // image_urls 컬럼이 없으므로 제외
    // if (postData.imageUrls) dbData.image_urls = postData.imageUrls
    
    const { data, error } = await supabase
      .from('posts')
      .insert(dbData)
      .select(`
        *,
        author:profiles(*)
      `)
      .single()

    if (error) throw error
    
    return this.transformPost(data)
  }

  static async updatePost(id: string, updates: Partial<CreatePostData>): Promise<CommunityPost> {
    const supabase = this.getClient()
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
    const supabase = this.getClient()
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  static async incrementViewCount(postId: string): Promise<void> {
    const supabase = this.getClient()
    const { error } = await supabase.rpc('increment_view_count', {
      post_id: postId
    })

    if (error) throw error
  }

  // Comment operations
  static async getComments(postId: string): Promise<CommunityComment[]> {
    const supabase = this.getClient()
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

  static async createComment(commentData: CreateCommentData, customClient?: any): Promise<CommunityComment> {
    const supabase = customClient || this.getClient()
    
    let userId: string | undefined = commentData.userId
    
    // userId가 없으면 세션에서 가져오기 시도
    if (!userId) {
      console.log('[CommunityService] No userId provided, checking session')
      
      // 먼저 세션 확인
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (session?.user) {
        userId = session.user.id
      } else {
        // getUser를 fallback으로 시도
        const { data: { user: fallbackUser } } = await supabase.auth.getUser()
        if (fallbackUser) {
          userId = fallbackUser.id
        }
      }
    }
    
    if (!userId) {
      throw new Error('User not authenticated - no userId available')
    }

    // Get the user's profile to use the correct profile ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!profile) throw new Error('User profile not found')

    // Convert camelCase to snake_case for database
    const dbData: any = {
      post_id: commentData.postId,
      content: commentData.content,
      author_id: profile.id
    }
    
    const { data, error } = await supabase
      .from('comments')
      .insert(dbData)
      .select(`
        *,
        author:profiles(*)
      `)
      .single()

    if (error) throw error
    
    return this.transformComment(data)
  }

  // User profile operations
  static async getCurrentUserProfile(): Promise<UserProfile | null> {
    const supabase = this.getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows found
      throw error
    }
    
    return this.transformProfile(data)
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    
    return this.transformProfile(data)
  }

  static async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const supabase = this.getClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('[CommunityService] Auth error:', authError)
      throw new Error(`Authentication failed: ${authError.message}`)
    }
    
    if (!user) {
      console.error('[CommunityService] No user found in session')
      throw new Error('User not authenticated')
    }
    
    console.log('[CommunityService] Updating profile for user:', user.id)

    // 먼저 프로필이 있는지 확인
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    let data, error

    // Convert camelCase to snake_case for database
    const dbUpdates: any = {}
    if (updates.nickname !== undefined) dbUpdates.nickname = updates.nickname
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl
    if (updates.favoriteTeamId !== undefined) dbUpdates.favorite_team_id = updates.favoriteTeamId
    if (updates.favoriteTeamName !== undefined) dbUpdates.favorite_team_name = updates.favoriteTeamName

    if (existingProfile) {
      // 프로필이 있으면 업데이트
      const result = await supabase
        .from('profiles')
        .update({
          ...dbUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select('*')
        .single()
      
      data = result.data
      error = result.error
    } else {
      // 프로필이 없으면 생성
      const result = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          email: user.email,
          ...dbUpdates,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single()
      
      data = result.data
      error = result.error
    }

    if (error) throw error
    
    return this.transformProfile(data)
  }

  // Realtime subscriptions
  static subscribeToBoard(boardId: string, callback: (payload: any) => void) {
    const supabase = this.getClient()
    return supabase
      .channel(`board-${boardId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts',
        filter: `board_id=eq.${boardId}`
      }, callback)
      .subscribe()
  }

  static subscribeToPost(postId: string, callback: (payload: any) => void) {
    const supabase = this.getClient()
    return supabase
      .channel(`post-${postId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`
      }, callback)
      .subscribe()
  }
}