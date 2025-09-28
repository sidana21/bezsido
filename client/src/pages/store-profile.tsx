import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Store as StoreIcon, MapPin, Phone, Clock, Calendar, Star, Package, Shield, ShoppingCart, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Store {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  phoneNumber: string;
  imageUrl?: string;
  isOpen: boolean;
  isActive: boolean;
  status: string;
  isVerified: boolean;
  verifiedAt?: string;
  createdAt: string;
  rating?: number;
  totalProducts?: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl?: string;
  category: string;
  isActive: boolean;
}

export default function StoreProfile() {
  const { storeId } = useParams<{ storeId: string }>();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: store, isLoading: isLoadingStore } = useQuery<Store>({
    queryKey: [`/api/stores/${storeId}`],
    enabled: !!storeId,
  });

  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: [`/api/stores/${storeId}/products`],
    enabled: !!storeId,
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

  // Contact seller mutation
  const contactSellerMutation = useMutation({
    mutationFn: async ({ product, sellerId }: { product: Product; sellerId: string }) => {
      // Start chat with seller
      const chatResponse = await apiRequest("/api/chats/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId: sellerId }),
      });

      // Send product message
      const productMessage = `مرحباً، أريد شراء هذا المنتج من متجركم:\n\n📦 ${product?.name || 'منتج'}\n💰 السعر: ${parseInt(product?.price || '0').toLocaleString()} دج\n📝 ${product?.description || 'بدون وصف'}\n\nهل هذا المنتج متوفر؟`;
      
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
        description: "فشل في بدء المحادثة مع المتجر",
        variant: "destructive",
      });
    },
  });

  if (isLoadingStore) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>جاري تحميل بيانات المتجر...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <StoreIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">المتجر غير موجود</h2>
          <p className="text-gray-600">لم يتم العثور على المتجر المطلوب</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Store Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Store Logo */}
            <div className="flex-shrink-0">
              {store.imageUrl ? (
                <img
                  src={store.imageUrl}
                  alt={store.name}
                  className="w-24 h-24 rounded-lg object-cover border"
                />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center border">
                  <StoreIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>

            {/* Store Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-2xl">{store.name}</CardTitle>
                {store.isVerified && (
                  <Badge className="bg-blue-500 text-white">
                    <Shield className="w-3 h-3 ml-1" />
                    موثق
                  </Badge>
                )}
                <Badge className={`${store.isOpen ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                  {store.isOpen ? 'مفتوح' : 'مغلق'}
                </Badge>
                <Badge className={`${
                  store.status === 'approved' ? 'bg-green-500' :
                  store.status === 'pending' ? 'bg-yellow-500' :
                  store.status === 'rejected' ? 'bg-red-500' :
                  'bg-gray-500'
                } text-white`}>
                  {store.status === 'approved' ? 'معتمد' :
                   store.status === 'pending' ? 'قيد المراجعة' :
                   store.status === 'rejected' ? 'مرفوض' : 'غير محدد'}
                </Badge>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {store.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4 ml-2 text-blue-500" />
                  {store.location}
                </div>
                {store.phoneNumber && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4 ml-2 text-green-500" />
                    {store.phoneNumber}
                  </div>
                )}
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Package className="w-4 h-4 ml-2 text-purple-500" />
                  {store.category}
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4 ml-2 text-orange-500" />
                  عضو منذ {new Date(store.createdAt).toLocaleDateString('ar-DZ')}
                </div>
                {store.isVerified && store.verifiedAt && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Shield className="w-4 h-4 ml-2 text-blue-500" />
                    موثق في {new Date(store.verifiedAt).toLocaleDateString('ar-DZ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Store Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{products.length}</div>
            <div className="text-sm text-gray-600">منتج متاح</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Star className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{store.rating || '5.0'}</div>
            <div className="text-sm text-gray-600">تقييم المتجر</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">
              {store.isOpen ? 'مفتوح' : 'مغلق'}
            </div>
            <div className="text-sm text-gray-600">حالة المتجر</div>
          </CardContent>
        </Card>
      </div>

      {/* Store Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            منتجات المتجر ({products.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingProducts ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>جاري تحميل المنتجات...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">لا توجد منتجات</h3>
              <p className="text-gray-600">لم يقم المتجر بإضافة أي منتجات حتى الآن</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {product.imageUrl && (
                    <div className="h-48 bg-gray-200 dark:bg-gray-700">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                      <Badge variant={product.isActive ? "default" : "secondary"} className="text-xs">
                        {product.isActive ? "متاح" : "غير متاح"}
                      </Badge>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-lg font-bold text-[var(--whatsapp-primary)]">
                        {parseInt(product.price).toLocaleString()} دج
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                    </div>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => setSelectedProduct(product)}
                      data-testid={`button-buy-${product.id}`}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      اشتري
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                {selectedProduct.imageUrl ? (
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                    data-testid="img-product-preview"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-400" />
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
                    {parseInt(selectedProduct.price || '0').toLocaleString()} دج
                  </span>
                </div>

                {/* Category */}
                <Badge variant="outline" className="text-xs">
                  {selectedProduct.category}
                </Badge>

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
                    sellerId: store?.id || '' 
                  })}
                  disabled={contactSellerMutation.isPending}
                  data-testid="button-contact-seller"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  تواصل مع المتجر
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}