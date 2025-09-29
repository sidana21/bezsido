import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import {
  Plus, Search, TrendingUp, MapPin, Tag, 
  ShoppingBag, Users, Camera, 
  Sparkles, ArrowLeft, Bell, BellDot, X, Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import type { User, BizChatPost } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { InstagramPostCard } from "@/components/instagram-post-card";
import { EnhancedCreatePost } from "@/components/enhanced-create-post";

interface PostWithUser extends BizChatPost {
  user: User;
  isLiked?: boolean;
  isSaved?: boolean;
  isFollowing?: boolean;
}

export default function SocialFeed() {
  const [, setLocation] = useLocation();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // جلب المستخدم الحالي
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user/current"],
  });

  // جلب المنشورات من الـ feed
  const { data: posts = [], isLoading } = useQuery<PostWithUser[]>({
    queryKey: ["/api/social-feed", selectedFilter, currentUser?.location],
    queryFn: () => apiRequest(`/api/social-feed?filter=${selectedFilter}&location=${encodeURIComponent(currentUser?.location || '')}`),
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
  const { data: notificationsResponse, isLoading: notificationsLoading, error: notificationsError } = useQuery<{
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



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-4">
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-purple-100/50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800 backdrop-blur-3xl">
      {/* Header مع شعار BizChat */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border-b border-white/20 dark:border-gray-700/50 shadow-xl shadow-purple-500/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/chat">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-110">
                  <span className="text-white font-bold text-sm drop-shadow-lg">B</span>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent drop-shadow-sm hover:drop-shadow-lg transition-all duration-300">
                  BizChat
                </h1>
                <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-none">
                  تجاري
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* أيقونة الإشعارات */}
              <div className="relative" ref={notificationRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                      setShowNotifications(!showNotifications);
                    } catch (error) {
                      console.error('خطأ في فتح الإشعارات:', error);
                    }
                  }}
                  className="relative w-9 h-9 hover:bg-green-50 dark:hover:bg-green-900/20 border border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-600 transition-all duration-300"
                  data-testid="button-notifications"
                >
                  {notificationData?.unreadCount && notificationData.unreadCount > 0 ? (
                    <>
                      <BellDot className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                        {notificationData.unreadCount > 9 ? '9+' : notificationData.unreadCount}
                      </span>
                    </>
                  ) : (
                    <Bell className="w-5 h-5 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors" />
                  )}
                </Button>
                
                {/* قائمة الإشعارات */}
                {showNotifications && (
                  <Card className="absolute left-0 top-12 w-96 max-h-96 overflow-y-auto z-50 shadow-xl border-2 border-green-100 dark:border-green-800 animate-in slide-in-from-top-2 fade-in-0 duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-green-700 dark:text-green-300">الإشعارات</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6 hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => setShowNotifications(false)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {notificationsLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-3"></div>
                          <p className="text-gray-500 dark:text-gray-400">جارِ تحميل الإشعارات...</p>
                        </div>
                      ) : notificationsError ? (
                        <div className="text-center py-8 text-red-500 dark:text-red-400">
                          <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>حدث خطأ في تحميل الإشعارات</p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => window.location.reload()} 
                            className="mt-2 text-xs"
                          >
                            إعادة المحاولة
                          </Button>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>لا توجد إشعارات جديدة</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {notifications.slice(0, 10).map((notification) => (
                            <div
                              key={notification.id}
                              className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                                notification.isRead 
                                  ? 'bg-gray-50 dark:bg-gray-800/50' 
                                  : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                              }`}
                            >
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center text-white text-lg">
                                  {getNotificationIcon(notification.type)}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <button
                                    onClick={() => {
                                      if (notification.fromUserId) {
                                        setLocation(`/profile/${notification.fromUserId}`);
                                        setShowNotifications(false);
                                      }
                                    }}
                                    className="font-semibold text-sm text-gray-900 dark:text-white truncate hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer"
                                    data-testid={`notification-user-${notification.fromUserId}`}
                                  >
                                    {notification.fromUserName || 'مستخدم'}
                                  </button>
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                                  )}
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <Clock className="w-3 h-3" />
                                  {formatDistanceToNow(new Date(notification.createdAt), { 
                                    addSuffix: true, 
                                    locale: ar 
                                  })}
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {notifications.length > 10 && (
                            <div className="text-center pt-2">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                و {notifications.length - 10} إشعار آخر...
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              <Button
                onClick={() => setShowCreatePost(true)}
                size="sm"
                className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-105 border-0"
                data-testid="button-create-post"
              >
                <Plus className="w-4 h-4 ml-2" />
                منشور جديد
              </Button>
              
              <Link href="/profile">
                <Avatar className="w-8 h-8 cursor-pointer border-2 border-green-200">
                  <AvatarImage src={currentUser?.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700">
                    {currentUser?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>

          {/* شريط البحث والفلاتر */}
          <div className="mt-4 space-y-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="ابحث في المنشورات، الهاشتاغات، والمستخدمين..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                data-testid="input-search-posts"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { id: "all", label: "الكل", icon: Sparkles },
                { id: "following", label: "المتابعين", icon: Users },
                { id: "local", label: "محلي", icon: MapPin },
                { id: "business", label: "تجاري", icon: ShoppingBag },
                { id: "trending", label: "رائج", icon: TrendingUp },
                { id: "products", label: "منتجات", icon: Tag },
              ].map((filter) => (
                <Button
                  key={filter.id}
                  variant={selectedFilter === filter.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`whitespace-nowrap ${
                    selectedFilter === filter.id
                      ? "bg-gradient-to-r from-green-500 to-emerald-500"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  data-testid={`filter-${filter.id}`}
                >
                  <filter.icon className="w-4 h-4 ml-2" />
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* المنشورات */}
      <div className="container mx-auto px-4 py-6">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Camera className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              لا توجد منشورات بعد
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              كن أول من يشارك منشور في مجتمع BizChat!
            </p>
            <Button
              onClick={() => setShowCreatePost(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <Plus className="w-4 h-4 ml-2" />
              أنشئ منشورك الأول
            </Button>
          </div>
        ) : (
          <div className="space-y-4 max-w-lg mx-auto">
            {posts.map((post) => (
              <InstagramPostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
              />
            ))}
          </div>
        )}
      </div>

      {/* نافذة إنشاء منشور جديد */}
      <EnhancedCreatePost
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        currentUser={currentUser}
      />
    </div>
  );
}