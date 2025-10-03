import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Store, MapPin, Phone, Clock, Star, ShoppingCart, Plus, Package, MessageCircle, ShieldCheck, Crown, Zap, Heart, TrendingUp, Award, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { User, Vendor as StoreType, Product } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface StoreWithOwner extends StoreType {
  owner: User;
  name: string;
  category: string;
  id: string;
}

export default function StoresPremium() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState<StoreWithOwner | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set());
  const observer = useRef<IntersectionObserver>();

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user/current"],
  });

  const { data: stores = [], isLoading: isLoadingStores } = useQuery<StoreWithOwner[]>({
    queryKey: ["/api/stores", currentUser?.location],
    queryFn: () => apiRequest(`/api/stores?location=${encodeURIComponent(currentUser?.location || '')}`),
    enabled: !!currentUser,
  });

  const { data: storeProducts = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products", selectedStore?.id],
    queryFn: () => apiRequest(`/api/products/store/${selectedStore?.id}`),
    enabled: !!selectedStore,
  });

  const { data: cartItems = [] } = useQuery<any[]>({
    queryKey: ["/api/cart"],
  });

  const startChatMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
      return apiRequest("/api/chats/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId }),
      });
    },
    onSuccess: (data: any) => {
      setLocation(`/chat/${data.chatId}`);
    },
  });


  const filteredStores = stores.filter(store =>
    store?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store?.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Intersection Observer for animations
  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const storeId = entry.target.getAttribute('data-store-id');
            if (storeId) {
              setVisibleCards(prev => new Set([...prev, storeId]));
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );
    return () => observer.current?.disconnect();
  }, []);

  // Premium store categories with icons and gradients
  const getCategoryIcon = (category: string) => {
    const categoryMap: { [key: string]: { icon: any; gradient: string; color: string } } = {
      'إلكترونيات': { icon: Zap, gradient: 'from-blue-500 to-cyan-500', color: 'text-blue-600' },
      'أزياء': { icon: Crown, gradient: 'from-purple-500 to-pink-500', color: 'text-purple-600' },
      'منزلية': { icon: Heart, gradient: 'from-emerald-500 to-teal-500', color: 'text-emerald-600' },
      'رياضة': { icon: TrendingUp, gradient: 'from-orange-500 to-red-500', color: 'text-orange-600' },
      'مطاعم': { icon: Award, gradient: 'from-yellow-500 to-amber-500', color: 'text-yellow-600' },
      'خدمات': { icon: Sparkles, gradient: 'from-indigo-500 to-purple-500', color: 'text-indigo-600' }
    };
    return categoryMap[category] || { icon: Store, gradient: 'from-gray-500 to-slate-500', color: 'text-gray-600' };
  };

  // Featured products for each store
  const getFeaturedProducts = () => {
    return [
      { id: '1', name: 'منتج مميز 1', price: '2500', imageUrl: '' },
      { id: '2', name: 'منتج مميز 2', price: '3200', imageUrl: '' },
      { id: '3', name: 'منتج مميز 3', price: '1800', imageUrl: '' }
    ].slice(0, 3);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pb-20 relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>

      {/* Header - Premium Glass Style */}
      <div className="relative bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white backdrop-blur-xl border-b border-white/20 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        <div className="relative flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 w-14 h-14 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105"
                data-testid="button-back"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-white to-white/90 bg-clip-text">المتاجر</h1>
              <p className="text-white/80 text-sm">اكتشف أفضل المتاجر في منطقتك</p>
            </div>
          </div>
          <Link href="/cart">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 w-14 h-14 rounded-2xl backdrop-blur-sm relative transition-all duration-300 hover:scale-105"
              data-testid="button-cart"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartItems.length > 0 && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs w-7 h-7 rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
                  {cartItems.length}
                </div>
              )}
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
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">المتاجر في {currentUser?.location}</h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg">اكتشف المتاجر والخدمات المحلية الرائعة</p>
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
            placeholder="ابحث عن متجر أو فئة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-16 text-lg h-16 rounded-2xl border-2 border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl focus:shadow-2xl transition-all duration-300 focus:scale-[1.02]"
            data-testid="input-search-stores"
          />
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
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-white/90 bg-clip-text">أضف متجرك</h2>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">انضم إلى شبكة المتاجر المحلية الرائدة واعرض منتجاتك لآلاف العملاء</p>
            <Link href="/my-store">
              <Button
                className="bg-white text-purple-600 hover:bg-white/90 text-lg px-8 py-4 rounded-2xl font-bold shadow-xl transition-all duration-300 hover:scale-105"
                data-testid="button-add-store"
              >
                سجل متجرك مجاناً الآن
              </Button>
            </Link>
          </div>
        </div>

        {/* Loading State - Premium */}
        {isLoadingStores && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 animate-pulse">
                <div className="h-64 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl mb-6"></div>
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-xl w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stores Grid - Ultra Premium Instagram Layout */}
        {!isLoadingStores && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredStores.map((store, index) => {
              const categoryInfo = getCategoryIcon(store?.category || '');
              const CategoryIcon = categoryInfo.icon;
              const featuredProducts = getFeaturedProducts();
              const isVisible = visibleCards.has(store.id);
              
              return (
                <div
                  key={store.id}
                  ref={(el) => el && observer.current?.observe(el)}
                  data-store-id={store.id}
                  className={`group relative transition-all duration-700 transform ${
                    isVisible 
                      ? 'opacity-100 translate-y-0 scale-100' 
                      : 'opacity-0 translate-y-12 scale-95'
                  }`}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Main Store Card - Ultra Premium */}
                  <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl border border-white/30 dark:border-gray-700/30 hover:shadow-3xl hover:scale-[1.02] transition-all duration-500 cursor-pointer">
                    {/* Glass Morphism Effects */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/5 pointer-events-none"></div>
                    <div className={`absolute inset-0 bg-gradient-to-br ${categoryInfo.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                    
                    {/* Hero Image Section - Premium */}
                    <div className="relative h-72 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
                      
                      {store.imageUrl ? (
                        <img
                          src={store.imageUrl}
                          alt={store.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700 filter group-hover:brightness-110"
                          data-testid={`img-store-${store.id}`}
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${categoryInfo.gradient} flex items-center justify-center relative overflow-hidden`}>
                          <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                          <CategoryIcon className="w-24 h-24 text-white/90 drop-shadow-2xl" />
                          {/* Floating Orbs */}
                          <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-pulse"></div>
                          <div className="absolute -top-8 -left-8 w-24 h-24 bg-white/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
                        </div>
                      )}
                      
                      {/* Premium Floating Badges */}
                      <div className="absolute top-6 left-6 z-20 flex flex-col gap-3">
                        {store.isVerified && (
                          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-xl backdrop-blur-sm animate-pulse">
                            <ShieldCheck className="w-5 h-5" />
                            <span className="text-sm font-bold">موثق</span>
                          </div>
                        )}
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-xl backdrop-blur-sm">
                          <Crown className="w-5 h-5" />
                          <span className="text-sm font-bold">مميز</span>
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="absolute top-6 right-6 z-20">
                        <div className={`px-4 py-2 rounded-full flex items-center gap-2 shadow-xl backdrop-blur-md transition-all duration-300 ${
                          store.isOpen 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white animate-pulse' 
                            : 'bg-gradient-to-r from-gray-500 to-slate-500 text-white'
                        }`}>
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-bold">{store.isOpen ? 'مفتوح' : 'مغلق'}</span>
                        </div>
                      </div>
                      
                      {/* Store Title Overlay */}
                      <div className="absolute bottom-6 left-6 right-6 z-20">
                        <h3 className="text-3xl font-bold text-white drop-shadow-2xl mb-2 leading-tight">
                          {store?.name || 'اسم المتجر'}
                        </h3>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map((star) => (
                              <Star key={star} className="w-5 h-5 text-yellow-400 fill-current drop-shadow-lg" />
                            ))}
                            <span className="text-white/90 text-lg font-semibold ml-2">4.8</span>
                          </div>
                          <span className="text-white/80 text-base">(127 تقييم)</span>
                        </div>
                        
                        {/* Category Badge */}
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${categoryInfo.gradient} text-white shadow-xl backdrop-blur-sm`}>
                          <CategoryIcon className="w-4 h-4" />
                          <span className="text-sm font-bold">{store?.category || 'التصنيف'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Store Content - Premium Info */}
                    <div className="p-8 relative">
                      {/* Description */}
                      <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-6 line-clamp-2">
                        {store?.description || 'وصف المتجر الرائع مع أفضل المنتجات والخدمات المتميزة'}
                      </p>
                      
                      {/* Location & Contact */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                          <div className="p-2 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 rounded-xl">
                            <MapPin className="w-5 h-5 text-red-500" />
                          </div>
                          <span className="font-medium">{store?.location || 'الموقع غير محدد'}</span>
                        </div>
                        
                        {store?.phoneNumber && (
                          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                            <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl">
                              <Phone className="w-5 h-5 text-green-500" />
                            </div>
                            <span className="font-medium">{store?.phoneNumber}</span>
                          </div>
                        )}
                      </div>

                      {/* Featured Products Preview */}
                      <div className="mb-6">
                        <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-purple-500" />
                          المنتجات المميزة
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                          {featuredProducts.map((product, idx) => (
                            <div key={idx} className="group/product relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-3 hover:shadow-lg transition-all duration-300 cursor-pointer">
                              <div className="h-16 bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 rounded-xl mb-2 flex items-center justify-center">
                                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                              </div>
                              <p className="text-xs font-medium text-gray-800 dark:text-gray-200 mb-1 line-clamp-1">{product.name}</p>
                              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{parseInt(product.price).toLocaleString()} دج</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons - Premium Style */}
                      <div className="flex gap-4">
                        <Button 
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105" 
                          onClick={() => startChatMutation.mutate(store.userId)}
                          disabled={startChatMutation.isPending}
                          data-testid={`button-contact-${store.id}`}
                        >
                          <MessageCircle className="w-5 h-5 mr-2" />
                          تواصل معنا
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              className="flex-1 border-2 border-gray-300 dark:border-gray-600 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 font-bold py-4 rounded-2xl transition-all duration-300 hover:scale-105"
                              onClick={() => setSelectedStore(store)}
                              data-testid={`button-view-${store.id}`}
                            >
                              <Package className="w-5 h-5 mr-2" />
                              جميع المنتجات
                            </Button>
                          </DialogTrigger>
                          
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                            <DialogHeader>
                              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                منتجات {selectedStore?.name || 'المتجر'}
                              </DialogTitle>
                            </DialogHeader>
                            
                            <div className="flex-1 overflow-y-auto p-4">
                              {isLoadingProducts ? (
                                <div className="text-center py-12">
                                  <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                  <p className="text-gray-500">جاري تحميل المنتجات...</p>
                                </div>
                              ) : storeProducts.length === 0 ? (
                                <div className="text-center py-16">
                                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Package className="w-12 h-12 text-gray-400" />
                                  </div>
                                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">لا توجد منتجات</h3>
                                  <p className="text-gray-500">لا توجد منتجات في هذا المتجر حالياً</p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {storeProducts?.map((product) => product && (
                                    <Card key={product.id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-xl" data-testid={`product-card-${product.id}`}>
                                      <CardHeader className="p-0">
                                        {product.imageUrl ? (
                                          <img
                                            src={product.imageUrl}
                                            alt={product?.name || 'منتج'}
                                            className="w-full h-48 object-cover"
                                          />
                                        ) : (
                                          <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                                            <Package className="w-16 h-16 text-white" />
                                          </div>
                                        )}
                                      </CardHeader>
                                      <CardContent className="p-6">
                                        <div className="space-y-4">
                                          <div>
                                            <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-2">{product?.name || 'اسم المنتج'}</h3>
                                            <p className="text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                                              {product?.description || 'وصف المنتج الرائع'}
                                            </p>
                                          </div>
                                          
                                          <div className="flex justify-between items-center">
                                            <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 text-sm">
                                              {product?.category || 'تصنيف'}
                                            </Badge>
                                            <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                              {parseInt(product?.price || '0').toLocaleString()} دج
                                            </div>
                                          </div>
                                          
                                          <div className="flex gap-3">
                                            <Link href={`/product/${product.id}`} className="w-full">
                                              <Button
                                                size="sm"
                                                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-3 rounded-xl"
                                                data-testid={`button-view-details-${product.id}`}
                                              >
                                                <Package className="w-4 h-4 mr-2" />
                                                عرض التفاصيل
                                              </Button>
                                            </Link>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State - Premium */}
        {!isLoadingStores && filteredStores.length === 0 && (
          <div className="text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
              <Store className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              {searchQuery ? "لا توجد متاجر تطابق البحث" : "لا توجد متاجر في هذه المنطقة حالياً"}
            </h3>
            {!searchQuery && (
              <p className="text-gray-500 text-lg mb-8">
                كن أول من ينشئ متجراً في منطقتك واستفد من فرصة ذهبية!
              </p>
            )}
            <Link href="/my-store">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                إنشاء متجر جديد
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Floating Action Button - Premium */}
      <div className="fixed bottom-24 left-6 z-50">
        <Link href="/my-store">
          <Button
            className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-2xl transition-all duration-300 hover:scale-110 animate-bounce"
            data-testid="fab-my-store"
          >
            <Store className="h-8 w-8 text-white" />
          </Button>
        </Link>
      </div>
    </div>
  );
}