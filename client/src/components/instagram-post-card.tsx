import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, 
  Play, Pause, Volume2, VolumeX, MapPin, Verified, Crown,
  Send, Smile, Camera, Tag, ShoppingBag, Eye, ChevronLeft, ChevronRight,
  User as UserIcon, ExternalLink, X
} from "lucide-react";
import type { User, BizChatPost } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface PostWithUser extends BizChatPost {
  user: User;
  isLiked?: boolean;
  isSaved?: boolean;
  isFollowing?: boolean;
}

interface InstagramPostCardProps {
  post: PostWithUser;
  currentUser?: User;
}

export function InstagramPostCard({ post, currentUser }: InstagramPostCardProps) {
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [hasBeenViewed, setHasBeenViewed] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const postRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // إعجاب بالمنشور
  const likeMutation = useMutation({
    mutationFn: async ({ action }: { action: 'like' | 'unlike' }) => {
      return apiRequest(`/api/posts/${post.id}/interactions`, {
        method: "POST",
        body: JSON.stringify({ 
          interactionType: action === 'like' ? 'like' : 'unlike'
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/social/unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/social"] });
    },
  });

  // حفظ المنشور
  const saveMutation = useMutation({
    mutationFn: async ({ action }: { action: 'save' | 'unsave' }) => {
      return apiRequest(`/api/posts/${post.id}/interactions`, {
        method: "POST",
        body: JSON.stringify({ 
          interactionType: action === 'save' ? 'save' : 'unsave'
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-feed"] });
    },
  });

  // متابعة مستخدم
  const followMutation = useMutation({
    mutationFn: async ({ action }: { action: 'follow' | 'unfollow' }) => {
      return apiRequest(`/api/users/${post.user.id}/follow`, {
        method: action === 'follow' ? "POST" : "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/social/unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/social"] });
      toast({
        title: "تم بنجاح",
        description: "تم تحديث حالة المتابعة",
      });
    },
  });

  // إضافة تعليق
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest(`/api/posts/${post.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/social/unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/social"] });
      setCommentText("");
      toast({
        title: "تم إضافة التعليق",
        description: "تم نشر تعليقك بنجاح",
      });
    },
  });

  // تتبع مشاهدة المنشور
  const viewMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/posts/${post.id}/view`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-feed"] });
    },
  });

  // تتبع المشاهدة باستخدام Intersection Observer
  useEffect(() => {
    if (!postRef.current || hasBeenViewed || !currentUser) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // إذا كان المنشور مرئي بنسبة 50% أو أكثر لمدة 1 ثانية
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const timer = setTimeout(() => {
              if (!hasBeenViewed && entry.isIntersecting) {
                setHasBeenViewed(true);
                viewMutation.mutate();
              }
            }, 1000); // انتظار ثانية واحدة قبل تسجيل المشاهدة
            
            return () => clearTimeout(timer);
          }
        });
      },
      {
        threshold: 0.5, // 50% من المنشور يجب أن يكون مرئي
        rootMargin: '0px' // بدون هامش إضافي
      }
    );

    observer.observe(postRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, [hasBeenViewed, currentUser, viewMutation]);

  const formatTime = (timestamp: string | Date | null) => {
    if (!timestamp) return "منذ دقائق";
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "منذ دقائق";
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    if (diffInHours < 168) return `منذ ${Math.floor(diffInHours / 24)} أيام`;
    return postTime.toLocaleDateString('ar');
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}م`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}ك`;
    return num.toString();
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const toggleVideoMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!post.images || post.images.length <= 1) return;
    
    if (direction === 'next') {
      setCurrentImageIndex((prev) => 
        prev === post.images!.length - 1 ? 0 : prev + 1
      );
    } else {
      setCurrentImageIndex((prev) => 
        prev === 0 ? post.images!.length - 1 : prev - 1
      );
    }
  };

  const handleDoubleClick = () => {
    if (!post.isLiked) {
      likeMutation.mutate({ action: 'like' });
    }
  };

  const handleUserProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowUserProfile(true);
  };

  const handleVisitUserProfile = () => {
    setShowUserProfile(false);
    setLocation(`/user-profile/${post.user.id}`);
  };

  const isLongCaption = post.content && post.content.length > 100;
  const displayedCaption = showFullCaption || !isLongCaption 
    ? post.content 
    : post.content?.substring(0, 100) + "...";

  return (
    <>
      <div 
        ref={postRef}
        className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1 backdrop-blur-xl border-white/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-3">
            <Avatar 
              className="w-10 h-10 cursor-pointer ring-2 ring-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 hover:ring-4 hover:ring-green-500 transition-all duration-300 hover:scale-110 shadow-lg"
              onClick={handleUserProfileClick}
              data-testid={`avatar-user-${post.user.id}`}
            >
              <AvatarImage src={post.user.avatar || undefined} />
              <AvatarFallback className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                {post.user.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUserProfileClick}
                  className="font-semibold text-sm text-gray-900 dark:text-white hover:text-green-600 cursor-pointer transition-colors"
                  data-testid={`button-user-name-${post.user.id}`}
                >
                  {post.user.name}
                </button>
                {post.user.isVerified && (
                  <Verified className="w-4 h-4 text-blue-500 fill-current" />
                )}
                {post.businessInfo?.businessName && (
                  <Crown className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span>{formatTime(post.createdAt)}</span>
                {post.locationInfo?.name && (
                  <>
                    <span>•</span>
                    <MapPin className="w-3 h-3" />
                    <span>{post.locationInfo.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!post.isFollowing && post.user.id !== currentUser?.id && (
              <Button
                size="sm"
                onClick={() => followMutation.mutate({ action: 'follow' })}
                disabled={followMutation.isPending}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-transparent border-none p-0 h-auto"
                data-testid={`button-follow-${post.id}`}
              >
                متابعة
              </Button>
            )}
            
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Media Content */}
        <div className="relative group">
          {/* صور المنشور */}
          {post.images && Array.isArray(post.images) && post.images.length > 0 && (
            <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <img
                src={post.images[currentImageIndex]}
                alt={`منشور ${post.user.name}`}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setShowImageViewer(true)}
                onDoubleClick={handleDoubleClick}
                data-testid={`image-post-${post.id}`}
              />
              
              {/* Navigation arrows for multiple images */}
              {post.images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => navigateImage('prev')}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => navigateImage('next')}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  
                  {/* Dots indicator */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1">
                    {post.images.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentImageIndex 
                            ? 'bg-white' 
                            : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* وسوم المنتجات */}
              {post.taggedProducts && post.taggedProducts.length > 0 && (
                <>
                  {post.taggedProducts.map((product, index) => (
                    <div
                      key={index}
                      className="absolute w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform animate-pulse"
                      style={{
                        left: `${product.position.x}%`,
                        top: `${product.position.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      data-testid={`product-tag-${index}`}
                    >
                      <ShoppingBag className="w-3 h-3 text-gray-700" />
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* فيديو المنشور */}
          {post.videoUrl && (
            <div className="relative aspect-square bg-black overflow-hidden">
              <video
                ref={videoRef}
                src={post.videoUrl}
                className="w-full h-full object-cover cursor-pointer"
                onClick={handleVideoClick}
                onDoubleClick={handleDoubleClick}
                loop
                muted={isVideoMuted}
                playsInline
                data-testid={`video-post-${post.id}`}
              />
              
              {/* Video controls */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {!isVideoPlaying && (
                  <div className="w-16 h-16 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute bottom-4 right-4 bg-black/30 hover:bg-black/50 text-white rounded-full w-8 h-8"
                onClick={toggleVideoMute}
              >
                {isVideoMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => likeMutation.mutate({ 
                  action: post.isLiked ? 'unlike' : 'like' 
                })}
                disabled={likeMutation.isPending}
                className="p-0 h-auto hover:bg-transparent group"
                data-testid={`button-like-${post.id}`}
              >
                <Heart className={`w-6 h-6 transition-all duration-500 transform ${
                  post.isLiked 
                    ? 'fill-current text-red-500 scale-125 animate-pulse' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-red-400 group-hover:scale-125 hover:drop-shadow-lg'
                } hover:filter hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]`} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(true)}
                className="p-0 h-auto hover:bg-transparent group"
                data-testid={`button-comment-${post.id}`}
              >
                <MessageCircle className="w-6 h-6 text-gray-700 dark:text-gray-300 hover:text-blue-500 group-hover:scale-125 transition-all duration-500 hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.6)] hover:rotate-12" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto hover:bg-transparent group"
                data-testid={`button-share-${post.id}`}
              >
                <Share2 className="w-6 h-6 text-gray-700 dark:text-gray-300 hover:text-green-500 group-hover:scale-125 transition-all duration-500 hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.6)] hover:-rotate-12" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => saveMutation.mutate({ 
                action: post.isSaved ? 'unsave' : 'save' 
              })}
              disabled={saveMutation.isPending}
              className="p-0 h-auto hover:bg-transparent group"
              data-testid={`button-save-${post.id}`}
            >
              <Bookmark className={`w-6 h-6 transition-all duration-500 transform ${
                post.isSaved 
                  ? 'fill-current text-yellow-500 scale-125 animate-bounce' 
                  : 'text-gray-700 dark:text-gray-300 hover:text-yellow-500 group-hover:scale-125 hover:drop-shadow-lg'
              } hover:filter hover:drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]`} />
            </Button>
          </div>

          {/* Views and Likes count */}
          <div className="mt-2 space-y-1">
            {/* Views count */}
            {(post.viewsCount || 0) > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {formatNumber(post.viewsCount || 0)} مشاهدة
                </span>
              </div>
            )}
            
            {/* Likes count */}
            {(post.likesCount || 0) > 0 && (
              <div>
                <span className="font-semibold text-sm text-gray-900 dark:text-white">
                  {formatNumber(post.likesCount || 0)} إعجاب
                </span>
              </div>
            )}
          </div>

          {/* Caption */}
          {post.content && (
            <div className="mt-2 text-sm">
              <span className="font-semibold text-gray-900 dark:text-white ml-2">
                {post.user.name}
              </span>
              <span className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {displayedCaption}
              </span>
              {isLongCaption && (
                <button
                  onClick={() => setShowFullCaption(!showFullCaption)}
                  className="text-gray-500 hover:text-gray-700 ml-1"
                >
                  {showFullCaption ? 'إخفاء' : 'المزيد'}
                </button>
              )}
              
              {/* الهاشتاغات */}
              {post.hashtags && post.hashtags.length > 0 && (
                <div className="mt-1">
                  {post.hashtags.map((hashtag, index) => (
                    <span key={index} className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium ml-1">
                      #{hashtag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Comments preview */}
          {(post.commentsCount || 0) > 0 && (
            <button
              onClick={() => setShowComments(true)}
              className="mt-2 text-sm text-gray-500 hover:text-gray-700"
            >
              عرض جميع التعليقات البالغة {formatNumber(post.commentsCount || 0)}
            </button>
          )}

          {/* Add comment */}
          <div className="flex items-center gap-3 mt-3 pb-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={currentUser?.avatar || undefined} />
              <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                {currentUser?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <Input
              placeholder="أضف تعليقاً..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && commentText.trim()) {
                  addCommentMutation.mutate(commentText.trim());
                }
              }}
              className="border-none bg-transparent text-sm placeholder:text-gray-400 focus-visible:ring-0 p-0"
              data-testid={`input-comment-${post.id}`}
            />
            {commentText.trim() && (
              <Button
                size="sm"
                onClick={() => addCommentMutation.mutate(commentText.trim())}
                disabled={addCommentMutation.isPending}
                className="text-blue-600 hover:text-blue-700 bg-transparent border-none p-0 h-auto font-semibold text-sm"
              >
                نشر
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      <Dialog open={showImageViewer} onOpenChange={setShowImageViewer}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 bg-black border-none">
          {post.images && post.images.length > 0 && (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={post.images[currentImageIndex]}
                alt={`صورة ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
              
              {post.images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                    onClick={() => navigateImage('prev')}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                    onClick={() => navigateImage('next')}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Comments Modal */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="max-w-lg max-h-[80vh] p-0">
          <div className="border-b p-4">
            <h3 className="font-semibold text-center">التعليقات</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-center py-8 text-gray-500">
              لا توجد تعليقات بعد. كن أول من يعلق!
            </div>
          </div>
          <div className="border-t p-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={currentUser?.avatar || undefined} />
                <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                  {currentUser?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Input
                placeholder="أضف تعليقاً..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && commentText.trim()) {
                    addCommentMutation.mutate(commentText.trim());
                  }
                }}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={() => addCommentMutation.mutate(commentText.trim())}
                disabled={!commentText.trim() || addCommentMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Profile Preview Modal */}
      <Dialog open={showUserProfile} onOpenChange={setShowUserProfile}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl">
          <DialogHeader className="text-center pb-2">
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-4 w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setShowUserProfile(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>
          
          <div className="flex flex-col items-center text-center space-y-4 pb-6">
            {/* Profile Picture */}
            <div className="relative">
              <Avatar className="w-24 h-24 ring-4 ring-gradient-to-r from-green-400 via-emerald-500 to-teal-500 shadow-2xl">
                <AvatarImage 
                  src={post.user.avatar || undefined} 
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-2xl font-bold">
                  {post.user.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              {/* Status indicators */}
              {post.user.isOnline && (
                <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-gray-900 shadow-lg"></div>
              )}
            </div>

            {/* User Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {post.user.name}
                </h3>
                {post.user.isVerified && (
                  <Verified className="w-5 h-5 text-blue-500 fill-current" />
                )}
                {post.businessInfo?.businessName && (
                  <Crown className="w-5 h-5 text-yellow-500" />
                )}
              </div>

              {/* Business info */}
              {post.businessInfo?.businessName && (
                <div className="space-y-1">
                  <Badge variant="secondary" className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border-none">
                    {post.businessInfo.businessName}
                  </Badge>
                  {post.businessInfo.category && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {post.businessInfo.category}
                    </p>
                  )}
                </div>
              )}

              {/* Location */}
              {post.user.location && (
                <div className="flex items-center justify-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>{post.user.location}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2 w-full">
              {post.user.id !== currentUser?.id && (
                <Button
                  onClick={() => followMutation.mutate({ 
                    action: post.isFollowing ? 'unfollow' : 'follow' 
                  })}
                  disabled={followMutation.isPending}
                  variant={post.isFollowing ? "outline" : "default"}
                  className={`flex-1 ${
                    !post.isFollowing 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0'
                      : 'border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                  }`}
                  data-testid={`button-follow-modal-${post.user.id}`}
                >
                  <UserIcon className="w-4 h-4 ml-2" />
                  {post.isFollowing ? 'إلغاء المتابعة' : 'متابعة'}
                </Button>
              )}
              
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleVisitUserProfile();
                }}
                variant="outline"
                className="flex-1 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                data-testid={`button-visit-profile-${post.user.id}`}
              >
                <ExternalLink className="w-4 h-4 ml-2" />
                زيارة الملف الشخصي
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}