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

interface VendorWithOwner extends Vendor {
  owner: User;
}

export default function Stores() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState<VendorWithOwner | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user/current"],
  });

  // Fetch all services from all vendors for service marketplace display
  const { data: allServices = [], isLoading: isLoadingServices } = useQuery<Service[]>({
    queryKey: ["/api/services", currentUser?.location],
    queryFn: () => apiRequest(`/api/services?location=${encodeURIComponent(currentUser?.location || '')}`),
    enabled: !!currentUser,
  });

  const { data: serviceCategories = [], isLoading: isLoadingCategories } = useQuery<ServiceCategory[]>({
    queryKey: ["/api/service-categories"],
    enabled: !!currentUser,
  });



  const requestServiceMutation = useMutation({
    mutationFn: async ({ serviceId, vendorId }: { serviceId: string; vendorId: string }) => {
      return apiRequest("/api/chats/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId: vendorId }),
      });
    },
    onSuccess: (data: any) => {
      setLocation(`/chat/${data.chatId}`);
      toast({
        title: "تم بدء المحادثة",
        description: "تم الاتصال بمقدم الخدمة بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في الاتصال بمقدم الخدمة",
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

  // Filter services for service marketplace search
  const filteredServices = allServices.filter(service =>
    service?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service?.serviceType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service?.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pb-20 relative overflow-hidden">
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
              <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-white to-white/90 bg-clip-text">خدمات BizChat</h1>
              <p className="text-white/80 text-sm">اكتشف مئات الخدمات المتنوعة من مقدمين موثوقين</p>
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
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">خدمات متاحة في {currentUser?.location}</h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg">مئات الخدمات المتنوعة من مقدمين محليين موثوقين</p>
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
            placeholder="ابحث عن خدمة، مقدم خدمة أو نوع خدمة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-16 text-lg h-16 rounded-2xl border-2 border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl focus:shadow-2xl transition-all duration-300 focus:scale-[1.02]"
            data-testid="input-search-stores"
          />
        </div>

        {/* Service Categories - Professional Grid */}
        <div className="mb-10">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">فئات الخدمات</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Transportation Services */}
            <Link href="/taxi">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Car className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-800 dark:text-white mb-1">تاكسي</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">نقل الركاب</p>
                </div>
              </div>
            </Link>

            {/* Delivery Services */}
            <Link href="/taxi-driver">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Truck className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-800 dark:text-white mb-1">لوحة السائق</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">إدارة خدمة التاكسي</p>
                </div>
              </div>
            </Link>

            {/* Home Services */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Home className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-bold text-gray-800 dark:text-white mb-1">خدمات منزلية</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">تنظيف وصيانة</p>
              </div>
            </div>

            {/* Repair Services */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Wrench className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-bold text-gray-800 dark:text-white mb-1">إصلاحات</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">صيانة تقنية</p>
              </div>
            </div>

            {/* Beauty Services */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Scissors className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-bold text-gray-800 dark:text-white mb-1">تجميل</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">حلاقة وتجميل</p>
              </div>
            </div>

            {/* Care Services */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Baby className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-bold text-gray-800 dark:text-white mb-1">رعاية</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">رعاية أطفال ومسنين</p>
              </div>
            </div>
          </div>
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

        {/* Loading State - Premium Services Grid */}
        {isLoadingServices && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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

        {/* Services Grid - Professional Style */}
        {!isLoadingServices && filteredServices.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer transform"
                data-testid={`service-card-${service.id}`}
                onClick={() => {/* TODO: Navigate to service detail */}}
              >
                {/* Service Image - AliExpress Style */}
                <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
                  {service.images && service.images.length > 0 ? (
                    <img
                      src={service.images[0]}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      data-testid={`img-service-${service.id}`}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                      <Package className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Wishlist Button */}
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 bg-white/80 hover:bg-white rounded-full shadow-md"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Add to wishlist
                      }}
                    >
                      <Heart className="w-4 h-4 text-gray-600" />
                    </Button>
                  </div>

                  {/* Quick Actions */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      size="sm"
                      className="bg-whatsapp-green hover:bg-green-600 text-white shadow-md h-8 px-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        requestServiceMutation.mutate({ serviceId: service.id, vendorId: service.vendorId });
                      }}
                      disabled={requestServiceMutation.isPending}
                      data-testid={`button-request-service-${service.id}`}
                    >
                      <MessageCircle className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Service Info - AliExpress Style */}
                <div className="p-3 space-y-2">
                  {/* Service Price - Most Prominent */}
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-red-500">
                      {parseInt(service?.basePrice || '0').toLocaleString()} دج
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-xs text-gray-500">4.8</span>
                    </div>
                  </div>
                  
                  {/* Service Name */}
                  <h3 className="font-medium text-sm text-gray-800 dark:text-white line-clamp-2 leading-4 group-hover:text-whatsapp-green transition-colors">
                    {service?.name || 'اسم الخدمة'}
                  </h3>
                  
                  {/* Service Provider Name */}
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Store className="w-3 h-3" />
                    <span className="truncate">
                      مقدم خدمة
                    </span>
                  </div>
                  
                  {/* Category Badge */}
                  <Badge 
                    variant="secondary" 
                    className="text-xs h-5 px-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  >
                    {service?.serviceType || 'نوع الخدمة'}
                  </Badge>
                  
                  {/* Request Service Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2 h-7 text-xs border-gray-200 hover:border-whatsapp-green hover:text-whatsapp-green transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      requestServiceMutation.mutate({ serviceId: service.id, vendorId: service.vendorId });
                    }}
                    disabled={requestServiceMutation.isPending}
                    data-testid={`button-request-now-${service.id}`}
                  >
                    <MessageCircle className="w-3 h-3 mr-1" />
                    اطلب الآن
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State - Premium */}
        {!isLoadingServices && filteredServices.length === 0 && (
          <div className="text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
              <Package className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              {searchQuery ? "لا توجد خدمات تطابق البحث" : "لا توجد خدمات في هذه المنطقة حالياً"}
            </h3>
            {!searchQuery && (
              <p className="text-gray-500 text-lg mb-8">
                كن أول من يقدم خدماته في هذه المنطقة!
              </p>
            )}
            <Link href="/my-vendor">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                أضف خدماتك
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
    </div>
  );
}