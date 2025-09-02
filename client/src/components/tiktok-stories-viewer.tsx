import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Play, 
  Pause, 
  VolumeOff, 
  Volume2, 
  ArrowRight,
  Send,
  MoreHorizontal,
  Eye,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Story, User, StoryComment, StoryLike } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface TikTokStoriesViewerProps {
  onClose: () => void;
}

interface StoryWithUser extends Story {
  user: User;
}

export function TikTokStoriesViewer({ onClose }: TikTokStoriesViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartRef = useRef<{ y: number; time: number } | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Control video playback
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Fetch stories
  const { data: stories = [], isLoading } = useQuery<StoryWithUser[]>({
    queryKey: ['/api/stories'],
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/user/current'],
  });

  const currentStory = stories[currentIndex];

  // Like mutation
  // Flying hearts state
  const [flyingHearts, setFlyingHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);
  
  const likeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/stories/${currentStory?.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionType: 'like' }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories', currentStory?.id, 'likes'] });
      // Add flying heart animation
      const newHeart = {
        id: Date.now(),
        x: Math.random() * window.innerWidth,
        y: window.innerHeight - 100
      };
      setFlyingHearts(prev => [...prev, newHeart]);
      
      // Remove heart after animation
      setTimeout(() => {
        setFlyingHearts(prev => prev.filter(heart => heart.id !== newHeart.id));
      }, 3000);
    },
  });

  // Comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest(`/api/stories/${currentStory?.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories', currentStory?.id, 'comments'] });
      setNewComment('');
      toast({
        title: "تم إضافة التعليق",
        description: "تم إضافة تعليقك بنجاح",
      });
    },
  });

  // Story interactions data
  const { data: likesData } = useQuery<{ likes: (StoryLike & { user: User })[], count: number, hasUserLiked: boolean }>({
    queryKey: ['/api/stories', currentStory?.id, 'likes'],
    enabled: !!currentStory?.id,
  });

  const { data: commentsData } = useQuery<{ comments: (StoryComment & { user: User })[], count: number }>({
    queryKey: ['/api/stories', currentStory?.id, 'comments'],
    enabled: !!currentStory?.id,
  });

  // Progress management
  useEffect(() => {
    if (!isPlaying || !currentStory) return;

    const duration = 8000; // 8 seconds per story
    const increment = 100 / (duration / 100);
    
    progressRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          // Use setTimeout to avoid setState during render
          setTimeout(() => {
            if (currentIndex < stories.length - 1) {
              setCurrentIndex(prevIndex => prevIndex + 1);
            } else {
              onClose();
            }
          }, 0);
          return 0;
        }
        return prev + increment;
      });
    }, 100);

    return () => {
      if (progressRef.current) {
        clearInterval(progressRef.current);
      }
    };
  }, [currentIndex, isPlaying, currentStory, stories.length, onClose]);

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
    setIsPlaying(true);
  }, [currentIndex]);

  // Navigation functions
  const nextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const prevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Enhanced touch gestures for TikTok-style navigation
  const [isDragging, setIsDragging] = useState(false);
  const [dragDistance, setDragDistance] = useState(0);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(false);
    setDragDistance(0);
    touchStartRef.current = {
      y: e.touches[0].clientY,
      time: Date.now()
    };
    setIsPlaying(false); // Pause during interaction
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const deltaY = e.touches[0].clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    
    // Start dragging if moved enough
    if (Math.abs(deltaY) > 10 && deltaTime > 50) {
      setIsDragging(true);
      setDragDistance(deltaY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    const velocity = Math.abs(deltaY) / deltaTime;

    // Enhanced swipe detection with velocity
    if (Math.abs(deltaY) > 80 || velocity > 0.5) {
      if (deltaY > 0) {
        // Swiped down - previous story
        prevStory();
      } else {
        // Swiped up - next story  
        nextStory();
      }
    } else {
      // Resume playing if no significant swipe
      setIsPlaying(true);
    }

    // Reset states
    setIsDragging(false);
    setDragDistance(0);
    touchStartRef.current = null;
  };

  // Double tap to like with position tracking
  const [lastTap, setLastTap] = useState<number>(0);
  
  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const timeDiff = now - lastTap;
    
    if (timeDiff < 300 && timeDiff > 0) {
      // Double tap detected
      e.preventDefault();
      if (currentStory) {
        // Get tap position for heart placement
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const x = 'clientX' in e ? e.clientX : e.touches[0].clientX;
        const y = 'clientY' in e ? e.clientY : e.touches[0].clientY;
        
        // Create immediate visual feedback
        const newHeart = {
          id: Date.now(),
          x: x - 30, // Offset to center the heart
          y: y - 30
        };
        setFlyingHearts(prev => [...prev, newHeart]);
        
        // Remove heart after animation
        setTimeout(() => {
          setFlyingHearts(prev => prev.filter(heart => heart.id !== newHeart.id));
        }, 3000);
        
        // Send like request
        if (!likesData?.hasUserLiked) {
          likeMutation.mutate();
        }
      }
    }
    setLastTap(now);
  };

  const handleAddComment = () => {
    if (newComment.trim() && currentStory) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}د`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}س`;
    } else {
      return `${Math.floor(diffInHours / 24)}ي`;
    }
  };

  if (isLoading || !stories.length) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* Progress indicators */}
      <div className="absolute top-4 left-4 right-4 z-20 flex space-x-1">
        {stories?.map((_, index) => (
          <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: "0%" }}
              animate={{ 
                width: index === currentIndex ? `${progress}%` : index < currentIndex ? "100%" : "0%"
              }}
              transition={{ duration: 0.1 }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-20 z-20 flex items-center space-x-3 space-x-reverse">
        <Avatar className="w-12 h-12 border-2 border-white">
          <AvatarImage src={currentStory?.user?.avatar || undefined} alt={currentStory?.user?.name || 'مستخدم'} />
          <AvatarFallback className="text-black bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            {currentStory?.user?.name?.[0] || 'م'}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-white font-bold text-lg">{currentStory?.user?.name || 'مستخدم'}</h3>
            {currentStory?.user?.isVerified && (
              <VerifiedBadge className="w-5 h-5" />
            )}
          </div>
          <p className="text-white/80 text-sm">
            {currentStory && formatTimeAgo(new Date(currentStory.timestamp || new Date()))}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-white border border-white/50 hover:bg-white/20 text-sm font-medium"
        >
          متابعة
        </Button>
      </div>

      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-8 right-4 z-20 text-white hover:bg-white/20"
      >
        <ArrowRight className="w-6 h-6" />
      </Button>

      {/* Story content with improved gestures */}
      <motion.div 
        ref={containerRef}
        className="w-full h-full flex items-center justify-center relative overflow-hidden"
        style={{
          backgroundColor: currentStory?.backgroundColor || '#000000',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleTap}
        onClick={(e) => {
          // Only handle click if it's not on interactive elements
          if (!((e.target as HTMLElement).closest('video, button'))) {
            setIsPlaying(!isPlaying);
          }
        }}
        animate={{
          y: isDragging ? dragDistance * 0.3 : 0,
          scale: isDragging ? 0.95 : 1
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
      >
        {currentStory?.videoUrl ? (
          <video 
            ref={videoRef}
            src={currentStory.videoUrl} 
            className="w-full h-full object-cover"
            autoPlay={isPlaying}
            loop
            muted={isMuted}
            playsInline
            onClick={(e) => {
              e.stopPropagation();
              setIsPlaying(!isPlaying);
            }}
          />
        ) : currentStory?.imageUrl ? (
          <img 
            src={currentStory.imageUrl} 
            alt="Story" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="p-8 text-center max-w-md">
            <p 
              className="text-3xl font-bold leading-relaxed break-words"
              style={{ color: currentStory?.textColor || '#ffffff' }}
            >
              {currentStory?.content}
            </p>
          </div>
        )}

        {/* Play/Pause overlay */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center bg-black/30"
            >
              <Play className="w-20 h-20 text-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced navigation zones with visual feedback */}
        <div className="absolute inset-0 flex">
          <motion.div 
            className="w-1/3 h-full cursor-pointer flex items-center justify-start pl-4"
            onClick={(e) => {
              e.stopPropagation();
              prevStory();
            }}
            whileTap={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            {currentIndex > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                className="text-white"
              >
                <ChevronUp className="w-8 h-8" />
              </motion.div>
            )}
          </motion.div>
          <div className="w-1/3 h-full" />
          <motion.div 
            className="w-1/3 h-full cursor-pointer flex items-center justify-end pr-4"
            onClick={(e) => {
              e.stopPropagation();
              nextStory();
            }}
            whileTap={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            {currentIndex < stories.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                className="text-white"
              >
                <ChevronDown className="w-8 h-8" />
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Right side actions */}
      <div className="absolute right-4 bottom-32 z-20 flex flex-col items-center space-y-6">
        {/* Like button */}
        <motion.div 
          className="flex flex-col items-center"
          whileTap={{ scale: 0.8 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              likeMutation.mutate();
            }}
            className="text-white hover:bg-white/20 rounded-full w-14 h-14 relative"
          >
            <motion.div
              animate={{ 
                scale: likesData?.hasUserLiked ? [1, 1.2, 1] : 1 
              }}
              transition={{ duration: 0.3 }}
            >
              <Heart 
                className={`w-8 h-8 transition-all duration-300 ${
                  likesData?.hasUserLiked 
                    ? 'fill-red-500 text-red-500 drop-shadow-lg' 
                    : 'text-white hover:text-red-300'
                }`} 
                fill={likesData?.hasUserLiked ? '#EF4444' : 'none'}
              />
            </motion.div>
          </Button>
          <span className="text-white text-sm font-bold mt-1">
            {likesData?.count ? formatCount(likesData.count) : ''}
          </span>
        </motion.div>

        {/* Comment button */}
        <motion.div 
          className="flex flex-col items-center"
          whileTap={{ scale: 0.8 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setShowComments(!showComments);
            }}
            className="text-white hover:bg-white/20 rounded-full w-14 h-14"
          >
            <MessageCircle className="w-8 h-8" />
          </Button>
          <span className="text-white text-sm font-bold mt-1">
            {commentsData?.count ? formatCount(commentsData.count) : ''}
          </span>
        </motion.div>

        {/* Share button */}
        <motion.div 
          className="flex flex-col items-center"
          whileTap={{ scale: 0.8 }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 rounded-full w-14 h-14"
          >
            <Share className="w-8 h-8" />
          </Button>
        </motion.div>

        {/* View count */}
        <div className="flex flex-col items-center">
          <div className="bg-black/50 rounded-full p-2">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-bold mt-1">
            {currentStory?.viewCount ? formatCount(parseInt(currentStory.viewCount)) : '0'}
          </span>
        </div>

        {/* More options */}
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 rounded-full w-14 h-14"
        >
          <MoreHorizontal className="w-8 h-8" />
        </Button>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-8 left-4 right-24 z-20">
        {/* Story description */}
        {currentStory?.content && (
          <div className="mb-4">
            <p className="text-white text-lg font-medium leading-relaxed">
              {currentStory.content}
            </p>
          </div>
        )}

        {/* Volume control */}
        {currentStory?.videoUrl && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(!isMuted);
            }}
            className="text-white hover:bg-white/20 rounded-full w-12 h-12 mb-4"
          >
            {isMuted ? <VolumeOff className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </Button>
        )}
      </div>

      {/* Navigation arrows */}
      <div className="absolute left-1/2 transform -translate-x-1/2 bottom-4 z-20 flex flex-col items-center space-y-2">
        {currentIndex > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={prevStory}
            className="text-white hover:bg-white/20 rounded-full"
          >
            <ChevronUp className="w-6 h-6" />
          </Button>
        )}
        {currentIndex < stories.length - 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={nextStory}
            className="text-white hover:bg-white/20 rounded-full"
          >
            <ChevronDown className="w-6 h-6" />
          </Button>
        )}
      </div>

      {/* Comments panel */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg rounded-t-3xl z-30 max-h-[60vh]"
          >
            <div className="p-6">
              {/* Comments header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-xl font-bold">
                  التعليقات ({commentsData?.count || 0})
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowComments(false)}
                  className="text-white hover:bg-white/20"
                >
                  <ArrowRight className="w-6 h-6" />
                </Button>
              </div>

              {/* Comments list */}
              <ScrollArea className="h-60 mb-4">
                {commentsData?.comments?.filter(Boolean)?.map((comment) => comment && (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 pb-3 border-b border-white/20 last:border-b-0"
                  >
                    <div className="flex items-start space-x-3 space-x-reverse">
                      <Avatar className="w-10 h-10 border-2 border-white/30">
                        <AvatarImage src={comment?.user?.avatar || undefined} alt={comment?.user?.name || 'معلق'} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {comment?.user?.name?.[0] || 'م'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 space-x-reverse mb-1">
                          <span className="text-white font-bold text-sm">{comment?.user?.name || 'مستخدم'}</span>
                          {comment?.user?.isVerified && <VerifiedBadge className="w-4 h-4" />}
                          <span className="text-white/60 text-xs">
                            {formatTimeAgo(new Date(comment?.createdAt || new Date()))}
                          </span>
                        </div>
                        <p className="text-white text-sm leading-relaxed">{comment?.content || ''}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {(!commentsData?.comments?.length) && (
                  <p className="text-white/60 text-center py-8">
                    كن أول من يعلق على هذه الحالة
                  </p>
                )}
              </ScrollArea>

              {/* Add comment */}
              <div className="flex items-center space-x-3 space-x-reverse">
                <Avatar className="w-10 h-10 border-2 border-white/30">
                  <AvatarImage src={currentUser?.avatar || undefined} alt={currentUser?.name} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                    {currentUser?.name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="أضف تعليق جميل..."
                  className="flex-1 bg-white/20 border-white/30 text-white placeholder-white/60 rounded-full px-4 py-3"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || addCommentMutation.isPending}
                  className="text-white hover:bg-white/20 rounded-full"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flying Hearts Animation */}
      <AnimatePresence>
        {flyingHearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ 
              x: heart.x, 
              y: heart.y, 
              scale: 0.5, 
              opacity: 1,
              rotate: 0
            }}
            animate={{ 
              y: heart.y - 200, 
              scale: [0.5, 1.2, 0.8],
              opacity: [1, 0.8, 0],
              rotate: [0, 15, -10, 20, 0],
              x: heart.x + (Math.random() - 0.5) * 100
            }}
            transition={{ 
              duration: 3,
              ease: "easeOut"
            }}
            className="fixed pointer-events-none z-50 text-6xl"
            style={{
              position: 'fixed',
              left: heart.x,
              top: heart.y
            }}
          >
            ❤️
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}