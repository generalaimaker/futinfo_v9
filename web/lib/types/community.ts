// Community types matching iOS CommunityModels.swift

export type BoardType = 'all' | 'team' | 'matchday'

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
  visibility?: PostVisibility
  crossPosted?: boolean
  originBoard?: string  // 원본 게시판 (크로스 포스팅시)
  reactions?: PostReactions  // 감정 반응
}

// 게시글 감정 반응
export interface PostReactions {
  like?: number      // 좋아요
  love?: number      // 사랑해요
  haha?: number      // 웃겨요
  wow?: number       // 놀라워요
  sad?: number       // 슬퍼요
  angry?: number     // 화나요
  // 팀 전용 반응
  teamLove?: number  // 팀 사랑 (팀 게시판만)
  goal?: number      // 골! (매치데이)
  trophy?: number    // 우승 (팀 게시판)
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

// 팬 인증 레벨
export enum FanLevel {
  NONE = 0,        // 미인증
  BASIC = 1,       // 간단 인증 (팀 선택만)
  VERIFIED = 2,    // 정식 팬 인증 (퀴즈, 활동)
  VIP = 3         // VIP 팬 (시즌티켓, 장기 활동)
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
  fanLevel?: FanLevel
  fanPoints?: {
    team: number      // 팀 포인트
    global: number    // 글로벌 포인트
  }
  rivalTeamId?: number  // 라이벌 팀 설정
  language?: string
  createdAt?: Date
  updatedAt?: Date
  joinedAt?: Date
  postCount?: number
  commentCount?: number
  badges?: FanBadge[]  // 획득한 배지들
}

export interface TeamBadgeInfo {
  teamId: number
  teamName: string
  logoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  emoji?: string  // 팀 전용 이모지
}

// 팬 배지 타입
export interface FanBadge {
  id: string
  type: 'season_ticket' | 'vip' | 'long_time' | 'contributor' | 'event'
  name: string
  icon: string
  earnedAt: Date
}

export interface CreatePostData {
  boardId: string
  title: string
  content: string
  category?: string
  tags?: string[]
  imageUrls?: string[]
  userId?: string  // 직접 userId 전달 가능
  visibility?: PostVisibility  // 공개 범위
  crossPost?: boolean          // 크로스 포스팅 여부
}

// 게시글 공개 범위
export enum PostVisibility {
  PUBLIC = 'public',           // 모두 볼 수 있음
  TEAM_ONLY = 'team_only',     // 팀 팬만
  VERIFIED_ONLY = 'verified_only' // 인증된 팬만
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
  userId?: string  // 직접 userId 전달 가능
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
  'media',     // 미디어
  'matchday',  // 매치데이
  'rivalry',   // 라이벌전
  'fanzone'    // 팬존
] as const

// 매치데이 모드
export interface MatchdayMode {
  active: boolean
  fixtureId: number
  homeTeamId: number
  awayTeamId: number
  startTime: Date
  chatRoomId?: string
}

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