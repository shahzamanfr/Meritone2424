import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FollowService, FollowUser } from '@/lib/follow.service';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FollowersListProps {
  userId: string;
  userName?: string;
  className?: string;
}

export const FollowersList: React.FC<FollowersListProps> = ({
  userId,
  userName,
  className
}) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadFollowers = async (offset: number = 0, append: boolean = false) => {
    try {
      if (offset === 0) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const result = await FollowService.getFollowers(userId, 20, offset);
      
      if (result.success && result.data) {
        if (append) {
          setFollowers(prev => [...prev, ...result.data!]);
        } else {
          setFollowers(result.data);
        }
        setHasMore(result.hasMore);
      } else {
        setError(result.error || 'Failed to load followers');
      }
    } catch (error) {
      console.error('Error loading followers:', error);
      setError('Failed to load followers');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadFollowers();
  }, [userId]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadFollowers(followers.length, true);
    }
  };

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading followers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => loadFollowers()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (followers.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-gray-500">
          {userName ? `${userName} has no followers yet` : 'No followers yet'}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {userName ? `${userName}'s Followers` : 'Followers'} ({followers.length})
        </h2>
      </div>

      <div className="space-y-3">
        {followers.map((follower) => (
          <Card key={follower.user_id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Avatar 
                  className="w-12 h-12 cursor-pointer"
                  onClick={() => handleUserClick(follower.user_id)}
                >
                  <AvatarImage 
                    src={follower.profile_picture || undefined} 
                    alt={follower.name} 
                  />
                  <AvatarFallback>
                    {follower.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 
                      className="font-medium text-gray-900 cursor-pointer hover:text-primary"
                      onClick={() => handleUserClick(follower.user_id)}
                    >
                      {follower.name}
                    </h3>
                    {currentUser?.id === follower.user_id && (
                      <Badge variant="secondary" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-500 truncate">{follower.email}</p>
                  
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-400">
                    {follower.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{follower.location}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>Joined {new Date(follower.created_at).getFullYear()}</span>
                    </div>
                  </div>
                  
                  {follower.bio && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {follower.bio}
                    </p>
                  )}
                </div>

                {currentUser?.id !== follower.user_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUserClick(follower.user_id)}
                  >
                    View Profile
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {hasMore && (
        <div className="text-center pt-4">
          <Button
            onClick={handleLoadMore}
            disabled={loadingMore}
            variant="outline"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default FollowersList;
