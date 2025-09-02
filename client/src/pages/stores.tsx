import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Store, MapPin, Phone, Clock, Star, ShoppingCart, Plus, Package, MessageCircle, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { User, Store as StoreType, Product } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface StoreWithOwner extends StoreType {
  owner: User;
}

export default function Stores() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState<StoreWithOwner | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      return apiRequest("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: quantity.toString() }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "تم الإضافة للسلة",
        description: "تم إضافة المنتج إلى السلة بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إضافة المنتج للسلة",
        variant: "destructive",
      });
    },
  });

  const buyNowMutation = useMutation({
    mutationFn: async ({ product, sellerId }: { product: Product; sellerId: string }) => {
      // Start chat with seller
      const chatResponse = await apiRequest("/api/chats/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId: sellerId }),
      });

      // Send product message
      const productMessage = `مرحباً، أريد شراء هذا المنتج:\n\n📦 ${product?.name || 'منتج'}\n💰 السعر: ${parseInt(product?.price || '0').toLocaleString()} دج\n📝 ${product?.description || 'بدون وصف'}\n\nهل هذا المنتج متوفر؟`;
      
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

  const filteredStores = stores.filter(store =>
    store?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store?.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header - Mobile optimized */}
      <div className="bg-whatsapp-green text-white p-4">
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
            <h1 className="text-2xl font-bold">المتاجر</h1>
          </div>
          <Link href="/cart">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-green-600 w-12 h-12 rounded-full relative"
              data-testid="button-cart"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartItems.length > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartItems.length}
                </Badge>
              )}
            </Button>
          </Link>
        </div>
      </div>

      <div className="px-4 py-3">
        {/* Location Banner - Mobile optimized */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 mb-6">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 mb-3">
            <MapPin className="w-6 h-6" />
            <span className="text-base font-semibold">المتاجر في منطقة {currentUser?.location}</span>
          </div>
          <p className="text-base text-gray-500">اكتشف المتاجر والخدمات المحلية في منطقتك</p>
        </div>

        {/* Search - Mobile optimized */}
        <div className="relative mb-6">
          <Search className="absolute right-4 top-4 w-6 h-6 text-gray-400" />
          <Input
            type="text"
            placeholder="ابحث عن متجر أو فئة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-12 text-lg h-14 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm"
            data-testid="input-search-stores"
          />
        </div>

        {/* Promote Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg p-4 mb-6">
          <div className="text-center">
            <Store className="w-8 h-8 mx-auto mb-2" />
            <h2 className="text-lg font-bold mb-2">أضف متجرك</h2>
            <p className="text-sm opacity-90">انضم إلى شبكة المتاجر المحلية واعرض منتجاتك للجميع</p>
            <Link href="/my-store">
              <Button
                className="mt-3 bg-white text-blue-600 hover:bg-gray-100"
                size="sm"
                data-testid="button-add-store"
              >
                سجل متجرك مجاناً
              </Button>
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {isLoadingStores && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 animate-pulse">
                <div className="flex">
                  <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="flex-1 mr-4 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="flex gap-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stores Grid - Beautiful Grid Layout */}
        {!isLoadingStores && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map((store) => (
              <div
                key={store.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                data-testid={`store-card-${store.id}`}
              >
                {/* Store Image - Larger and more prominent */}
                <div className="relative h-48 overflow-hidden">
                  {store.imageUrl ? (
                    <img
                      src={store.imageUrl}
                      alt={store.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      data-testid={`img-store-${store.id}`}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <Store className="w-16 h-16 text-white" />
                    </div>
                  )}
                  
                  {/* Status Badge - Floating */}
                  <div className="absolute top-3 right-3">
                    <Badge
                      variant={store.isOpen ? "default" : "secondary"}
                      className={`${store.isOpen ? "bg-green-500 text-white" : "bg-gray-500 text-white"} backdrop-blur-sm bg-opacity-90`}
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {store.isOpen ? "مفتوح" : "مغلق"}
                    </Badge>
                  </div>

                  {/* Verification Badge */}
                  {store.isVerified && (
                    <div className="absolute top-3 left-3">
                      <div className="bg-blue-500 text-white rounded-full p-2 backdrop-blur-sm bg-opacity-90" title="متجر موثق">
                        <ShieldCheck className="w-4 h-4" data-testid={`badge-verified-store-${store.id}`} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Store Content */}
                <div className="p-5">
                  {/* Store Header */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-xl text-gray-800 dark:text-white group-hover:text-whatsapp-green transition-colors">
                        {store?.name || 'اسم المتجر'}
                      </h3>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">4.8</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                      {store?.description || 'وصف المتجر'}
                    </p>
                    
                    {/* Owner Info */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>بواسطة {store?.owner?.name || 'صاحب المتجر'}</span>
                      {store?.owner?.isVerified && (
                        <ShieldCheck className="w-3 h-3 text-blue-500" data-testid={`badge-verified-owner-${store.id}`} />
                      )}
                    </div>
                  </div>

                  {/* Store Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4 text-red-500" />
                      <span>{store?.location || 'الموقع غير محدد'}</span>
                    </div>
                    
                    {store?.phoneNumber && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4 text-green-500" />
                        <span>{store?.phoneNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Category Badge */}
                  <div className="mb-4">
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900 dark:to-blue-900 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                    >
                      {store?.category || 'التصنيف'}
                    </Badge>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-gradient-to-r from-whatsapp-green to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                      onClick={() => startChatMutation.mutate(store.userId)}
                      disabled={startChatMutation.isPending}
                      data-testid={`button-contact-${store.id}`}
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      تواصل
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1 border-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                          onClick={() => setSelectedStore(store)}
                          data-testid={`button-view-${store.id}`}
                        >
                          <Package className="w-4 h-4 mr-1" />
                          المنتجات
                        </Button>
                      </DialogTrigger>
                        
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <DialogHeader>
                          <DialogTitle className="text-xl">
                            منتجات {selectedStore?.name || 'المتجر'}
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="flex-1 overflow-y-auto">
                          {isLoadingProducts ? (
                            <div className="text-center py-8">جاري التحميل...</div>
                          ) : storeProducts.length === 0 ? (
                            <div className="text-center py-8">
                              <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                              <p className="text-gray-500">لا توجد منتجات في هذا المتجر حالياً</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {storeProducts?.map((product) => product && (
                                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`product-card-${product.id}`}>
                                  <CardHeader className="p-0">
                                    {product.imageUrl && (
                                      <img
                                        src={product.imageUrl}
                                        alt={product?.name || 'منتج'}
                                        className="w-full h-32 object-cover"
                                      />
                                    )}
                                    {!product.imageUrl && (
                                      <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                        <Package className="w-8 h-8 text-gray-400" />
                                      </div>
                                    )}
                                  </CardHeader>
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      <div>
                                        <h3 className="font-semibold text-lg">{product?.name || 'اسم المنتج'}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                          {product?.description || 'وصف المنتج'}
                                        </p>
                                      </div>
                                      
                                      <div className="flex justify-between items-center">
                                        <Badge variant="outline" className="text-xs">
                                          {product?.category || 'تصنيف'}
                                        </Badge>
                                        <div className="text-lg font-bold text-whatsapp-green">
                                          {parseInt(product?.price || '0').toLocaleString()} دج
                                        </div>
                                      </div>
                                      
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="flex-1"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            addToCartMutation.mutate({ productId: product?.id });
                                          }}
                                          disabled={addToCartMutation.isPending}
                                          data-testid={`button-add-to-cart-${product.id}`}
                                        >
                                          <ShoppingCart className="w-3 h-3 mr-1" />
                                          {addToCartMutation.isPending ? "جاري..." : "أضف للسلة"}
                                        </Button>
                                        
                                        <Link href={`/product/${product.id}`}>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="flex-1 min-w-fit"
                                            data-testid={`button-view-details-${product.id}`}
                                          >
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
            ))}
          </div>
        )}

        {!isLoadingStores && filteredStores.length === 0 && (
          <div className="text-center py-12">
            <Store className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? "لا توجد متاجر تطابق البحث" : "لا توجد متاجر في هذه المنطقة حالياً"}
            </p>
            {!searchQuery && (
              <p className="text-sm text-gray-400 mt-2">
                كن أول من ينشئ متجراً في منطقتك!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button - Mobile optimized */}
      <div className="fixed bottom-20 left-4 z-50">
        <Link href="/my-store">
          <Button
            className="w-16 h-16 rounded-full bg-[var(--whatsapp-primary)] hover:bg-[var(--whatsapp-primary)]/90 active:bg-[var(--whatsapp-primary)]/80 shadow-xl transition-transform active:scale-95 touch-none"
            data-testid="fab-my-store"
          >
            <Store className="h-6 w-6 text-white" />
          </Button>
        </Link>
      </div>
    </div>
  );
}