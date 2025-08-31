import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Store, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStoreSchema, insertProductSchema } from "@shared/schema";
import { z } from "zod";
import { StoreIcon, Plus, Edit, MapPin, Phone, Clock, Settings, Upload, ImageIcon, X } from "lucide-react";

interface StoreWithOwner extends Store {
  owner: User;
}

const storeFormSchema = insertStoreSchema.extend({
  name: z.string().min(1, "اسم المتجر مطلوب"),
  description: z.string().min(1, "وصف المتجر مطلوب"),
  category: z.string().min(1, "فئة المتجر مطلوبة"),
  location: z.string().min(1, "موقع المتجر مطلوب"),
});

type StoreFormData = z.infer<typeof storeFormSchema>;

export default function MyStore() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [lastStoreStatus, setLastStoreStatus] = useState<string | null>(null);
  const [productImageUrl, setProductImageUrl] = useState<string>("");
  const { toast } = useToast();
  const isInitialMount = useRef(true);

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user/current"],
  });

  const { data: userStore, isLoading: isLoadingStore } = useQuery<Store | null>({
    queryKey: ["/api/user/store"],
    refetchInterval: 30000, // Check every 30 seconds for updates
  });

  const { data: storeProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/user/products"],
  });

  const form = useForm<StoreFormData>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      location: "",
      phoneNumber: "",
      imageUrl: "",
      isOpen: true,
    },
  });

  // Update location field when currentUser data is available
  useEffect(() => {
    if (currentUser?.location) {
      form.setValue("location", currentUser.location);
    }
  }, [currentUser, form]);

  // Monitor store status changes and show congratulatory message
  useEffect(() => {
    if (userStore && !isInitialMount.current) {
      // Check if store status changed to approved
      if (lastStoreStatus === 'pending' && userStore.status === 'approved') {
        toast({
          title: "🎉 تفعيل المتجر مبروك عليك!",
          description: "تم الموافقة على متجرك وتفعيله بنجاح! يمكنك الآن إضافة منتجاتك وبدء البيع والاستفادة من جميع الخدمات.",
          duration: 10000,
        });
      }
      // Check if store was rejected
      else if (lastStoreStatus === 'pending' && userStore.status === 'rejected') {
        toast({
          title: "تم رفض طلب المتجر",
          description: userStore.rejectionReason || "يرجى مراجعة البيانات والمحاولة مرة أخرى.",
          variant: "destructive",
          duration: 8000,
        });
      }
      // Update last status
      setLastStoreStatus(userStore.status);
    } else if (userStore && isInitialMount.current) {
      // Set initial status without showing notification
      setLastStoreStatus(userStore.status);
      isInitialMount.current = false;
    }
  }, [userStore, lastStoreStatus, toast]);

  const productForm = useForm({
    resolver: zodResolver(insertProductSchema.extend({
      name: z.string().min(1, "اسم المنتج مطلوب"),
      description: z.string().min(1, "وصف المنتج مطلوب"),
      price: z.string().min(1, "السعر مطلوب"),
      category: z.string().min(1, "فئة المنتج مطلوبة"),
    })),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category: "",
      imageUrl: "",
      location: currentUser?.location || "",
      isActive: true,
    },
  });

  const createStoreMutation = useMutation({
    mutationFn: async (data: StoreFormData) => {
      console.log("Sending store data to API:", data);
      const response = await apiRequest("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      console.log("API response:", response);
      return response;
    },
    onSuccess: () => {
      // Invalidate multiple related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/user/store"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      
      // Force refetch the user store immediately
      queryClient.refetchQueries({ queryKey: ["/api/user/store"] });
      
      toast({
        title: "🕒 انتظار الموافقة",
        description: "تم تقديم طلب إنشاء متجرك بنجاح! سيتم مراجعته من قبل الإدارة وستتلقى إشعارًا عند الموافقة.",
        duration: 6000,
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error("Create store error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء المتجر. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  const updateStoreMutation = useMutation({
    mutationFn: async (data: Partial<StoreFormData>) => {
      if (!userStore) throw new Error("No store found");
      return apiRequest(`/api/stores/${userStore.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/store"] });
      toast({
        title: "تم تحديث المتجر",
        description: "تم تحديث معلومات متجرك بنجاح!",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث المتجر",
        variant: "destructive",
      });
    },
  });

  const addProductMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!userStore) throw new Error("No store found");
      return apiRequest("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          imageUrl: productImageUrl, // Use uploaded image URL
          userId: currentUser?.id,
          storeId: userStore.id,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/products"] });
      toast({
        title: "تم إضافة المنتج",
        description: "تم إضافة المنتج بنجاح!",
      });
      setIsAddProductDialogOpen(false);
      setProductImageUrl(""); // Reset image URL
      productForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة المنتج",
        variant: "destructive",
      });
    },
  });

  const uploadProductImageMutation = useMutation({
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
      setProductImageUrl(data.mediaUrl);
      toast({
        title: "تم رفع الصورة",
        description: "تم رفع صورة المنتج بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في رفع الصورة",
        variant: "destructive",
      });
    },
  });


  // Handle product image upload
  const handleProductImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "حجم الصورة كبير",
          description: "يجب أن يكون حجم الصورة أقل من 5 ميجابايت",
          variant: "destructive",
        });
        return;
      }
      uploadProductImageMutation.mutate(file);
    }
  };

  // Simple button click handler
  const handleButtonClick = () => {
    const formData = form.getValues();
    
    // Validate required fields
    if (!formData.name || !formData.description || !formData.category || !formData.location) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    
    // Submit the form
    createStoreMutation.mutate(formData);
  };

  const handleUpdateStore = (data: StoreFormData) => {
    updateStoreMutation.mutate(data);
  };

  const handleAddProduct = (data: any) => {
    addProductMutation.mutate(data);
  };

  // Reset image when dialog closes
  const handleCloseAddProductDialog = (open: boolean) => {
    setIsAddProductDialogOpen(open);
    if (!open) {
      setProductImageUrl("");
      productForm.reset();
    }
  };

  const openEditDialog = () => {
    if (userStore) {
      form.reset({
        name: userStore.name,
        description: userStore.description,
        category: userStore.category,
        location: userStore.location,
        phoneNumber: userStore.phoneNumber || "",
        imageUrl: userStore.imageUrl || "",
        isOpen: userStore.isOpen ?? true,
      });
      setIsEditDialogOpen(true);
    }
  };

  if (isLoadingStore) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">متجري</h1>
          {userStore && (
            <Button onClick={openEditDialog} variant="outline" data-testid="button-edit-store">
              <Edit className="w-4 h-4 ml-2" />
              تعديل المتجر
            </Button>
          )}
        </div>

        {!userStore ? (
          /* No Store - Create Store */
          <Card>
            <CardContent className="p-8 text-center">
              <StoreIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">لا يوجد لديك متجر حتى الآن</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                أنشئ متجرك الخاص لعرض منتجاتك وزيادة مبيعاتك
              </p>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[var(--whatsapp-primary)] hover:bg-[var(--whatsapp-secondary)]" data-testid="button-create-store">
                    <Plus className="w-4 h-4 ml-2" />
                    إنشاء متجر جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" data-testid="create-store-modal">
                  <DialogHeader>
                    <DialogTitle>إنشاء متجر جديد</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">اسم المتجر *</Label>
                      <Input
                        id="name"
                        {...form.register("name")}
                        placeholder="متجر الإلكترونيات"
                        data-testid="input-store-name"
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">وصف المتجر *</Label>
                      <Textarea
                        id="description"
                        {...form.register("description")}
                        placeholder="وصف موجز عن متجرك ونوع المنتجات التي تبيعها"
                        data-testid="input-store-description"
                      />
                      {form.formState.errors.description && (
                        <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">فئة المتجر *</Label>
                      <Input
                        id="category"
                        {...form.register("category")}
                        placeholder="إلكترونيات، ملابس، طعام، إلخ"
                        data-testid="input-store-category"
                      />
                      {form.formState.errors.category && (
                        <p className="text-sm text-red-500">{form.formState.errors.category.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">الموقع *</Label>
                      <Input
                        id="location"
                        {...form.register("location")}
                        placeholder="تندوف، وهران، الجزائر..."
                        data-testid="input-store-location"
                      />
                      {form.formState.errors.location && (
                        <p className="text-sm text-red-500">{form.formState.errors.location.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">رقم الهاتف</Label>
                      <Input
                        id="phoneNumber"
                        {...form.register("phoneNumber")}
                        placeholder="+213555123456"
                        data-testid="input-store-phone"
                      />
                    </div>

                    <div className="flex justify-end space-x-2 space-x-reverse">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                        data-testid="button-cancel-create"
                      >
                        إلغاء
                      </Button>
                      <Button
                        type="button"
                        disabled={createStoreMutation.isPending}
                        className="bg-[var(--whatsapp-primary)] hover:bg-[var(--whatsapp-secondary)] disabled:opacity-50"
                        data-testid="button-submit-create"
                        onClick={handleButtonClick}
                      >
                        {createStoreMutation.isPending ? "جاري الإنشاء..." : "إنشاء المتجر"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          /* Store exists - Show store details and management */
          <div className="space-y-6">
            {/* Store Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center flex-wrap gap-2">
                  <StoreIcon className="w-5 h-5 ml-2" />
                  {userStore.name}
                  <div className="flex gap-2">
                    <Badge className={`${userStore.isOpen ? 'bg-green-500' : 'bg-red-500'}`}>
                      {userStore.isOpen ? 'مفتوح' : 'مغلق'}
                    </Badge>
                    <Badge className={`${
                      userStore.status === 'approved' ? 'bg-green-500' :
                      userStore.status === 'pending' ? 'bg-yellow-500' :
                      userStore.status === 'rejected' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}>
                      {userStore.status === 'approved' ? 'معتمد' :
                       userStore.status === 'pending' ? 'قيد المراجعة' :
                       userStore.status === 'rejected' ? 'مرفوض' :
                       userStore.status === 'suspended' ? 'معلق' : 'غير محدد'}
                    </Badge>
                  </div>
                </CardTitle>
                {userStore.status === 'rejected' && userStore.rejectionReason && (
                  <div className="text-sm text-red-600 dark:text-red-400 mt-2">
                    <strong>سبب الرفض:</strong> {userStore.rejectionReason}
                  </div>
                )}
                {userStore.status === 'pending' && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-3">
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-yellow-600 ml-2" />
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200">طلب قيد المراجعة</h4>
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                      انتظار الموافقة - تم تقديم طلب إنشاء متجرك بنجاح وهو الآن قيد المراجعة من قبل فريق الإدارة. 
                      سيتم إشعارك فور الموافقة على الطلب وتفعيل متجرك.
                    </p>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                      تاريخ التقديم: {userStore.createdAt ? new Date(userStore.createdAt).toLocaleDateString('ar-DZ') : 'غير محدد'}
                    </div>
                  </div>
                )}
                {userStore.status === 'approved' && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mt-3">
                    <div className="flex items-center text-green-700 dark:text-green-300">
                      <Clock className="w-4 h-4 ml-2" />
                      <span className="text-sm">تم الموافقة على متجرك في: {userStore.approvedAt ? new Date(userStore.approvedAt).toLocaleDateString('ar-DZ') : 'غير محدد'}</span>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4 ml-2" />
                      {userStore.location}
                    </div>
                    {userStore.phoneNumber && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4 ml-2" />
                        {userStore.phoneNumber}
                      </div>
                    )}
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Settings className="w-4 h-4 ml-2" />
                      {userStore.category}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-700 dark:text-gray-300">{userStore.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Store Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>منتجات المتجر ({storeProducts.length})</span>
                  <Dialog open={isAddProductDialogOpen} onOpenChange={handleCloseAddProductDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        className="bg-[var(--whatsapp-primary)] hover:bg-[var(--whatsapp-secondary)]" 
                        data-testid="button-add-product"
                        disabled={userStore.status !== 'approved'}
                      >
                        <Plus className="w-4 h-4 ml-2" />
                        إضافة منتج
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md" data-testid="add-product-modal">
                      <DialogHeader>
                        <DialogTitle>إضافة منتج جديد</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={productForm.handleSubmit(handleAddProduct)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="productName">اسم المنتج *</Label>
                          <Input
                            id="productName"
                            {...productForm.register("name")}
                            placeholder="سماعة بلوتوث"
                            data-testid="input-product-name"
                          />
                          {productForm.formState.errors.name && (
                            <p className="text-sm text-red-500">{productForm.formState.errors.name.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="productDescription">وصف المنتج *</Label>
                          <Textarea
                            id="productDescription"
                            {...productForm.register("description")}
                            placeholder="وصف تفصيلي للمنتج..."
                            data-testid="input-product-description"
                          />
                          {productForm.formState.errors.description && (
                            <p className="text-sm text-red-500">{productForm.formState.errors.description.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="productPrice">السعر (دج) *</Label>
                          <Input
                            id="productPrice"
                            {...productForm.register("price")}
                            placeholder="5000"
                            type="number"
                            data-testid="input-product-price"
                          />
                          {productForm.formState.errors.price && (
                            <p className="text-sm text-red-500">{productForm.formState.errors.price.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="productCategory">فئة المنتج *</Label>
                          <Input
                            id="productCategory"
                            {...productForm.register("category")}
                            placeholder="إلكترونيات، ملابس، طعام..."
                            data-testid="input-product-category"
                          />
                          {productForm.formState.errors.category && (
                            <p className="text-sm text-red-500">{productForm.formState.errors.category.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>صورة المنتج</Label>
                          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                            {productImageUrl ? (
                              <div className="relative">
                                <img
                                  src={productImageUrl}
                                  alt="صورة المنتج"
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-2 right-2"
                                  onClick={() => setProductImageUrl("")}
                                  data-testid="button-remove-image"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="text-center">
                                <label htmlFor="product-image-upload" className="cursor-pointer">
                                  <div className="flex flex-col items-center space-y-2">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                      {uploadProductImageMutation.isPending ? (
                                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                      ) : (
                                        <ImageIcon className="w-6 h-6 text-gray-400" />
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      {uploadProductImageMutation.isPending ? (
                                        "جاري تحميل الصورة..."
                                      ) : (
                                        <>
                                          <span className="font-semibold text-blue-600">انقر للتحميل</span>
                                          <br />
                                          أو اسحب الصورة هنا
                                        </>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      JPG, PNG, GIF حتى 5MB
                                    </div>
                                  </div>
                                </label>
                                <input
                                  id="product-image-upload"
                                  type="file"
                                  accept="image/*,image/jpeg,image/png,image/gif,image/webp"
                                  onChange={handleProductImageChange}
                                  className="hidden"
                                  data-testid="input-product-image"
                                  disabled={uploadProductImageMutation.isPending}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2 space-x-reverse">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleCloseAddProductDialog(false)}
                            data-testid="button-cancel-product"
                          >
                            إلغاء
                          </Button>
                          <Button
                            type="submit"
                            disabled={addProductMutation.isPending}
                            className="bg-[var(--whatsapp-primary)] hover:bg-[var(--whatsapp-secondary)]"
                            data-testid="button-submit-product"
                          >
                            {addProductMutation.isPending ? "جاري الإضافة..." : "إضافة المنتج"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {storeProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">لا توجد منتجات في متجرك حتى الآن</p>
                    <p className="text-sm text-gray-500 mb-4">ابدأ بإضافة منتجاتك لزيادة المبيعات</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {storeProducts.map((product) => (
                      <Card key={product.id} className="overflow-hidden" data-testid={`product-card-${product.id}`}>
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
                          <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-lg font-bold text-[var(--whatsapp-primary)]">
                              {parseInt(product.price).toLocaleString()} دج
                            </span>
                            <Badge variant={product.isActive ? "default" : "secondary"}>
                              {product.isActive ? "نشط" : "متوقف"}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1" data-testid={`button-edit-product-${product.id}`}>
                              <Edit className="w-3 h-3 ml-1" />
                              تعديل
                            </Button>
                            <Button 
                              size="sm" 
                              variant={product.isActive ? "secondary" : "default"}
                              className="flex-1"
                              data-testid={`button-toggle-product-${product.id}`}
                            >
                              {product.isActive ? "إيقاف" : "تفعيل"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Store Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md" data-testid="edit-store-modal">
            <DialogHeader>
              <DialogTitle>تعديل المتجر</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleUpdateStore)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم المتجر *</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="متجر الإلكترونيات"
                  data-testid="input-edit-store-name"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">وصف المتجر *</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="وصف موجز عن متجرك ونوع المنتجات التي تبيعها"
                  data-testid="input-edit-store-description"
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">فئة المتجر *</Label>
                <Input
                  id="category"
                  {...form.register("category")}
                  placeholder="إلكترونيات، ملابس، طعام، إلخ"
                  data-testid="input-edit-store-category"
                />
                {form.formState.errors.category && (
                  <p className="text-sm text-red-500">{form.formState.errors.category.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">رقم الهاتف</Label>
                <Input
                  id="phoneNumber"
                  {...form.register("phoneNumber")}
                  placeholder="+213555123456"
                  data-testid="input-edit-store-phone"
                />
              </div>

              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={updateStoreMutation.isPending}
                  className="bg-[var(--whatsapp-primary)] hover:bg-[var(--whatsapp-secondary)]"
                  data-testid="button-submit-edit"
                >
                  {updateStoreMutation.isPending ? "جاري التحديث..." : "حفظ التغييرات"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}