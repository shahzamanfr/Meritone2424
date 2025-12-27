import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { FollowService, FollowRelationship, FollowResult } from '@/lib/follow.service';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  targetUserId: string;
  targetUserName?: string;
  onFollowChange?: (relationship: FollowRelationship) => void;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  showUnfollowConfirm?: boolean;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  targetUserId,
  targetUserName,
  onFollowChange,
  className,
  size = 'default',
  variant = 'default',
  showUnfollowConfirm = true
}) => {
  const { user: currentUser } = useAuth();
  const [relationship, setRelationship] = useState<FollowRelationship>({
    isFollowing: false,
    followerCount: 0,
    followingCount: 0
  });
  const [loading, setLoading] = useState(false);
  const [optimisticState, setOptimisticState] = useState<boolean | null>(null);
  const [showUnfollowDialog, setShowUnfollowDialog] = useState(false);

  // Don't show button if user is trying to follow themselves
  if (currentUser?.id === targetUserId) {
    return null;
  }

  // Load initial relationship
  useEffect(() => {
    const loadRelationship = async () => {
      try {
        const relationshipData = await FollowService.getRelationship(targetUserId);
        setRelationship(relationshipData);
      } catch (error) {
        console.error('Error loading relationship:', error);
      }
    };

    loadRelationship();
  }, [targetUserId]);

  const handleFollowToggle = async () => {
    if (!currentUser) {
      return;
    }

    // Store original state for rollback
    const originalRelationship = { ...relationship };
    const newFollowingState = !relationship.isFollowing;

    // Optimistic update
    setOptimisticState(newFollowingState);
    setLoading(true);

    // Optimistically update the relationship for immediate UI feedback
    const optimisticRelationship: FollowRelationship = {
      isFollowing: newFollowingState,
      followerCount: newFollowingState
        ? relationship.followerCount + 1
        : Math.max(0, relationship.followerCount - 1),
      followingCount: relationship.followingCount
    };

    setRelationship(optimisticRelationship);
    onFollowChange?.(optimisticRelationship);

    try {
      const result: FollowResult = await FollowService.toggleFollow(targetUserId, relationship.isFollowing);

      if (result.success) {
        // Update with actual server response
        const updatedRelationship: FollowRelationship = {
          isFollowing: newFollowingState,
          followerCount: result.followerCount || relationship.followerCount,
          followingCount: result.followingCount || relationship.followingCount
        };

        setRelationship(updatedRelationship);
        onFollowChange?.(updatedRelationship);
        setOptimisticState(null);
      } else {
        // Revert optimistic update on error
        setOptimisticState(null);
        setRelationship(originalRelationship);
        onFollowChange?.(originalRelationship);

        console.error('Follow toggle failed:', result.error);
        // Show error message to user
        alert(`Failed to ${newFollowingState ? 'follow' : 'unfollow'} user: ${result.error}`);
      }
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticState(null);
      setRelationship(originalRelationship);
      onFollowChange?.(originalRelationship);

      console.error('Follow toggle error:', error);
      alert(`Failed to ${newFollowingState ? 'follow' : 'unfollow'} user. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollowClick = () => {
    if (showUnfollowConfirm) {
      setShowUnfollowDialog(true);
    } else {
      handleFollowToggle();
    }
  };

  const confirmUnfollow = () => {
    setShowUnfollowDialog(false);
    handleFollowToggle();
  };

  const isFollowing = optimisticState !== null ? optimisticState : relationship.isFollowing;
  const buttonText = isFollowing ? 'Following' : 'Follow';
  const ButtonIcon = isFollowing ? UserCheck : UserPlus;

  return (
    <>
      <Button
        onClick={isFollowing ? handleUnfollowClick : handleFollowToggle}
        disabled={loading}
        size={size}
        variant={isFollowing ? 'outline' : variant}
        className={cn(
          'transition-all duration-200 rounded-md',
          isFollowing && 'hover:bg-gray-100 hover:text-gray-900 hover:border-gray-400',
          className
        )}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <ButtonIcon className="w-4 h-4 mr-2" />
        )}
        {buttonText}
      </Button>

      {/* Unfollow confirmation dialog */}
      {showUnfollowDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 max-w-sm mx-4 shadow-2xl border border-gray-200">
            <h3 className="text-xl font-bold mb-2 text-gray-900">Unfollow {targetUserName || 'User'}?</h3>
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">
              You won't see their updates in your feed anymore. This can be undone at any time.
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowUnfollowDialog(false)}
                className="flex-1 rounded-md border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmUnfollow}
                className="flex-1 bg-gray-900 hover:bg-black text-white rounded-md transition-colors"
              >
                Unfollow
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FollowButton;
