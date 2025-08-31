import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateStoryModal } from "@/components/create-story-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, MessageCircle, Share, Plus, ArrowLeft, Play, Pause, Volume2, VolumeX, Send, X } from "lucide-react";
import { Link } from "wouter";
import type { Story, User } from "@shared/schema";

interface StoryWithUser extends Story {
  user: User;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: Date;
  likes: number;
}

interface StoryInteraction {
  storyId: string;
  likes: number;
  isLiked: boolean;
  comments: Comment[];
  shares: number;
}

export default function Status() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [interactions, setInteractions] = useState<Record<string, StoryInteraction>>({});
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: stories = [], isLoading } = useQuery<StoryWithUser[]>({
    queryKey: ["/api/stories"],
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user/current"],
  });

  // Sample stories for demo
  const sampleStories: StoryWithUser[] = [
    {
      id: "1",
      userId: "user1",
      content: "أحدث منتجاتنا من الملابس الشتوية",
      imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=700&fit=crop",
      videoUrl: "",
      backgroundColor: "#075e54",
      textColor: "#ffffff",
      location: "الرياض",
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      viewCount: "156",
      viewers: [],
      user: {
        id: "user1",
        name: "متجر الأناقة",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        phoneNumber: "+966501234567",
        location: "الرياض",
        isOnline: true,
        isVerified: true,
        verifiedAt: new Date(),
        isAdmin: false,
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    },
    {
      id: "1.5",
      userId: "user1.5",
      content: "فيديو تعريفي بمنتجاتنا الجديدة",
      imageUrl: "",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      backgroundColor: "#25D366",
      textColor: "#ffffff",
      location: "الرياض",
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      viewCount: "89",
      viewers: [],
      user: {
        id: "user1.5",
        name: "استديو الإبداع",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
        phoneNumber: "+966507654321",
        location: "الرياض",
        isOnline: true,
        isVerified: true,
        verifiedAt: new Date(),
        isAdmin: false,
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    },
    {
      id: "2", 
      userId: "user2",
      content: "طعام طازج وصحي - جربوا أطباقنا الجديدة",
      imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=700&fit=crop",
      videoUrl: "",
      backgroundColor: "#25D366",
      textColor: "#ffffff",
      location: "جدة",
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      viewCount: "89",
      viewers: [],
      user: {
        id: "user2",
        name: "مطعم البركة",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
        phoneNumber: "+966507654321",
        location: "جدة",
        isOnline: false,
        isVerified: true,
        verifiedAt: new Date(),
        isAdmin: false,
        lastSeen: new Date(Date.now() - 5 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    },
    {
      id: "3",
      userId: "user3", 
      content: "عروض خاصة على الإلكترونيات - خصم 50%",
      imageUrl: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=700&fit=crop",
      videoUrl: "",
      backgroundColor: "#34B7F1",
      textColor: "#ffffff",
      location: "الدمام",
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      viewCount: "234",
      viewers: [],
      user: {
        id: "user3",
        name: "متجر التقنية",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
        phoneNumber: "+966502345678",
        location: "الدمام",
        isOnline: true,
        isVerified: false,
        verifiedAt: null,
        isAdmin: false,
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    },
    {
      id: "4",
      userId: "user4",
      content: "منتجات طبيعية للعناية بالبشرة",
      imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=700&fit=crop",
      videoUrl: "",
      backgroundColor: "#FF6B6B",
      textColor: "#ffffff", 
      location: "مكة",
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      viewCount: "67",
      viewers: [],
      user: {
        id: "user4",
        name: "منتجات طبيعية",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
        phoneNumber: "+966509876543",
        location: "مكة",
        isOnline: true,
        isVerified: true,
        verifiedAt: new Date(),
        isAdmin: false,
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }
  ];

  // Sample comments for demo
  const sampleComments: Comment[] = [
    {
      id: "c1",
      userId: "u1",
      userName: "سارة أحمد",
      userAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face",
      content: "منتجات رائعة! أين يمكنني الشراء؟",
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      likes: 5
    },
    {
      id: "c2", 
      userId: "u2",
      userName: "محمد علي",
      userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face",
      content: "جودة ممتازة والأسعار مناسبة 👍",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      likes: 3
    },
    {
      id: "c3",
      userId: "u3",
      userName: "فاطمة خالد", 
      userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop&crop=face",
      content: "هل يوجد توصيل للمنطقة الشرقية؟",
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      likes: 1
    },
    {
      id: "c4",
      userId: "u4", 
      userName: "أحمد محمد",
      userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop&crop=face",
      content: "شكرًا لكم على الخدمة المميزة",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      likes: 7
    },
    {
      id: "c5",
      userId: "u5",
      userName: "نور العين",
      userAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&h=50&fit=crop&crop=face", 
      content: "متى سيكون العرض متاحًا؟",
      timestamp: new Date(Date.now() - 20 * 60 * 1000),
      likes: 2
    }
  ];

  // Initialize sample interactions
  const initializeInteractions = () => {
    const initialInteractions: Record<string, StoryInteraction> = {};
    sampleStories.forEach(story => {
      initialInteractions[story.id] = {
        storyId: story.id,
        likes: Math.floor(Math.random() * 100) + 20,
        isLiked: false,
        comments: sampleComments.slice(0, Math.floor(Math.random() * 3) + 1),
        shares: Math.floor(Math.random() * 50) + 10
      };
    });
    return initialInteractions;
  };

  // Use sample stories if no real stories
  const displayStories = stories.length > 0 ? stories : sampleStories;
  
  // Initialize interactions on mount
  useEffect(() => {
    if (Object.keys(interactions).length === 0) {
      setInteractions(initializeInteractions());
    }
  }, []);

  // Auto-play first video when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      const firstVideo = videoRefs.current[0];
      if (firstVideo && displayStories[0]?.videoUrl && isPlaying) {
        firstVideo.play().catch(error => {
          console.error('Failed to auto-play first video:', error);
        });
      }
    }, 500); // Small delay to ensure video is loaded

    return () => clearTimeout(timer);
  }, [displayStories]);
  
  const currentStory = displayStories && displayStories.length > 0 && currentVideoIndex >= 0 && currentVideoIndex < displayStories.length
    ? displayStories[currentVideoIndex]
    : null;
  const currentInteraction = currentStory ? (interactions[currentStory.id] || {
    storyId: currentStory.id,
    likes: 0,
    isLiked: false, 
    comments: [],
    shares: 0
  }) : null;

  const handleScroll = () => {
    if (!containerRef.current || displayStories.length === 0) return;
    
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const windowHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / windowHeight);
    
    if (newIndex !== currentVideoIndex && newIndex >= 0 && newIndex < displayStories.length) {
      setCurrentVideoIndex(newIndex);
    }
  };

  const scrollToVideo = (index: number) => {
    if (!containerRef.current || displayStories.length === 0 || index < 0 || index >= displayStories.length) return;
    
    const container = containerRef.current;
    const windowHeight = window.innerHeight;
    container.scrollTo({
      top: index * windowHeight,
      behavior: 'smooth'
    });
  };

  const togglePlayPause = () => {
    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);
    
    // Immediate control of current video
    const currentVideo = videoRefs.current[currentVideoIndex];
    if (currentVideo) {
      if (newPlayingState) {
        currentVideo.play().catch(error => {
          console.error('Failed to play current video:', error);
        });
      } else {
        currentVideo.pause();
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleLike = (storyId: string) => {
    setInteractions(prev => ({
      ...prev,
      [storyId]: {
        ...prev[storyId],
        likes: prev[storyId]?.isLiked ? prev[storyId].likes - 1 : (prev[storyId]?.likes || 0) + 1,
        isLiked: !prev[storyId]?.isLiked
      }
    }));
  };

  const handleShare = (storyId: string) => {
    setInteractions(prev => ({
      ...prev,
      [storyId]: {
        ...prev[storyId],
        shares: (prev[storyId]?.shares || 0) + 1
      }
    }));
    
    // Show share functionality (could be expanded)
    if (navigator.share) {
      navigator.share({
        title: 'شاهد هذه الحالة',
        text: currentStory?.content || '',
        url: window.location.href
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !currentStory) return;
    
    const comment: Comment = {
      id: `c${Date.now()}`,
      userId: "current_user",
      userName: "أنت",
      userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face",
      content: newComment,
      timestamp: new Date(),
      likes: 0
    };
    
    setInteractions(prev => ({
      ...prev,
      [currentStory.id]: {
        ...prev[currentStory.id],
        comments: [...(prev[currentStory.id]?.comments || []), comment]
      }
    }));
    
    setNewComment("");
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "الآن";
    if (diffInMinutes < 60) return `${diffInMinutes} دقيقة`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ساعة`;
    return `${Math.floor(diffInMinutes / 1440)} يوم`;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [currentVideoIndex]);

  // Handle video playback when currentVideoIndex or isPlaying changes
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      
      if (index === currentVideoIndex && isPlaying) {
        video.play().catch(error => {
          console.error(`Failed to play video ${index}:`, error);
        });
      } else {
        video.pause();
      }
    });
  }, [currentVideoIndex, isPlaying]);

  // Handle video mute state
  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (video) {
        video.muted = isMuted;
      }
    });
  }, [isMuted]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Header - Enhanced */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 via-black/40 to-transparent backdrop-blur-sm">
        <div className="flex items-center justify-between p-4 pt-12">
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 w-12 h-12 rounded-full backdrop-blur-sm border border-white/10 shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6 drop-shadow-sm" />
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-white text-xl font-bold drop-shadow-lg bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">الحالات</h1>
            <div className="w-16 h-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mx-auto mt-1 animate-pulse"></div>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-gradient-to-br hover:from-emerald-500/20 hover:to-green-600/20 w-12 h-12 rounded-full backdrop-blur-sm border border-white/10 shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95 hover:rotate-90"
            data-testid="button-add-status"
          >
            <Plus className="w-6 h-6 drop-shadow-sm" />
          </Button>
        </div>
      </div>

      {/* Video Feed */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        data-testid="video-feed"
      >
        <style>{`
          div::-webkit-scrollbar {
            display: none;
          }
          
          /* TikTok-style animations */
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.2); }
            50% { box-shadow: 0 0 30px rgba(255, 255, 255, 0.4), 0 0 40px rgba(255, 255, 255, 0.2); }
          }
          
          @keyframes heartbeat {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          
          @keyframes sparkle {
            0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
            50% { opacity: 1; transform: scale(1) rotate(180deg); }
          }
          
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          .animate-float { animation: float 3s ease-in-out infinite; }
          .animate-glow { animation: glow 2s ease-in-out infinite; }
          .animate-heartbeat { animation: heartbeat 1.5s ease-in-out infinite; }
          .animate-sparkle { animation: sparkle 1.5s ease-in-out infinite; }
          .animate-gradient { animation: gradientShift 3s ease infinite; background-size: 200% 200%; }
        `}</style>
        
        {displayStories.map((story, index) => (
          <div
            key={story.id}
            className="relative w-full h-screen snap-start snap-always flex items-center justify-center"
            style={{ backgroundColor: story.backgroundColor || '#075e54' }}
          >
            {/* Background Content */}
            {story.videoUrl ? (
              <video
                ref={(el) => {
                  videoRefs.current[index] = el;
                }}
                src={story.videoUrl}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay={index === currentVideoIndex && isPlaying}
                loop
                muted={isMuted}
                playsInline
                controls={false}
                data-testid={`video-story-${index}`}
                onLoadedData={(e) => {
                  const video = e.target as HTMLVideoElement;
                  if (index === currentVideoIndex && isPlaying) {
                    video.play().catch(console.error);
                  }
                }}
                onError={(e) => {
                  console.error(`Video load error for story ${index}:`, e);
                }}
              />
            ) : story.imageUrl ? (
              <img
                src={story.imageUrl}
                alt={story.content || ''}
                className="absolute inset-0 w-full h-full object-cover"
                data-testid={`img-story-${index}`}
              />
            ) : (
              <div 
                className="absolute inset-0 w-full h-full flex items-center justify-center"
                style={{ backgroundColor: story.backgroundColor || '#075e54' }}
              >
                <div 
                  className="text-center p-8 max-w-sm"
                  style={{ color: story.textColor || '#ffffff' }}
                >
                  <p className="text-2xl font-bold leading-relaxed">
                    {story.content}
                  </p>
                </div>
              </div>
            )}

            {/* Enhanced overlay with gradient effects */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
            <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20" />

            {/* Story content overlay */}
            {(story.imageUrl || story.videoUrl) && story.content && (
              <div className="absolute inset-0 flex items-end">
                <div className="w-full p-6 bg-gradient-to-t from-black/70 to-transparent">
                  <p className="text-white text-lg font-medium leading-relaxed">
                    {story.content}
                  </p>
                </div>
              </div>
            )}

            {/* User Info - Enhanced */}
            <div className="absolute bottom-24 left-4 flex items-center gap-3 z-10">
              <div className="relative">
                {/* تأثير الهالة النابضة */}
                {story.user.isOnline && (
                  <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-30 scale-110" />
                )}
                <Avatar className="w-14 h-14 border-3 border-white shadow-xl ring-2 ring-white/20">
                  <AvatarImage src={story.user.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                    {story.user.name[0]}
                  </AvatarFallback>
                </Avatar>
                {/* مؤشر الاتصال المحسن */}
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-white shadow-lg transition-all duration-300 ${
                  story.user.isOnline 
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse' 
                    : 'bg-gradient-to-r from-gray-400 to-gray-500'
                }`}>
                  {story.user.isOnline && (
                    <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-50" />
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-white font-bold text-lg drop-shadow-lg" data-testid={`text-username-${index}`}>
                    {story.user.name}
                  </p>
                  {story.user.isVerified && (
                    <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      <span className="text-white text-xs font-bold drop-shadow-sm">✓</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-white/90 text-sm font-medium drop-shadow-md">{story.location}</p>
                  <span className="text-white/70 text-xs">•</span>
                  <span className="text-white/70 text-xs font-medium">{story.timestamp ? formatTimeAgo(story.timestamp) : 'الآن'}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons - TikTok Style */}
            <div className="absolute bottom-20 right-3 flex flex-col gap-6 z-10">
              <div className="flex flex-col items-center relative">
                {/* تأثير النبضة للإعجاب */}
                {interactions[story.id]?.isLiked && (
                  <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-40 scale-150 pointer-events-none" />
                )}
                <Button
                  onClick={() => handleLike(story.id)}
                  variant="ghost"
                  size="icon"
                  className={`w-14 h-14 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 backdrop-blur-sm border border-white/20 shadow-lg ${
                    interactions[story.id]?.isLiked 
                      ? 'bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-red-500/50 animate-pulse' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  data-testid={`button-like-${index}`}
                >
                  <Heart className={`w-7 h-7 transition-all duration-300 ${
                    interactions[story.id]?.isLiked ? 'fill-current drop-shadow-sm' : ''
                  }`} />
                </Button>
                <span className="text-white text-sm mt-2 font-bold drop-shadow-lg">
                  {interactions[story.id]?.likes || 0}
                </span>
              </div>
              
              <div className="flex flex-col items-center relative">
                {/* تأثير دوران للتعليقات */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-0 hover:opacity-20 animate-spin-slow transition-opacity" />
                <Button
                  onClick={() => {
                    setCurrentVideoIndex(index);
                    setCommentsModalOpen(true);
                  }}
                  variant="ghost"
                  size="icon"
                  className="w-14 h-14 rounded-full bg-white/10 text-white hover:bg-gradient-to-br hover:from-blue-500/20 hover:to-purple-600/20 backdrop-blur-sm border border-white/20 shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95"
                  data-testid={`button-comment-${index}`}
                >
                  <MessageCircle className="w-7 h-7 drop-shadow-sm" />
                </Button>
                <span className="text-white text-sm mt-2 font-bold drop-shadow-lg">
                  {interactions[story.id]?.comments?.length || 0}
                </span>
              </div>
              
              <div className="flex flex-col items-center relative">
                {/* تأثير الموجة للمشاركة */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-teal-600 rounded-full opacity-0 hover:opacity-20 scale-0 hover:scale-150 transition-all duration-500" />
                <Button
                  onClick={() => handleShare(story.id)}
                  variant="ghost"
                  size="icon"
                  className="w-14 h-14 rounded-full bg-white/10 text-white hover:bg-gradient-to-br hover:from-green-500/20 hover:to-teal-600/20 backdrop-blur-sm border border-white/20 shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95 hover:rotate-12"
                  data-testid={`button-share-${index}`}
                >
                  <Share className="w-7 h-7 drop-shadow-sm" />
                </Button>
                <span className="text-white text-sm mt-2 font-bold drop-shadow-lg">
                  {interactions[story.id]?.shares || 0}
                </span>
              </div>

              {/* Sound control for videos */}
              {story.videoUrl && (
                <div className="flex flex-col items-center relative">
                  {/* تأثير الصوت النابض */}
                  {!isMuted && (
                    <div className="absolute inset-0 bg-yellow-500 rounded-full animate-pulse opacity-30 scale-125 pointer-events-none" />
                  )}
                  <Button
                    onClick={toggleMute}
                    variant="ghost"
                    size="icon"
                    className={`w-14 h-14 rounded-full backdrop-blur-sm border border-white/20 shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95 ${
                      isMuted 
                        ? 'bg-white/10 text-white hover:bg-white/20' 
                        : 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 text-white animate-pulse'
                    }`}
                    data-testid={`button-sound-${index}`}
                  >
                    {isMuted ? <VolumeX className="w-7 h-7 drop-shadow-sm" /> : <Volume2 className="w-7 h-7 drop-shadow-sm" />}
                  </Button>
                </div>
              )}
            </div>

            {/* Video Controls - Enhanced */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              {index === currentVideoIndex && (
                <div className="relative">
                  {/* تأثير النبضة الخارجية */}
                  <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20 scale-150" />
                  <Button
                    onClick={togglePlayPause}
                    variant="ghost"
                    size="icon"
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-black/40 to-black/60 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-black/50 opacity-0 hover:opacity-100 transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-2xl"
                    data-testid={`button-play-pause-${index}`}
                  >
                    {isPlaying ? (
                      <Pause className="w-10 h-10 drop-shadow-lg" />
                    ) : (
                      <Play className="w-10 h-10 drop-shadow-lg ml-1" />
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* View Count - Enhanced */}
            <div className="absolute top-28 right-4 bg-gradient-to-r from-black/60 to-black/40 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full animate-pulse" />
                <p className="text-white text-sm font-bold drop-shadow-sm" data-testid={`text-views-${index}`}>
                  {story.viewCount} مشاهدة
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Story Progress Indicators - Enhanced */}
      <div className="absolute top-24 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
        {displayStories.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-500 transform hover:scale-110 cursor-pointer ${
              index === currentVideoIndex 
                ? 'w-10 bg-gradient-to-r from-white to-gray-200 shadow-lg animate-pulse' 
                : index < currentVideoIndex
                ? 'w-8 bg-white/60'
                : 'w-6 bg-white/30'
            }`}
            onClick={() => scrollToVideo(index)}
            data-testid={`progress-indicator-${index}`}
          />
        ))}
      </div>

      {/* Navigation Hints - Enhanced */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
        <div className="bg-gradient-to-r from-black/60 to-black/40 backdrop-blur-sm rounded-full px-6 py-3 border border-white/10 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-transparent via-white to-transparent rounded-full animate-pulse" />
            <p className="text-white/90 text-sm font-medium drop-shadow-sm">اسحب للتنقل</p>
            <div className="w-1 h-8 bg-gradient-to-b from-transparent via-white to-transparent rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      <CreateStoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      
      {/* Comments Modal - Enhanced TikTok Style */}
      <Dialog open={commentsModalOpen} onOpenChange={setCommentsModalOpen}>
        <DialogContent className="max-w-md mx-auto h-[85vh] flex flex-col p-0 gap-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 border-2 border-white/20 shadow-2xl backdrop-blur-xl">
          <DialogHeader className="p-6 border-b border-white/10 bg-gradient-to-r from-purple-600/20 to-pink-600/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <DialogTitle className="text-xl font-bold text-white drop-shadow-lg">التعليقات</DialogTitle>
                <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                  <span className="text-white text-xs font-bold">{currentInteraction?.comments?.length || 0}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCommentsModalOpen(false)}
                className="text-white hover:bg-white/10 w-10 h-10 rounded-full backdrop-blur-sm transition-all duration-300 transform hover:scale-110 active:scale-95"
                data-testid="button-close-comments"
              >
                <X className="w-5 h-5 drop-shadow-sm" />
              </Button>
            </div>
          </DialogHeader>
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {currentInteraction?.comments?.map((comment) => (
                <div key={comment.id} className="flex gap-3" data-testid={`comment-${comment.id}`}>
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={comment.userAvatar} />
                    <AvatarFallback className="text-xs">
                      {comment.userName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-3 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{comment.userName}</span>
                        <span className="text-xs text-gray-500">
                          {comment.timestamp ? formatTimeAgo(comment.timestamp) : 'الآن'}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">{comment.content}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-2 px-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-0 text-xs text-gray-500 hover:text-blue-600"
                        data-testid={`button-like-comment-${comment.id}`}
                      >
                        <Heart className="w-3 h-3 ml-1" />
                        {comment.likes > 0 && comment.likes}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-0 text-xs text-gray-500 hover:text-blue-600"
                        data-testid={`button-reply-comment-${comment.id}`}
                      >
                        رد
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {currentInteraction?.comments?.length === 0 && (
                <div className="text-center text-gray-500 py-8" data-testid="no-comments">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>لا توجد تعليقات بعد</p>
                  <p className="text-sm">كن أول من يعلق!</p>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="border-t p-4">
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face" />
                <AvatarFallback className="text-xs">أ</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="اكتب تعليقاً..."
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddComment();
                    }
                  }}
                  data-testid="input-new-comment"
                />
                <Button
                  onClick={handleAddComment}
                  size="icon"
                  disabled={!newComment.trim()}
                  className="w-10 h-10 flex-shrink-0"
                  data-testid="button-send-comment"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}