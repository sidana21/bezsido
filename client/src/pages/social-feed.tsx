import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, 
  Plus, Search, Filter, TrendingUp, MapPin, Tag, 
  ShoppingBag, Users, Eye, Camera, Video, Music,
  Sparkles, Crown, Verified, ArrowLeft, Send, Gift
} from "lucide-react";
import type { User, BizChatPost } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface PostWithUser extends BizChatPost {
  user: User;
  isLiked?: boolean;
  isSaved?: boolean;
  isFollowing?: boolean;
}

export default function SocialFeed() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreatePost, setShowCreatePost] = useState(false);

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

  // إعجاب بالمنشور
  const likeMutation = useMutation({
    mutationFn: async ({ postId, action }: { postId: string; action: 'like' | 'unlike' }) => {
      return apiRequest(`/api/posts/${postId}/interactions`, {
        method: "POST",
        body: JSON.stringify({ 
          interactionType: action === 'like' ? 'like' : 'unlike'
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-feed"] });
    },
  });

  // حفظ المنشور
  const saveMutation = useMutation({
    mutationFn: async ({ postId, action }: { postId: string; action: 'save' | 'unsave' }) => {
      return apiRequest(`/api/posts/${postId}/interactions`, {
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
    mutationFn: async ({ userId, action }: { userId: string; action: 'follow' | 'unfollow' }) => {
      return apiRequest(`/api/users/${userId}/follow`, {
        method: action === 'follow' ? "POST" : "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-feed"] });
      toast({
        title: "تم بنجاح",
        description: "تم تحديث حالة المتابعة",
      });
    },
  });

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:to-gray-800">
      {/* Header مع شعار BizChat */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/chat">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  BizChat
                </h1>
                <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-none">
                  تجاري
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowCreatePost(true)}
                size="sm"
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
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
          <div className="space-y-6 max-w-2xl mx-auto">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                {/* Header المنشور */}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Link href={`/profile/${post.user.id}`}>
                        <Avatar className="w-12 h-12 cursor-pointer border-2 border-gradient-to-r from-green-200 to-emerald-200">
                          <AvatarImage src={post.user.avatar || undefined} />
                          <AvatarFallback className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700">
                            {post.user.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <Link href={`/profile/${post.user.id}`}>
                            <span className="font-semibold text-gray-900 dark:text-white hover:text-green-600 cursor-pointer">
                              {post.user.name}
                            </span>
                          </Link>
                          {post.user.isVerified && (
                            <Verified className="w-4 h-4 text-blue-500 fill-current" />
                          )}
                          {post.businessInfo?.businessName && (
                            <Crown className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{formatTime(post.createdAt)}</span>
                          {post.locationInfo?.name && (
                            <>
                              <span>•</span>
                              <MapPin className="w-3 h-3" />
                              <span>{post.locationInfo.name}</span>
                            </>
                          )}
                          {post.isSponsored && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                                إعلان
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!post.isFollowing && post.user.id !== currentUser?.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => followMutation.mutate({ userId: post.user.id, action: 'follow' })}
                          disabled={followMutation.isPending}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          متابعة
                        </Button>
                      )}
                      
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* محتوى المنشور */}
                  {post.content && (
                    <div className="mt-3">
                      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                        {post.content}
                      </p>
                      
                      {/* الهاشتاغات */}
                      {post.hashtags && post.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {post.hashtags.map((hashtag, index) => (
                            <span key={index} className="text-green-600 hover:text-green-700 cursor-pointer font-medium">
                              #{hashtag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="pt-0">
                  {/* صور المنشور */}
                  {post.images && Array.isArray(post.images) && post.images.length > 0 && (
                    <div className="relative mb-4">
                      <div className={`grid gap-2 ${
                        post.images.length === 1 ? 'grid-cols-1' :
                        post.images.length === 2 ? 'grid-cols-2' :
                        post.images.length === 3 ? 'grid-cols-2' : 'grid-cols-2'
                      }`}>
                        {post.images?.slice(0, 4).map((image, index) => (
                          <div
                            key={index}
                            className={`relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700 ${
                              post.images && post.images.length === 3 && index === 0 ? 'row-span-2' : 'aspect-square'
                            }`}
                          >
                            <img
                              src={image}
                              alt={`صورة ${index + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                              onClick={() => {/* TODO: فتح عارض الصور */}}
                            />
                            
                            {/* عرض عدد الصور الإضافية */}
                            {index === 3 && post.images && post.images.length > 4 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-white text-xl font-bold">
                                  +{(post.images?.length || 0) - 4}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* وسوم المنتجات */}
                      {post.taggedProducts && post.taggedProducts.length > 0 && (
                        <>
                          {post.taggedProducts.map((product, index) => (
                            <div
                              key={index}
                              className="absolute w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                              style={{
                                left: `${product.position.x}%`,
                                top: `${product.position.y}%`,
                                transform: 'translate(-50%, -50%)'
                              }}
                            >
                              <ShoppingBag className="w-3 h-3 text-gray-700" />
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}

                  {/* معلومات الأعمال */}
                  {post.businessInfo?.businessName && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-4 border border-blue-100 dark:border-blue-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {post.businessInfo.businessName}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {post.businessInfo.category}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* إحصائيات التفاعل */}
                  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      {(post.likesCount || 0) > 0 && (
                        <span>{formatNumber(post.likesCount || 0)} إعجاب</span>
                      )}
                      {(post.commentsCount || 0) > 0 && (
                        <span>{formatNumber(post.commentsCount || 0)} تعليق</span>
                      )}
                      {(post.viewsCount || 0) > 0 && (
                        <span>{formatNumber(post.viewsCount || 0)} مشاهدة</span>
                      )}
                    </div>
                    
                    {(post.sharesCount || 0) > 0 && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatNumber(post.sharesCount || 0)} مشاركة
                      </span>
                    )}
                  </div>

                  {/* أزرار التفاعل */}
                  <div className="flex items-center justify-between pt-3">
                    <div className="flex items-center gap-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => likeMutation.mutate({ 
                          postId: post.id, 
                          action: post.isLiked ? 'unlike' : 'like' 
                        })}
                        disabled={likeMutation.isPending}
                        className="text-gray-600 hover:text-red-500 p-2"
                        data-testid={`button-like-${post.id}`}
                      >
                        <Heart className={`w-5 h-5 ml-2 ${post.isLiked ? 'fill-current text-red-500' : ''}`} />
                        إعجاب
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {/* TODO: فتح التعليقات */}}
                        className="text-gray-600 hover:text-blue-500 p-2"
                        data-testid={`button-comment-${post.id}`}
                      >
                        <MessageCircle className="w-5 h-5 ml-2" />
                        تعليق
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {/* TODO: مشاركة */}}
                        className="text-gray-600 hover:text-green-500 p-2"
                        data-testid={`button-share-${post.id}`}
                      >
                        <Share2 className="w-5 h-5 ml-2" />
                        مشاركة
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => saveMutation.mutate({ 
                        postId: post.id, 
                        action: post.isSaved ? 'unsave' : 'save' 
                      })}
                      disabled={saveMutation.isPending}
                      className="text-gray-600 hover:text-yellow-500 p-2"
                      data-testid={`button-save-${post.id}`}
                    >
                      <Bookmark className={`w-5 h-5 ${post.isSaved ? 'fill-current text-yellow-500' : ''}`} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* نافذة إنشاء منشور جديد */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-right">إنشاء منشور جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={currentUser?.avatar || undefined} />
                <AvatarFallback>{currentUser?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <span className="font-semibold">{currentUser?.name}</span>
                <p className="text-sm text-gray-500">منشور عام</p>
              </div>
            </div>
            
            <textarea
              placeholder="ماذا تريد أن تشارك؟"
              className="w-full h-32 p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              data-testid="textarea-post-content"
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-green-600">
                <Button variant="ghost" size="icon">
                  <Camera className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Music className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Tag className="w-5 h-5" />
                </Button>
              </div>
              
              <Button 
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                data-testid="button-publish-post"
              >
                <Send className="w-4 h-4 ml-2" />
                نشر
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}