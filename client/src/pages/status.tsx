import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateStoryModal } from "@/components/create-story-modal";
import { Heart, MessageCircle, Share, Plus, ArrowLeft, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Link } from "wouter";
import type { Story, User } from "@shared/schema";

interface StoryWithUser extends Story {
  user: User;
}

export default function Status() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
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
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }
  ];

  // Use sample stories if no real stories
  const displayStories = stories.length > 0 ? stories : sampleStories;

  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const windowHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / windowHeight);
    
    if (newIndex !== currentVideoIndex && newIndex >= 0 && newIndex < displayStories.length) {
      setCurrentVideoIndex(newIndex);
    }
  };

  const scrollToVideo = (index: number) => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const windowHeight = window.innerHeight;
    container.scrollTo({
      top: index * windowHeight,
      behavior: 'smooth'
    });
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [currentVideoIndex]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between p-4 pt-12">
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 w-10 h-10 rounded-full"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-white text-lg font-semibold">الحالات</h1>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 w-10 h-10 rounded-full"
            data-testid="button-add-status"
          >
            <Plus className="w-5 h-5" />
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
                src={story.videoUrl}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay={index === currentVideoIndex && isPlaying}
                loop
                muted={isMuted}
                playsInline
                controls={false}
                data-testid={`video-story-${index}`}
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

            {/* Dark overlay for better text visibility */}
            <div className="absolute inset-0 bg-black/20" />

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

            {/* User Info */}
            <div className="absolute bottom-20 left-4 flex items-center gap-3 z-10">
              <Avatar className="w-12 h-12 border-2 border-white">
                <AvatarImage src={story.user.avatar || undefined} />
                <AvatarFallback className="bg-gray-600 text-white">
                  {story.user.name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold" data-testid={`text-username-${index}`}>
                    {story.user.name}
                  </p>
                  {story.user.isVerified && (
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
                <p className="text-white/80 text-sm">{story.location}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="absolute bottom-32 right-4 flex flex-col gap-6 z-10">
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 rounded-full bg-white/20 text-white hover:bg-white/30"
                data-testid={`button-like-${index}`}
              >
                <Heart className="w-6 h-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 rounded-full bg-white/20 text-white hover:bg-white/30"
                data-testid={`button-comment-${index}`}
              >
                <MessageCircle className="w-6 h-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 rounded-full bg-white/20 text-white hover:bg-white/30"
                data-testid={`button-share-${index}`}
              >
                <Share className="w-6 h-6" />
              </Button>

              {/* Sound control for videos */}
              {story.videoUrl && (
                <Button
                  onClick={toggleMute}
                  variant="ghost"
                  size="icon"
                  className="w-12 h-12 rounded-full bg-white/20 text-white hover:bg-white/30"
                  data-testid={`button-sound-${index}`}
                >
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </Button>
              )}
            </div>

            {/* Video Controls */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              {index === currentVideoIndex && (
                <Button
                  onClick={togglePlayPause}
                  variant="ghost"
                  size="icon"
                  className="w-16 h-16 rounded-full bg-black/20 text-white hover:bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                  data-testid={`button-play-pause-${index}`}
                >
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                </Button>
              )}
            </div>

            {/* View Count */}
            <div className="absolute top-20 right-4 bg-black/40 rounded-full px-3 py-1">
              <p className="text-white text-sm" data-testid={`text-views-${index}`}>
                {story.viewCount} مشاهدة
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Story Progress Indicators */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 flex gap-1 z-20">
        {displayStories.map((_, index) => (
          <div
            key={index}
            className={`w-8 h-1 rounded-full transition-all duration-300 ${
              index === currentVideoIndex ? 'bg-white' : 'bg-white/40'
            }`}
            data-testid={`progress-indicator-${index}`}
          />
        ))}
      </div>

      {/* Navigation Hints */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/60 text-sm text-center">
        <p>اسحب لأعلى أو لأسفل للتنقل</p>
      </div>

      <CreateStoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}