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

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.category.toLowerCase().includes(searchQuery.toLowerCase())
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

        {/* Stores Grid */}
        {!isLoadingStores && (
          <div className="space-y-4">
            {filteredStores.map((store) => (
              <div
                key={store.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
                data-testid={`store-card-${store.id}`}
              >
                <div className="flex">
                  {store.imageUrl && (
                    <img
                      src={store.imageUrl}
                      alt={store.name}
                      className="w-24 h-24 object-cover"
                      data-testid={`img-store-${store.id}`}
                    />
                  )}
                  {!store.imageUrl && (
                    <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <Store className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{store.name}</h3>
                          {store.isVerified && (
                            <div title="متجر موثق">
                              <ShieldCheck className="w-4 h-4 text-blue-500" data-testid={`badge-verified-store-${store.id}`} />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{store.description}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            بواسطة {store.owner.name}
                          </p>
                          {store.owner.isVerified && (
                            <div title="حساب موثق">
                              <ShieldCheck className="w-3 h-3 text-blue-500" data-testid={`badge-verified-owner-${store.id}`} />
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={store.isOpen ? "default" : "secondary"}
                        className={store.isOpen ? "bg-green-500" : "bg-gray-500"}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {store.isOpen ? "مفتوح" : "مغلق"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{store.location}</span>
                      </div>
                      {store.phoneNumber && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          <span>{store.phoneNumber}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">
                        {store.category}
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="bg-whatsapp-green hover:bg-green-600 flex items-center gap-1"
                        onClick={() => startChatMutation.mutate(store.userId)}
                        disabled={startChatMutation.isPending}
                        data-testid={`button-contact-${store.id}`}
                      >
                        <MessageCircle className="w-3 h-3" />
                        تواصل
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedStore(store)}
                            data-testid={`button-view-${store.id}`}
                          >
                            <Package className="w-3 h-3 mr-1" />
                            عرض المنتجات
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                          <DialogHeader>
                            <DialogTitle className="text-xl">
                              منتجات {selectedStore?.name}
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
                                {storeProducts.map((product) => (
                                  <Card key={product.id} className="overflow-hidden" data-testid={`product-card-${product.id}`}>
                                    <CardHeader className="p-0">
                                      {product.imageUrl && (
                                        <img
                                          src={product.imageUrl}
                                          alt={product.name}
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
                                          <h3 className="font-semibold text-lg">{product.name}</h3>
                                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                            {product.description}
                                          </p>
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                          <Badge variant="outline" className="text-xs">
                                            {product.category}
                                          </Badge>
                                          <div className="text-lg font-bold text-whatsapp-green">
                                            {parseInt(product.price).toLocaleString()} دج
                                          </div>
                                        </div>
                                        
                                        {product.isActive ? (
                                          <Button 
                                            className="w-full bg-whatsapp-green hover:bg-green-600"
                                            onClick={() => addToCartMutation.mutate({ productId: product.id })}
                                            disabled={addToCartMutation.isPending}
                                            data-testid={`button-add-cart-${product.id}`}
                                          >
                                            <Plus className="w-4 h-4 ml-1" />
                                            إضافة للسلة
                                          </Button>
                                        ) : (
                                          <Button variant="secondary" disabled className="w-full">
                                            غير متوفر حالياً
                                          </Button>
                                        )}
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