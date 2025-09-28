import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ImageModal } from "@/components/ui/image-modal";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  MessageCircle,
  Heart,
  Share2,
  ShoppingCart,
  MapPin,
  User,
  Store,
  Star,
  Phone,
  Clock,
  ChevronLeft,
  ChevronRight,
  Package
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string | null;
  images?: string[];
  category: string;
  location: string;
  isActive: boolean;
  commissionRate: string;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    avatar: string | null;
    phoneNumber: string;
    location: string;
    isOnline: boolean | null;
    isVerified: boolean | null;
  };
  store?: {
    id: string;
    name: string;
    description: string;
    category: string;
  };
}

interface CartItem {
  id: string;
  productId: string;
  quantity: string;
  addedAt: string;
}

export default function ProductDetail() {
  const { productId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Product details query
  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/products", productId],
    retry: false,
    refetchOnMount: true,
  });

  // Start chat mutation
  const startChatMutation = useMutation({
    mutationFn: async (sellerId: string) => {
      console.log("Sending request with sellerId:", sellerId);
      
      // Start chat with seller
      const chatResponse = await apiRequest("/api/chats/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId: sellerId }),
      });

      // Send product message
      const productMessage = `مرحباً 👋\n\nأنا مهتم بهذا المنتج:\n🛍️ ${product?.name}\n💰 ${formatCurrency(product?.price || '0')}\n📍 ${product?.location}\n\nهل يمكنك تزويدي بمزيد من التفاصيل؟\nشكراً لك 🙏`;
      
      await apiRequest(`/api/chats/${chatResponse.chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: productMessage,
          messageType: "text",
          replyToId: null,
        }),
      });

      return chatResponse;
    },
    onSuccess: (data) => {
      navigate(`/chat/${data.chatId}`);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في بدء المحادثة مع البائع",
        variant: "destructive",
      });
    },
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/cart`, {
        method: "POST",
        body: JSON.stringify({ 
          productId: product?.id,
          quantity: 1 
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم إضافة المنتج إلى السلة",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إضافة المنتج إلى السلة",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (price: string | number | undefined) => {
    if (price == null || price === '') return '0 دج';
    return `${parseFloat(price.toString()).toLocaleString()} دج`;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name || "منتج",
          text: `شاهد هذا المنتج الرائع: ${product?.name}`,
          url: window.location.href
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback - copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "تم النسخ",
          description: "تم نسخ رابط المنتج",
        });
      } catch (error) {
        toast({
          title: "خطأ",
          description: "فشل في نسخ الرابط",
          variant: "destructive",
        });
      }
    }
  };

  const handleContactSeller = () => {
    if (product) {
      console.log("Product data:", product);
      console.log("Owner ID:", product.owner?.id);
      console.log("Owner data:", product.owner);
      
      // Use hardcoded seller ID for now to test
      const sellerId = product.owner?.id || "user-store-3"; // Bakery owner from storage
      console.log("Using seller ID:", sellerId);
      
      startChatMutation.mutate(sellerId);
    }
  };

  // Use only actual product images
  const productImages = (product?.images && product.images.length > 0) 
    ? product.images 
    : (product?.imageUrl ? [product.imageUrl] : []);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  // Touch handlers for swipe functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && productImages.length > 1) {
      nextImage();
    }
    if (isRightSwipe && productImages.length > 1) {
      prevImage();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded-md w-32 mb-6"></div>
            <div className="aspect-square bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-8 bg-gray-200 rounded-md w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded-md w-1/2 mb-8"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded-md"></div>
              <div className="h-4 bg-gray-200 rounded-md w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded-md w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">المنتج غير موجود</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">لم يتم العثور على المنتج المطلوب</p>
          <Link href="/stores">
            <Button>العودة إلى المتاجر</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/stores">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            
            <h1 className="font-semibold text-lg truncate mx-4">{product.name}</h1>
            
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsLiked(!isLiked)}
                data-testid="button-like"
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current text-red-500' : ''}`} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleShare}
                data-testid="button-share"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Images Carousel */}
      <div 
        ref={imageContainerRef}
        className="relative aspect-square max-h-[400px] overflow-hidden cursor-pointer group"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (productImages.length > 0) {
            setImageModalOpen(true);
          }
        }}
      >
        {productImages.length > 0 ? (
          <>
            <img
              src={productImages[currentImageIndex]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300"
              data-testid="product-main-image"
            />
            
            {/* Zoom indicator overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="bg-white/90 text-gray-800 px-4 py-2 rounded-full text-sm font-medium">
                اضغط للتكبير
              </div>
            </div>
            
            {productImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  data-testid="button-prev-image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  data-testid="button-next-image"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
                
                {/* Swipe hint */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
                  اسحب يميناً أو يساراً
                </div>
                
                {/* Image indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {productImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                      data-testid={`image-indicator-${index}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <Package className="w-16 h-16 text-gray-400" />
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Price and Title */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                {product.name}
              </h1>
              <Badge variant="outline" className="ml-4 shrink-0">
                {product.category}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl font-bold text-whatsapp-green" data-testid="product-price">
                {formatCurrency(product?.price)}
              </span>
              {product.commissionRate && parseFloat(product.commissionRate) > 0 && (
                <Badge variant="secondary" className="text-sm">
                  عمولة {(parseFloat(product.commissionRate) * 100).toFixed(0)}%
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="w-4 h-4" />
              <span>{product.location}</span>
              <span className="mx-2">•</span>
              <Clock className="w-4 h-4" />
              <span>منشور منذ {new Date(product.createdAt).toLocaleDateString('ar')}</span>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">وصف المنتج</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </div>

          <Separator />

          {/* Seller Information */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">معلومات البائع</h3>
              
              <div className="flex items-start gap-3 mb-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={product.owner?.avatar || undefined} />
                  <AvatarFallback>
                    <User className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{product.owner?.name}</h4>
                    {product.owner?.isVerified && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                    {product.owner?.isOnline && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{product.owner?.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>{product.owner?.phoneNumber}</span>
                    </div>
                  </div>
                  
                  {/* Quick chat button */}
                  <Button
                    onClick={handleContactSeller}
                    disabled={startChatMutation.isPending}
                    className="w-full mt-3 bg-whatsapp-green hover:bg-green-600"
                    data-testid="button-quick-chat"
                  >
                    <MessageCircle className="w-4 h-4 ml-2" />
                    💬 دردشة سريعة
                  </Button>
                </div>
              </div>

              {/* Store Information */}
              {product.store && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Store className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900 dark:text-white">{product.store.name}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{product.store.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 safe-area-pb">
        <div className="container mx-auto">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => addToCartMutation.mutate()}
              disabled={addToCartMutation.isPending}
              data-testid="button-add-to-cart"
            >
              <ShoppingCart className="w-4 h-4 ml-2" />
              {addToCartMutation.isPending ? "جاري الإضافة..." : "أضف للسلة"}
            </Button>
            
            <Button
              className="flex-1 bg-whatsapp-green hover:bg-green-600 relative"
              onClick={handleContactSeller}
              disabled={startChatMutation.isPending}
              data-testid="button-contact-seller"
            >
              <MessageCircle className="w-5 h-5 ml-2" />
              {startChatMutation.isPending ? "جاري الاتصال..." : "💬 دردشة مع البائع"}
              
              {/* Chat indicator */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Bottom spacer for fixed actions */}
      <div className="h-20"></div>

      {/* Image Modal */}
      <ImageModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        images={productImages}
        currentIndex={currentImageIndex}
        title={product.name}
        showNavigation={true}
        showActions={true}
      />
    </div>
  );
}