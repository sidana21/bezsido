import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageModal } from '@/components/ui/image-modal';
import { 
  Store, 
  MapPin, 
  Star, 
  Phone, 
  Mail, 
  Globe, 
  Package, 
  ShoppingBag,
  MessageCircle,
  Heart,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VendorCategory {
  id: string;
  name: string;
  nameAr: string;
  description?: string;
  icon?: string;
  color?: string;
}

interface Vendor {
  id: string;
  businessName: string;
  displayName: string;
  description: string;
  categoryId: string;
  logoUrl?: string;
  bannerUrl?: string;
  location: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  website?: string;
  status: string;
  isActive: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  averageRating: string;
  totalReviews: number;
  totalProducts: number;
  totalSales: string;
  totalOrders: number;
  createdAt: string;
  category?: VendorCategory;
  owner?: {
    id: string;
    name: string;
    avatar?: string;
  };
  ratingsCount?: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  originalPrice: string;
  salePrice?: string;
  images: string[];
  stockQuantity: number;
  averageRating: string;
  totalReviews: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export default function VendorProfilePage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedImageTitle, setSelectedImageTitle] = useState<string>('');

  // Get vendor details
  const { data: vendor, isLoading: vendorLoading } = useQuery<Vendor>({
    queryKey: ['/api/vendors', vendorId],
  });

  // Get vendor products
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/vendors', vendorId, 'products'],
  });

  const handleImageClick = (images: string[], title: string) => {
    setSelectedImages(images);
    setSelectedImageTitle(title);
    setImageModalOpen(true);
  };

  // Quick contact mutation
  const quickContactMutation = useMutation({
    mutationFn: async (sellerId: string) => {
      console.log("Starting chat with seller ID:", sellerId);
      
      const chatResponse = await apiRequest("/api/chats/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId: sellerId }),
      });

      return chatResponse;
    },
    onSuccess: (data) => {
      console.log("Chat started successfully:", data);
      toast({
        title: "✅ تم بدء المحادثة",
        description: "يمكنك الآن التواصل مع البائع",
      });
      navigate(`/chats/${data.chatId}`);
    },
    onError: (error: any) => {
      console.error("Error starting chat:", error);
      toast({
        title: "خطأ في إنشاء المحادثة",
        description: error.message || "حدث خطأ أثناء محاولة التواصل مع البائع",
        variant: "destructive",
      });
    },
  });

  const handleQuickContact = (sellerId: string) => {
    quickContactMutation.mutate(sellerId);
  };

  if (vendorLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl" dir="rtl">
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-gray-200 rounded-lg"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl" dir="rtl">
        <div className="text-center py-12">
          <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">البائع غير موجود</h3>
          <p className="text-gray-600">لم نتمكن من العثور على البائع المطلوب</p>
        </div>
      </div>
    );
  }

  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
      <div 
        className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden relative"
        onClick={(e) => {
          if (product.images && product.images.length > 0) {
            e.stopPropagation();
            handleImageClick(product.images, product.name);
          }
        }}
      >
        {product.images && product.images.length > 0 ? (
          <>
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              data-testid={`product-image-${product.id}`}
            />
            {/* Image count indicator */}
            {product.images.length > 1 && (
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                {product.images.length} صور
              </div>
            )}
            {/* Zoom indicator */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="bg-white/90 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                اضغط للتكبير
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">{product.name}</h3>
        
        <div className="flex items-center gap-2 mb-2">
          {product.salePrice ? (
            <>
              <span className="text-lg font-bold text-green-600">
                {parseFloat(product.salePrice).toLocaleString()} دج
              </span>
              <span className="text-sm text-gray-500 line-through">
                {parseFloat(product.originalPrice).toLocaleString()} دج
              </span>
            </>
          ) : (
            <span className="text-lg font-bold text-gray-900">
              {parseFloat(product.originalPrice).toLocaleString()} دج
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{parseFloat(product.averageRating).toFixed(1)}</span>
            <span className="text-gray-500">({product.totalReviews})</span>
          </div>
          
          <span className="text-gray-500">
            {product.stockQuantity > 0 ? `${product.stockQuantity} متوفر` : 'غير متوفر'}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Banner */}
      <div className="relative h-48 bg-gradient-to-r from-blue-600 to-purple-600">
        {vendor.bannerUrl && (
          <img 
            src={vendor.bannerUrl} 
            alt={vendor.displayName}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl">
        {/* Vendor Header */}
        <div className="relative -mt-24 mb-8">
          <Card className="p-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                <AvatarImage src={vendor.logoUrl} alt={vendor.displayName} />
                <AvatarFallback className="bg-blue-500 text-white font-bold text-2xl">
                  {vendor.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-2xl font-bold text-gray-900">{vendor.displayName}</h1>
                      {vendor.isVerified && (
                        <Badge className="bg-green-100 text-green-800">
                          ✓ موثق
                        </Badge>
                      )}
                      {vendor.isFeatured && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          ⭐ مميز
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-gray-600 font-medium mb-2">{vendor.businessName}</p>
                    
                    {vendor.category && (
                      <Badge 
                        variant="outline" 
                        style={{ borderColor: vendor.category.color, color: vendor.category.color }}
                      >
                        {vendor.category.icon} {vendor.category.nameAr}
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button size="sm" variant="outline">
                      <Heart className="h-4 w-4 ml-1" />
                      حفظ
                    </Button>
                    <Button size="sm" variant="outline">
                      <Share2 className="h-4 w-4 ml-1" />
                      مشاركة
                    </Button>
                    <Button size="sm">
                      <MessageCircle className="h-4 w-4 ml-1" />
                      تواصل
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">{vendor.totalProducts}</div>
                    <div className="text-sm text-gray-600">منتج</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{vendor.totalOrders}</div>
                    <div className="text-sm text-gray-600">طلب</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xl font-bold text-yellow-600">
                        {parseFloat(vendor.averageRating).toFixed(1)}
                      </span>
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="text-sm text-gray-600">{vendor.totalReviews} تقييم</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600">
                      {parseFloat(vendor.totalSales).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">مبيعات (دج)</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>نبذة عن البائع</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{vendor.description}</p>
              </CardContent>
            </Card>

            {/* Products */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    المنتجات ({products.length})
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    عرض الكل
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }, (_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="aspect-square bg-gray-200 rounded mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">لا توجد منتجات متاحة حالياً</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.slice(0, 6).map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>معلومات الاتصال</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">{vendor.location}</p>
                    {vendor.address && (
                      <p className="text-sm text-gray-600">{vendor.address}</p>
                    )}
                  </div>
                </div>

                {vendor.phoneNumber && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{vendor.phoneNumber}</p>
                      <p className="text-sm text-gray-600">هاتف</p>
                    </div>
                  </div>
                )}

                {vendor.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{vendor.email}</p>
                      <p className="text-sm text-gray-600">بريد إلكتروني</p>
                    </div>
                  </div>
                )}

                {vendor.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-gray-500" />
                    <div>
                      <a 
                        href={vendor.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        زيارة الموقع
                      </a>
                      <p className="text-sm text-gray-600">موقع إلكتروني</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>إجراءات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" size="lg">
                  <ShoppingBag className="h-5 w-5 ml-2" />
                  تصفح جميع المنتجات
                </Button>
                <Button variant="outline" className="w-full">
                  <MessageCircle className="h-5 w-5 ml-2" />
                  إرسال رسالة
                </Button>
                <Button variant="outline" className="w-full">
                  <Star className="h-5 w-5 ml-2" />
                  إضافة تقييم
                </Button>
              </CardContent>
            </Card>

            {/* Vendor Stats */}
            <Card>
              <CardHeader>
                <CardTitle>إحصائيات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">تاريخ الانضمام</span>
                  <span className="font-medium">
                    {new Date(vendor.createdAt).toLocaleDateString('ar')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">معدل الاستجابة</span>
                  <span className="font-medium text-green-600">95%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">وقت الاستجابة</span>
                  <span className="font-medium">خلال ساعة</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        images={selectedImages}
        title={selectedImageTitle}
        showNavigation={true}
        showActions={true}
        sellerId={vendor?.owner?.id}
        onQuickContact={handleQuickContact}
      />
    </div>
  );
}