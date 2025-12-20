import { createClient } from '@supabase/supabase-js'

// Environment variables - MUST be set in .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables are set
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. Please create a .env file with:\n' +
    'VITE_SUPABASE_URL=your_supabase_url\n' +
    'VITE_SUPABASE_ANON_KEY=your_anon_key'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types
export type Database = {
  public: {
    Tables: {
      trades: {
        Row: {
          id: string
          title: string
          description: string | null
          skill_offered: string
          skill_wanted: string
          user_id: string
          user_display_name: string
          status: 'Open' | 'Closed' | 'Assigned' | 'Completed'
          comments: any[] | null
          location: string | null
          deadline: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          skill_offered: string
          skill_wanted: string
          user_id: string
          user_display_name: string
          status?: 'Open' | 'Closed' | 'Assigned' | 'Completed'
          comments?: any[] | null
          location?: string | null
          deadline?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          skill_offered?: string
          skill_wanted?: string
          user_id?: string
          user_display_name?: string
          status?: 'Open' | 'Closed' | 'Assigned' | 'Completed'
          comments?: any[] | null
          location?: string | null
          deadline?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          username: string | null
          email: string
          bio: string | null
          location: string | null
          profile_picture: string | null
          skills_i_have: string[] | null
          skills_i_want: string[] | null
          top_skills: string[] | null
          experience_level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
          availability: 'full_time' | 'part_time' | 'project_based' | null
          preferred_work: 'online' | 'offline' | 'both' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          username?: string | null
          email: string
          bio?: string | null
          location?: string | null
          profile_picture?: string | null
          skills_i_have?: string[] | null
          skills_i_want?: string[] | null
          top_skills?: string[] | null
          experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
          availability?: 'full_time' | 'part_time' | 'project_based' | null
          preferred_work?: 'online' | 'offline' | 'both' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          username?: string | null
          email?: string
          bio?: string | null
          location?: string | null
          profile_picture?: string | null
          skills_i_have?: string[] | null
          skills_i_want?: string[] | null
          top_skills?: string[] | null
          experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
          availability?: 'full_time' | 'part_time' | 'project_based' | null
          preferred_work?: 'online' | 'offline' | 'both' | null
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          post_type: 'skill_offer' | 'skill_request' | 'project' | 'general'
          skills_offered: string[] | null
          skills_needed: string[] | null
          experience_level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
          availability: 'full_time' | 'part_time' | 'project_based' | null
          deadline: string | null
          media_urls: string[] | null
          likes_count: number
          comments_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          post_type: 'skill_offer' | 'skill_request' | 'project' | 'general'
          skills_offered?: string[] | null
          skills_needed?: string[] | null
          experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
          availability?: 'full_time' | 'part_time' | 'project_based' | null
          deadline?: string | null
          media_urls?: string[] | null
          likes_count?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          post_type?: 'skill_offer' | 'skill_request' | 'project' | 'general'
          skills_offered?: string[] | null
          skills_needed?: string[] | null
          experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
          availability?: 'full_time' | 'part_time' | 'project_based' | null
          deadline?: string | null
          media_urls?: string[] | null
          likes_count?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      post_likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      post_comments: {
        Row: {
          id: string
          user_id: string
          post_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          content: string
          created_at?: string
          updated_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          created_at?: string
        }
      }
    }
  }
}

