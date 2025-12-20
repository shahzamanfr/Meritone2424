import { supabase } from './supabase';

export interface FollowRelationship {
  isFollowing: boolean;
  followerCount: number;
  followingCount: number;
}

export interface FollowUser {
  user_id: string;
  name: string;
  email: string;
  profile_picture: string | null;
  bio: string | null;
  location: string | null;
  created_at: string;
}

export interface FollowResult {
  success: boolean;
  error?: string;
  followerCount?: number;
  followingCount?: number;
  currentUserFollowingCount?: number;
}

export class FollowService {
  /**
   * Follow a user using RPC for atomic operation (with fallback)
   */
  static async follow(userId: string): Promise<FollowResult> {
    try {
      // Try RPC first
      const { data, error } = await supabase.rpc('follow_user', {
        target_user_id: userId
      });

      if (error) {
        console.warn('RPC not available, falling back to direct table operations:', error.message);
        return await this.followFallback(userId);
      }

      return data as FollowResult;
    } catch (error) {
      console.warn('RPC failed, falling back to direct table operations:', error);
      return await this.followFallback(userId);
    }
  }

  /**
   * Fallback follow method using direct table operations
   */
  private static async followFallback(userId: string): Promise<FollowResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      if (user.id === userId) {
        return { success: false, error: 'Cannot follow yourself' };
      }

      // Check if already following
      const { data: existing } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();

      if (existing) {
        return { success: false, error: 'Already following this user' };
      }

      // Insert follow relationship
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: userId
        });

      if (error) {
        return { success: false, error: error.message };
      }

      // Get updated counts
      const { count: followerCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      const { count: currentUserFollowingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);

      return {
        success: true,
        followerCount: followerCount || 0,
        followingCount: followingCount || 0,
        currentUserFollowingCount: currentUserFollowingCount || 0
      };
    } catch (error) {
      console.error('Follow fallback error:', error);
      return { success: false, error: 'Failed to follow user' };
    }
  }

  /**
   * Unfollow a user using RPC for atomic operation (with fallback)
   */
  static async unfollow(userId: string): Promise<FollowResult> {
    try {
      // Try RPC first
      const { data, error } = await supabase.rpc('unfollow_user', {
        target_user_id: userId
      });

      if (error) {
        console.warn('RPC not available, falling back to direct table operations:', error.message);
        return await this.unfollowFallback(userId);
      }

      return data as FollowResult;
    } catch (error) {
      console.warn('RPC failed, falling back to direct table operations:', error);
      return await this.unfollowFallback(userId);
    }
  }

  /**
   * Fallback unfollow method using direct table operations
   */
  private static async unfollowFallback(userId: string): Promise<FollowResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Check if following
      const { data: existing } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();

      if (!existing) {
        return { success: false, error: 'Not following this user' };
      }

      // Delete follow relationship
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Get updated counts
      const { count: followerCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      const { count: currentUserFollowingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);

      return {
        success: true,
        followerCount: followerCount || 0,
        followingCount: followingCount || 0,
        currentUserFollowingCount: currentUserFollowingCount || 0
      };
    } catch (error) {
      console.error('Unfollow fallback error:', error);
      return { success: false, error: 'Failed to unfollow user' };
    }
  }

  /**
   * Get relationship between current user and target user using RPC (with fallback)
   */
  static async getRelationship(targetUserId: string): Promise<FollowRelationship> {
    try {
      // Try RPC first
      const { data, error } = await supabase.rpc('get_relationship_data', {
        target_user_id: targetUserId
      });

      if (error) {
        console.warn('RPC not available, falling back to direct queries:', error.message);
        return await this.getRelationshipFallback(targetUserId);
      }

      return {
        isFollowing: data.is_following || false,
        followerCount: data.follower_count || 0,
        followingCount: data.following_count || 0
      };
    } catch (error) {
      console.warn('RPC failed, falling back to direct queries:', error);
      return await this.getRelationshipFallback(targetUserId);
    }
  }

  /**
   * Fallback getRelationship method using direct queries
   */
  private static async getRelationshipFallback(targetUserId: string): Promise<FollowRelationship> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Check if following
      let isFollowing = false;
      if (user) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)
          .single();
        isFollowing = !!followData;
      }

      // Get follower count for target user
      const { count: followerCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId);

      // Get following count for target user
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', targetUserId);

      return {
        isFollowing,
        followerCount: followerCount || 0,
        followingCount: followingCount || 0
      };
    } catch (error) {
      console.error('Get relationship fallback error:', error);
      return { isFollowing: false, followerCount: 0, followingCount: 0 };
    }
  }

  /**
   * Get followers of a user
   */
  static async getFollowers(userId: string, limit: number = 20, offset: number = 0): Promise<{
    success: boolean;
    data?: FollowUser[];
    error?: string;
    hasMore: boolean;
  }> {
    try {
      // First get the follower relationships
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('follower_id, created_at')
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (followsError) {
        console.error('Error fetching follows:', followsError);
        return { success: false, error: followsError.message, hasMore: false };
      }

      if (!followsData || followsData.length === 0) {
        return { success: true, data: [], hasMore: false };
      }

      // Get the user IDs of followers
      const followerIds = followsData.map(follow => follow.follower_id);

      // Fetch the profile data for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, email, profile_picture, bio, location, created_at')
        .in('user_id', followerIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return { success: false, error: profilesError.message, hasMore: false };
      }

      // Map the data together
      const followers = followsData.map(follow => {
        const profile = profilesData?.find(p => p.user_id === follow.follower_id);
        return {
          user_id: follow.follower_id,
          name: profile?.name || 'Unknown User',
          email: profile?.email || '',
          profile_picture: profile?.profile_picture || null,
          bio: profile?.bio || null,
          location: profile?.location || null,
          created_at: follow.created_at
        };
      });

      return {
        success: true,
        data: followers,
        hasMore: followsData.length === limit
      };
    } catch (error) {
      console.error('Get followers error:', error);
      return { success: false, error: 'Failed to fetch followers', hasMore: false };
    }
  }

  /**
   * Get users that a user is following
   */
  static async getFollowing(userId: string, limit: number = 20, offset: number = 0): Promise<{
    success: boolean;
    data?: FollowUser[];
    error?: string;
    hasMore: boolean;
  }> {
    try {
      // First get the following relationships
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('following_id, created_at')
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (followsError) {
        console.error('Error fetching follows:', followsError);
        return { success: false, error: followsError.message, hasMore: false };
      }

      if (!followsData || followsData.length === 0) {
        return { success: true, data: [], hasMore: false };
      }

      // Get the user IDs being followed
      const followingIds = followsData.map(follow => follow.following_id);

      // Fetch the profile data for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, email, profile_picture, bio, location, created_at')
        .in('user_id', followingIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return { success: false, error: profilesError.message, hasMore: false };
      }

      // Map the data together
      const following = followsData.map(follow => {
        const profile = profilesData?.find(p => p.user_id === follow.following_id);
        return {
          user_id: follow.following_id,
          name: profile?.name || 'Unknown User',
          email: profile?.email || '',
          profile_picture: profile?.profile_picture || null,
          bio: profile?.bio || null,
          location: profile?.location || null,
          created_at: follow.created_at
        };
      });

      return {
        success: true,
        data: following,
        hasMore: followsData.length === limit
      };
    } catch (error) {
      console.error('Get following error:', error);
      return { success: false, error: 'Failed to fetch following', hasMore: false };
    }
  }

  /**
   * Toggle follow/unfollow (for optimistic UI)
   */
  static async toggleFollow(userId: string, currentState: boolean): Promise<FollowResult> {
    if (currentState) {
      return await this.unfollow(userId);
    } else {
      return await this.follow(userId);
    }
  }

  /**
   * Subscribe to real-time follow updates for a user
   */
  static subscribeToFollowUpdates(
    userId: string, 
    onUpdate: (relationship: FollowRelationship) => void
  ) {
    const channel = supabase
      .channel(`follows-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follows',
          filter: `following_id=eq.${userId}`
        },
        async () => {
          // Refetch relationship data when follows change
          const relationship = await this.getRelationship(userId);
          onUpdate(relationship);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follows',
          filter: `follower_id=eq.${userId}`
        },
        async () => {
          // Refetch relationship data when following changes
          const relationship = await this.getRelationship(userId);
          onUpdate(relationship);
        }
      )
      .subscribe();

    return channel;
  }

  /**
   * Subscribe to real-time updates for current user's own profile
   */
  static subscribeToOwnProfileUpdates(
    currentUserId: string,
    onUpdate: (relationship: FollowRelationship) => void
  ) {
    const channel = supabase
      .channel(`own-profile-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follows',
          filter: `follower_id=eq.${currentUserId}`
        },
        async () => {
          // Refetch current user's relationship data
          const relationship = await this.getRelationship(currentUserId);
          onUpdate(relationship);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follows',
          filter: `following_id=eq.${currentUserId}`
        },
        async () => {
          // Refetch current user's relationship data
          const relationship = await this.getRelationship(currentUserId);
          onUpdate(relationship);
        }
      )
      .subscribe();

    return channel;
  }

  /**
   * Global follow update listener for cross-profile updates
   */
  static subscribeToGlobalFollowUpdates(
    currentUserId: string,
    onCurrentUserUpdate: (relationship: FollowRelationship) => void,
    onTargetUserUpdate?: (userId: string, relationship: FollowRelationship) => void
  ) {
    const channel = supabase
      .channel('global-follow-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follows'
        },
        async (payload) => {
          const newData = payload.new as any;
          const oldData = payload.old as any;
          
          // If current user followed/unfollowed someone
          if (newData?.follower_id === currentUserId || oldData?.follower_id === currentUserId) {
            const relationship = await this.getRelationship(currentUserId);
            onCurrentUserUpdate(relationship);
          }
          
          // If someone followed/unfollowed current user
          if (newData?.following_id === currentUserId || oldData?.following_id === currentUserId) {
            const relationship = await this.getRelationship(currentUserId);
            onCurrentUserUpdate(relationship);
          }
          
          // If we have a target user update callback, call it for any user
          if (onTargetUserUpdate && (newData?.following_id || oldData?.following_id)) {
            const targetUserId = newData?.following_id || oldData?.following_id;
            if (targetUserId) {
              const relationship = await this.getRelationship(targetUserId);
              onTargetUserUpdate(targetUserId, relationship);
            }
          }
        }
      )
      .subscribe();

    return channel;
  }

  /**
   * Subscribe to real-time follow updates for current user's own profile
   */
  static subscribeToOwnFollowUpdates(
    onUpdate: (relationship: FollowRelationship) => void
  ) {
    return supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return null;
      
      return this.subscribeToFollowUpdates(user.id, onUpdate);
    });
  }

  /**
   * Unsubscribe from follow updates
   */
  static unsubscribeFromFollowUpdates(channel: any) {
    if (channel) {
      supabase.removeChannel(channel);
    }
  }
}
