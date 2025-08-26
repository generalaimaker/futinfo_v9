import { supabase } from '@/lib/supabase/client'

export interface AdminUser {
  id: string
  user_id: string
  role: 'super_admin' | 'admin' | 'moderator'
  permissions: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BannerContent {
  id?: string
  type: 'match' | 'news' | 'team' | 'stats' | 'promotion'
  title?: string
  subtitle?: string
  content: any
  position: number
  is_active: boolean
  start_date?: string
  end_date?: string
  created_at?: string
  updated_at?: string
  created_by?: string
}

export interface FeaturedMatch {
  id?: string
  fixture_id: number
  match_date: string
  teams_info: any
  league_info: any
  priority: number
  is_featured: boolean
  featured_until?: string
  created_at?: string
  created_by?: string
}

export interface CuratedNews {
  id?: string
  title: string
  description?: string
  image_url?: string
  source_url?: string
  source_name?: string
  category?: string
  tags?: string[]
  priority: number
  is_featured: boolean
  published_at?: string
  created_at?: string
  created_by?: string
}

class AdminService {
  // 관리자 권한 체크
  async checkAdminAccess(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      return !!data && !error
    } catch (error) {
      console.error('Admin access check error:', error)
      return false
    }
  }

  // 관리자 정보 가져오기
  async getAdminInfo() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) throw error
    return data
  }

  // 배너 콘텐츠 관리
  async getBannerContents() {
    const { data, error } = await supabase
      .from('banner_content')
      .select('*')
      .order('position', { ascending: true })

    if (error) throw error
    return data
  }

  async createBannerContent(content: Omit<BannerContent, 'id' | 'created_at' | 'updated_at'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('banner_content')
      .insert({
        ...content,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateBannerContent(id: string, updates: Partial<BannerContent>) {
    const { data, error } = await supabase
      .from('banner_content')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteBannerContent(id: string) {
    const { error } = await supabase
      .from('banner_content')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // 추천 경기 관리
  async getFeaturedMatches() {
    const { data, error } = await supabase
      .from('featured_matches')
      .select('*')
      .eq('is_featured', true)
      .order('priority', { ascending: true })

    if (error) throw error
    return data
  }

  async addFeaturedMatch(match: Omit<FeaturedMatch, 'id' | 'created_at'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('featured_matches')
      .insert({
        ...match,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateFeaturedMatch(id: string, updates: Partial<FeaturedMatch>) {
    const { data, error } = await supabase
      .from('featured_matches')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async removeFeaturedMatch(id: string) {
    const { error } = await supabase
      .from('featured_matches')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // 큐레이션 뉴스 관리
  async getCuratedNews() {
    const { data, error } = await supabase
      .from('curated_news')
      .select('*')
      .order('priority', { ascending: true })

    if (error) throw error
    return data
  }

  async addCuratedNews(news: Omit<CuratedNews, 'id' | 'created_at'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('curated_news')
      .insert({
        ...news,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateCuratedNews(id: string, updates: Partial<CuratedNews>) {
    const { data, error } = await supabase
      .from('curated_news')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteCuratedNews(id: string) {
    const { error } = await supabase
      .from('curated_news')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // 배너 설정 관리
  async getBannerSettings() {
    const { data, error } = await supabase
      .from('banner_settings')
      .select('*')

    if (error) throw error
    
    // 설정을 key-value 맵으로 변환
    const settings: Record<string, any> = {}
    data?.forEach(item => {
      settings[item.key] = item.value
    })
    return settings
  }

  async updateBannerSetting(key: string, value: any) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('banner_settings')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 관리자 추가 (슈퍼 관리자만)
  async addAdmin(userId: string, role: AdminUser['role'] = 'admin') {
    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        user_id: userId,
        role,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 관리자 권한 수정
  async updateAdminRole(adminId: string, role: AdminUser['role']) {
    const { data, error } = await supabase
      .from('admin_users')
      .update({
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 관리자 비활성화
  async deactivateAdmin(adminId: string) {
    const { data, error } = await supabase
      .from('admin_users')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

export const adminService = new AdminService()