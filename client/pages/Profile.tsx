import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { MessageButton } from "@/components/messaging/MessageButton";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { usePosts } from "@/contexts/PostsContext";
import { supabase } from "@/lib/supabase";
import { ImageCarouselComponent } from "@/components/ImageCarousel";
import { BackButton } from "@/components/BackButton";
import FollowButton from "@/components/FollowButton";
import FollowersModal from "@/components/FollowersModal";
import FollowingModal from "@/components/FollowingModal";
import { FollowService, FollowRelationship } from "@/lib/follow.service";
import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Users,
  Star,
  Calendar,
  Clock,
  FileIcon,
  ArrowLeft,
  Trash2,
  MoreVertical,
  AlertCircle,
  Briefcase,
  Search,
  Globe,
  Settings,
  Lock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get user ID from URL params
  const { isAuthenticated, isEmailVerified, user: authUser, loading: authLoading } = useAuth();
  const { profile, loading, hasProfile, deleteProfile } = useProfile();
  const { getUserPosts, deletePost, refreshPosts } = usePosts();
  const [activeTab, setActiveTab] = useState<"posts" | "about" | "skills" | "followers" | "following">("posts");
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [viewingUserPosts, setViewingUserPosts] = useState<any[]>([]);
  const [showDeleteProfileDialog, setShowDeleteProfileDialog] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const [loadingViewingUser, setLoadingViewingUser] = useState(false);
  const [followRelationship, setFollowRelationship] = useState<FollowRelationship>({
    isFollowing: false,
    followerCount: 0,
    followingCount: 0
  });
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [loadingMoreFollowers, setLoadingMoreFollowers] = useState(false);
  const [loadingMoreFollowing, setLoadingMoreFollowing] = useState(false);
  const [hasMoreFollowers, setHasMoreFollowers] = useState(true);
  const [hasMoreFollowing, setHasMoreFollowing] = useState(true);
  const [followersOffset, setFollowersOffset] = useState(0);
  const [followingOffset, setFollowingOffset] = useState(0);
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);
  const [ownProfileChannel, setOwnProfileChannel] = useState<any>(null);
  const [globalChannel, setGlobalChannel] = useState<any>(null);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [prefetchedFollowers, setPrefetchedFollowers] = useState<any[]>([]);
  const [prefetchedFollowing, setPrefetchedFollowing] = useState<any[]>([]);

  // Track if we've already redirected to prevent glitching
  const hasRedirected = useRef(false);

  // Determine if we're viewing another user's profile
  const isViewingOtherUser = id && id !== authUser?.id;

  // Get user's posts from the database - use target user's ID if viewing their profile
  const targetUserId = id || authUser?.id;
  const userPosts = targetUserId ? getUserPosts(targetUserId) : [];

  // Fetch target user's data (either from route param or authenticated user)
  useEffect(() => {
    const fetchTargetUserData = async () => {
      if (!targetUserId) return;

      setLoadingViewingUser(true);
      try {
        // Fetch user profile
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', targetUserId)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          setViewingUser(null);
          return;
        }

        setViewingUser(userProfile);

        // Fetch user's posts
        const { data: userPosts, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });

        if (!postsError && userPosts) {
          setViewingUserPosts(userPosts);
        }

        // Fetch follow relationship if viewing another user
        if (isViewingOtherUser && authUser) {
          const relationship = await FollowService.getRelationship(targetUserId);
          setFollowRelationship(relationship);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setViewingUser(null);
      } finally {
        setLoadingViewingUser(false);
      }
    };

    fetchTargetUserData();
  }, [targetUserId, isViewingOtherUser, authUser]); // Refetch when target user changes

  // CRITICAL: Early return checks - prevent rendering until all checks pass
  // This completely eliminates glitching by not rendering anything until ready


  // no-op placeholder for removed messaging modal

  // Always use the fetched user data (either from route or authenticated user)
  const currentProfile = viewingUser;
  const currentPosts = viewingUserPosts;
  const isLoading = loadingViewingUser;

  // Load followers and following for own profile
  const loadFollowers = async (reset = true) => {
    if (!targetUserId) return;

    if (reset) {
      setLoadingFollowers(true);
      setFollowersOffset(0);
    } else {
      setLoadingMoreFollowers(true);
    }

    try {
      const offset = reset ? 0 : followersOffset;
      const result = await FollowService.getFollowers(targetUserId, 20, offset);
      if (result.success && result.data) {
        if (reset) {
          setFollowers(result.data);
        } else {
          setFollowers(prev => [...prev, ...result.data]);
        }
        setHasMoreFollowers(result.hasMore);
        setFollowersOffset(offset + result.data.length);
      }
    } catch (error) {
      console.error('Error loading followers:', error);
    } finally {
      setLoadingFollowers(false);
      setLoadingMoreFollowers(false);
    }
  };

  const loadFollowing = async (reset = true) => {
    if (!targetUserId) return;

    if (reset) {
      setLoadingFollowing(true);
      setFollowingOffset(0);
    } else {
      setLoadingMoreFollowing(true);
    }

    try {
      const offset = reset ? 0 : followingOffset;
      const result = await FollowService.getFollowing(targetUserId, 20, offset);

      if (result.success && result.data) {
        if (reset) {
          setFollowing(result.data);
        } else {
          setFollowing(prev => [...prev, ...result.data]);
        }
        setHasMoreFollowing(result.hasMore);
        setFollowingOffset(offset + result.data.length);
      } else {
        console.error('Failed to load following:', result.error);
      }
    } catch (error) {
      console.error('Error loading following:', error);
    } finally {
      setLoadingFollowing(false);
      setLoadingMoreFollowing(false);
    }
  };

  // Refresh relationship data
  const refreshRelationship = async () => {
    if (!targetUserId) return;

    try {
      const relationship = await FollowService.getRelationship(targetUserId);
      setFollowRelationship(relationship);
    } catch (error) {
      console.error('Error refreshing relationship:', error);
    }
  };

  // Force refresh all profile data
  const refreshAllProfileData = async () => {
    if (!targetUserId) return;

    try {
      // Refresh relationship data
      const relationship = await FollowService.getRelationship(targetUserId);
      setFollowRelationship(relationship);

      // Refresh lists if they're currently visible
      if (activeTab === 'followers') {
        loadFollowers(true);
      } else if (activeTab === 'following') {
        loadFollowing(true);
      }
    } catch (error) {
      console.error('Error refreshing profile data:', error);
    }
  };

  // Invalidate and refresh all data when switching profiles
  const invalidateAndRefresh = async () => {
    if (!targetUserId) return;

    try {
      // Clear existing data
      setFollowRelationship({
        isFollowing: false,
        followerCount: 0,
        followingCount: 0
      });
      setFollowers([]);
      setFollowing([]);

      // Refresh relationship data
      const relationship = await FollowService.getRelationship(targetUserId);
      setFollowRelationship(relationship);

      // Refresh lists if they're currently visible
      if (activeTab === 'followers') {
        loadFollowers(true);
      } else if (activeTab === 'following') {
        loadFollowing(true);
      }
    } catch (error) {
      console.error('Error invalidating and refreshing:', error);
    }
  };

  // Invalidate cache when switching profiles
  useEffect(() => {
    if (targetUserId) {
      invalidateAndRefresh();
    }
  }, [targetUserId]);

  // Prefetch followers and following data for faster modal opening
  useEffect(() => {
    if (!targetUserId) return;

    const prefetchData = async () => {
      try {
        // Prefetch first 5 followers
        const followersResult = await FollowService.getFollowers(targetUserId, 5, 0);
        if (followersResult.success && followersResult.data) {
          setPrefetchedFollowers(followersResult.data);
        }

        // Prefetch first 5 following
        const followingResult = await FollowService.getFollowing(targetUserId, 5, 0);
        if (followingResult.success && followingResult.data) {
          setPrefetchedFollowing(followingResult.data);
        }
      } catch (error) {
        console.error('Error prefetching data:', error);
      }
    };

    prefetchData();
  }, [targetUserId]);

  // Load followers/following when switching to those tabs
  useEffect(() => {
    if (!isViewingOtherUser && targetUserId) {
      if (activeTab === 'followers') {
        loadFollowers(true); // Always reset when switching to followers tab
      } else if (activeTab === 'following') {
        loadFollowing(true); // Always reset when switching to following tab
      }
    }
  }, [activeTab, isViewingOtherUser, targetUserId]);

  const handleDeletePost = async () => {
    if (!postToDelete) return;

    // Optimistically remove the post from the UI
    setViewingUserPosts(prev => prev.filter(p => p.id !== postToDelete));

    const { success, error } = await deletePost(postToDelete);

    if (success) {
      toast({
        title: "Post deleted",
        description: "Your post has been successfully deleted.",
      });
    } else {
      // Revert if failed (optional, but good UX)
      // For now just show error
      toast({
        title: "Error",
        description: error || "Failed to delete post",
        variant: "destructive",
      });
      // Optionally re-fetch posts to restore state
    }
    setPostToDelete(null);
  };

  const handleDeleteProfile = async () => {
    const { success, error } = await deleteProfile();

    if (success) {
      toast({
        title: "Profile deleted",
        description: "Your profile has been successfully deleted.",
      });
      navigate("/");
    } else {
      toast({
        title: "Error",
        description: error || "Failed to delete profile",
        variant: "destructive",
      });
    }
    setShowDeleteProfileDialog(false);
  };

  // Set up comprehensive real-time subscriptions
  useEffect(() => {
    if (!authUser?.id || !targetUserId) return;

    // Set up subscription for the viewed user's profile
    const targetChannel = FollowService.subscribeToFollowUpdates(
      targetUserId,
      (updatedRelationship) => {
        setFollowRelationship(updatedRelationship);
        // Refresh lists if they're currently visible
        if (activeTab === 'followers') {
          loadFollowers(true);
        } else if (activeTab === 'following') {
          loadFollowing(true);
        }
      }
    );

    // Set up subscription for current user's own profile
    const ownChannel = FollowService.subscribeToOwnProfileUpdates(
      authUser.id,
      (updatedRelationship) => {
        // Only update if viewing own profile
        if (!isViewingOtherUser) {
          setFollowRelationship(updatedRelationship);
          // Refresh lists if they're visible
          if (activeTab === 'followers') {
            loadFollowers(true);
          } else if (activeTab === 'following') {
            loadFollowing(true);
          }
        }
      }
    );

    // Set up global subscription for cross-profile updates
    const globalChannel = FollowService.subscribeToGlobalFollowUpdates(
      authUser.id,
      (currentUserRelationship) => {
        // Update current user's profile if viewing own profile
        if (!isViewingOtherUser) {
          setFollowRelationship(currentUserRelationship);
          // Refresh lists if they're visible
          if (activeTab === 'followers') {
            loadFollowers(true);
          } else if (activeTab === 'following') {
            loadFollowing(true);
          }
        }
      },
      (targetUserId, targetUserRelationship) => {
        // Update target user's profile if viewing their profile
        if (isViewingOtherUser && targetUserId === id) {
          setFollowRelationship(targetUserRelationship);
        }
      }
    );

    setRealtimeChannel(targetChannel);
    setOwnProfileChannel(ownChannel);
    setGlobalChannel(globalChannel);

    // Cleanup on unmount
    return () => {
      // Clean up existing subscriptions
      if (realtimeChannel) {
        FollowService.unsubscribeFromFollowUpdates(realtimeChannel);
      }
      if (ownProfileChannel) {
        supabase.removeChannel(ownProfileChannel);
      }
      if (globalChannel) {
        supabase.removeChannel(globalChannel);
      }

      // Clean up new subscriptions
      if (targetChannel) {
        FollowService.unsubscribeFromFollowUpdates(targetChannel);
      }
      if (ownChannel) {
        supabase.removeChannel(ownChannel);
      }
      if (globalChannel) {
        supabase.removeChannel(globalChannel);
      }
    };
  }, [targetUserId, authUser?.id, isViewingOtherUser, activeTab]);

  // Cleanup realtime subscription on unmount
  useEffect(() => {
    return () => {
      if (realtimeChannel) {
        FollowService.unsubscribeFromFollowUpdates(realtimeChannel);
      }
    };
  }, []);

  // Show loading state when ANY loading is happening
  if (authLoading || loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="ml-2 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // CRITICAL: Authentication checks - must perform AFTER loading check but BEFORE rendering content
  // Only check authentication for own profile (not when viewing others)
  if (!isViewingOtherUser && !hasRedirected.current) {
    if (!isAuthenticated) {
      hasRedirected.current = true;
      navigate("/signin");
      return null;
    }

    if (!isEmailVerified) {
      hasRedirected.current = true;
      navigate("/");
      return null;
    }

    if (!hasProfile) {
      hasRedirected.current = true;
      navigate("/create-profile");
      return null;
    }
  }

  // Show error if user profile not found
  if (!isLoading && !currentProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-10">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
            <p className="text-gray-600 mb-4">The user profile you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate(-1)} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Privacy Check: if profile is private and viewer is not the owner
  const isPrivate = currentProfile?.is_public === false;
  if (!isLoading && isPrivate && isViewingOtherUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <BackButton />
              <h1 className="text-xl font-bold text-gray-900">Private Profile</h1>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">This profile is private</h2>
            <p className="text-gray-600 mb-8">
              You must be following this user to view their profile, or they have chosen to keep their profile private.
            </p>
            <Button onClick={() => navigate(-1)} className="w-full bg-green-600 hover:bg-green-700">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getPostTypeInfo = (type: string) => {
    switch (type) {
      case 'skill_offer':
        return {
          label: 'Offering Skills',
          color: 'text-green-700',
          bgColor: 'bg-green-50 border-green-200',
          icon: Briefcase
        };
      case 'skill_request':
        return {
          label: 'Seeking Skills',
          color: 'text-blue-700',
          bgColor: 'bg-blue-50 border-blue-200',
          icon: Search
        };
      // Projects are now deprecated/merged into Skill Requests or General
      case 'general':
        return {
          label: 'General',
          color: 'text-gray-700',
          bgColor: 'bg-gray-50 border-gray-200',
          icon: Globe
        };
      default:
        return {
          label: type,
          color: 'text-gray-700',
          bgColor: 'bg-gray-100 border-gray-200',
          icon: Globe
        };
    }
  };

  const getExperienceColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-orange-100 text-orange-700';
      case 'expert': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'full_time': return 'bg-blue-100 text-blue-700';
      case 'part_time': return 'bg-purple-100 text-purple-700';
      case 'project_based': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const renderMediaPreview = (mediaUrl: string, index: number) => {
    if (mediaUrl.startsWith('data:image/') || mediaUrl.match(/\.(jpeg|jpg|gif|png)$/i)) {
      return (
        <img
          src={mediaUrl}
          alt={`Post media ${index + 1}`}
          loading="lazy"
          className="w-full h-full object-contain hover:opacity-95 transition-opacity"
        />
      );
    } else if (mediaUrl.startsWith('data:video/') || mediaUrl.match(/\.(mp4|webm|ogg)$/i)) {
      return (
        <video
          src={mediaUrl}
          className="w-full h-full object-contain"
          controls
          preload="metadata"
        />
      );
    } else {
      return (
        <div className="w-full h-48 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <FileIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <span className="text-sm text-gray-500">Attachment</span>
          </div>
        </div>
      );
    }
  };

  const handleNavigation = (path: string) => {
    try {
      navigate(path);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback: try using window.location
      window.location.href = path;
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading currentProfile?...</p>
        </div>
      </div>
    );
  }

  // Return early if no profile
  if (!currentProfile) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header for other user's profile */}
      {isViewingOtherUser && (
        <div className="bg-white border-b border-gray-200 px-3 sm:px-4 py-3">
          <div className="container mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-1 sm:space-x-2 p-2"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate px-2">
              {currentProfile?.name || "User"}'s Profile
            </h1>
            <div className="w-12 sm:w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={() => {
                    // Try to go back to previous page, fallback to home
                    if (window.history.length > 1) {
                      window.history.back();
                    } else {
                      handleNavigation("/");
                    }
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg"
                  title="Go back"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                {/* Alternative navigation options - hidden on mobile */}
                <div className="hidden sm:flex items-center space-x-1">
                  <button
                    onClick={() => handleNavigation("/feed")}
                    className="text-xs px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-gray-100 rounded"
                    title="Go to Feed"
                  >
                    Post
                  </button>
                  <span className="text-muted-foreground">•</span>
                  <button
                    onClick={() => handleNavigation("/")}
                    className="text-xs px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-gray-100 rounded"
                    title="Go Home"
                  >
                    Home
                  </button>
                </div>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">Profile</h1>
            </div>
            {!isViewingOtherUser && (
              <Button
                onClick={() => handleNavigation("/create-post")}
                size="sm"
                className="ml-2 shrink-0"
              >
                <span className="hidden sm:inline">New Post</span>
                <span className="sm:hidden">Post</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Professional Profile Card */}
        <div className="bg-white shadow-sm">
          {/* Cover Photo */}
          <div className="relative h-48 sm:h-64 bg-gradient-to-br from-green-600 via-green-500 to-emerald-600">
          </div>

          {/* Profile Info Section */}
          <div className="px-6 sm:px-8 pb-6">
            {/* Profile Picture & Basic Info */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 sm:-mt-20 mb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
                {/* Profile Picture */}
                <div className="relative group">
                  <img
                    src={
                      currentProfile?.profile_picture ||
                      ""
                    }
                    alt={currentProfile?.name || "User"}
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white object-cover shadow-xl"
                  />
                  <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-4 border-white rounded-full"></div>
                </div>

                {/* Name & Title */}
                <div className="text-center sm:text-left mb-4 sm:mb-2">
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                    {currentProfile?.name}
                  </h1>
                  <div className="flex flex-col sm:flex-row items-center gap-3 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      {(currentProfile?.show_location ?? true) && (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-sm">{currentProfile?.location || "Location not set"}</span>
                        </>
                      )}
                    </div>
                    <span className="hidden sm:block text-gray-400">•</span>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">Joined {new Date(currentProfile?.created_at).getFullYear()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-4 sm:px-0">
                {isViewingOtherUser ? (
                  <>
                    <FollowButton
                      targetUserId={targetUserId}
                      targetUserName={currentProfile?.name}
                      onFollowChange={async (relationship) => {
                        setFollowRelationship(relationship);
                        await refreshAllProfileData();
                        if (authUser?.id) {
                          try {
                            await FollowService.getRelationship(authUser.id);
                          } catch (error) {
                            console.error('Error refreshing current user relationship:', error);
                          }
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                    />
                    <Button
                      onClick={() => {
                        if (!authUser) {
                          navigate("/signin");
                          return;
                        }
                        if (!currentProfile?.user_id || currentProfile.user_id === authUser.id) return;
                        navigate("/messages", { state: { openWithUserId: currentProfile.user_id } });
                      }}
                      variant="outline"
                      className="border-gray-300 hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Message
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleNavigation("/edit-profile")}
                      className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Profile
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="border-gray-200">
                          <Settings className="w-5 h-5 text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleNavigation("/settings")}>
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                          onClick={() => setShowDeleteProfileDialog(true)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Profile
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex justify-center sm:justify-start mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Available for MeritOne trades</span>
              </div>
            </div>

            {/* Skills Section */}
            {currentProfile?.skills_i_have && currentProfile?.skills_i_have.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {currentProfile?.skills_i_have.slice(0, 8).map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-sm font-medium rounded-lg transition-colors cursor-default"
                    >
                      {skill}
                    </span>
                  ))}
                  {currentProfile?.skills_i_have.length > 8 && (
                    <span className="px-4 py-2 bg-gray-100 text-gray-600 border border-gray-300 text-sm font-medium rounded-lg">
                      +{currentProfile?.skills_i_have.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4 pt-6 border-t border-gray-200">
              <div className="text-center p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                  {currentPosts.length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Posts</div>
              </div>
              <div
                className="text-center p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setShowFollowersModal(true)}
              >
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                  {followRelationship.followerCount}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Followers</div>
              </div>
              <div
                className="text-center p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setShowFollowingModal(true)}
              >
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                  {followRelationship.followingCount}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Following</div>
              </div>
              <div className="text-center p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                  {currentProfile?.skills_i_have?.length || 0}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Skills</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border border-gray-200 mb-6 sm:mb-8 mx-3 sm:mx-0 rounded-lg sm:rounded-none">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-8 overflow-x-auto scrollbar-hide">
              {[
                { id: "posts", label: "Posts", count: currentPosts.length },
                { id: "about", label: "About" },
                {
                  id: "skills",
                  label: "Skills",
                  count: currentProfile?.skills_i_have?.length || 0,
                },
                // Only show followers/following tabs for own profile
                ...(isViewingOtherUser ? [] : [
                  {
                    id: "followers",
                    label: "Followers",
                    count: followRelationship.followerCount
                  },
                  {
                    id: "following",
                    label: "Following",
                    count: followRelationship.followingCount
                  }
                ])
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "py-3 sm:py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0",
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700",
                  )}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-1 sm:ml-2 text-xs text-gray-400">
                      ({tab.count})
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-8">
            {activeTab === "posts" && (
              <div className="space-y-10">
                {userPosts.length > 0 ? (
                  userPosts.map((post) => {
                    const postTypeInfo = getPostTypeInfo(post.post_type);

                    return (
                      <div
                        key={post.id}
                        className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                      >
                        <div className="p-8 border-b border-gray-100">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-5">
                              <img
                                src={
                                  post.user?.profile_picture ||
                                  ""
                                }
                                alt={post.user?.name || "User"}
                                className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                                onError={(e) => {
                                  e.currentTarget.src = "";
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <h3 className="font-bold text-lg text-gray-900 truncate max-w-[200px] sm:max-w-md">
                                    {post.user?.name || "Anonymous User"}
                                  </h3>
                                  <span className={cn(
                                    "px-2 py-1 text-xs font-medium rounded-full flex items-center",
                                    postTypeInfo.bgColor,
                                    postTypeInfo.color
                                  )}>
                                    <postTypeInfo.icon className="w-3 h-3 mr-1" />
                                    <span>{postTypeInfo.label}</span>
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500">
                                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>

                            {/* Delete Option for Post Owner */}
                            {!isViewingOtherUser && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 p-2 rounded-full transition-colors flex-shrink-0">
                                    <MoreHorizontal className="w-5 h-5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                    onClick={() => setPostToDelete(post.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Post
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>

                        {/* Post Content */}
                        <div className="p-8">
                          <h4 className="font-bold text-gray-900 mb-4 text-xl">{post.title}</h4>
                          <p className="text-gray-700 whitespace-pre-wrap mb-6 leading-relaxed text-base">{post.content}</p>

                          {/* Post Media/Images */}
                          {post.media_urls && post.media_urls.length > 0 && (
                            <div className="mb-6">
                              <ImageCarouselComponent
                                images={post.media_urls}
                                renderMedia={renderMediaPreview}
                              />
                            </div>
                          )}

                          {/* Skills */}
                          {(post.skills_offered?.length > 0 || post.skills_needed?.length > 0) && (
                            <div className="mb-6">
                              {post.skills_offered?.length > 0 && (
                                <div className="mb-3">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Users className="w-4 h-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-600">Offering</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {post.skills_offered.map((skill, index) => (
                                      <span
                                        key={index}
                                        className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {post.skills_needed?.length > 0 && (
                                <div>
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Star className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-600">Seeking</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {post.skills_needed.map((skill, index) => (
                                      <span
                                        key={index}
                                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Additional Info */}
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                            {post.experience_level && (
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4" />
                                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getExperienceColor(post.experience_level))}>
                                  {post.experience_level}
                                </span>
                              </div>
                            )}
                            {post.availability && (
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getAvailabilityColor(post.availability))}>
                                  {post.availability.replace('_', ' ')}
                                </span>
                              </div>
                            )}
                            {post.deadline && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>Deadline: {new Date(post.deadline).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Post Actions */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6">
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <Heart className="w-5 h-5" />
                                <span>{post.likes_count} likes</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <MessageCircle className="w-5 h-5" />
                                <span>{post.comments_count} comments</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <Share2 className="w-5 h-5" />
                                <span>Share</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                    <p className="text-gray-500 mb-6">
                      Start sharing your skills and projects with the community!
                    </p>
                    {!isViewingOtherUser && (
                      <Button
                        onClick={() => handleNavigation("/create-post")}
                        className="bg-primary hover:bg-primary/90 text-white"
                      >
                        Create Your First Post
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )
            }

            {activeTab === "about" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">About</h3>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {currentProfile?.bio || "No bio available."}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-4 text-lg">Experience Level</h4>
                    <span className="inline-flex items-center px-5 py-2.5 rounded-full text-base font-semibold bg-primary/10 text-primary">
                      {currentProfile?.experience_level || "Not specified"}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-4 text-lg">Availability</h4>
                    <span className="inline-flex items-center px-5 py-2.5 rounded-full text-base font-semibold bg-primary/10 text-primary">
                      {currentProfile?.availability || "Not specified"}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-4 text-lg">Preferred Work</h4>
                    <span className="inline-flex items-center px-5 py-2.5 rounded-full text-base font-semibold bg-primary/10 text-primary">
                      {currentProfile?.preferred_work || "Not specified"}
                    </span>
                  </div>

                  {(currentProfile?.show_location ?? true) && (
                    <div>
                      <h4 className="font-bold text-gray-900 mb-4 text-lg">Location</h4>
                      <span className="text-gray-700 text-base">{currentProfile?.location || "Not specified"}</span>
                    </div>
                  )}

                  {(currentProfile?.show_email ?? false) && (
                    <div>
                      <h4 className="font-bold text-gray-900 mb-4 text-lg">Email</h4>
                      <span className="text-gray-700 text-base">{currentProfile?.email || "Not specified"}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "skills" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Skills & Expertise</h3>

                  {currentProfile?.skills_i_have && currentProfile?.skills_i_have.length > 0 && (
                    <div className="mb-8">
                      <h4 className="font-bold text-gray-900 mb-5 text-lg">Skills I Have</h4>
                      <div className="flex flex-wrap gap-3">
                        {currentProfile?.skills_i_have.map((skill: string, index: number) => (
                          <span
                            key={index}
                            className="px-5 py-3 bg-green-50 text-green-700 rounded-xl text-base font-semibold border border-green-200 hover:shadow-md transition-shadow"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentProfile?.skills_i_want && currentProfile?.skills_i_want.length > 0 && (
                    <div className="mb-8">
                      <h4 className="font-bold text-gray-900 mb-5 text-lg">Skills I Want to Learn</h4>
                      <div className="flex flex-wrap gap-3">
                        {currentProfile?.skills_i_want.map((skill: string, index: number) => (
                          <span
                            key={index}
                            className="px-5 py-3 bg-blue-50 text-blue-700 rounded-xl text-base font-semibold border border-blue-200 hover:shadow-md transition-shadow"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentProfile?.top_skills && currentProfile?.top_skills.length > 0 && (
                    <div>
                      <h4 className="font-bold text-gray-900 mb-5 text-lg">Top Skills</h4>
                      <div className="flex flex-wrap gap-3">
                        {currentProfile?.top_skills.map((skill: string, index: number) => (
                          <span
                            key={index}
                            className="px-5 py-3 bg-purple-50 text-purple-700 rounded-xl text-base font-semibold border border-purple-200 hover:shadow-md transition-shadow"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!currentProfile?.skills_i_have || currentProfile?.skills_i_have.length === 0) &&
                    (!currentProfile?.skills_i_want || currentProfile?.skills_i_want.length === 0) &&
                    (!currentProfile?.top_skills || currentProfile?.top_skills.length === 0) && (
                      <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No skills added yet.</p>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Followers Tab */}
            {activeTab === "followers" && (
              <div className="space-y-5">
                {loadingFollowers ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                    <span className="text-base">Loading followers...</span>
                  </div>
                ) : followers.length > 0 ? (
                  <div className="space-y-4">
                    {followers.map((follower) => (
                      <div key={follower.user_id} className="flex items-center space-x-4 p-6 bg-white border border-gray-200 rounded-2xl hover:shadow-lg transition-all duration-300">
                        <img
                          src={follower.profile_picture || ""}
                          alt={follower.name}
                          className="w-16 h-16 rounded-full object-cover cursor-pointer hover:ring-4 hover:ring-green-100 transition-all"
                          onClick={() => navigate(`/profile/${follower.user_id}`)}
                        />
                        <div className="flex-1 min-w-0">
                          <h3
                            className="font-bold text-lg text-gray-900 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => navigate(`/profile/${follower.user_id}`)}
                          >
                            {follower.name}
                          </h3>
                          {follower.show_email && <p className="text-base text-gray-500 truncate">{follower.email}</p>}
                          {follower.bio && (
                            <p className="text-base text-gray-600 mt-2 line-clamp-2">{follower.bio}</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => navigate(`/profile/${follower.user_id}`)}
                        >
                          View Profile
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-gray-500 text-lg">No followers yet.</p>
                    <p className="text-base text-gray-400 mt-3">Start connecting with others to build your network!</p>
                  </div>
                )}

                {/* Load More Button for Followers */}
                {followers.length > 0 && hasMoreFollowers && (
                  <div className="text-center mt-6">
                    <Button
                      variant="outline"
                      onClick={() => loadFollowers(false)}
                      disabled={loadingMoreFollowers}
                      className="w-full max-w-xs"
                    >
                      {loadingMoreFollowers ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          Loading more...
                        </>
                      ) : (
                        'Load More Followers'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Following Tab */}
            {activeTab === "following" && (
              <div className="space-y-5">
                {loadingFollowing ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                    <span className="text-base">Loading following...</span>
                  </div>
                ) : following.length > 0 ? (
                  <div className="space-y-4">
                    {following.map((user) => (
                      <div key={user.user_id} className="flex items-center space-x-4 p-6 bg-white border border-gray-200 rounded-2xl hover:shadow-lg transition-all duration-300">
                        <img
                          src={user.profile_picture || ""}
                          alt={user.name}
                          className="w-16 h-16 rounded-full object-cover cursor-pointer hover:ring-4 hover:ring-green-100 transition-all"
                          onClick={() => navigate(`/profile/${user.user_id}`)}
                        />
                        <div className="flex-1 min-w-0">
                          <h3
                            className="font-bold text-lg text-gray-900 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => navigate(`/profile/${user.user_id}`)}
                          >
                            {user.name}
                          </h3>
                          {user.show_email && <p className="text-base text-gray-500 truncate">{user.email}</p>}
                          {user.bio && (
                            <p className="text-base text-gray-600 mt-2 line-clamp-2">{user.bio}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => navigate(`/profile/${user.user_id}`)}
                          >
                            View Profile
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-gray-500 text-lg">Not following anyone yet.</p>
                    <p className="text-base text-gray-400 mt-3">Start following people to see their posts in your feed!</p>
                  </div>
                )}

                {/* Load More Button for Following */}
                {following.length > 0 && hasMoreFollowing && (
                  <div className="text-center mt-6">
                    <Button
                      variant="outline"
                      onClick={() => loadFollowing(false)}
                      disabled={loadingMoreFollowing}
                      className="w-full max-w-xs"
                    >
                      {loadingMoreFollowing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          Loading more...
                        </>
                      ) : (
                        'Load More Following'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MessagingInterface removed; we navigate to /messages */}

      {/* Followers Modal */}
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        userId={targetUserId}
        userName={currentProfile?.name || 'User'}
        followerCount={followRelationship.followerCount}
        onFollowChange={(userId, isFollowing) => {
          // Refresh relationship data when follow state changes
          refreshAllProfileData();
        }}
      />

      {/* Following Modal */}
      <FollowingModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        userId={targetUserId}
        userName={currentProfile?.name || 'User'}
        followingCount={followRelationship.followingCount}
        onFollowChange={(userId, isFollowing) => {
          // Refresh relationship data when follow state changes
          refreshAllProfileData();
        }}
      />
      <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Profile Confirmation Dialog */}
      <AlertDialog open={showDeleteProfileDialog} onOpenChange={setShowDeleteProfileDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profile?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="text-red-600 font-medium">Warning: This action is permanent and cannot be undone.</p>
              <p>This will permanently delete your:</p>
              <ul className="list-disc list-inside text-sm">
                <li>Profile information</li>
                <li>Posts and comments</li>
                <li>Trades and applications</li>
                <li>Followers and following data</li>
              </ul>
              <p className="pt-2">Are you absolutely sure you want to delete your account?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteProfile();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Deleting...
                </>
              ) : (
                "Delete Completely"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
};

export default Profile;
