import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, UserPlus, UserMinus, MessageCircle, MoreHorizontal,
  MapPin, Calendar, Globe, Phone, Mail, Briefcase, Award,
  Heart, Eye, TrendingUp, Users, Grid, Bookmark, Tag,
  Verified, Crown, Star, ShoppingBag, Share2, Settings,
  Camera, Edit, Link as LinkIcon, Instagram, Facebook, Twitter
} from "lucide-react";
import type { User, BivochatPost, Follow } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { TopBar } from "@/components/top-bar";

interface ProfileData extends User {
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing?: boolean;
  isOwnProfile?: boolean;
  bio?: string;
  businessInfo?: {
    businessName?: string;
    category?: string;
    location?: string;
    website?: string;
    phone?: string;
  };
  businessStats?: {
    totalViews: number;
    totalLikes: number;
    engagementRate: number;
    totalSales: number;
  };
}

interface PostWithStats extends BivochatPost {
  user: User;
  isLiked?: boolean;
  isSaved?: boolean;
}

export default function UserProfile() {
  const { userId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("posts");
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  // جلب بيانات المستخدم الحالي
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user/current"],
  });

  // جلب بيانات الملف الشخصي
  const { data: profileData, isLoading: isLoadingProfile } = useQuery<ProfileData>({
    queryKey: ["/api/users/profile", userId],
    queryFn: () => apiRequest(`/api/users/${userId}/profile`),
    enabled: !!userId,
  });

  // تتبع زيارة الملف الشخصي وإرسال إشعار (مع تحديد معدل الزيارات)
  useEffect(() => {
    const trackProfileVisit = async () => {
      // عدم إرسال إشعار إذا كان المستخدم يزور ملفه الخاص
      if (!userId || !currentUser || !profileData || profileData.isOwnProfile) {
        return;
      }

      // تحديد معدل الزيارات - عدم إرسال إشعار إذا تم زيارة نفس الملف في آخر 5 دقائق
      const visitKey = `profile_visit_${currentUser.id}_${userId}`;
      const lastVisit = sessionStorage.getItem(visitKey);
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (lastVisit && (now - parseInt(lastVisit)) < fiveMinutes) {
        // تم زيارة الملف مؤخراً، لا نرسل إشعار
        return;
      }

      try {
        // إرسال إشعار زيارة الملف
        await apiRequest(`/api/users/${userId}/profile-visit`, {
          method: 'POST',
        });
        
        // حفظ وقت الزيارة
        sessionStorage.setItem(visitKey, now.toString());
      } catch (error) {
        // تجاهل الأخطاء - تتبع زيارة اختياري
        console.log('Profile visit tracking error:', error);
      }
    };

    // تأخير بسيط للتأكد من أن البيانات جاهزة
    const timer = setTimeout(trackProfileVisit, 1000);
    return () => clearTimeout(timer);
  }, [userId, currentUser, profileData]);

  // جلب منشورات المستخدم
  const { data: userPosts = [], isLoading: isLoadingPosts } = useQuery<PostWithStats[]>({
    queryKey: ["/api/users", userId, "posts"],
    queryFn: () => apiRequest(`/api/users/${userId}/posts`),
    enabled: !!userId,
  });

  // جلب المنشورات المحفوظة (إذا كان الملف الشخصي الخاص)
  const { data: savedPosts = [] } = useQuery<PostWithStats[]>({
    queryKey: ["/api/users/saved-posts"],
    queryFn: () => apiRequest(`/api/users/saved-posts`),
    enabled: profileData?.isOwnProfile,
  });

  // جلب منتجات المستخدم
  const { data: userProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/users", userId, "products"],
    queryFn: () => apiRequest(`/api/users/${userId}/products`),
    enabled: !!userId,
  });

  // دمج المنشورات والمنتجات في مصفوفة واحدة للعرض
  const allUserContent = [
    ...(userPosts as any[]).map((post: any) => ({
      id: post.id,
      type: 'post',
      imageUrl: post.images?.[0],
      videoUrl: post.videoUrl,
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      images: post.images,
      ...post
    })),
    ...(userProducts as any[]).map((product: any) => ({
      id: product.id,
      type: 'product',
      imageUrl: product.imageUrl,
      videoUrl: product.videoUrl,
      name: product.name,
      price: product.price,
      ...product
    }))
  ];

  // متابعة/إلغاء متابعة
  const followMutation = useMutation({
    mutationFn: async (action: 'follow' | 'unfollow') => {
      return apiRequest(`/api/users/${userId}/follow`, {
        method: action === 'follow' ? "POST" : "DELETE",
      });
    },
    onSuccess: (_, action) => {
      // تحديث فوري لجميع البيانات ذات الصلة
      queryClient.invalidateQueries({ queryKey: ["/api/users/profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "followers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "following"] });
      
      // تحديث إحصائيات المستخدم الحالي في كلا الصفحتين
      if (currentUser?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/users", currentUser.id, "stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/users/profile", currentUser.id] });
        queryClient.invalidateQueries({ queryKey: ["/api/users", currentUser.id, "following"] });
        queryClient.invalidateQueries({ queryKey: ["/api/user/current"] });
      }
      
      // تحديث قائمة الإشعارات لإظهار إشعار المتابعة الجديد
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/social"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/social/unread-count"] });
      
      toast({
        title: "تم بنجاح",
        description: action === 'follow' ? "تم متابعة المستخدم" : "تم إلغاء المتابعة",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة المتابعة",
        variant: "destructive",
      });
    },
  });

  // إرسال رسالة
  const startChatMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/chats/start", {
        method: "POST",
        body: JSON.stringify({ otherUserId: userId }),
      });
      return response;
    },
    onSuccess: (data) => {
      navigate(`/chat/${data.chatId}`);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في بدء المحادثة",
        variant: "destructive",
      });
    },
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}م`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}ك`;
    return num.toString();
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            <div className="flex items-center space-x-6 rtl:space-x-reverse">
              <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="space-y-4 flex-1">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                <div className="flex space-x-4 rtl:space-x-reverse">
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            المستخدم غير موجود
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            لم يتم العثور على هذا المستخدم
          </p>
          <Link href="/social-feed">
            <Button>العودة للمنشورات</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:to-gray-800">
      {/* TopBar للإشعارات العالمية */}
      <TopBar title={profileData?.name || "الملف الشخصي"} />
      
      {/* محتوى الصفحة مع مسافة من الأعلى لتجنب التداخل مع TopBar */}
      <div className="pt-14">
        {/* Header */}
        <div className="sticky top-14 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/social-feed">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {profileData.name}
                </h1>
                <p className="text-sm text-gray-500">
                  {formatNumber(profileData.postsCount)} منشور
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Share2 className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
              {profileData.isOwnProfile && (
                <Link href="/profile/edit">
                  <Button variant="ghost" size="icon">
                    <Settings className="w-5 h-5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* معلومات الملف الشخصي */}
        <div className="space-y-6">
          {/* الصورة والمعلومات الأساسية */}
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="relative">
              <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-white shadow-xl">
                <AvatarImage src={profileData.avatar || undefined} className="object-cover" />
                <AvatarFallback className="text-4xl bg-gradient-to-r from-green-100 to-emerald-100 text-green-700">
                  {profileData.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              {profileData.isOwnProfile && (
                <Button
                  size="icon"
                  className="absolute bottom-2 right-2 rounded-full bg-white shadow-lg hover:bg-gray-50"
                >
                  <Camera className="w-4 h-4 text-gray-600" />
                </Button>
              )}
            </div>

            <div className="flex-1 space-y-4">
              {/* الاسم والشارات */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profileData.name}
                  </h2>
                  {profileData.isVerified && (
                    <Verified className="w-6 h-6 text-blue-500 fill-current" />
                  )}
                  {profileData.businessInfo?.businessName && (
                    <Crown className="w-6 h-6 text-yellow-500" />
                  )}
                </div>
                
                {profileData.businessInfo?.businessName && (
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {profileData.businessInfo.businessName}
                    </span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      تجاري
                    </Badge>
                  </div>
                )}
              </div>

              {/* الإحصائيات */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(profileData.postsCount)}
                  </div>
                  <div className="text-sm text-gray-500">منشور</div>
                </div>
                
                <button
                  onClick={() => setShowFollowersModal(true)}
                  className="text-center hover:opacity-80 transition-opacity"
                  data-testid="button-followers"
                >
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(profileData.followersCount)}
                  </div>
                  <div className="text-sm text-gray-500">متابع</div>
                </button>
                
                <button
                  onClick={() => setShowFollowingModal(true)}
                  className="text-center hover:opacity-80 transition-opacity"
                  data-testid="button-following"
                >
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(profileData.followingCount)}
                  </div>
                  <div className="text-sm text-gray-500">يتابع</div>
                </button>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex items-center gap-3">
                {profileData.isOwnProfile ? (
                  <Link href="/profile/edit" className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Edit className="w-4 h-4 ml-2" />
                      تعديل الملف الشخصي
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Button
                      onClick={() => followMutation.mutate(profileData.isFollowing ? 'unfollow' : 'follow')}
                      disabled={followMutation.isPending}
                      className={`flex-1 ${
                        profileData.isFollowing
                          ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                          : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                      }`}
                      data-testid="button-follow"
                    >
                      {profileData.isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4 ml-2" />
                          إلغاء المتابعة
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 ml-2" />
                          متابعة
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => startChatMutation.mutate()}
                      disabled={startChatMutation.isPending}
                      className="flex-1"
                      data-testid="button-message"
                    >
                      <MessageCircle className="w-4 h-4 ml-2" />
                      رسالة
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* الوصف والمعلومات الإضافية */}
          <div className="space-y-4">
            {profileData.bio && (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {profileData.bio}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
              {profileData.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{profileData.location}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>انضم في {profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString('ar') : 'غير محدد'}</span>
              </div>

              {profileData.businessInfo?.website && (
                <div className="flex items-center gap-1">
                  <LinkIcon className="w-4 h-4" />
                  <a 
                    href={profileData.businessInfo.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700"
                  >
                    {profileData.businessInfo.website}
                  </a>
                </div>
              )}
            </div>

            {/* الإحصائيات التجارية */}
            {profileData.businessStats && (
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatNumber(profileData.businessStats.totalViews)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">مشاهدة</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatNumber(profileData.businessStats.totalLikes)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">إعجاب</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {profileData.businessStats.engagementRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">تفاعل</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatNumber(profileData.businessStats.totalSales)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">مبيعة</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* التبويبات */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="posts" className="flex items-center gap-2">
                <Grid className="w-4 h-4" />
                المنشورات
              </TabsTrigger>
              {profileData.isOwnProfile && (
                <TabsTrigger value="saved" className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4" />
                  المحفوظة
                </TabsTrigger>
              )}
              <TabsTrigger value="tagged" className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                المعلمة
              </TabsTrigger>
            </TabsList>

            {/* منشورات ومنتجات المستخدم */}
            <TabsContent value="posts" className="mt-6">
              {isLoadingPosts ? (
                <div className="grid grid-cols-3 gap-1">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                  ))}
                </div>
              ) : allUserContent.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                    لا توجد منشورات أو منتجات بعد
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {profileData.isOwnProfile ? "شارك منشورك أو منتجك الأول!" : "لم يشارك أي منشورات أو منتجات بعد"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {allUserContent.map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="aspect-square bg-gray-100 dark:bg-gray-800 relative group cursor-pointer overflow-hidden"
                      onClick={() => {
                        if (item.type === 'post') {
                          navigate(`/social-feed`);
                        } else if (item.type === 'product') {
                          navigate(`/product/${item.id}`);
                        }
                      }}
                      data-testid={`${item.type}-${item.id}`}
                    >
                      {/* عرض الصورة أو الفيديو */}
                      {item.videoUrl ? (
                        <video
                          src={item.videoUrl}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.type === 'product' ? item.name : 'منشور'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : item.images && item.images.length > 0 ? (
                        <img
                          src={item.images[0]}
                          alt={item.type === 'product' ? item.name : 'منشور'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                          <Camera className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      
                      {/* إحصائيات عند التمرير */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        {item.type === 'post' ? (
                          <div className="flex items-center gap-4 text-white">
                            <div className="flex items-center gap-1">
                              <Heart className="w-5 h-5 fill-current" />
                              <span>{formatNumber(item.likesCount || 0)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-5 h-5 fill-current" />
                              <span>{formatNumber(item.commentsCount || 0)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-white text-center px-2">
                            <ShoppingBag className="w-6 h-6 mx-auto mb-1" />
                            <p className="text-sm font-semibold truncate">{item.name}</p>
                            {item.price && (
                              <p className="text-xs">{item.price} د.ج</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* مؤشر نوع المحتوى */}
                      <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
                        {item.type === 'product' ? (
                          <ShoppingBag className="w-4 h-4 text-white" />
                        ) : item.images && item.images.length > 1 ? (
                          <Grid className="w-4 h-4 text-white" />
                        ) : item.videoUrl ? (
                          <div className="w-4 h-4 text-white">▶</div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* المنشورات المحفوظة */}
            {profileData.isOwnProfile && (
              <TabsContent value="saved" className="mt-6">
                {savedPosts.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bookmark className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                      لا توجد منشورات محفوظة
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      احفظ المنشورات التي تعجبك لتجدها هنا لاحقاً
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1">
                    {savedPosts.map((post) => (
                      <div
                        key={post.id}
                        className="aspect-square bg-gray-100 dark:bg-gray-800 relative group cursor-pointer overflow-hidden"
                        onClick={() => navigate(`/social-feed`)}
                      >
                        {post.images && post.images.length > 0 ? (
                          <img
                            src={post.images[0]}
                            alt="منشور محفوظ"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                            <Bookmark className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}

            {/* المنشورات المعلمة */}
            <TabsContent value="tagged" className="mt-6">
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Tag className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                  لا توجد منشورات معلمة
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  المنشورات التي تم تعليم هذا المستخدم فيها ستظهر هنا
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* نافذة المتابعين */}
      <Dialog open={showFollowersModal} onOpenChange={setShowFollowersModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">المتابعون</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <div className="text-center py-8 text-gray-500">
              قائمة المتابعين ستكون متاحة قريباً
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة المتابَعين */}
      <Dialog open={showFollowingModal} onOpenChange={setShowFollowingModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">يتابع</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <div className="text-center py-8 text-gray-500">
              قائمة المتابَعين ستكون متاحة قريباً
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div> {/* إغلاق div pt-14 */}
    </div>
  );
}