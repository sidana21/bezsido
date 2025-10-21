import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Plus, Bell, BellDot, Camera, ArrowLeft, Home, Settings
} from "lucide-react";
import type { User, BivochatPost } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { TikTokPostCard } from "@/components/tiktok-post-card";
import { EnhancedCreatePost } from "@/components/enhanced-create-post";
import { NotificationsSettingsModal } from "@/components/notifications-settings-modal";

interface PostWithUser extends BivochatPost {
  user: User;
  isLiked?: boolean;
  isSaved?: boolean;
  isFollowing?: boolean;
  isPromoted?: boolean;
  promotionData?: {
    vendorId: string;
    promotionId: string;
    description?: string | null;
    subscriptionTier?: 'bronze' | 'silver' | 'gold';
  };
}

export default function SocialFeed() {
  const [, setLocation] = useLocation();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // جلب المستخدم الحالي
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user/current"],
  });

  // جلب المنشورات من الـ feed
  const { data: posts = [], isLoading } = useQuery<PostWithUser[]>({
    queryKey: ["/api/social-feed", "all", currentUser?.location],
    queryFn: () => apiRequest(`/api/social-feed?filter=all&location=${encodeURIComponent(currentUser?.location || '')}`),
    enabled: !!currentUser,
    refetchInterval: 30000, // تحديث كل 30 ثانية
  });

  // جلب عدد الإشعارات غير المقروءة
  const { data: notificationData } = useQuery<{unreadCount: number}>({
    queryKey: ["/api/notifications/social/unread-count"],
    enabled: !!currentUser,
    refetchInterval: 10000, // تحديث كل 10 ثوانِ
  });

  // جلب قائمة الإشعارات
  const { data: notificationsResponse } = useQuery<{
    notifications: Array<{
      id: string;
      type: string;
      fromUserId: string;
      fromUserName?: string;
      fromUserAvatar?: string;
      message: string;
      title: string;
      createdAt: string;
      isRead: boolean;
    }>;
    unreadCount?: number;
  }>({
    queryKey: ["/api/notifications/social"],
    enabled: !!currentUser && showNotifications,
    refetchInterval: showNotifications ? 5000 : false,
    retry: 2,
    staleTime: 30000,
    gcTime: 60000,
  });

  // استخراج البيانات من الاستجابة
  const notifications = notificationsResponse?.notifications || [];

  // دالة لتحديد جميع الإشعارات كمقروءة
  const markAllNotificationsAsReadMutation = useMutation({
    mutationFn: () => apiRequest("/api/notifications/social/mark-all-read", {
      method: "POST",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/social"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/social/unread-count"] });
    },
  });

  // تتبع التمرير لتحديد المنشور النشط
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const newIndex = Math.round(scrollTop / containerHeight);
      
      if (newIndex !== currentPostIndex && newIndex >= 0 && newIndex < posts.length) {
        setCurrentPostIndex(newIndex);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentPostIndex, posts.length]);

  // إغلاق الإشعارات عند الضغط خارج القائمة
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showNotifications]);

  // دالة للتنقل إلى منشور محدد
  const scrollToPost = (index: number) => {
    const container = containerRef.current;
    if (container && index >= 0 && index < posts.length) {
      container.scrollTo({
        top: index * container.clientHeight,
        behavior: 'smooth'
      });
    }
  };

  // دالة لتحويل نوع الإشعار إلى أيقونة
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'follow':
        return '👥';
      default:
        return '🔔';
    }
  };

  // شاشة التحميل
  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
          <p className="text-white text-lg">جاري تحميل المنشورات...</p>
        </div>
      </div>
    );
  }

  // عرض رسالة عدم وجود منشورات
  if (posts.length === 0) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-center px-8">
          <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-8">
            <Camera className="w-16 h-16 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            لا توجد منشورات بعد
          </h2>
          <p className="text-gray-300 mb-8 text-lg">
            كن أول من يشارك منشور في مجتمع Bivochat!
          </p>
          <Button
            onClick={() => setLocation('/create-post')}
            className="relative bg-gradient-to-r from-red-500 via-pink-500 to-red-600 hover:from-red-600 hover:via-pink-600 hover:to-red-700 text-white px-8 py-3 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 overflow-hidden group"
            data-testid="button-create-first-post"
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <Plus className="w-6 h-6 mr-2 relative z-10 group-hover:rotate-90 transition-transform duration-300" />
            <span className="relative z-10 font-bold">أنشئ منشورك الأول</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      {/* حاوي المنشورات الرئيسي */}
      <div 
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {posts.map((post, index) => (
          <TikTokPostCard
            key={post.id}
            post={post}
            currentUser={currentUser}
            isActive={index === currentPostIndex}
          />
        ))}
      </div>

      {/* أزرار التنقل والتفاعل العلوية */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between p-4">
          {/* زر العودة */}
          <Button
            onClick={() => setLocation('/chat')}
            variant="ghost"
            size="icon"
            className="w-12 h-12 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md"
            data-testid="button-back-home"
          >
            <Home className="w-6 h-6" />
          </Button>

          {/* العنوان */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <h1 className="text-white font-bold text-xl">Bivochat</h1>
          </div>

          {/* زر الإشعارات */}
          <div className="relative" ref={notificationRef}>
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const newShowState = !showNotifications;
                setShowNotifications(newShowState);
                
                if (newShowState && notificationData?.unreadCount && notificationData.unreadCount > 0) {
                  setTimeout(() => {
                    markAllNotificationsAsReadMutation.mutate();
                  }, 1000);
                }
              }}
              variant="ghost"
              size="icon"
              className="w-12 h-12 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md relative"
              data-testid="button-notifications"
            >
              {notificationData?.unreadCount && notificationData.unreadCount > 0 ? (
                <>
                  <BellDot className="w-6 h-6" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                    {notificationData.unreadCount > 9 ? '9+' : notificationData.unreadCount}
                  </span>
                </>
              ) : (
                <Bell className="w-6 h-6" />
              )}
            </Button>

            {/* قائمة الإشعارات */}
            {showNotifications && (
              <div className="absolute left-0 top-16 w-80 max-h-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in-0 duration-200">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 dark:text-white">الإشعارات</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNotificationSettings(true);
                    }}
                    className="w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-700"
                    data-testid="button-notification-settings"
                  >
                    <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </Button>
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">لا توجد إشعارات جديدة</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                            !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                          onClick={() => {
                            if (notification.fromUserId) {
                              setShowNotifications(false);
                              setLocation(`/user-profile/${notification.fromUserId}`);
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(notification.createdAt).toLocaleDateString('ar')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* مؤشر المنشورات الجانبي - مخفي */}
      {posts.length > 1 && (
        <div className="hidden absolute right-2 top-1/2 transform -translate-y-1/2 z-40 flex flex-col gap-2">
          {posts.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToPost(index)}
              className={`w-2 h-8 rounded-full transition-all duration-300 ${
                index === currentPostIndex 
                  ? 'bg-white' 
                  : 'bg-white/40 hover:bg-white/70'
              }`}
              data-testid={`post-indicator-${index}`}
            />
          ))}
        </div>
      )}

      {/* نافذة إنشاء منشور جديد */}
      <EnhancedCreatePost
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        currentUser={currentUser}
      />

      {/* نافذة إعدادات الإشعارات */}
      <NotificationsSettingsModal
        open={showNotificationSettings}
        onOpenChange={setShowNotificationSettings}
      />
    </div>
  );
}