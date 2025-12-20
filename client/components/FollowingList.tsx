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

interface FollowingListProps {
  userId: string;
  userName?: string;
  className?: string;
}

export const FollowingList: React.FC<FollowingListProps> = ({
  userId,
  userName,
  className
}) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadFollowing = async (offset: number = 0, append: boolean = false) => {
    try {
      if (offset === 0) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const result = await FollowService.getFollowing(userId, 20, offset);
      
      if (result.success && result.data) {
        if (append) {
          setFollowing(prev => [...prev, ...result.data!]);
        } else {
          setFollowing(result.data);
        }
        setHasMore(result.hasMore);
      } else {
        setError(result.error || 'Failed to load following');
      }
    } catch (error) {
      console.error('Error loading following:', error);
      setError('Failed to load following');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadFollowing();
  }, [userId]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadFollowing(following.length, true);
    }
  };

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading following...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => loadFollowing()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (following.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-gray-500">
          {userName ? `${userName} is not following anyone yet` : 'Not following anyone yet'}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {userName ? `${userName} is Following` : 'Following'} ({following.length})
        </h2>
      </div>

      <div className="space-y-3">
        {following.map((user) => (
          <Card key={user.user_id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Avatar 
                  className="w-12 h-12 cursor-pointer"
                  onClick={() => handleUserClick(user.user_id)}
                >
                  <AvatarImage 
                    src={user.profile_picture || undefined} 
                    alt={user.name} 
                  />
                  <AvatarFallback>
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 
                      className="font-medium text-gray-900 cursor-pointer hover:text-primary"
                      onClick={() => handleUserClick(user.user_id)}
                    >
                      {user.name}
                    </h3>
                    {currentUser?.id === user.user_id && (
                      <Badge variant="secondary" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-400">
                    {user.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{user.location}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>Joined {new Date(user.created_at).getFullYear()}</span>
                    </div>
                  </div>
                  
                  {user.bio && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {user.bio}
                    </p>
                  )}
                </div>

                {currentUser?.id !== user.user_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUserClick(user.user_id)}
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

export default FollowingList;
