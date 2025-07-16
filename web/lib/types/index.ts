// Main types export
export * from './community'

// Database types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Supabase database schema types
export interface Database {
  public: {
    Tables: {
      community_boards: {
        Row: {
          id: string
          type: string
          name: string
          team_id: number | null
          description: string | null
          icon_url: string | null
          post_count: number
          member_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: string
          name: string
          team_id?: number | null
          description?: string | null
          icon_url?: string | null
          post_count?: number
          member_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: string
          name?: string
          team_id?: number | null
          description?: string | null
          icon_url?: string | null
          post_count?: number
          member_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      community_posts: {
        Row: {
          id: string
          board_id: string
          author_id: string
          title: string
          content: string
          category: string | null
          tags: string[] | null
          image_urls: string[] | null
          view_count: number
          like_count: number
          comment_count: number
          is_pinned: boolean
          is_notice: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          board_id: string
          author_id: string
          title: string
          content: string
          category?: string | null
          tags?: string[] | null
          image_urls?: string[] | null
          view_count?: number
          like_count?: number
          comment_count?: number
          is_pinned?: boolean
          is_notice?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          board_id?: string
          author_id?: string
          title?: string
          content?: string
          category?: string | null
          tags?: string[] | null
          image_urls?: string[] | null
          view_count?: number
          like_count?: number
          comment_count?: number
          is_pinned?: boolean
          is_notice?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string | null
          nickname: string
          avatar_url: string | null
          favorite_team_id: number | null
          favorite_team_name: string | null
          language: string | null
          post_count: number | null
          comment_count: number | null
          created_at: string | null
          updated_at: string | null
          joined_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          nickname: string
          avatar_url?: string | null
          favorite_team_id?: number | null
          favorite_team_name?: string | null
          language?: string | null
          post_count?: number | null
          comment_count?: number | null
          created_at?: string | null
          updated_at?: string | null
          joined_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          nickname?: string
          avatar_url?: string | null
          favorite_team_id?: number | null
          favorite_team_name?: string | null
          language?: string | null
          post_count?: number | null
          comment_count?: number | null
          created_at?: string | null
          updated_at?: string | null
          joined_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}