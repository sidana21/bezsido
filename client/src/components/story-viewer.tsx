import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { X, Play, Pause, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { Story, User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface StoryViewerProps {
  storyId: string;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

interface StoryWithUser extends Story {
  user: User;
}

export function StoryViewer({ storyId, onClose, onNext, onPrevious }: StoryViewerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: story, isLoading } = useQuery<StoryWithUser>({
    queryKey: ['/api/stories', storyId],
    enabled: !!storyId,
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/user/current'],
  });

  const viewStoryMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/stories/${storyId}/view`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
    },
  });

  const startChatMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
      return apiRequest("/api/chats/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId }),
      });
    },
    onSuccess: (data: any) => {
      setLocation(`/chat/${data.chatId}`);
    },
  });

  // Mark story as viewed when component mounts
  useEffect(() => {
    if (storyId && story) {
      viewStoryMutation.mutate();
    }
  }, [storyId, story]);

  // Auto-progress story
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (onNext) {
            // Move to next story automatically
          } else {
            onClose();
          }
          return 100;
        }
        return prev + 1;
      });
    }, 50); // 5 second story duration (50ms * 100 = 5000ms)

    return () => clearInterval(interval);
  }, [isPlaying, onNext, onClose]);

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
    setIsPlaying(true);
  }, [storyId]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `منذ ${minutes} دقيقة`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `منذ ${hours} ساعة`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `منذ ${days} يوم`;
    }
  };

  if (isLoading || !story) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
        <div className="text-white">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      data-testid="story-viewer"
    >
      <div className="relative w-full max-w-md h-full md:h-auto md:max-h-[80vh] bg-black md:rounded-lg overflow-hidden">
        {/* Progress Bar */}
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="w-full bg-white bg-opacity-30 rounded-full h-1">
            <div 
              className="bg-white rounded-full h-1 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Header */}
        <div className="absolute top-8 left-4 right-4 z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <Avatar className="w-10 h-10 border-2 border-white">
              <AvatarImage src={story.user.avatar || undefined} alt={story.user.name} />
              <AvatarFallback className="text-black">{story.user.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-white font-medium text-sm">{story.user.name}</h3>
                {story.user.isVerified && (
                  <VerifiedBadge className="w-3.5 h-3.5" />
                )}
              </div>
              <p className="text-white text-opacity-80 text-xs">
                {formatTimeAgo(story.timestamp || new Date())}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 space-x-reverse">
            {currentUser?.id !== story.userId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => startChatMutation.mutate(story.userId)}
                disabled={startChatMutation.isPending}
                className="text-white hover:bg-white hover:bg-opacity-20"
                data-testid="button-message-story-owner"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-white hover:bg-white hover:bg-opacity-20"
              data-testid="button-play-pause"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20"
              data-testid="button-close-story"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Story Content */}
        <div 
          className="w-full h-full flex items-center justify-center"
          style={{
            backgroundColor: story.backgroundColor || '#075e54',
          }}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {story.imageUrl ? (
            <img 
              src={story.imageUrl} 
              alt="Story" 
              className="w-full h-full object-cover"
              data-testid="story-image"
            />
          ) : (
            <div className="p-8 text-center">
              <p 
                className="text-2xl font-medium leading-relaxed break-words"
                style={{ color: story.textColor || '#ffffff' }}
                data-testid="story-text"
              >
                {story.content}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        {onPrevious && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPrevious()}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white hover:bg-opacity-20"
            data-testid="button-previous-story"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}
        
        {onNext && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNext()}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white hover:bg-opacity-20"
            data-testid="button-next-story"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}

        {/* View Count */}
        <div className="absolute bottom-4 right-4">
          <div className="bg-black bg-opacity-50 rounded-full px-3 py-1">
            <span className="text-white text-sm">👁 {story.viewCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}