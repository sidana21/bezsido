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
  User as UserIcon, ExternalLink, X, UserPlus
} from "lucide-react";
import type { User, BizChatPost } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface PostWithUser extends BizChatPost {
  user: User;
  isLiked?: boolean;
  isSaved?: boolean;
  isFollowing?: boolean;
}

interface TikTokPostCardProps {
  post: PostWithUser;
  currentUser?: User;
  isActive?: boolean;
}

interface FlyingHeart {
  id: string;
  x: number;
  y: number;
}

export function TikTokPostCard({ post, currentUser, isActive = false }: TikTokPostCardProps) {
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [hasBeenViewed, setHasBeenViewed] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [flyingHearts, setFlyingHearts] = useState<FlyingHeart[]>([]);
  const [pulseButtons, setPulseButtons] = useState<{[key: string]: boolean}>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const postRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // إعجاب بالمنشور مع تأثير القلوب المتطايرة
  const likeMutation = useMutation({
    mutationFn: async ({ action }: { action: 'like' | 'unlike' }) => {
      return apiRequest(`/api/posts/${post.id}/interactions`, {
        method: "POST",
        body: JSON.stringify({ 
          interactionType: action === 'like' ? 'like' : 'unlike'
        }),
      });
    },
    onSuccess: (_, { action }) => {
      if (action === 'like') {
        createFlyingHearts();
      }
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

  // دالة إنشاء القلوب المتطايرة
  const createFlyingHearts = () => {
    const newHearts: FlyingHeart[] = [];
    for (let i = 0; i < 5; i++) {
      newHearts.push({
        id: `heart-${Date.now()}-${i}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
      });
    }
    setFlyingHearts(newHearts);
    
    // إزالة القلوب بعد انتهاء الانيميشن
    setTimeout(() => {
      setFlyingHearts([]);
    }, 2000);
  };

  // دالة تفعيل نبض الأزرار
  const activateButtonPulse = (buttonId: string) => {
    setPulseButtons(prev => ({ ...prev, [buttonId]: true }));
    setTimeout(() => {
      setPulseButtons(prev => ({ ...prev, [buttonId]: false }));
    }, 300);
  };

  // تتبع المشاهدة باستخدام Intersection Observer
  useEffect(() => {
    if (!postRef.current || hasBeenViewed || !currentUser) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
            const timer = setTimeout(() => {
              if (!hasBeenViewed && entry.isIntersecting) {
                setHasBeenViewed(true);
                viewMutation.mutate();
              }
            }, 1000);
            
            return () => clearTimeout(timer);
          }
        });
      },
      {
        threshold: 0.7,
        rootMargin: '0px'
      }
    );

    observer.observe(postRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, [hasBeenViewed, currentUser, viewMutation]);

  // إدارة تشغيل الفيديو
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch(() => {
        // إذا فشل التشغيل التلقائي، ننتظر تفاعل المستخدم
      });
    } else {
      video.pause();
    }
  }, [isActive]);

  // مراقبة تقدم الفيديو
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const progress = (video.currentTime / video.duration) * 100;
      setVideoProgress(progress || 0);
    };

    const handlePlay = () => setIsVideoPlaying(true);
    const handlePause = () => setIsVideoPlaying(false);
    const handleEnded = () => {
      setIsVideoPlaying(false);
      setVideoProgress(0);
      // إعادة تشغيل الفيديو تلقائياً (مثل TikTok)
      video.currentTime = 0;
      if (isActive) {
        video.play();
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [isActive]);

  const formatTime = (timestamp: string | Date | null) => {
    if (!timestamp) return "منذ دقائق";
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "منذ دقائق";
    if (diffInHours < 24) return `منذ ${diffInHours}س`;
    if (diffInHours < 168) return `منذ ${Math.floor(diffInHours / 24)}ي`;
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
    }
  };

  const toggleVideoMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const handleDoubleClick = () => {
    if (!post.isLiked) {
      activateButtonPulse('like');
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

  const handleLikeClick = () => {
    activateButtonPulse('like');
    likeMutation.mutate({ 
      action: post.isLiked ? 'unlike' : 'like' 
    });
  };

  const handleCommentClick = () => {
    activateButtonPulse('comment');
    setShowComments(true);
  };

  const handleShareClick = async () => {
    activateButtonPulse('share');
    
    const shareData = {
      title: `منشور من ${post.user.name} - BizChat`,
      text: post.content || 'شاهد هذا المنشور على BizChat',
      url: `${window.location.origin}/user-profile/${post.user.id}`
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // fallback للمتصفحات التي لا تدعم Web Share API
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "تم النسخ",
          description: "تم نسخ رابط المنشور إلى الحافظة",
        });
      }
    } catch (error) {
      // إذا فشل النسخ للحافظة، نعرض الرابط في toast
      toast({
        title: "مشاركة المنشور",
        description: shareData.url,
      });
    }
  };

  const handleSaveClick = () => {
    activateButtonPulse('save');
    saveMutation.mutate({ 
      action: post.isSaved ? 'unsave' : 'save' 
    });
  };

  const handleFollowClick = () => {
    activateButtonPulse('follow');
    followMutation.mutate({ 
      action: post.isFollowing ? 'unfollow' : 'follow' 
    });
  };

  return (
    <>
      {/* حاوي رئيسي بتصميم TikTok */}
      <div 
        ref={postRef}
        className="relative w-full h-screen bg-black overflow-hidden snap-start snap-always"
        data-testid={`tiktok-post-${post.id}`}
      >
        {/* المحتوى الرئيسي */}
        <div className="absolute inset-0">
          {/* فيديو المنشور */}
          {post.videoUrl && (
            <div className="w-full h-full relative">
              <video
                ref={videoRef}
                src={post.videoUrl}
                className="w-full h-full object-cover cursor-pointer"
                onClick={handleVideoClick}
                onDoubleClick={handleDoubleClick}
                loop
                muted={isVideoMuted}
                playsInline
                autoPlay={isActive}
                data-testid={`video-post-${post.id}`}
              />
              
              {/* طبقة التفاعل */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
              
              {/* أيقونة التشغيل */}
              {!isVideoPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30 animate-pulse">
                    <Play className="w-10 h-10 text-white ml-1 drop-shadow-lg" />
                  </div>
                </div>
              )}
              
              {/* شريط التقدم */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div 
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* صور المنشور */}
          {post.images && Array.isArray(post.images) && post.images.length > 0 && !post.videoUrl && (
            <div className="w-full h-full relative">
              <img
                src={post.images[currentImageIndex]}
                alt={`منشور ${post.user.name}`}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setShowImageViewer(true)}
                onDoubleClick={handleDoubleClick}
                data-testid={`image-post-${post.id}`}
              />
              
              {/* طبقة التفاعل للصور */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
            </div>
          )}
        </div>

        {/* القلوب المتطايرة */}
        <div className="absolute inset-0 pointer-events-none z-30">
          {flyingHearts.map((heart) => (
            <div
              key={heart.id}
              className="absolute text-red-500 text-6xl animate-bounce"
              style={{
                left: `${heart.x}%`,
                top: `${heart.y}%`,
                animation: 'flyHeart 2s ease-out forwards'
              }}
            >
              ❤️
            </div>
          ))}
        </div>

        {/* معلومات المستخدم والأزرار التفاعلية */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
          <div className="flex justify-between items-end">
            {/* معلومات المنشور */}
            <div className="flex-1 pr-4">
              {/* معلومات المستخدم */}
              <div className="flex items-center gap-3 mb-3">
                <Avatar 
                  className={`w-12 h-12 cursor-pointer ring-4 ring-white hover:ring-green-500 transition-all duration-300 hover:scale-125 shadow-2xl ${
                    showUserProfile ? 'scale-150 ring-green-500' : ''
                  }`}
                  onClick={handleUserProfileClick}
                  data-testid={`avatar-user-${post.user.id}`}
                >
                  <AvatarImage src={post.user.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-lg font-bold">
                    {post.user.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleUserProfileClick}
                      className="font-bold text-white hover:text-green-400 cursor-pointer transition-colors text-lg drop-shadow-lg"
                      data-testid={`button-user-name-${post.user.id}`}
                    >
                      {post.user.name}
                    </button>
                    {post.user.isVerified && (
                      <Verified className="w-5 h-5 text-blue-500 fill-current" />
                    )}
                    {post.businessInfo?.businessName && (
                      <Crown className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-white/80 text-sm">{formatTime(post.createdAt)}</span>
                    {post.locationInfo?.name && (
                      <>
                        <span className="text-white/80">•</span>
                        <MapPin className="w-4 h-4 text-white/80" />
                        <span className="text-white/80 text-sm">{post.locationInfo.name}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* زر المتابعة */}
                {!post.isFollowing && post.user.id !== currentUser?.id && (
                  <Button
                    onClick={handleFollowClick}
                    disabled={followMutation.isPending}
                    className={`px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full transition-all duration-300 ${
                      pulseButtons.follow ? 'animate-pulse scale-110' : ''
                    }`}
                    data-testid={`button-follow-${post.id}`}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    متابعة
                  </Button>
                )}
              </div>

              {/* نص المنشور */}
              {post.content && (
                <div className="text-white mb-2">
                  <p className="text-base drop-shadow-lg">
                    {post.content.length > 100 && !showFullCaption
                      ? `${post.content.substring(0, 100)}...`
                      : post.content}
                  </p>
                  {post.content.length > 100 && (
                    <button
                      onClick={() => setShowFullCaption(!showFullCaption)}
                      className="text-white/80 text-sm mt-1 hover:text-white"
                    >
                      {showFullCaption ? 'إخفاء' : 'المزيد'}
                    </button>
                  )}
                </div>
              )}

              {/* إحصائيات المنشور */}
              <div className="flex items-center gap-4 text-white/90 text-sm">
                {(post.viewsCount || 0) > 0 && (
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{formatNumber(post.viewsCount || 0)}</span>
                  </div>
                )}
                {(post.likesCount || 0) > 0 && (
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span>{formatNumber(post.likesCount || 0)}</span>
                  </div>
                )}
                {(post.commentsCount || 0) > 0 && (
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{formatNumber(post.commentsCount || 0)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* أزرار التفاعل الجانبية */}
            <div className="flex flex-col gap-6 items-center">
              {/* زر الإعجاب */}
              <div className="flex flex-col items-center">
                <Button
                  onClick={handleLikeClick}
                  disabled={likeMutation.isPending}
                  className={`w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 p-0 transition-all duration-300 ${
                    pulseButtons.like ? 'animate-pulse scale-125' : 'hover:scale-110'
                  }`}
                  data-testid={`button-like-${post.id}`}
                >
                  <Heart className={`w-8 h-8 transition-all duration-300 ${
                    post.isLiked 
                      ? 'fill-current text-red-500 animate-pulse' 
                      : 'text-white hover:text-red-400'
                  }`} />
                </Button>
                {(post.likesCount || 0) > 0 && (
                  <span className="text-white text-xs mt-1 font-semibold">
                    {formatNumber(post.likesCount || 0)}
                  </span>
                )}
              </div>

              {/* زر التعليق */}
              <div className="flex flex-col items-center">
                <Button
                  onClick={handleCommentClick}
                  className={`w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 p-0 transition-all duration-300 ${
                    pulseButtons.comment ? 'animate-pulse scale-125' : 'hover:scale-110'
                  }`}
                  data-testid={`button-comment-${post.id}`}
                >
                  <MessageCircle className="w-8 h-8 text-white hover:text-blue-400 transition-colors duration-300" />
                </Button>
                {(post.commentsCount || 0) > 0 && (
                  <span className="text-white text-xs mt-1 font-semibold">
                    {formatNumber(post.commentsCount || 0)}
                  </span>
                )}
              </div>

              {/* زر المشاركة */}
              <div className="flex flex-col items-center">
                <Button
                  onClick={handleShareClick}
                  className={`w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 p-0 transition-all duration-300 ${
                    pulseButtons.share ? 'animate-pulse scale-125' : 'hover:scale-110'
                  }`}
                  data-testid={`button-share-${post.id}`}
                >
                  <Share2 className="w-8 h-8 text-white hover:text-green-400 transition-colors duration-300" />
                </Button>
              </div>

              {/* زر الحفظ */}
              <div className="flex flex-col items-center">
                <Button
                  onClick={handleSaveClick}
                  disabled={saveMutation.isPending}
                  className={`w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 p-0 transition-all duration-300 ${
                    pulseButtons.save ? 'animate-pulse scale-125' : 'hover:scale-110'
                  }`}
                  data-testid={`button-save-${post.id}`}
                >
                  <Bookmark className={`w-8 h-8 transition-all duration-300 ${
                    post.isSaved 
                      ? 'fill-current text-yellow-500 animate-pulse' 
                      : 'text-white hover:text-yellow-400'
                  }`} />
                </Button>
              </div>

              {/* زر كتم الصوت (للفيديوهات فقط) */}
              {post.videoUrl && (
                <div className="flex flex-col items-center">
                  <Button
                    onClick={toggleVideoMute}
                    className={`w-14 h-14 rounded-full backdrop-blur-md border-2 p-0 transition-all duration-300 hover:scale-110 ${
                      isVideoMuted 
                        ? 'bg-red-500/80 hover:bg-red-600/80 border-red-400' 
                        : 'bg-green-500/80 hover:bg-green-600/80 border-green-400'
                    }`}
                    data-testid={`button-mute-${post.id}`}
                  >
                    {isVideoMuted ? (
                      <VolumeX className="w-8 h-8 text-white" />
                    ) : (
                      <Volume2 className="w-8 h-8 text-white" />
                    )}
                  </Button>
                  <span className="text-white text-xs mt-1 font-semibold">
                    {isVideoMuted ? 'مكتوم' : 'صوت'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* أزرار إضافية في الأعلى */}
        <div className="absolute top-6 left-4 right-4 z-20 flex justify-between items-start">
          {/* زر كتم الصوت في الأعلى (للفيديوهات) */}
          {post.videoUrl && (
            <Button
              onClick={toggleVideoMute}
              className={`px-4 py-2 rounded-full backdrop-blur-md border-2 transition-all duration-300 hover:scale-105 shadow-lg ${
                isVideoMuted 
                  ? 'bg-red-500/90 hover:bg-red-600/90 border-red-300 text-white' 
                  : 'bg-green-500/90 hover:bg-green-600/90 border-green-300 text-white'
              }`}
              data-testid={`button-mute-top-${post.id}`}
            >
              <div className="flex items-center gap-2">
                {isVideoMuted ? (
                  <>
                    <VolumeX className="w-5 h-5" />
                    <span className="font-bold text-sm">مكتوم الصوت</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-5 h-5" />
                    <span className="font-bold text-sm">تشغيل الصوت</span>
                  </>
                )}
              </div>
            </Button>
          )}
          
          <Button variant="ghost" size="icon" className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white">
            <MoreHorizontal className="w-6 h-6" />
          </Button>
        </div>

        {/* زر زيارة الملف الشخصي عند تكبير الصورة الشخصية */}
        <Dialog open={showUserProfile} onOpenChange={setShowUserProfile}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="text-center">الملف الشخصي</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center p-4">
              <Avatar className="w-24 h-24 mb-4 ring-4 ring-green-500">
                <AvatarImage src={post.user.avatar || undefined} />
                <AvatarFallback className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-2xl">
                  {post.user.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">{post.user.name}</h3>
              
              <div className="flex items-center gap-2 mb-4">
                {post.user.isVerified && (
                  <Verified className="w-5 h-5 text-blue-500 fill-current" />
                )}
                {post.businessInfo?.businessName && (
                  <Crown className="w-5 h-5 text-yellow-500" />
                )}
              </div>

              <div className="flex gap-3 w-full">
                <Button
                  onClick={handleVisitUserProfile}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  data-testid={`button-visit-profile-${post.user.id}`}
                >
                  <UserIcon className="w-4 h-4 mr-2" />
                  زيارة الملف الشخصي
                </Button>
                
                <Button
                  onClick={() => setShowUserProfile(false)}
                  variant="outline"
                  className="flex-1"
                  data-testid={`button-cancel-profile-${post.user.id}`}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* حوار التعليقات */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>التعليقات</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-64 overflow-y-auto">
              {/* قائمة التعليقات هنا */}
            </div>
            
            <div className="flex gap-2">
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="اكتب تعليقاً..."
                className="flex-1"
                data-testid={`input-comment-${post.id}`}
              />
              <Button
                onClick={() => addCommentMutation.mutate(commentText)}
                disabled={addCommentMutation.isPending || !commentText.trim()}
                data-testid={`button-send-comment-${post.id}`}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
}