import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { X, Play, Pause, ChevronLeft, ChevronRight, MessageCircle, Heart, MessageSquare, Send, Share, VolumeOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Story, User, StoryComment, StoryLike } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { createStoryProgressManager, createStoryNavigator } from "@/utils/story-management";

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
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
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

  // Story likes and comments queries
  const { data: likesData } = useQuery<{ likes: (StoryLike & { user: User })[], count: number, hasUserLiked: boolean }>({
    queryKey: ['/api/stories', storyId, 'likes'],
    enabled: !!storyId,
  });

  const { data: commentsData } = useQuery<{ comments: (StoryComment & { user: User })[], count: number }>({
    queryKey: ['/api/stories', storyId, 'comments'],
    enabled: !!storyId,
  });

  // Like/unlike mutations
  const likeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/stories/${storyId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionType: 'like' }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories', storyId, 'likes'] });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/stories/${storyId}/like`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories', storyId, 'likes'] });
    },
  });

  // Comment mutations
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest(`/api/stories/${storyId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories', storyId, 'comments'] });
      setNewComment('');
    },
  });

  const handleLikeToggle = () => {
    if (likesData?.hasUserLiked) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  // Mark story as viewed when component mounts
  useEffect(() => {
    if (storyId && story) {
      viewStoryMutation.mutate();
    }
  }, [storyId, story]);

  // Auto-progress story with safe utilities
  useEffect(() => {
    if (!isPlaying) return;
    
    const navigator = createStoryNavigator(onNext, undefined, onClose);
    const progressManager = createStoryProgressManager(
      setProgress,
      navigator.close,
      5000 // 5 second duration
    );
    
    progressManager.start();
    
    return () => {
      progressManager.stop();
    };
  }, [isPlaying, onNext, onClose]);

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
    setIsPlaying(true);
  }, [storyId]);

  // Handle video play/pause when isPlaying state changes
  useEffect(() => {
    const video = document.querySelector('[data-testid="story-video"]') as HTMLVideoElement;
    if (video) {
      if (isPlaying) {
        video.play().catch(console.error);
      } else {
        video.pause();
      }
    }
  }, [isPlaying]);

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return '';
    
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
            {story.videoUrl && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                className="text-white hover:bg-white hover:bg-opacity-20"
                data-testid="button-toggle-mute"
              >
                {isMuted ? <VolumeOff className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
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
          {story.videoUrl ? (
            <video 
              src={story.videoUrl} 
              className="w-full h-full object-cover"
              autoPlay={isPlaying}
              loop
              muted={isMuted}
              playsInline
              data-testid="story-video"
              onLoadedData={(e) => {
                // Ensure video plays/pauses based on isPlaying state
                const video = e.target as HTMLVideoElement;
                if (isPlaying) {
                  video.play().catch(console.error);
                } else {
                  video.pause();
                }
              }}
            />
          ) : story.imageUrl ? (
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
            className="absolute right-4 top-16 text-white hover:bg-white hover:bg-opacity-20"
            data-testid="button-next-story"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}

        {/* Story Actions - Right Side */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col space-y-4">
          {/* Like Button */}
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLikeToggle}
              disabled={likeMutation.isPending || unlikeMutation.isPending}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-12 h-12"
              data-testid="button-like-story"
            >
              <Heart className={`h-6 w-6 ${likesData?.hasUserLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            {(likesData?.count || 0) > 0 && (
              <span className="text-white text-sm mt-1">{likesData?.count}</span>
            )}
          </div>

          {/* Comments Button */}
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowComments(!showComments)}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-12 h-12"
              data-testid="button-comments-story"
            >
              <MessageSquare className="h-6 w-6" />
            </Button>
            {(commentsData?.count || 0) > 0 && (
              <span className="text-white text-sm mt-1">{commentsData?.count}</span>
            )}
          </div>

          {/* Share Button */}
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-12 h-12"
              data-testid="button-share-story"
            >
              <Share className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* View Count - Bottom Right */}
        <div className="absolute bottom-4 right-4">
          <div className="bg-black bg-opacity-50 rounded-full px-3 py-1">
            <span className="text-white text-sm">👁 {story.viewCount}</span>
          </div>
        </div>

        {/* Comments Panel */}
        {showComments && (
          <div className="absolute bottom-20 left-4 right-4 bg-black bg-opacity-80 rounded-lg p-4 max-h-60">
            {/* Comments List */}
            <ScrollArea className="h-32 mb-3">
              {commentsData?.comments?.map((comment) => (
                <div key={comment.id} className="mb-3 pb-2 border-b border-white border-opacity-20 last:border-b-0">
                  <div className="flex items-start space-x-2 space-x-reverse">
                    <Avatar className="w-8 h-8 ring-2 ring-white ring-opacity-30">
                      <AvatarImage src={comment.user.avatar || undefined} alt={comment.user.name} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                        {comment.user.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 space-x-reverse mb-1">
                        <span className="text-white text-sm font-bold">{comment.user.name}</span>
                        {comment.user.isVerified && (
                          <VerifiedBadge className="w-4 h-4" title="حساب موثق" animated={false} />
                        )}
                        <span className="text-white text-opacity-70 text-xs">
                          {formatTimeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-white text-sm leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              {(!commentsData?.comments || commentsData.comments.length === 0) && (
                <p className="text-white text-opacity-60 text-sm text-center py-4">
                  لا توجد تعليقات بعد
                </p>
              )}
            </ScrollArea>

            {/* Add Comment */}
            <div className="flex items-center space-x-3 space-x-reverse">
              {/* Current User Avatar */}
              <Avatar className="w-8 h-8 ring-2 ring-white ring-opacity-30">
                <AvatarImage src={currentUser?.avatar || undefined} alt={currentUser?.name} />
                <AvatarFallback className="text-xs bg-gradient-to-br from-green-500 to-emerald-600 text-white font-semibold">
                  {currentUser?.name?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="أضف تعليق..."
                className="flex-1 bg-white bg-opacity-20 border-white border-opacity-30 text-white placeholder-white placeholder-opacity-60"
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                data-testid="input-add-comment"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAddComment}
                disabled={!newComment.trim() || addCommentMutation.isPending}
                className="text-white hover:bg-white hover:bg-opacity-20"
                data-testid="button-send-comment"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}