// Community types matching iOS CommunityModels.swift

export type BoardType = 'all' | 'team'

export interface CommunityBoard {
  id: string
  type: BoardType
  name: string
  teamId?: number
  leagueId?: number
  description?: string
  iconUrl?: string
  postCount: number
  memberCount: number
}

export interface CommunityPost {
  id: string
  boardId: string
  authorId: string
  author?: UserProfile
  title: string
  content: string
  category?: string
  tags?: string[]
  imageUrls?: string[]
  createdAt: Date
  updatedAt?: Date
  viewCount: number
  likeCount: number
  commentCount: number
  isPinned: boolean
  isNotice: boolean
  isLiked?: boolean
  isBookmarked?: boolean
}

export interface CommunityComment {
  id: string
  postId: string
  authorId: string
  author: UserProfile
  content: string
  createdAt: Date
  updatedAt: Date
  likeCount: number
  parentCommentId?: string // For replies
  isLiked?: boolean
}

export interface UserProfile {
  id: string
  userId?: string // auth user ID
  email?: string
  nickname: string
  avatarUrl?: string
  favoriteTeamId?: number
  favoriteTeamName?: string
  fanTeam?: TeamBadgeInfo
  language?: string
  createdAt?: Date
  updatedAt?: Date
  joinedAt?: Date
  postCount?: number
  commentCount?: number
}

export interface TeamBadgeInfo {
  teamId: number
  teamName: string
  logoUrl?: string
  primaryColor?: string
  secondaryColor?: string
}

export interface CreatePostData {
  boardId: string
  title: string
  content: string
  category?: string
  tags?: string[]
  imageUrls?: string[]
}

export interface UpdatePostData {
  title?: string
  content?: string
  category?: string
  tags?: string[]
  imageUrls?: string[]
}

export interface CreateCommentData {
  postId: string
  content: string
  parentCommentId?: string
}

// Realtime event types
export type RealtimeEvent = 
  | 'INSERT' 
  | 'UPDATE' 
  | 'DELETE'

export interface RealtimePayload<T = any> {
  eventType: RealtimeEvent
  new?: T
  old?: T
  schema: string
  table: string
}

// Post categories
export const POST_CATEGORIES = [
  'match',     // 경기
  'transfer',  // 이적
  'news',      // 뉴스
  'talk',      // 잡담
  'media'      // 미디어
] as const

export type PostCategory = typeof POST_CATEGORIES[number]

// API response types
export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  totalPages: number
  hasMore: boolean
}

export interface APIError {
  message: string
  code?: string
  details?: any
}