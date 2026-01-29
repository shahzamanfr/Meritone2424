import React from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useToast } from "@/hooks/use-toast";

type Props = {
  userId: string;
  userName?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
};

export const MessageButton: React.FC<Props> = ({ userId, userName, className, variant = "outline" }) => {
  const { user } = useAuth();
  const { isProfileComplete } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isInvalidTarget = !userId || userId === "current-user";

  return (
    <Button
      onClick={() => {
        if (!user) {
          navigate("/signin");
          return;
        }
        if (isInvalidTarget) return;

        if (userId === user.id) {
          toast({
            title: "You can't message yourself",
            description: "You cannot start a conversation with your own account.",
            variant: "destructive",
          });
          return;
        }

        // Check if profile is complete
        if (!isProfileComplete) {
          toast({
            title: "Complete your profile",
            description: "Please add a bio and at least one skill to send messages",
            variant: "destructive"
          });
          navigate('/edit-profile');
          return;
        }

        navigate("/messages", { state: { openWithUserId: userId } });
      }}
      variant={variant}
      className={cn("text-sm", className)}
      disabled={isInvalidTarget}
      title={userName ? `Message ${userName}` : "Message"}
    >
      <MessageCircle className="w-4 h-4 sm:mr-2" />
      <span className="hidden sm:inline">Message</span>
    </Button>
  );
};


