import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CommentsSection } from "@/components/CommentsSection";
import { ImageCarouselComponent } from "@/components/ImageCarousel";
import { BackButton } from "@/components/BackButton";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { usePosts, type Post } from "@/contexts/PostsContext";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/lib/supabase";
import { PageLoader, LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Heart,
  MessageSquare,
  Share2,
  MoreHorizontal,
  Filter,
  Search,
  FileIcon,
  Calendar,
  Star,
  Users,
  Clock,
  Plus,
  Home,
  TrendingUp,
  Award,
  Globe,
  Eye,
  Briefcase,
  ArrowRight,
  Trash2,
  MoreVertical,
  AlertCircle,
  Pencil
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
import { MessageButton } from "@/components/messaging/MessageButton";
import { useProfile } from "@/contexts/ProfileContext";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { getAvatarUrl } from "@/lib/avatar-utils";

const SocialFeed: React.FC = () => {

  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { posts, loading, error, hasMore, loadMorePosts, likePost, unlikePost, refreshPosts, deletePost, retryLoad } = usePosts();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { profile: currentUserProfile, isProfileComplete } = useProfile();
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const commentTogglesRef = React.useRef<Map<string, () => void>>(new Map());
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const { toast } = useToast();


  // Filter and sort posts
  const filteredPosts = posts
    .filter(post => {
      if (filterType !== 'all' && post.post_type !== filterType) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          post.title?.toLowerCase().includes(query) ||
          post.content?.toLowerCase().includes(query) ||
          post.user?.name?.toLowerCase().includes(query) ||
          post.skills_offered?.some(skill => skill.toLowerCase().includes(query)) ||
          post.skills_needed?.some(skill => skill.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') {
        return (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count);
      }
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      const safeDateA = isNaN(dateA) ? 0 : dateA;
      const safeDateB = isNaN(dateB) ? 0 : dateB;
      return safeDateB - safeDateA;
    });

  // Infinite scroll hook
  const loadMoreRef = useInfiniteScroll({
    loading,
    hasMore,
    onLoadMore: loadMorePosts,
    threshold: 400
  });

  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());

  const handleLike = async (postId: string) => {
    // Check if profile is complete
    if (!isProfileComplete) {
      toast({
        title: "Complete your profile",
        description: "Please add a bio and at least one skill to like posts",
        variant: "destructive"
      });
      navigate('/edit-profile');
      return;
    }

    // Prevent multiple simultaneous requests for the same post
    if (likingPosts.has(postId)) {
      console.log('Already processing like for this post, skipping...');
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    // Mark this post as being processed
    setLikingPosts(prev => new Set(prev).add(postId));

    try {
      if (post.isLiked) {
        await unlikePost(postId);
      } else {
        await likePost(postId);
      }
    } finally {
      // Remove from processing set after a short delay to prevent rapid re-clicks
      setTimeout(() => {
        setLikingPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      }, 300);
    }
  };



  const handleDeletePost = async () => {
    if (!postToDelete) return;

    const { success, error } = await deletePost(postToDelete);

    if (success) {
      toast({
        title: "Post deleted",
        description: "Your post has been successfully deleted.",
      });
      setPostToDelete(null);
    } else {
      toast({
        title: "Error",
        description: error || "Failed to delete post",
        variant: "destructive",
      });
    }
  };

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

  const experienceColors = {
    beginner: 'bg-green-50 text-green-700 border-green-200',
    intermediate: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    advanced: 'bg-orange-50 text-orange-700 border-orange-200',
    expert: 'bg-red-50 text-red-700 border-red-200',
    default: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  const getExperienceColor = (level: string) => {
    return experienceColors[level as keyof typeof experienceColors] || experienceColors.default;
  };

  const availabilityColors = {
    full_time: 'bg-blue-50 text-blue-700 border-blue-200',
    part_time: 'bg-purple-50 text-purple-700 border-purple-200',
    project_based: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    default: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  const getAvailabilityColor = (availability: string) => {
    return availabilityColors[availability as keyof typeof availabilityColors] || availabilityColors.default;
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

  // Don't show full-page loader - it causes posts to disappear during refresh
  // Instead, we show a loading spinner at the bottom of the feed

  return (
    <div className="min-h-screen bg-gray-50">
      {/* LinkedIn-style Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Search Overlay */}
          {showMobileSearch ? (
            <div className="flex items-center px-4 py-3 space-x-4 bg-white animate-in slide-in-from-top duration-200">
              <button
                onClick={() => {
                  setShowMobileSearch(false);
                  setSearchQuery('');
                }}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search posts, skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full bg-gray-100 border-0 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between px-4 sm:px-6 py-2.5">
              {/* Left Section - Logo & Desktop Search */}
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                <div className="hidden sm:block">
                  <BackButton />
                </div>
                <button
                  onClick={() => navigate("/")}
                  className="hover:opacity-80 transition-opacity shrink-0"
                >
                  <img
                    src="/meritone-logo.png"
                    alt="MeritOne"
                    className="h-8 sm:h-10 w-auto object-contain"
                  />
                </button>

                <div className="hidden md:block relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search posts, skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full bg-gray-100 border-0 rounded-lg text-sm placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-green-500 focus:outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Right Section - Icons & Actions */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Mobile Search Trigger */}
                <button
                  onClick={() => setShowMobileSearch(true)}
                  className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </button>

                <div className="hidden sm:flex items-center space-x-1 border-r border-gray-200 pr-4 mr-2">
                  <button
                    onClick={() => navigate('/')}
                    className="flex flex-col items-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors min-w-[56px]"
                  >
                    <Home className="w-5 h-5" />
                    <span className="text-[10px] mt-1 font-medium hidden lg:block uppercase tracking-wider">Home</span>
                  </button>
                  <button className="flex flex-col items-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors min-w-[56px]">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-[10px] mt-1 font-medium hidden lg:block uppercase tracking-wider">Trending</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2 sm:space-x-4">
                  <NotificationBell />
                  <button
                    onClick={() => currentUserProfile?.user_id && navigate(`/profile/${currentUserProfile.user_id}`)}
                    className="shrink-0 hover:ring-2 hover:ring-green-500 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <img
                      src={getAvatarUrl(currentUserProfile?.profile_picture, currentUserProfile?.name)}
                      alt="Profile"
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-gray-200"
                    />
                  </button>
                  <Button
                    onClick={() => navigate("/create-post")}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-sm transition-all h-8 sm:h-10 px-3 sm:px-4"
                  >
                    <Plus className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Post</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      < div className="max-w-6xl mx-auto py-6" >
        <div className="flex gap-6 px-4 sm:px-6">
          {/* Left Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm sticky top-20">
              {/* Profile Cover */}
              <div className="h-16 bg-gradient-to-r from-green-600 to-green-700"></div>

              {/* Profile Info */}
              <div className="p-4 text-center -mt-8">
                <img
                  src={getAvatarUrl(currentUserProfile?.profile_picture, currentUserProfile?.name)}
                  alt="Profile"
                  className="w-16 h-16 rounded-full mx-auto mb-3 border-4 border-white shadow-sm"
                />
                <h3 className="font-semibold text-gray-900">{currentUserProfile?.name || "Your Name"}</h3>
                <p className="text-sm text-gray-500 mt-1">Professional Network</p>
              </div>

              {/* Stats */}
              <div className="px-4 pb-4 space-y-2 text-sm border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center px-2 py-1 rounded">
                  <span className="text-gray-600">Profile views</span>
                  <span className="font-semibold text-green-600">0</span>
                </div>
                <div className="flex justify-between items-center px-2 py-1 rounded">
                  <span className="text-gray-600">Post impressions</span>
                  <span className="font-semibold text-green-600">0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Feed - Centered */}
          <div className="w-full lg:max-w-2xl flex-shrink-0">
            {/* Create Post Widget */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm">
              <div className="flex items-center space-x-4">
                <img
                  src={getAvatarUrl(currentUserProfile?.profile_picture, currentUserProfile?.name)}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
                <button
                  onClick={() => navigate("/create-post")}
                  className="flex-1 text-left px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-gray-500 hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  <span className="sm:hidden">What's on your mind?</span>
                  <span className="hidden sm:inline">Start a post about your skills...</span>
                </button>
              </div>
            </div>

            {/* Feed Selection Controls - Optimized for Mobile */}
            <div className="bg-white rounded-lg border border-gray-200 mb-4 shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                {/* Sorting */}
                <div className="flex p-2 gap-1 bg-gray-50/50">
                  <button
                    onClick={() => setSortBy('latest')}
                    className={cn(
                      "flex-1 px-4 py-1.5 rounded-md text-xs font-semibold transition-all",
                      sortBy === 'latest'
                        ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                        : "text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    Recent
                  </button>
                  <button
                    onClick={() => setSortBy('popular')}
                    className={cn(
                      "flex-1 px-4 py-1.5 rounded-md text-xs font-semibold transition-all",
                      sortBy === 'popular'
                        ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                        : "text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    Popular
                  </button>
                </div>

                {/* Filtering - Horizontal Scrollable on Mobile */}
                <div className="flex-1 flex items-center p-2 space-x-2 overflow-x-auto scrollbar-hide no-scrollbar">
                  {[
                    { id: 'all', label: 'All Posts' },
                    { id: 'skill_offer', label: 'Offering' },
                    { id: 'skill_request', label: 'Seeking' },
                    { id: 'general', label: 'General' }
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setFilterType(filter.id)}
                      className={cn(
                        "whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        filterType === filter.id
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Posts Feed */}
            {filteredPosts.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
                {error ? (
                  // Show error state with retry button
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to load posts</h3>
                    <p className="text-gray-600 mb-6 max-w-md">{error}</p>
                    <div className="flex gap-3">
                      <Button
                        onClick={retryLoad}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Try Again
                      </Button>
                      <Button
                        onClick={() => navigate("/")}
                        variant="outline"
                      >
                        Go Home
                      </Button>
                    </div>
                  </div>
                ) : loading ? (
                  // Show loading spinner on initial load
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600">Loading posts...</p>
                  </div>
                ) : (
                  // Show empty state when no posts exist
                  <>
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts to show</h3>
                    <p className="text-gray-600 mb-6">
                      {searchQuery || filterType !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Be the first to share something with your network!'
                      }
                    </p>
                    <Button
                      onClick={() => navigate("/create-post")}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Create Your First Post
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredPosts.map((post) => {
                  const postTypeInfo = getPostTypeInfo(post.post_type);
                  const IconComponent = postTypeInfo.icon;


                  return (
                    <article
                      key={post.id}
                      className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all overflow-hidden"
                    >
                      {/* Post Header */}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <img
                              src={getAvatarUrl(post.user?.profile_picture, post.user?.name)}
                              alt={post.user?.name || "User"}
                              loading="lazy"
                              className="w-11 h-11 rounded-full object-cover flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-green-500 transition-all"
                              onClick={() => navigate(`/profile/${post.user_id}`)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3
                                  className="font-semibold text-[15px] text-gray-900 cursor-pointer hover:text-green-600 transition-colors truncate"
                                  onClick={() => navigate(`/profile/${post.user_id}`)}
                                >
                                  {post.user?.name || "Anonymous User"}
                                </h3>
                                <span className="text-gray-300 hidden sm:inline">•</span>
                                <span className="text-[13px] text-gray-500 hidden sm:inline">
                                  {(() => {
                                    try {
                                      return formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
                                    } catch (e) {
                                      return 'recently';
                                    }
                                  })()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border", postTypeInfo.bgColor)}>
                                  <IconComponent className={cn("w-3 h-3", postTypeInfo.color)} />
                                  <span className={postTypeInfo.color}>{postTypeInfo.label}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          {user?.id === post.user_id ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 p-1.5 rounded-full transition-colors flex-shrink-0">
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
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() => navigate('/create-post', { state: { postToEdit: post } })}
                                >
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Edit Post
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <button className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 p-1.5 rounded-full transition-colors flex-shrink-0">
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="px-5 pb-4 space-y-2.5">
                        {post.title && (
                          <h4 className="font-semibold text-[17px] text-gray-900 leading-snug">{post.title}</h4>
                        )}
                        <p className="text-[15px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {post.content}
                        </p>
                      </div>

                      {/* Post Media */}
                      {
                        post.media_urls && post.media_urls.length > 0 && (
                          <div className="mb-4">
                            <ImageCarouselComponent
                              images={post.media_urls}
                              renderMedia={renderMediaPreview}
                            />
                          </div>
                        )
                      }

                      {/* Skills Section */}
                      {
                        (post.skills_offered?.length > 0 || post.skills_needed?.length > 0) && (
                          <div className="px-5 pb-4">
                            <div className="bg-gray-50 rounded-lg p-4 space-y-3.5">
                              {post.skills_offered?.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">💼 Offering</h5>
                                  <div className="flex flex-wrap gap-2">
                                    {post.skills_offered.map((skill, index) => (
                                      <span
                                        key={index}
                                        className="inline-flex items-center px-3 py-1.5 bg-white text-gray-800 rounded-md text-sm font-medium border border-gray-200"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {post.skills_needed?.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">🔍 Looking For</h5>
                                  <div className="flex flex-wrap gap-2">
                                    {post.skills_needed.map((skill, index) => (
                                      <span
                                        key={index}
                                        className="inline-flex items-center px-3 py-1.5 bg-white text-gray-800 rounded-md text-sm font-medium border border-gray-200"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      }

                      {/* Additional Info */}
                      {
                        (post.experience_level || post.availability || post.deadline) && (
                          <div className="px-5 pb-4">
                            <div className="flex flex-wrap gap-2">
                              {post.experience_level && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-50 text-gray-700">
                                  <Award className="w-4 h-4" />
                                  <span>{post.experience_level.charAt(0).toUpperCase() + post.experience_level.slice(1)}</span>
                                </div>
                              )}
                              {post.availability && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-50 text-gray-700">
                                  <Clock className="w-4 h-4" />
                                  <span>{post.availability.replace('_', ' ').charAt(0).toUpperCase() + post.availability.replace('_', ' ').slice(1)}</span>
                                </div>
                              )}
                              {post.deadline && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-50 text-gray-700">
                                  <Calendar className="w-4 h-4" />
                                  <span>Due {(() => {
                                    try {
                                      return new Date(post.deadline).toLocaleDateString();
                                    } catch (e) {
                                      return 'Invalid Date';
                                    }
                                  })()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      }

                      {/* Likes Count */}
                      {
                        post.likes_count > 0 && (
                          <div className="px-5 pb-3">
                            <p className="text-sm font-medium text-gray-700">
                              {post.likes_count} {post.likes_count === 1 ? 'like' : 'likes'}
                            </p>
                          </div>
                        )
                      }

                      {/* Action Buttons */}
                      <div className="border-t border-gray-100 px-3 py-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1">
                            <button
                              onClick={() => handleLike(post.id)}
                              className={cn(
                                "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium flex-1",
                                post.isLiked
                                  ? "text-blue-600"
                                  : "text-gray-600 hover:text-blue-600"
                              )}
                            >
                              <Heart className={cn("w-5 h-5", post.isLiked ? "fill-current" : "")} />
                              <span className="hidden sm:inline">Like</span>
                            </button>
                            <button
                              onClick={() => {
                                const toggle = commentTogglesRef.current.get(post.id);
                                if (toggle) toggle();
                              }}
                              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium text-gray-600 hover:text-green-600 flex-1"
                            >
                              <MessageSquare className="w-5 h-5" />
                              <span className="hidden sm:inline">Comment</span>
                            </button>
                            <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium text-gray-600 hover:text-green-600 flex-1">
                              <Share2 className="w-5 h-5" />
                              <span className="hidden sm:inline">Share</span>
                            </button>
                          </div>
                          <div className="pl-3 ml-3 border-l border-gray-200">
                            <MessageButton
                              userId={post.user_id}
                              userName={post.user?.name}
                              className="px-5 py-3 text-sm font-medium text-gray-600 hover:text-green-600 hover:bg-gray-50 rounded-xl transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Comments Section */}
                      <CommentsSection
                        postId={post.id}
                        postOwnerId={post.user_id}
                        commentsCount={post.comments_count}
                        onToggleComments={(toggle) => {
                          commentTogglesRef.current.set(post.id, toggle);
                        }}
                      />
                    </article>
                  );
                })}

                {/* Infinite Scroll Trigger */}
                <div ref={loadMoreRef} className="py-8">
                  {loading && hasMore && (
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  {!hasMore && filteredPosts.length > 0 && (
                    <p className="text-center text-gray-500 text-sm">You've reached the end of the feed</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
    </div >
  );
};

export default SocialFeed;