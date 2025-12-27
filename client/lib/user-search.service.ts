import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

export interface UserSearchResult {
  user_id: string;
  name: string;
  email: string;
  profile_picture: string | null;
  location: string | null;
  bio: string | null;
  skills_i_have: string[] | null;
  experience_level: string | null;
}

export interface UserSearchServiceResponse {
  success: boolean;
  data?: UserSearchResult[];
  error?: string;
  total?: number;
}

export class UserSearchService {
  private static readonly DEBOUNCE_DELAY = 300;
  private static readonly MIN_QUERY_LENGTH = 2;
  private static readonly MAX_QUERY_LENGTH = 100;

  /**
   * Search for users with debouncing and error handling
   */
  static async searchUsers(
    query: string,
    session: Session | null
  ): Promise<UserSearchServiceResponse> {
    try {
      // Validate input
      if (!query || typeof query !== 'string') {
        return { success: false, error: 'Search query is required' };
      }

      const trimmedQuery = query.trim();
      if (trimmedQuery.length < this.MIN_QUERY_LENGTH) {
        return { success: false, error: 'Search query must be at least 2 characters long' };
      }

      if (trimmedQuery.length > this.MAX_QUERY_LENGTH) {
        return { success: false, error: 'Search query is too long' };
      }

      if (!session?.user) {
        return { success: false, error: 'Authentication required' };
      }

      // Run search directly against Supabase (case-insensitive)
      const currentUserId = session.user.id;
      const sanitized = trimmedQuery.replace(/[%_]/g, '\\$&');

      const { data, error } = await supabase
        .from('profiles')
        .select(
          'user_id, name, email, profile_picture, location, bio, skills_i_have, experience_level'
        )
        .or(`name.ilike.%${sanitized}%,email.ilike.%${sanitized}%,bio.ilike.%${sanitized}%`)
        .neq('user_id', currentUserId)
        .order('name', { ascending: true })
        .limit(20);

      if (error) {
        return { success: false, error: 'Failed to search users' };
      }

      return {
        success: true,
        data: (data || []) as unknown as UserSearchResult[],
        total: data?.length || 0,
      };
    } catch (error) {
      console.error('User search service error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }

  /**
   * Debounced search function
   */
  static debounceSearch(
    query: string,
    session: Session | null,
    callback: (result: UserSearchServiceResponse) => void,
    delay: number = this.DEBOUNCE_DELAY
  ): () => void {
    const timeoutId = setTimeout(async () => {
      const result = await this.searchUsers(query, session);
      callback(result);
    }, delay);

    return () => clearTimeout(timeoutId);
  }

  /**
   * Validate search query
   */
  static validateQuery(query: string): { isValid: boolean; error?: string } {
    if (!query || typeof query !== 'string') {
      return { isValid: false, error: 'Search query is required' };
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length < this.MIN_QUERY_LENGTH) {
      return { isValid: false, error: 'Search query must be at least 2 characters long' };
    }

    if (trimmedQuery.length > this.MAX_QUERY_LENGTH) {
      return { isValid: false, error: 'Search query is too long' };
    }

    return { isValid: true };
  }
}
