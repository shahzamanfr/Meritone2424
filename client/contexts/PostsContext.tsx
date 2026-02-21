import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  post_type: 'skill_offer' | 'skill_request' | 'project' | 'general';
  skills_offered: string[] | null;
  skills_needed: string[] | null;
  experience_level: string | null;
  availability: string | null;
  deadline: string | null;
  media_urls: string[] | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    profile_picture: string;
    email: string;
  };
  isLiked?: boolean;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    profile_picture: string;
    email: string;
  };
}

interface PostsContextType {
  posts: Post[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMorePosts: () => Promise<void>;
  createPost: (postData: any) => Promise<{ error: string | null; success: boolean }>;
  updatePost: (postId: string, updates: any) => Promise<{ error: string | null; success: boolean }>;
  deletePost: (postId: string) => Promise<{ error: string | null; success: boolean }>;
  likePost: (postId: string) => Promise<{ error: string | null; success: boolean }>;
  unlikePost: (postId: string) => Promise<{ error: string | null; success: boolean }>;
  addComment: (postId: string, content: string) => Promise<{ error: string | null; success: boolean }>;
  deleteComment: (commentId: string) => Promise<{ error: string | null; success: boolean }>;
  loadComments: (postId: string) => Promise<Comment[]>;
  refreshPosts: () => void;
  retryLoad: () => void;
  getUserPosts: (userId: string) => Post[];
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const usePosts = () => {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
};

const POSTS_PER_PAGE = 15;

export const PostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const { user, loading: authLoading } = useAuth();
  const initialLoadDone = useRef(false);
  const loadPostsRef = useRef<(reset?: boolean) => Promise<void>>();

  const loadPosts = useCallback(async (reset = false) => {
    // Prevent multiple simultaneous loads
    if (loading && !reset) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const currentOffset = reset ? 0 : offset;

      if (import.meta.env.DEV) {
        console.log('🚀 Fetching posts via RPC...', { currentOffset, POSTS_PER_PAGE });
      }

      const { data: rpcPosts, error: rpcError } = await supabase.rpc('get_posts_with_details', {
        limit_count: POSTS_PER_PAGE,
        offset_count: currentOffset
      });

      if (rpcError) {
        console.error('❌ RPC Error:', rpcError);
        setError(rpcError.message || 'Failed to load posts');
        return;
      }

      if (!rpcPosts || rpcPosts.length === 0) {
        setHasMore(false);
        if (reset) setPosts([]);
        return;
      }

      // Check if we have more posts
      setHasMore(rpcPosts.length === POSTS_PER_PAGE);

      // Transform RPC results to Post interface
      const transformedPosts: Post[] = rpcPosts.map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        title: p.title,
        content: p.content,
        post_type: p.post_type,
        skills_offered: p.skills_offered,
        skills_needed: p.skills_needed,
        experience_level: p.experience_level,
        availability: p.availability,
        deadline: p.deadline,
        media_urls: p.media_urls,
        likes_count: Number(p.total_likes || p.likes_count || 0),
        comments_count: Number(p.total_comments || p.comments_count || 0),
        created_at: p.created_at,
        updated_at: p.updated_at,
        user: {
          name: p.user_name || 'Unknown',
          profile_picture: p.user_profile_picture || '',
          email: p.user_email || '' // RPC doesn't currently return email, but interface needs it
        },
        isLiked: user?.id ? (p.liked_by_user_ids || []).includes(user.id) : false
      }));

      if (reset) {
        setPosts(transformedPosts);
        setOffset(POSTS_PER_PAGE);
      } else {
        setPosts(prev => [...prev, ...transformedPosts]);
        setOffset(currentOffset + POSTS_PER_PAGE);
      }
    } catch (error) {
      console.error('Error in loadPosts:', error);
      setError('An unexpected error occurred while loading posts');
    } finally {
      setLoading(false);
    }
  }, [loading, offset, user]);


  const loadMorePosts = useCallback(async () => {
    if (!loading && hasMore && loadPostsRef.current) {
      await loadPostsRef.current(false);
    }
  }, [loading, hasMore]);

  const createPost = async (postData: any) => {
    try {
      if (!user?.id) {
        return { error: 'You must be signed in to create a post', success: false };
      }

      const { data, error } = await supabase
        .from('posts')
        .insert([{ ...postData, user_id: user.id }])
        .select()
        .single();

      if (error) {
        if (import.meta.env.DEV) {
          console.error('Error creating post:', error);
        }
        return { error: error.message, success: false };
      }


      await refreshPosts(); // Refresh to show new post at top
      return { error: null, success: true };
    } catch (error) {
      console.error('Error creating post:', error);
      return { error: 'Failed to create post', success: false };
    }
  };

  const updatePost = async (postId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', postId);

      if (error) {
        return { error: error.message, success: false };
      }

      await refreshPosts();
      return { error: null, success: true };
    } catch (error) {
      return { error: 'Failed to update post', success: false };
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) {
        return { error: error.message, success: false };
      }

      // Remove from local state immediately
      setPosts(prev => prev.filter(p => p.id !== postId));
      return { error: null, success: true };
    } catch (error) {
      return { error: 'Failed to delete post', success: false };
    }
  };

  const likePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('post_likes')
        .insert([{ post_id: postId, user_id: user?.id }]);

      if (error) {
        // If it's a duplicate key error (409), treat it as already liked
        if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
          console.log('Post already liked, syncing state from database');
          // Fetch the actual post data to get correct count
          const { data: postData } = await supabase
            .from('posts')
            .select('likes_count')
            .eq('id', postId)
            .single();

          setPosts(prevPosts =>
            prevPosts.map(post =>
              post.id === postId
                ? { ...post, isLiked: true, likes_count: postData?.likes_count ?? post.likes_count }
                : post
            )
          );
          return { error: null, success: true };
        }
        console.error('Error liking post:', error);
        return { error: error.message, success: false };
      }

      // Fetch the updated post to get the correct count from the database
      // The trigger should have incremented it
      const { data: postData } = await supabase
        .from('posts')
        .select('likes_count')
        .eq('id', postId)
        .single();

      // Update local state with actual database count
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, isLiked: true, likes_count: postData?.likes_count ?? post.likes_count + 1 }
            : post
        )
      );

      return { error: null, success: true };
    } catch (error) {
      console.error('Failed to like post:', error);
      return { error: 'Failed to like post', success: false };
    }
  };

  const unlikePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error unliking post:', error);
        return { error: error.message, success: false };
      }

      // Fetch the updated post to get the correct count from the database
      const { data: postData } = await supabase
        .from('posts')
        .select('likes_count')
        .eq('id', postId)
        .single();

      // Update local state with actual database count
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, isLiked: false, likes_count: postData?.likes_count ?? Math.max(0, post.likes_count - 1) }
            : post
        )
      );

      return { error: null, success: true };
    } catch (error) {
      console.error('Failed to unlike post:', error);
      return { error: 'Failed to unlike post', success: false };
    }
  };

  const addComment = async (postId: string, content: string) => {
    try {
      if (!user?.id) {
        return { error: 'You must be signed in to comment', success: false };
      }

      const { data, error } = await supabase
        .from('post_comments')
        .insert([{
          post_id: postId,
          user_id: user.id,
          content: content
        }])
        .select()
        .single();

      if (error) {
        return { error: error.message, success: false };
      }

      // Update local state immediately for better UX
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, comments_count: post.comments_count + 1 }
            : post
        )
      );

      return { error: null, success: true };
    } catch (error) {
      return { error: 'Failed to add comment', success: false };
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        return { error: error.message, success: false };
      }

      // Refresh posts to update comment counts
      await refreshPosts();
      return { error: null, success: true };
    } catch (error) {
      return { error: 'Failed to delete comment', success: false };
    }
  };

  const loadComments = async (postId: string): Promise<Comment[]> => {
    try {
      const { data: rpcComments, error } = await supabase.rpc('get_post_comments_with_users', {
        target_post_id: postId
      });

      if (error) {
        console.error('Error loading comments via RPC:', error);
        return [];
      }

      if (!rpcComments || rpcComments.length === 0) return [];

      // Transform RPC results to Comment interface
      return rpcComments.map((c: any) => ({
        id: c.id,
        post_id: c.post_id,
        user_id: c.user_id,
        content: c.content,
        created_at: c.created_at,
        updated_at: c.updated_at,
        user: {
          name: c.user_name || 'Unknown',
          profile_picture: c.user_profile_picture || '',
          email: '' // Not returned by RPC
        }
      }));
    } catch (error) {
      console.error('Error in loadComments:', error);
      return [];
    }
  };

  const getUserPosts = (userId: string): Post[] => {
    return posts.filter(post => post.user_id === userId);
  };

  const refreshPosts = () => {
    setOffset(0);
    setHasMore(true);
    loadPosts(true);
  };

  // Store loadPosts in ref for use in loadMorePosts
  useEffect(() => {
    loadPostsRef.current = loadPosts;
  }, [loadPosts]);

  // Supabase Realtime subscription for posts
  useEffect(() => {
    const channel = supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        async (payload) => {
          if (import.meta.env.DEV) {
            console.log('📬 Realtime post update received:', payload);
          }

          if (payload.eventType === 'INSERT') {
            const newPost = payload.new as Post;

            // Check if we already have this post (to avoid duplications from manual refreshes)
            setPosts(prev => {
              if (prev.some(p => p.id === newPost.id)) return prev;

              // Fetch profile for the new post
              const fetchProfile = async () => {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('user_id, name, profile_picture, email')
                  .eq('user_id', newPost.user_id)
                  .single();

                setPosts(currentPosts =>
                  currentPosts.map(p =>
                    p.id === newPost.id
                      ? { ...p, user: profile || { name: 'Unknown', profile_picture: '', email: '' } }
                      : p
                  )
                );
              };

              fetchProfile();

              // Add post to state immediately, with placeholder user
              return [{
                ...newPost,
                user: { name: 'Loading...', profile_picture: '', email: '' },
                isLiked: false,
                likes_count: newPost.likes_count || 0,
                comments_count: newPost.comments_count || 0
              }, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedPost = payload.new as Post;
            setPosts(prev => prev.map(p =>
              p.id === updatedPost.id
                ? { ...p, ...updatedPost }
                : p
            ));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setPosts(prev => prev.filter(p => p.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Initial load - wait for auth to initialize before loading posts
  useEffect(() => {
    if (!initialLoadDone.current && !authLoading) {
      initialLoadDone.current = true;
      console.log('🚀 Auth initialized, loading posts...', { userId: user?.id });
      loadPosts(true);
    }
  }, [authLoading, loadPosts, user?.id]);

  const retryLoad = useCallback(() => {
    setError(null);
    initialLoadDone.current = false;
    loadPosts(true);
  }, [loadPosts]);

  const resetState = useCallback(() => {
    setPosts([]);
    setOffset(0);
    setHasMore(true);
    setError(null);
    initialLoadDone.current = false;
  }, []);

  // Reset state when user logs out
  useEffect(() => {
    if (!authLoading && !user) {
      resetState();
    }
  }, [user, authLoading, resetState]);

  const value: PostsContextType = useMemo(() => ({
    posts,
    loading,
    error,
    hasMore,
    loadMorePosts,
    createPost,
    updatePost,
    deletePost,
    likePost,
    unlikePost,
    addComment,
    deleteComment,
    loadComments,
    refreshPosts,
    retryLoad,
    getUserPosts
  }), [posts, loading, error, hasMore, loadMorePosts]);

  return (
    <PostsContext.Provider value={value}>
      {children}
    </PostsContext.Provider>
  );
};
