import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Bookmark,
  Plus,
  MoreHorizontal,
  Store,
  MapPin,
  Clock,
  Star,
  Send,
  Camera
} from "lucide-react";
import { Link } from "wouter";

interface BusinessPost {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    isVerified?: boolean;
  };
  content: string;
  imageUrl?: string;
  businessName?: string;
  location?: string;
  category?: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  isSaved: boolean;
  timestamp: string;
  product?: {
    name: string;
    price: string;
    originalPrice?: string;
  };
}

interface BusinessStory {
  id: string;
  userId: string;
  user: {
    name: string;
    avatar?: string;
  };
  businessName: string;
  isViewed: boolean;
  imageUrl: string;
}

export default function Neighborhoods() {
  const { toast } = useToast();
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);

  // Mock data for business stories
  const businessStories: BusinessStory[] = [
    {
      id: "1",
      userId: "1",
      user: { name: "متجر الإلكترونيات", avatar: "/api/placeholder/40/40" },
      businessName: "متجر الإلكترونيات",
      isViewed: false,
      imageUrl: "/api/placeholder/400/600"
    },
    {
      id: "2", 
      userId: "2",
      user: { name: "مطعم البركة", avatar: "/api/placeholder/40/40" },
      businessName: "مطعم البركة",
      isViewed: true,
      imageUrl: "/api/placeholder/400/600"
    },
    {
      id: "3",
      userId: "3", 
      user: { name: "صالون الجمال", avatar: "/api/placeholder/40/40" },
      businessName: "صالون الجمال",
      isViewed: false,
      imageUrl: "/api/placeholder/400/600"
    },
    {
      id: "4",
      userId: "4",
      user: { name: "ورشة السيارات", avatar: "/api/placeholder/40/40" },
      businessName: "ورشة السيارات", 
      isViewed: true,
      imageUrl: "/api/placeholder/400/600"
    }
  ];

  // Mock data for business posts
  const businessPosts: BusinessPost[] = [
    {
      id: "1",
      userId: "1",
      user: {
        id: "1",
        name: "متجر الإلكترونيات الحديثة", 
        avatar: "/api/placeholder/40/40",
        isVerified: true
      },
      content: "🔥 عرض خاص لفترة محدودة! خصم 30% على جميع أجهزة اللابتوب والهواتف الذكية. اطلب الآن واحصل على توصيل مجاني لجميع أنحاء المدينة!",
      imageUrl: "/api/placeholder/400/300",
      businessName: "متجر الإلكترونيات الحديثة",
      location: "وسط المدينة",
      category: "إلكترونيات",
      likes: 84,
      comments: 12,
      isLiked: false,
      isSaved: false,
      timestamp: "منذ 2 ساعة",
      product: {
        name: "لابتوب Dell Inspiron",
        price: "85,000 دج",
        originalPrice: "120,000 دج"
      }
    },
    {
      id: "2", 
      userId: "2",
      user: {
        id: "2",
        name: "مطعم البركة للمأكولات الشعبية",
        avatar: "/api/placeholder/40/40",
        isVerified: true
      },
      content: "🍽️ اليوم في قائمة طعامنا: كسكس باللحم الطازج مع الخضار المتنوعة. طبخ بيتي أصيل بطعم لا يُنسى! احجز طاولتك الآن.",
      imageUrl: "/api/placeholder/400/300",
      businessName: "مطعم البركة",
      location: "حي السلام",
      category: "مطاعم",
      likes: 156,
      comments: 28,
      isLiked: true,
      isSaved: true,
      timestamp: "منذ 4 ساعات"
    },
    {
      id: "3",
      userId: "3", 
      user: {
        id: "3",
        name: "صالون الأناقة للجمال",
        avatar: "/api/placeholder/40/40",
        isVerified: false
      },
      content: "✨ خدمات تجميل وعناية شاملة للعروس! باقات مخصصة ليوم زفافك المميز. احجزي موعدك مسبقاً للاستفادة من العروض الخاصة.",
      imageUrl: "/api/placeholder/400/300", 
      businessName: "صالون الأناقة",
      location: "حي النور",
      category: "تجميل",
      likes: 73,
      comments: 15,
      isLiked: false,
      isSaved: false,
      timestamp: "منذ 6 ساعات"
    }
  ];

  // Get current user
  const { data: currentUser } = useQuery<any>({
    queryKey: ["/api/user/current"],
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      return apiRequest(`/api/posts/${postId}/${isLiked ? 'unlike' : 'like'}`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-posts"] });
    },
  });

  // Save post mutation  
  const savePostMutation = useMutation({
    mutationFn: async ({ postId, isSaved }: { postId: string; isSaved: boolean }) => {
      return apiRequest(`/api/posts/${postId}/${isSaved ? 'unsave' : 'save'}`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-posts"] });
    },
  });

  const handleLike = (postId: string, isLiked: boolean) => {
    likePostMutation.mutate({ postId, isLiked });
  };

  const handleSave = (postId: string, isSaved: boolean) => {
    savePostMutation.mutate({ postId, isSaved });
  };

  const handleStoryClick = (index: number) => {
    setActiveStoryIndex(index);
    // Here you would typically open a story viewer
    toast({
      title: "عرض القصة",
      description: `جاري فتح قصة ${businessStories[index].businessName}`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            BizFeed
          </h1>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-400">
              <Heart className="w-6 h-6" />
            </Button>
            <Link href="/chat">
              <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-400" data-testid="button-chat">
                <MessageCircle className="w-6 h-6" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stories Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex gap-4 overflow-x-auto pb-2">
          {/* Add Story Button */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center border-2 border-dashed border-gray-400">
                <Plus className="w-6 h-6 text-gray-500" />
              </div>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">إضافة قصة</span>
          </div>

          {/* Business Stories */}
          {businessStories.map((story, index) => (
            <div 
              key={story.id} 
              className="flex flex-col items-center flex-shrink-0 cursor-pointer"
              onClick={() => handleStoryClick(index)}
              data-testid={`story-${story.id}`}
            >
              <div className="relative">
                <div className={`w-16 h-16 rounded-full p-0.5 ${
                  story.isViewed 
                    ? 'bg-gray-300 dark:bg-gray-600' 
                    : 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500'
                }`}>
                  <Avatar className="w-full h-full border-2 border-white dark:border-gray-800">
                    <AvatarImage src={story.user.avatar} alt={story.user.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                      {story.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center max-w-[64px] truncate">
                {story.businessName}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-0">
        {businessPosts.map((post) => (
          <Card key={post.id} className="bg-white dark:bg-gray-800 rounded-none border-x-0 border-t-0 shadow-none" data-testid={`post-${post.id}`}>
            {/* Post Header */}
            <div className="flex items-center justify-between p-4 pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={post.user.avatar} alt={post.user.name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {post.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white" data-testid={`post-user-${post.id}`}>
                      {post.user.name}
                    </span>
                    {post.user.isVerified && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <MapPin className="w-3 h-3" />
                    <span>{post.location}</span>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span>{post.timestamp}</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-gray-500 dark:text-gray-400">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>

            {/* Post Image */}
            {post.imageUrl && (
              <div className="relative">
                <img 
                  src={post.imageUrl} 
                  alt="Post content"
                  className="w-full aspect-square object-cover"
                  data-testid={`post-image-${post.id}`}
                />
                {post.product && (
                  <div className="absolute bottom-4 left-4 bg-black/70 text-white rounded-lg p-3 backdrop-blur-sm">
                    <div className="text-sm font-semibold">{post.product.name}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-green-400">{post.product.price}</span>
                      {post.product.originalPrice && (
                        <span className="text-sm text-gray-300 line-through">{post.product.originalPrice}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Post Actions */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`p-0 ${post.isLiked ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}
                    onClick={() => handleLike(post.id, post.isLiked)}
                    data-testid={`button-like-${post.id}`}
                  >
                    <Heart className={`w-6 h-6 ${post.isLiked ? 'fill-current' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="icon" className="p-0 text-gray-700 dark:text-gray-300">
                    <MessageCircle className="w-6 h-6" />
                  </Button>
                  <Button variant="ghost" size="icon" className="p-0 text-gray-700 dark:text-gray-300">
                    <Send className="w-6 h-6" />
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`p-0 ${post.isSaved ? 'text-yellow-600' : 'text-gray-700 dark:text-gray-300'}`}
                  onClick={() => handleSave(post.id, post.isSaved)}
                  data-testid={`button-save-${post.id}`}
                >
                  <Bookmark className={`w-6 h-6 ${post.isSaved ? 'fill-current' : ''}`} />
                </Button>
              </div>

              {/* Likes Count */}
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2" data-testid={`likes-count-${post.id}`}>
                {post.likes.toLocaleString()} إعجاب
              </div>

              {/* Post Content */}
              <div className="text-sm text-gray-900 dark:text-white mb-2">
                <span className="font-semibold">{post.user.name}</span>
                <span className="mr-2" data-testid={`post-content-${post.id}`}>{post.content}</span>
              </div>

              {/* Category Badge */}
              {post.category && (
                <Badge variant="secondary" className="mb-2">
                  {post.category}
                </Badge>
              )}

              {/* Comments */}
              {post.comments > 0 && (
                <Button variant="ghost" className="p-0 h-auto text-sm text-gray-500 dark:text-gray-400 mb-2" data-testid={`comments-${post.id}`}>
                  عرض جميع التعليقات الـ {post.comments}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6 z-50">
        <Link href="/my-store">
          <Button
            className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-2xl transition-all duration-300 hover:scale-110"
            data-testid="fab-create-post"
          >
            <Camera className="h-6 w-6 text-white" />
          </Button>
        </Link>
      </div>
    </div>
  );
}