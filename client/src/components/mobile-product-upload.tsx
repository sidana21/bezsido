import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Camera, 
  ImageIcon, 
  X, 
  Plus, 
  Package, 
  DollarSign, 
  Tag,
  CheckCircle,
  Upload,
  Smartphone,
  Store,
  AlertTriangle,
  ArrowLeft
} from "lucide-react";
import type { ProductCategory } from "@shared/schema";

// Product form schema optimized for mobile
const mobileProductSchema = z.object({
  name: z.string().min(2, "اسم المنتج يجب أن يكون حرفين على الأقل"),
  description: z.string().min(10, "الوصف يجب أن يكون 10 أحرف على الأقل"),
  originalPrice: z.string().min(1, "السعر مطلوب"),
  salePrice: z.string().optional(),
  categoryId: z.string().min(1, "فئة المنتج مطلوبة"),
  stockQuantity: z.string().default("1"),
  tags: z.string().optional(),
});

type MobileProductForm = z.infer<typeof mobileProductSchema>;

interface MobileProductUploadProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function MobileProductUpload({ onSuccess, onCancel }: MobileProductUploadProps) {
  const [productImages, setProductImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user has a vendor/store
  const { data: userVendor, isLoading: isLoadingVendor } = useQuery({
    queryKey: ['/api/user/vendor'],
  });

  // Get product categories
  const { data: categories = [] } = useQuery<ProductCategory[]>({
    queryKey: ['/api/product-categories'],
  });

  const form = useForm<MobileProductForm>({
    resolver: zodResolver(mobileProductSchema),
    defaultValues: {
      name: "",
      description: "",
      originalPrice: "",
      salePrice: "",
      categoryId: "",
      stockQuantity: "1",
      tags: "",
    },
  });

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('media', file);
      
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("يجب تسجيل الدخول أولاً");
      }
      
      const response = await fetch("/api/upload/media", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("فشل في رفع الصورة");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setProductImages(prev => [...prev, data.mediaUrl]);
      setIsUploading(false);
      toast({
        title: "تم رفع الصورة",
        description: "تم رفع صورة المنتج بنجاح",
      });
    },
    onError: (error: any) => {
      setIsUploading(false);
      toast({
        title: "خطأ",
        description: error.message || "فشل في رفع الصورة",
        variant: "destructive",
      });
    },
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (data: MobileProductForm) => {
      // Validate numeric fields before sending
      const originalPriceNum = parseFloat(data.originalPrice);
      const salePriceNum = data.salePrice ? parseFloat(data.salePrice) : null;
      const stockQuantityNum = parseInt(data.stockQuantity);
      
      if (isNaN(originalPriceNum) || originalPriceNum <= 0) {
        throw new Error("السعر يجب أن يكون رقماً صحيحاً أكبر من الصفر");
      }
      
      if (data.salePrice && (isNaN(salePriceNum!) || salePriceNum! <= 0)) {
        throw new Error("سعر التخفيض يجب أن يكون رقماً صحيحاً أكبر من الصفر");
      }
      
      if (isNaN(stockQuantityNum) || stockQuantityNum < 0) {
        throw new Error("الكمية يجب أن تكون رقماً صحيحاً أكبر من أو يساوي الصفر");
      }

      const productData = {
        ...data,
        originalPrice: data.originalPrice, // Keep as string for decimal field
        salePrice: data.salePrice || null, // Keep as string or null
        stockQuantity: stockQuantityNum,
        images: productImages,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
        isActive: true,
      };

      return apiRequest("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/vendor'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "تم إضافة المنتج",
        description: "تم إضافة المنتج بنجاح إلى متجرك",
      });
      form.reset();
      setProductImages([]);
      setCurrentStep(1);
      onSuccess?.();
    },
    onError: (error: any) => {
      // Handle specific error for missing vendor store
      if (error.message && error.message.includes("لم يتم العثور على متجر")) {
        toast({
          title: "يجب إنشاء متجر أولاً",
          description: "لا يمكنك إضافة منتجات بدون إنشاء متجر. انقر على 'إنشاء متجر' أدناه للبدء.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "خطأ في إضافة المنتج",
          description: error.message || "حدث خطأ أثناء إضافة المنتج. يرجى المحاولة مرة أخرى.",
          variant: "destructive",
        });
      }
    },
  });

  // Handle camera capture
  const handleCameraCapture = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  // Handle gallery selection
  const handleGallerySelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "نوع الملف غير صحيح",
          description: "يرجى اختيار صورة صحيحة (JPG, PNG, GIF, WebP)",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "حجم الصورة كبير",
          description: "يجب أن يكون حجم الصورة أقل من 5 ميجابايت",
          variant: "destructive",
        });
        return;
      }
      
      setIsUploading(true);
      uploadImageMutation.mutate(file);
    }
    
    // Reset the input
    event.target.value = '';
  };

  // Remove image
  const removeImage = (index: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const onSubmit = (data: MobileProductForm) => {
    if (productImages.length === 0) {
      toast({
        title: "صورة مطلوبة",
        description: "يجب إضافة صورة واحدة على الأقل للمنتج",
        variant: "destructive",
      });
      return;
    }
    addProductMutation.mutate(data);
  };

  // Step navigation
  const nextStep = () => {
    if (currentStep === 1 && productImages.length === 0) {
      toast({
        title: "صورة مطلوبة",
        description: "يجب إضافة صورة واحدة على الأقل للمنتج",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Show loading state
  if (isLoadingVendor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">جاري التحقق من متجرك...</p>
        </div>
      </div>
    );
  }

  // Show message if user doesn't have a store
  if (!userVendor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <h1 className="text-lg font-semibold">متجر مطلوب</h1>
            </div>
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="px-4 py-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Store className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-xl">يجب إنشاء متجر أولاً</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  لا يمكنك إضافة منتجات بدون إنشاء متجر. يرجى إنشاء متجرك أولاً ثم العودة لإضافة المنتجات.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4 pt-4">
                <p className="text-gray-600 leading-relaxed">
                  إنشاء متجر سهل وسريع! ستحتاج فقط إلى:
                </p>
                <div className="text-right space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>اسم المتجر والوصف</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>اختيار فئة النشاط التجاري</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>معلومات الاتصال والموقع</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-6">
                <Button 
                  onClick={() => window.location.href = '/my-vendor'}
                  className="flex-1"
                  data-testid="button-create-store"
                >
                  <Store className="w-4 h-4 ml-2" />
                  إنشاء متجر جديد
                </Button>
                {onCancel && (
                  <Button variant="outline" onClick={onCancel} className="flex-1">
                    <ArrowLeft className="w-4 h-4 ml-2" />
                    العودة
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="h-6 w-6 text-blue-600" />
            <h1 className="text-lg font-semibold">إضافة منتج جديد</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{currentStep}/3</Badge>
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-center space-x-4 space-x-reverse">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
              </div>
              {step < 3 && (
                <div className={`w-8 h-1 mx-2 ${
                  step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-2">
          <span className="text-sm text-gray-600">
            {currentStep === 1 && "إضافة الصور"}
            {currentStep === 2 && "معلومات المنتج"}
            {currentStep === 3 && "السعر والتفاصيل"}
          </span>
        </div>
      </div>

      <div className="px-4 pb-20">
        {/* Step 1: Image Upload */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                صور المنتج
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCameraCapture}
                  className="h-20 flex-col space-y-2"
                  disabled={isUploading}
                >
                  <Camera className="w-8 h-8" />
                  <span className="text-sm">كاميرا</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGallerySelect}
                  className="h-20 flex-col space-y-2"
                  disabled={isUploading}
                >
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-sm">معرض الصور</span>
                </Button>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Upload status */}
              {isUploading && (
                <div className="text-center py-4">
                  <Upload className="h-8 w-8 animate-pulse mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-gray-600">جاري رفع الصورة...</p>
                </div>
              )}

              {/* Image Gallery */}
              {productImages.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">الصور المرفوعة ({productImages.length})</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {productImages.map((image, index) => (
                      <div key={index} className="relative aspect-square">
                        <img
                          src={image}
                          alt={`صورة المنتج ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next button */}
              <Button 
                onClick={nextStep} 
                className="w-full"
                disabled={productImages.length === 0}
              >
                متابعة إلى معلومات المنتج
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Product Information */}
        {currentStep === 2 && (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  معلومات المنتج
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">اسم المنتج *</Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="مثال: هاتف ذكي جديد"
                    className="text-lg"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">وصف المنتج *</Label>
                  <Textarea
                    id="description"
                    {...form.register('description')}
                    placeholder="اكتب وصفاً مفصلاً للمنتج..."
                    rows={4}
                    className="resize-none"
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="categoryId">فئة المنتج *</Label>
                  <Select
                    value={form.watch('categoryId')}
                    onValueChange={(value) => form.setValue('categoryId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر فئة المنتج" />
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

                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                    السابق
                  </Button>
                  <Button type="button" onClick={nextStep} className="flex-1">
                    متابعة للأسعار
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        )}

        {/* Step 3: Pricing and Details */}
        {currentStep === 3 && (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  السعر والتفاصيل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="originalPrice">السعر الأساسي * (دج)</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    {...form.register('originalPrice')}
                    placeholder="0"
                    className="text-lg"
                  />
                  {form.formState.errors.originalPrice && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.originalPrice.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="salePrice">سعر التخفيض (دج)</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    {...form.register('salePrice')}
                    placeholder="0 (اختياري)"
                    className="text-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="stockQuantity">الكمية المتوفرة</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    {...form.register('stockQuantity')}
                    defaultValue="1"
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="tags">كلمات مفتاحية</Label>
                  <Input
                    id="tags"
                    {...form.register('tags')}
                    placeholder="مثال: هاتف, إلكترونيات, جديد"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    اكتب الكلمات مفصولة بفاصلة
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                    السابق
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={addProductMutation.isPending}
                  >
                    {addProductMutation.isPending ? 'جارٍ الإضافة...' : 'إضافة المنتج'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        )}
      </div>
    </div>
  );
}