import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
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
  Settings
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

export default function MyVendorPage() {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // Get vendor categories
  const { data: categories = [] } = useQuery<VendorCategory[]>({
    queryKey: ['/api/vendor-categories'],
  });

  // Get user's vendor
  const { data: vendor, isLoading } = useQuery<Vendor | null>({
    queryKey: ['/api/user/vendor'],
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
          <CardContent>
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">المزايا التي ستحصل عليها:</h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• عرض منتجاتك لآلاف العملاء المحتملين</li>
                  <li>• نظام إدارة متقدم للطلبات والمبيعات</li>
                  <li>• أدوات تسويقية قوية لزيادة المبيعات</li>
                  <li>• تقارير مفصلة عن الأداء والإحصائيات</li>
                  <li>• دعم فني متخصص على مدار الساعة</li>
                </ul>
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
    </div>
  );
}