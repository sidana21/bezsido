import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Store, 
  Plus, 
  Edit, 
  Package, 
  Star, 
  MapPin, 
  Globe, 
  Phone, 
  Mail,
  Clock,
  TrendingUp,
  Users,
  ShoppingBag,
  Camera,
  Settings,
  Smartphone,
  Upload,
  Megaphone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MobileProductUpload from '@/components/mobile-product-upload';
import { useIsMobile } from '@/hooks/use-mobile';
import ImageModal from '@/components/ui/image-modal';
import { Link } from 'wouter';

interface VendorCategory {
  id: string;
  name: string;
  nameAr: string;
  description?: string;
  icon?: string;
  color?: string;
}

interface Product {
  id: string;
  vendorId: string;
  categoryId: string;
  name: string;
  description: string;
  originalPrice: string;
  salePrice?: string;
  currency: string;
  images: string[];
  stockQuantity: number;
  stockStatus: string;
  tags: string[];
  status: string;
  isActive: boolean;
  isFeatured: boolean;
  viewCount: number;
  averageRating: string;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
}

interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  displayName: string;
  description: string;
  categoryId: string;
  logoUrl?: string;
  bannerUrl?: string;
  location: string;
  address?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  email?: string;
  website?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  status: string;
  isActive: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  isPremium: boolean;
  averageRating: string;
  totalReviews: number;
  totalProducts: number;
  totalSales: string;
  totalOrders: number;
  workingHours?: Record<string, { open: string; close: string; isOpen: boolean }>;
  deliveryAreas?: string[];
  deliveryFee: string;
  minOrderAmount: string;
  createdAt: string;
  category?: VendorCategory;
}

// Vendor form validation schema
const vendorSchema = z.object({
  businessName: z.string().min(2, 'اسم النشاط يجب أن يكون حرفين على الأقل'),
  displayName: z.string().min(2, 'الاسم التجاري يجب أن يكون حرفين على الأقل'),
  description: z.string().min(10, 'الوصف يجب أن يكون 10 أحرف على الأقل'),
  categoryId: z.string().min(1, 'يجب اختيار فئة'),
  location: z.string().min(2, 'الموقع مطلوب'),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  whatsappNumber: z.string().optional(),
  email: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
  website: z.string().url('رابط الموقع غير صحيح').optional().or(z.literal('')),
  deliveryFee: z.string().default('0'),
  minOrderAmount: z.string().default('0'),
});

type VendorFormData = z.infer<typeof vendorSchema>;

// Product Card Component
const ProductCard = ({ 
  product, 
  onImageClick 
}: { 
  product: Product;
  onImageClick: (images: string[], productName: string) => void;
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleProductStatus = useMutation({
    mutationFn: () => apiRequest(`/api/products/${product.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !product.isActive }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/products'] });
      toast({
        title: product.isActive ? 'تم إخفاء المنتج' : 'تم تفعيل المنتج',
        description: product.isActive ? 'المنتج غير مرئي للعملاء الآن' : 'المنتج متاح للعملاء الآن',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث حالة المنتج',
        variant: 'destructive',
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: () => apiRequest(`/api/products/${product.id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/products'] });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف المنتج بنجاح',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'فشل في حذف المنتج',
        variant: 'destructive',
      });
    },
  });

  const price = parseFloat(product.originalPrice);
  const salePrice = product.salePrice ? parseFloat(product.salePrice) : null;
  const finalPrice = salePrice || price;
  const hasDiscount = salePrice && salePrice < price;

  return (
    <Card className={`transition-all hover:shadow-md ${!product.isActive ? 'opacity-60' : ''}`}>
      <div className="relative">
        {/* Product Image */}
        <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-105"
              onClick={() => onImageClick(product.images, product.name)}
              data-testid={`image-product-${product.id}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>
        
        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <Badge 
            variant={product.isActive ? "default" : "secondary"}
            className={product.isActive ? "bg-green-500" : "bg-gray-500"}
          >
            {product.isActive ? "نشط" : "معطل"}
          </Badge>
        </div>

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-2 right-2">
            <Badge variant="destructive">
              -{Math.round((1 - finalPrice / price) * 100)}%
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Product Name */}
        <h3 className="font-medium text-sm mb-2 line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
        
        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-green-600">
            {finalPrice.toLocaleString()} {product.currency}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-500 line-through">
              {price.toLocaleString()}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Package className="h-3 w-3" />
            <span>المخزون: {product.stockQuantity}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Star className="h-3 w-3" />
            <span>{parseFloat(product.averageRating || '0').toFixed(1)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              variant={product.isActive ? "outline" : "default"}
              size="sm"
              className="flex-1"
              onClick={() => toggleProductStatus.mutate()}
              disabled={toggleProductStatus.isPending}
              data-testid={`button-toggle-${product.id}`}
            >
              {toggleProductStatus.isPending ? '...' : product.isActive ? 'إخفاء' : 'تفعيل'}
            </Button>
            <Button variant="outline" size="sm" className="flex-1" data-testid={`button-edit-${product.id}`}>
              تعديل
            </Button>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => {
              if (confirm(`هل أنت متأكد من حذف "${product.name}"؟`)) {
                deleteProductMutation.mutate();
              }
            }}
            disabled={deleteProductMutation.isPending}
            data-testid={`button-delete-${product.id}`}
          >
            {deleteProductMutation.isPending ? 'جارٍ الحذف...' : 'حذف المنتج'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function MyVendorPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [showMobileUpload, setShowMobileUpload] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedProductImages, setSelectedProductImages] = useState<string[]>([]);
  const [selectedProductName, setSelectedProductName] = useState<string>('');
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Handle image modal
  const handleImageClick = (images: string[], productName: string) => {
    console.log('🖱️ Image clicked!', { images, productName });
    
    if (!images || images.length === 0) {
      console.error('❌ No images provided to modal');
      return;
    }
    
    console.log('✅ Setting image modal state...');
    setSelectedProductImages(images);
    setSelectedProductName(productName);
    setImageModalOpen(true);
    
    console.log('✅ Image modal should open now');
  };

  // Get vendor categories
  const { data: categories = [] } = useQuery<VendorCategory[]>({
    queryKey: ['/api/vendor-categories'],
  });

  // Get user's vendor
  const { data: vendor, isLoading } = useQuery<Vendor | null>({
    queryKey: ['/api/user/vendor'],
  });

  // Get user's products (only when vendor exists)
  const { data: products = [], isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: ['/api/user/products'],
    enabled: !!vendor, // Only fetch products if vendor exists
  });

  // Setup form
  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      businessName: vendor?.businessName || '',
      displayName: vendor?.displayName || '',
      description: vendor?.description || '',
      categoryId: vendor?.categoryId || '',
      location: vendor?.location || '',
      address: vendor?.address || '',
      phoneNumber: vendor?.phoneNumber || '',
      whatsappNumber: vendor?.whatsappNumber || '',
      email: vendor?.email || '',
      website: vendor?.website || '',
      deliveryFee: vendor?.deliveryFee || '0',
      minOrderAmount: vendor?.minOrderAmount || '0',
    },
  });

  // Create vendor mutation
  const createVendorMutation = useMutation({
    mutationFn: (data: VendorFormData) => apiRequest('/api/vendors', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/vendor'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/products'] });
      toast({
        title: 'تم إنشاء البائع بنجاح',
        description: 'سيتم مراجعة طلبك وسيصلك إشعار عند الموافقة',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في إنشاء البائع',
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    },
  });

  // Update vendor mutation
  const updateVendorMutation = useMutation({
    mutationFn: (data: VendorFormData) => apiRequest(`/api/vendors/${vendor!.id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/vendor'] });
      setIsEditing(false);
      toast({
        title: 'تم تحديث البيانات بنجاح',
        description: 'تم حفظ التغييرات على بيانات البائع',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في التحديث',
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: VendorFormData) => {
    if (vendor) {
      updateVendorMutation.mutate(data);
    } else {
      createVendorMutation.mutate(data);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'مُوافق عليه';
      case 'pending': return 'قيد المراجعة';
      case 'rejected': return 'مرفوض';
      case 'suspended': return 'معلق';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl" dir="rtl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-full">
            <Store className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {vendor ? 'إدارة بائعي' : 'كن بائعاً'}
            </h1>
            <p className="text-gray-600">
              {vendor ? 'إدارة وتطوير نشاطك التجاري' : 'انضم إلى السوق وابدأ البيع'}
            </p>
          </div>
        </div>

        {vendor && (
          <div className="flex gap-2">
            <Badge className={cn('px-3 py-1', getStatusColor(vendor.status))}>
              {getStatusText(vendor.status)}
            </Badge>
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
        )}
      </div>

      {vendor ? (
        // Existing vendor - Dashboard
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">إجمالي المبيعات</p>
                    <p className="text-2xl font-bold text-green-600">
                      {parseFloat(vendor.totalSales).toLocaleString()} دج
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">الطلبات</p>
                    <p className="text-2xl font-bold text-blue-600">{vendor.totalOrders}</p>
                  </div>
                  <ShoppingBag className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">المنتجات</p>
                    <p className="text-2xl font-bold text-purple-600">{vendor.totalProducts}</p>
                  </div>
                  <Package className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">التقييم</p>
                    <div className="flex items-center gap-1">
                      <p className="text-2xl font-bold text-yellow-600">
                        {parseFloat(vendor.averageRating).toFixed(1)}
                      </p>
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    </div>
                    <p className="text-xs text-gray-500">({vendor.totalReviews} تقييم)</p>
                  </div>
                  <Users className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Product Upload */}
          {isMobile && (
            <>
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Smartphone className="h-5 w-5" />
                    إضافة منتجات عبر الهاتف
                  </CardTitle>
                  <CardDescription>
                    أضف منتجاتك بسهولة من خلال كاميرا الهاتف
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => setShowMobileUpload(true)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      size="lg"
                    >
                      <Camera className="h-5 w-5 ml-2" />
                      رفع من الكاميرا
                    </Button>
                    <Button 
                      onClick={() => setShowMobileUpload(true)}
                      variant="outline" 
                      className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                      size="lg"
                    >
                      <Upload className="h-5 w-5 ml-2" />
                      رفع من المعرض
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 mt-3 text-center">
                    واجهة محسنة للهواتف الذكية مع رفع سريع للصور
                  </p>
                </CardContent>
              </Card>
              
              {/* Mobile Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    إجراءات سريعة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-20 flex-col space-y-2">
                      <Settings className="w-6 h-6" />
                      <span className="text-sm">إدارة المتجر</span>
                    </Button>
                    <Link href="/promotions" className="w-full">
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col space-y-2 w-full" 
                        data-testid="button-promotions-mobile"
                      >
                        <Megaphone className="w-6 h-6 text-primary" />
                        <span className="text-sm">الإعلانات</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Desktop Quick Actions */}
          {!isMobile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  إجراءات سريعة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => setShowMobileUpload(true)}
                    variant="outline" 
                    className="h-20 flex-col space-y-2"
                    data-testid="button-add-product"
                  >
                    <Plus className="w-6 h-6" />
                    <span>إضافة منتج</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col space-y-2">
                    <Settings className="w-6 h-6" />
                    <span>إدارة المتجر</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col space-y-2">
                    <TrendingUp className="w-6 h-6" />
                    <span>التقارير</span>
                  </Button>
                  <Link href="/promotions">
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col space-y-2 w-full" 
                      data-testid="button-promotions"
                    >
                      <Megaphone className="w-6 h-6 text-primary" />
                      <span>خدمات الترويج</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  منتجاتي ({products.length})
                </CardTitle>
                <Button 
                  onClick={() => setShowMobileUpload(true)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 ml-1" />
                  إضافة منتج
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isProductsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 aspect-square rounded-lg mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد منتجات بعد</h3>
                  <p className="text-gray-500 mb-6">ابدأ بإضافة منتجاتك الأولى لعرضها للعملاء</p>
                  <Button 
                    onClick={() => setShowMobileUpload(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة منتج الآن
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onImageClick={handleImageClick}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vendor Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  معلومات البائع
                </CardTitle>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant={isEditing ? "outline" : "default"}
                  size="sm"
                  data-testid="button-edit-vendor"
                >
                  {isEditing ? (
                    <>إلغاء</>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 ml-1" />
                      تعديل
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                // Edit Form
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="businessName">اسم النشاط التجاري</Label>
                      <Input
                        id="businessName"
                        {...form.register('businessName')}
                        data-testid="input-business-name"
                      />
                      {form.formState.errors.businessName && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.businessName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="displayName">الاسم التجاري</Label>
                      <Input
                        id="displayName"
                        {...form.register('displayName')}
                        data-testid="input-display-name"
                      />
                      {form.formState.errors.displayName && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.displayName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">وصف النشاط</Label>
                    <Textarea
                      id="description"
                      {...form.register('description')}
                      rows={4}
                      data-testid="textarea-description"
                    />
                    {form.formState.errors.description && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.description.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="categoryId">فئة النشاط</Label>
                      <Select
                        value={form.watch('categoryId')}
                        onValueChange={(value) => form.setValue('categoryId', value)}
                      >
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="اختر فئة النشاط" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.icon} {category.nameAr}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.categoryId && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.categoryId.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="location">الموقع</Label>
                      <Input
                        id="location"
                        {...form.register('location')}
                        placeholder="مثال: الجزائر"
                        data-testid="input-location"
                      />
                      {form.formState.errors.location && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.location.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phoneNumber">رقم الهاتف</Label>
                      <Input
                        id="phoneNumber"
                        {...form.register('phoneNumber')}
                        placeholder="+213 555 123 456"
                        data-testid="input-phone"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        type="email"
                        {...form.register('email')}
                        placeholder="vendor@example.com"
                        data-testid="input-email"
                      />
                      {form.formState.errors.email && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={updateVendorMutation.isPending}
                      data-testid="button-save-vendor"
                    >
                      {updateVendorMutation.isPending ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      data-testid="button-cancel-edit"
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              ) : (
                // Display Info
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={vendor.logoUrl} alt={vendor.displayName} />
                      <AvatarFallback className="bg-blue-500 text-white font-bold text-lg">
                        {vendor.displayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{vendor.displayName}</h3>
                      <p className="text-gray-600 font-medium">{vendor.businessName}</p>
                      <p className="text-gray-700 mt-2">{vendor.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">معلومات الاتصال</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>{vendor.location}</span>
                        </div>
                        {vendor.phoneNumber && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span>{vendor.phoneNumber}</span>
                          </div>
                        )}
                        {vendor.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span>{vendor.email}</span>
                          </div>
                        )}
                        {vendor.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-gray-500" />
                            <a 
                              href={vendor.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              زيارة الموقع
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">معلومات التوصيل</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">رسوم التوصيل: </span>
                          <span className="font-medium">{vendor.deliveryFee} دج</span>
                        </div>
                        <div>
                          <span className="text-gray-600">أقل مبلغ طلب: </span>
                          <span className="font-medium">{vendor.minOrderAmount} دج</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        // No vendor - Create form
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              إنشاء بائع جديد
            </CardTitle>
            <CardDescription>
              اكمل المعلومات أدناه لبدء رحلتك في البيع عبر السوق
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-24 md:pb-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">اسم النشاط التجاري *</Label>
                  <Input
                    id="businessName"
                    {...form.register('businessName')}
                    placeholder="مثال: متجر الإلكترونيات الحديثة"
                    data-testid="input-business-name"
                  />
                  {form.formState.errors.businessName && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.businessName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="displayName">الاسم التجاري *</Label>
                  <Input
                    id="displayName"
                    {...form.register('displayName')}
                    placeholder="مثال: تك ستور"
                    data-testid="input-display-name"
                  />
                  {form.formState.errors.displayName && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.displayName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">وصف النشاط *</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder="اكتب وصفاً مفصلاً عن نشاطك التجاري ونوع المنتجات التي تبيعها..."
                  rows={4}
                  data-testid="textarea-description"
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categoryId">فئة النشاط *</Label>
                  <Select
                    value={form.watch('categoryId')}
                    onValueChange={(value) => form.setValue('categoryId', value)}
                  >
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="اختر فئة النشاط" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.icon} {category.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.categoryId && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.categoryId.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="location">الموقع *</Label>
                  <Input
                    id="location"
                    {...form.register('location')}
                    placeholder="مثال: الجزائر"
                    data-testid="input-location"
                  />
                  {form.formState.errors.location && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.location.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phoneNumber">رقم الهاتف</Label>
                  <Input
                    id="phoneNumber"
                    {...form.register('phoneNumber')}
                    placeholder="+213 555 123 456"
                    data-testid="input-phone"
                  />
                </div>

                <div>
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register('email')}
                    placeholder="vendor@example.com"
                    data-testid="input-email"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createVendorMutation.isPending}
                data-testid="button-create-vendor"
              >
                {createVendorMutation.isPending ? 'جارٍ الإنشاء...' : 'إنشاء البائع'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Mobile Product Upload Modal */}
      {showMobileUpload && (
        <div className="fixed inset-0 z-[9999] bg-white dark:bg-gray-900 overflow-auto">
          <MobileProductUpload
            onSuccess={() => {
              setShowMobileUpload(false);
              queryClient.invalidateQueries({ queryKey: ['/api/user/vendor'] });
            }}
            onCancel={() => setShowMobileUpload(false)}
          />
        </div>
      )}

      {/* Image Modal */}
      <ImageModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        images={selectedProductImages}
        title={selectedProductName}
        showNavigation={true}
        showActions={true}
      />
    </div>
  );
}