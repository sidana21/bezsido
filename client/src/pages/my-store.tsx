import { useState } from "react";
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
import { insertStoreSchema } from "@shared/schema";
import { z } from "zod";
import { StoreIcon, Plus, Edit, MapPin, Phone, Clock, Settings } from "lucide-react";

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
  const { toast } = useToast();

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user/current"],
  });

  const { data: userStore, isLoading: isLoadingStore } = useQuery<Store | null>({
    queryKey: ["/api/user/store"],
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
      location: currentUser?.location || "",
      phoneNumber: "",
      imageUrl: "",
      isOpen: true,
    },
  });

  const createStoreMutation = useMutation({
    mutationFn: async (data: StoreFormData) => {
      return apiRequest("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/store"] });
      toast({
        title: "تم إنشاء المتجر",
        description: "تم إنشاء متجرك بنجاح!",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء المتجر",
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

  const handleCreateStore = (data: StoreFormData) => {
    createStoreMutation.mutate(data);
  };

  const handleUpdateStore = (data: StoreFormData) => {
    updateStoreMutation.mutate(data);
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
                  <form onSubmit={form.handleSubmit(handleCreateStore)} className="space-y-4">
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
                        type="submit"
                        disabled={createStoreMutation.isPending}
                        className="bg-[var(--whatsapp-primary)] hover:bg-[var(--whatsapp-secondary)]"
                        data-testid="button-submit-create"
                      >
                        {createStoreMutation.isPending ? "جاري الإنشاء..." : "إنشاء المتجر"}
                      </Button>
                    </div>
                  </form>
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
                <CardTitle className="flex items-center">
                  <StoreIcon className="w-5 h-5 ml-2" />
                  {userStore.name}
                  <Badge className={`mr-2 ${userStore.isOpen ? 'bg-green-500' : 'bg-red-500'}`}>
                    {userStore.isOpen ? 'مفتوح' : 'مغلق'}
                  </Badge>
                </CardTitle>
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
                <CardTitle>منتجات المتجر ({storeProducts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {storeProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">لا توجد منتجات في متجرك حتى الآن</p>
                    <Button variant="outline" data-testid="button-add-first-product">
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة منتج جديد
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {storeProducts.map((product) => (
                      <Card key={product.id} className="overflow-hidden">
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
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-[var(--whatsapp-primary)]">
                              {parseInt(product.price).toLocaleString()} دج
                            </span>
                            <Badge variant={product.isActive ? "default" : "secondary"}>
                              {product.isActive ? "نشط" : "متوقف"}
                            </Badge>
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