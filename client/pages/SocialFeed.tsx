import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CommentsSection } from "@/components/CommentsSection";
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
  AlertCircle
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

const SocialFeed: React.FC = () => {

  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { posts, loading, hasMore, loadMorePosts, likePost, unlikePost, refreshPosts, deletePost } = usePosts();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { profile: currentUserProfile } = useProfile();
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const commentTogglesRef = React.useRef<Map<string, () => void>>(new Map());
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
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
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // Infinite scroll hook
  const loadMoreRef = useInfiniteScroll({
    loading,
    hasMore,
    onLoadMore: loadMorePosts,
    threshold: 400
  });

  const handleLike = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.isLiked) {
      await unlikePost(postId);
    } else {
      await likePost(postId);
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
          color: 'text-gray-700',
          bgColor: 'bg-gray-100 border-gray-200',
          icon: Briefcase
        };
      case 'skill_request':
        return {
          label: 'Seeking Skills',
          color: 'text-gray-700',
          bgColor: 'bg-gray-100 border-gray-200',
          icon: Search
        };
      case 'project':
        return {
          label: 'Project',
          color: 'text-gray-700',
          bgColor: 'bg-gray-100 border-gray-200',
          icon: Star
        };
      case 'general':
        return {
          label: 'General',
          color: 'text-gray-700',
          bgColor: 'bg-gray-100 border-gray-200',
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
          alt={`Post media ${index + 1} `}
          loading="lazy"
          className="w-full max-h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
          onClick={() => window.open(mediaUrl, '_blank')}
        />
      );
    } else if (mediaUrl.startsWith('data:video/') || mediaUrl.match(/\.(mp4|webm|ogg)$/i)) {
      return (
        <video
          src={mediaUrl}
          className="w-full max-h-96 object-cover"
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

  if (loading) {
    return <PageLoader text="Loading your feed..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* LinkedIn-style Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between px-3 sm:px-6 py-3">
            {/* Left Section - Logo & Search */}
            <div className="flex items-center space-x-2 sm:space-x-6 flex-1">
              <button
                onClick={() => navigate("/")}
                className="hover:opacity-80 transition-opacity"
              >
                <img
                  src="/meritone-logo.png"
                  alt="MeritOne"
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              </button>

              <div className="hidden md:block relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts, skills, people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full bg-gray-100 border-0 rounded-md text-sm placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Right Section - Navigation & Actions */}
            <div className="flex items-center space-x-0.5 sm:space-x-1">
              <button
                onClick={() => navigate('/')}
                className="hidden sm:flex flex-col items-center p-2 sm:p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors min-w-[48px] sm:min-w-[64px]"
              >
                <Home className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-xs mt-1 hidden lg:block">Home</span>
              </button>

              <div className="relative hidden sm:block">
                <button className="flex flex-col items-center p-2 sm:p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors min-w-[48px] sm:min-w-[64px]">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-xs mt-1 hidden lg:block">Trending</span>
                </button>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-3 ml-2 sm:ml-6 pl-2 sm:pl-6 border-l border-gray-200">
                <img
                  src={currentUserProfile?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserProfile?.name || 'S')}&background=0D8ABC&color=fff`}
                  alt="Profile"
                  loading="lazy"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-gray-200"
                />
                <Button
                  onClick={() => navigate("/create-post")}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 sm:px-5 py-2 rounded-lg shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline text-sm">Create Post</span>
                </Button>
              </div >
            </div >
          </div >
        </div >
      </header >

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
                  src={currentUserProfile?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserProfile?.name || 'S')}&background=0D8ABC&color=fff`}
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
                  <span className="font-semibold text-green-600">..</span>
                </div>
                <div className="flex justify-between items-center px-2 py-1 rounded">
                  <span className="text-gray-600">Post impressions</span>
                  <span className="font-semibold text-green-600">..</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Feed - Centered */}
          <div className="w-full lg:max-w-2xl flex-shrink-0">
            {/* Create Post Widget */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow-sm">
              <div className="flex items-center space-x-3">
                <img
                  src={currentUserProfile?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserProfile?.name || 'S')}&background=0D8ABC&color=fff`}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <button
                  onClick={() => navigate("/create-post")}
                  className="flex-1 text-left px-4 py-3 border border-gray-300 rounded-full text-gray-500 hover:bg-gray-50 transition-colors text-sm"
                >
                  Start a post about your skills...
                </button>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSortBy('latest')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                      sortBy === 'latest'
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    Recent
                  </button>
                  <button
                    onClick={() => setSortBy('popular')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                      sortBy === 'popular'
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    Popular
                  </button>
                </div>

                <div className="relative">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white text-sm font-medium text-gray-700 hover:border-gray-300 transition-all cursor-pointer"
                  >
                    <option value="all">All Posts</option>
                    <option value="skill_offer">Skill Offers</option>
                    <option value="skill_request">Skill Requests</option>
                    <option value="project">Projects</option>
                    <option value="general">General</option>
                  </select>
                  <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Posts Feed */}
            {filteredPosts.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
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
                              src={
                                post.user?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.user?.name || 'A')}&background=random`
                              }
                              alt={post.user?.name || "User"}
                              loading="lazy"
                              className="w-11 h-11 rounded-full object-cover flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-green-500 transition-all"
                              onClick={() => navigate(`/profile/${post.user_id}`)}
                              onError={(e) => {
                                const name = post.user?.name || 'A';
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
                              }}
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
                                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
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
                            <div className="space-y-0">
                              {post.media_urls.map((mediaUrl, index) => (
                                <div key={index} className="overflow-hidden max-h-96">
                                  {renderMediaPreview(mediaUrl, index)}
                                </div>
                              ))}
                            </div>
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
                                  <span>Due {new Date(post.deadline).toLocaleDateString()}</span>
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