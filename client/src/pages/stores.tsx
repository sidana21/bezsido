import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Store, MapPin, Phone, Clock, Star, ShoppingCart, Plus, Package, MessageCircle, ShieldCheck, Crown, Zap, Heart, TrendingUp, Award, Sparkles, Car, Truck, Home, Wrench, Scissors, Baby } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { User, Vendor, Product, Service, ServiceCategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TopBar } from "@/components/top-bar";

interface VendorWithOwner extends Vendor {
  owner: User;
}

export default function Stores() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState<VendorWithOwner | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user/current"],
  });

  // Fetch all products from all vendors for product marketplace display
  const { data: allProducts = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products", currentUser?.location],
    queryFn: () => apiRequest(`/api/products?location=${encodeURIComponent(currentUser?.location || '')}`),
    enabled: !!currentUser,
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      return apiRequest("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "تم الإضافة",
        description: "تم إضافة المنتج إلى السلة بنجاح",
      });
      setSelectedProduct(null);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إضافة المنتج إلى السلة",
        variant: "destructive",
      });
    },
  });

  // Contact seller mutation (for chat)
  const contactSellerMutation = useMutation({
    mutationFn: async ({ product, sellerId }: { product: Product; sellerId: string }) => {
      // Start chat with seller
      const chatResponse = await apiRequest("/api/chats/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId: sellerId }),
      });

      // Send product message
      const productMessage = `مرحباً، أريد شراء هذا المنتج:\n\n📦 ${product?.name || 'منتج'}\n💰 السعر: ${parseInt(product?.salePrice || product?.originalPrice || '0').toLocaleString()} دج\n📝 ${product?.description || 'بدون وصف'}\n\nهل هذا المنتج متوفر؟`;
      
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
    onSuccess: (data: any) => {
      setSelectedProduct(null);
      setLocation(`/chat/${data.chatId}`);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في بدء المحادثة مع البائع",
        variant: "destructive",
      });
    },
  });

  // Filter products for product marketplace search
  const filteredProducts = allProducts.filter(product =>
    product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product?.categoryId?.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <>
      <TopBar title="المتاجر" />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pb-20 pt-14 relative overflow-hidden">
        {/* Premium Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-2xl animate-pulse delay-2000"></div>
        </div>

        {/* Header - Premium Glass Style */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white backdrop-blur-xl shadow-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-green-600 w-12 h-12 rounded-full"
                data-testid="button-back"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-white to-white/90 bg-clip-text">متاجر BizChat</h1>
              <p className="text-white/80 text-sm">تسوق من مجموعة واسعة من المنتجات المحلية</p>
            </div>
          </div>
          <Link href="/profile">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-green-600 w-12 h-12 rounded-full"
              data-testid="button-profile"
            >
              <Crown className="w-6 h-6" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative px-6 py-8">
        {/* Location Banner - Premium Glass Card */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
          <div className="relative flex items-center gap-4 mb-4">
            <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">منتجات متاحة في {currentUser?.location}</h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg">تسوق من مجموعة واسعة من المنتجات المحلية</p>
            </div>
          </div>
        </div>

        {/* Premium Search Bar */}
        <div className="relative mb-8">
          <div className="absolute right-6 top-1/2 transform -translate-y-1/2 z-10">
            <Search className="w-6 h-6 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="ابحث عن منتج، فئة أو متجر..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-16 text-lg h-16 rounded-2xl border-2 border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl focus:shadow-2xl transition-all duration-300 focus:scale-[1.02]"
            data-testid="input-search-stores"
          />
        </div>

        {/* Service Categories - Horizontal Scroll */}
        <div className="mb-10">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-purple-500 animate-pulse" />
            فئات الخدمات
          </h3>
          <div className="relative">
            {/* Horizontal Scrollable Container */}
            <div className="flex gap-8 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory px-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              
              {/* Home Services - Circular with Pulse */}
              <Link href="/home-services" data-testid="link-home-services">
                <div className="flex-shrink-0 snap-start cursor-pointer group">
                  <div className="relative">
                    {/* Outer Pulsing Ring */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 blur-xl opacity-60 animate-pulse group-hover:opacity-80 transition-opacity"></div>
                    
                    {/* Main Circle */}
                    <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:shadow-3xl overflow-hidden">
                      {/* Animated Background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Pulsing Inner Glow */}
                      <div className="absolute inset-2 rounded-full bg-gradient-to-br from-green-300/40 to-transparent animate-pulse"></div>
                      
                      {/* Icon */}
                      <Home className="w-14 h-14 text-white drop-shadow-2xl relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                    </div>
                  </div>
                  
                  {/* Label */}
                  <div className="mt-4 text-center">
                    <h4 className="font-bold text-gray-800 dark:text-white text-base mb-1">خدمات منزلية</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">تنظيف ومنزلية</p>
                  </div>
                </div>
              </Link>

              {/* Beauty Services - Circular with Pulse */}
              <Link href="/beauty-services" data-testid="link-beauty-services">
                <div className="flex-shrink-0 snap-start cursor-pointer group">
                  <div className="relative">
                    {/* Outer Pulsing Ring */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 blur-xl opacity-60 animate-pulse group-hover:opacity-80 transition-opacity"></div>
                    
                    {/* Main Circle */}
                    <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:shadow-3xl overflow-hidden">
                      {/* Animated Background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Pulsing Inner Glow */}
                      <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-300/40 to-transparent animate-pulse"></div>
                      
                      {/* Icon */}
                      <Scissors className="w-14 h-14 text-white drop-shadow-2xl relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                    </div>
                  </div>
                  
                  {/* Label */}
                  <div className="mt-4 text-center">
                    <h4 className="font-bold text-gray-800 dark:text-white text-base mb-1">تجميل</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">صالونات وتجميل</p>
                  </div>
                </div>
              </Link>

              {/* Taxi Services - Circular with Pulse (Hidden for now) */}
              {/* <Link href="/taxi">
                <div className="flex-shrink-0 snap-start cursor-pointer group" data-testid="category-taxi">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 blur-xl opacity-60 animate-pulse group-hover:opacity-80 transition-opacity"></div>
                    
                    <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:shadow-3xl overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-300/40 to-transparent animate-pulse"></div>
                      <Car className="w-14 h-14 text-white drop-shadow-2xl relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <h4 className="font-bold text-gray-800 dark:text-white text-base mb-1">تاكسي</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">نقل الركاب</p>
                  </div>
                </div>
              </Link> */}

              {/* Delivery Services - Circular with Pulse (Hidden for now) */}
              {/* <Link href="/taxi-driver">
                <div className="flex-shrink-0 snap-start cursor-pointer group" data-testid="category-delivery">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 blur-xl opacity-60 animate-pulse group-hover:opacity-80 transition-opacity"></div>
                    
                    <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:shadow-3xl overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-300/40 to-transparent animate-pulse"></div>
                      <Truck className="w-14 h-14 text-white drop-shadow-2xl relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <h4 className="font-bold text-gray-800 dark:text-white text-base mb-1">توصيل</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">خدمة التوصيل</p>
                  </div>
                </div>
              </Link> */}
            </div>
            
            {/* Scroll Indicator - Animated */}
            <div className="flex justify-center mt-6 gap-2">
              <div className="h-1.5 w-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse shadow-lg"></div>
              <div className="h-1.5 w-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>
          </div>
          
          {/* CSS to hide scrollbar */}
          <style>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            @keyframes pulse {
              0%, 100% {
                opacity: 1;
              }
              50% {
                opacity: 0.5;
              }
            }
          `}</style>
        </div>

        {/* Promote Banner - Ultra Premium */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-3xl p-8 mb-10 overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-3xl mb-6 backdrop-blur-sm">
              <Store className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-white/90 bg-clip-text">قدم خدماتك</h2>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">انضم إلى منصة الخدمات المحلية الرائدة وقدم خدماتك لآلاف العملاء في منطقتك</p>
            <Link href="/my-vendor">
              <Button
                className="bg-white text-purple-600 hover:bg-white/90 text-lg px-8 py-4 rounded-2xl font-bold shadow-xl transition-all duration-300 hover:scale-105"
                data-testid="button-add-service"
              >
                سجل خدماتك مجاناً الآن
              </Button>
            </Link>
          </div>
        </div>

        {/* Loading State - Premium Products Grid */}
        {isLoadingProducts && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-10">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden animate-pulse">
                <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600"></div>
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Products Grid - Professional Style */}
        {!isLoadingProducts && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-10">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer transform"
                data-testid={`product-card-${product.id}`}
                onClick={() => setLocation(`/product/${product.id}`)}
              >
                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSIxMDAiIGZpbGw9IiNGM0Y0RjYiLz48L3N2Zz4=';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <Package className="w-12 h-12 text-gray-400" />
                    </div>
                  )}

                  {/* Discount Badge */}
                  {product.salePrice && parseInt(product.salePrice) < parseInt(product.originalPrice || product.salePrice) && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-red-500 text-white text-xs px-2 py-1 shadow-lg">
                        خصم
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="p-3 space-y-2">
                  {/* Rating */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-xs text-gray-500">4.5</span>
                    </div>
                  </div>
                  
                  {/* Product Name */}
                  <h3 className="font-medium text-sm text-gray-800 dark:text-white line-clamp-2 leading-4 group-hover:text-blue-600 transition-colors">
                    {product?.name || 'اسم المنتج'}
                  </h3>
                  
                  {/* Price */}
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-green-600">
                      {parseInt(product?.salePrice || product?.originalPrice || '0').toLocaleString()} دج
                    </span>
                    {product.salePrice && product.originalPrice && parseInt(product.salePrice) < parseInt(product.originalPrice) && (
                      <span className="text-xs text-gray-400 line-through">
                        {parseInt(product.originalPrice).toLocaleString()} دج
                      </span>
                    )}
                  </div>
                  
                  {/* Buy Now Button */}
                  <Button
                    size="sm"
                    className="w-full mt-2 h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProduct(product);
                    }}
                    data-testid={`button-buy-now-${product.id}`}
                  >
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    اشتري
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State - Premium */}
        {!isLoadingProducts && filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
              <Package className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              {searchQuery ? "لا توجد منتجات تطابق البحث" : "لا توجد منتجات في هذه المنطقة حالياً"}
            </h3>
            {!searchQuery && (
              <p className="text-gray-500 text-lg mb-8">
                كن أول من يضيف منتجاته في هذه المنطقة!
              </p>
            )}
            <Link href="/my-store">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                أضف منتجاتك
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Floating Action Button - Premium */}
      <div className="fixed bottom-24 left-6 z-50">
        <Link href="/my-vendor">
          <Button
            className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-2xl transition-all duration-300 hover:scale-110 animate-bounce"
            data-testid="fab-my-service"
          >
            <Store className="h-8 w-8 text-white" />
          </Button>
        </Link>
      </div>

      {/* Product Preview Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>معاينة المنتج</DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4">
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700 rounded-lg">
                {selectedProduct.images && selectedProduct.images.length > 0 ? (
                  <img
                    src={selectedProduct.images[0]}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                    data-testid="img-product-preview"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-400" />
                  </div>
                )}

                {/* Discount Badge */}
                {selectedProduct.salePrice && parseInt(selectedProduct.salePrice) < parseInt(selectedProduct.originalPrice || selectedProduct.salePrice) && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-red-500 text-white text-xs px-2 py-1 shadow-lg">
                      خصم
                    </Badge>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                  {selectedProduct.name}
                </h3>
                
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedProduct.description}
                </p>

                {/* Price */}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xl text-green-600">
                    {parseInt(selectedProduct.salePrice || selectedProduct.originalPrice || '0').toLocaleString()} دج
                  </span>
                  {selectedProduct.salePrice && selectedProduct.originalPrice && parseInt(selectedProduct.salePrice) < parseInt(selectedProduct.originalPrice) && (
                    <span className="text-sm text-gray-400 line-through">
                      {parseInt(selectedProduct.originalPrice).toLocaleString()} دج
                    </span>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-500">4.5 (125 تقييم)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => addToCartMutation.mutate({ productId: selectedProduct.id })}
                  disabled={addToCartMutation.isPending}
                  data-testid="button-add-to-cart"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  إضافة إلى السلة
                </Button>
                
                <Button
                  variant="outline"
                  className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50"
                  onClick={() => contactSellerMutation.mutate({ 
                    product: selectedProduct, 
                    sellerId: selectedProduct.vendorId 
                  })}
                  disabled={contactSellerMutation.isPending}
                  data-testid="button-contact-seller"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  تواصل مع البائع
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}