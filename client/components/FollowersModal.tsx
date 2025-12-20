import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FollowService, FollowUser } from '@/lib/follow.service';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  followerCount: number;
  onFollowChange?: (userId: string, isFollowing: boolean) => void;
}

const FollowersModal: React.FC<FollowersModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  followerCount,
  onFollowChange
}) => {
  const { user: currentUser } = useAuth();
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const loadFollowers = async (reset = true) => {
    if (reset) {
      setLoading(true);
      setOffset(0);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentOffset = reset ? 0 : offset;
      const result = await FollowService.getFollowers(userId, 20, currentOffset);
      
      if (result.success && result.data) {
        if (reset) {
          setFollowers(result.data);
        } else {
          setFollowers(prev => [...prev, ...result.data]);
        }
        setHasMore(result.hasMore);
        setOffset(currentOffset + result.data.length);
        
        // Check follow states for each follower
        if (currentUser) {
          const followStates: Record<string, boolean> = {};
          for (const follower of result.data) {
            try {
              const relationship = await FollowService.getRelationship(follower.user_id);
              followStates[follower.user_id] = relationship.isFollowing;
            } catch (error) {
              console.error(`Error checking follow state for ${follower.user_id}:`, error);
              followStates[follower.user_id] = false;
            }
          }
          setFollowingStates(prev => ({ ...prev, ...followStates }));
        }
      }
    } catch (error) {
      console.error('Error loading followers:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      loadFollowers(true);
    }
  }, [isOpen, userId]);

  const handleFollowToggle = async (targetUserId: string, targetUserName: string) => {
    if (!currentUser) return;

    const isCurrentlyFollowing = followingStates[targetUserId] || false;
    setLoadingStates(prev => ({ ...prev, [targetUserId]: true }));

    try {
      const result = await FollowService.toggleFollow(targetUserId, isCurrentlyFollowing);
      
      if (result.success) {
        setFollowingStates(prev => ({
          ...prev,
          [targetUserId]: !isCurrentlyFollowing
        }));
        
        onFollowChange?.(targetUserId, !isCurrentlyFollowing);
      } else {
        console.error('Follow toggle failed:', result.error);
        alert(`Failed to ${isCurrentlyFollowing ? 'unfollow' : 'follow'} ${targetUserName}`);
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
      alert(`Failed to ${isCurrentlyFollowing ? 'unfollow' : 'follow'} ${targetUserName}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadFollowers(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-center">
            {userName}'s Followers
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading followers...</span>
            </div>
          ) : followers.length > 0 ? (
            <div className="space-y-2 overflow-y-auto max-h-[60vh]">
              {followers.map((follower) => {
                const isFollowing = followingStates[follower.user_id] || false;
                const isLoading = loadingStates[follower.user_id] || false;
                const isOwnProfile = currentUser?.id === follower.user_id;

                return (
                  <div
                    key={follower.user_id}
                    className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage 
                        src={follower.profile_picture || undefined} 
                        alt={follower.name}
                      />
                      <AvatarFallback>
                        {follower.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {follower.name}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {follower.email}
                      </p>
                      {follower.bio && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {follower.bio}
                        </p>
                      )}
                    </div>
                    
                    {!isOwnProfile && currentUser && (
                      <Button
                        size="sm"
                        variant={isFollowing ? "outline" : "default"}
                        onClick={() => handleFollowToggle(follower.user_id, follower.name)}
                        disabled={isLoading}
                        className={cn(
                          "transition-all duration-200",
                          isFollowing && "hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                        )}
                      >
                        {isLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : isFollowing ? (
                          <UserCheck className="w-3 h-3 mr-1" />
                        ) : (
                          <UserPlus className="w-3 h-3 mr-1" />
                        )}
                        {isFollowing ? 'Following' : 'Follow'}
                      </Button>
                    )}
                  </div>
                );
              })}
              
              {hasMore && (
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="w-full"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Loading more...
                      </>
                    ) : (
                      'Load More Followers'
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <UserPlus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No followers yet</h3>
              <p className="text-gray-500">
                {userName} doesn't have any followers yet.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FollowersModal;
