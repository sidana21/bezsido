import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Scissors, MapPin, Star, MessageCircle, Plus, ImageIcon, X, Trash2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { User, Service } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function BeautyServices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    basePrice: "",
    serviceType: "hair-salon"
  });
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user/current"],
  });

  const { data: serviceCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/service-categories"],
  });

  // Find the beauty services category (حناييات وتجميل - Henna & Beauty)
  const beautyServiceCategory = serviceCategories.find(cat => 
    cat.nameAr === "حناييات وتجميل" || cat.name === "Henna & Beauty"
  );

  const { data: homeServices = [], isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services", "beauty", currentUser?.location, beautyServiceCategory?.id],
    queryFn: () => {
      const params = new URLSearchParams();
      if (currentUser?.location) params.append('location', currentUser.location);
      if (beautyServiceCategory?.id) params.append('categoryId', beautyServiceCategory.id);
      return apiRequest(`/api/services?${params.toString()}`);
    },
    enabled: !!currentUser && !!beautyServiceCategory,
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('media', file);
      
      const response = await fetch("/api/upload/media", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("فشل في رفع الصورة");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.fileType !== 'video') {
        setUploadedImages(prev => [...prev, data.mediaUrl]);
        toast({
          title: "تم رفع الصورة",
          description: "تم رفع الصورة بنجاح",
        });
      }
      setIsUploading(false);
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

  const addServiceMutation = useMutation({
    mutationFn: async (serviceData: any) => {
      return apiRequest("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serviceData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setShowAddDialog(false);
      setNewService({ name: "", description: "", basePrice: "", serviceType: "hair-salon" });
      setUploadedImages([]);
      toast({
        title: "تم النشر بنجاح",
        description: "تم نشر خدمة التجميل بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في نشر الخدمة",
        variant: "destructive",
      });
    },
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

  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      return apiRequest(`/api/services/${serviceId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: "تم الحذف",
        description: "تم حذف الخدمة بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف الخدمة",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        toast({
          title: "خطأ",
          description: "يرجى اختيار ملف صورة فقط",
          variant: "destructive",
        });
        return;
      }
      setIsUploading(true);
      uploadImageMutation.mutate(file);
    }
  };

  const handleImageUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveImage = (imageUrl: string) => {
    setUploadedImages(prev => prev.filter(url => url !== imageUrl));
  };

  const handleAddService = () => {
    if (!newService.name || !newService.description || !newService.basePrice) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const beautyCategory = serviceCategories.find(cat => 
      cat.nameAr === "حناييات وتجميل" || 
      cat.name === "Henna & Beauty" ||
      cat.nameAr?.includes("تجميل") ||
      cat.name?.toLowerCase().includes("beauty")
    );
    
    if (!beautyCategory) {
      console.error("Available categories:", serviceCategories);
      toast({
        title: "خطأ",
        description: "فئة الخدمة غير متوفرة",
        variant: "destructive",
      });
      return;
    }

    addServiceMutation.mutate({
      name: newService.name,
      description: newService.description,
      basePrice: newService.basePrice,
      serviceType: newService.serviceType,
      categoryId: beautyCategory.id,
      location: currentUser?.location || "",
      vendorId: currentUser?.id,
      images: uploadedImages
    });
  };

  const filteredServices = homeServices.filter(service =>
    service?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service?.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50/30 to-rose-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/stores">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-pink-600 w-12 h-12 rounded-full"
                data-testid="button-back"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
                <Scissors className="w-8 h-8" />
                خدمات التجميل
              </h1>
              <p className="text-white/80 text-sm">صالونات، مكياج، عناية بالبشرة والشعر</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        {/* Search Bar */}
        <div className="relative mb-8">
          <div className="absolute right-6 top-1/2 transform -translate-y-1/2 z-10">
            <Search className="w-6 h-6 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="ابحث عن خدمة تجميل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-16 text-lg h-16 rounded-2xl border-2 border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 shadow-xl"
            data-testid="input-search-services"
          />
        </div>

        {/* Services Categories */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
            <div className="text-3xl mb-2">✨</div>
            <h3 className="font-bold text-gray-800 dark:text-white">حناييات وتجميل</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">نقش حناء ومكياج للمناسبات</p>
          </div>
        </div>

        {/* Dialog for Adding Service */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-right">نشر خدمة تجميل جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 text-right">
                    اسم الخدمة
                  </label>
                  <Input
                    placeholder="مثال: صبغة شعر احترافية"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    className="text-right"
                    data-testid="input-service-name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 text-right">
                    نوع الخدمة
                  </label>
                  <select
                    value={newService.serviceType}
                    onChange={(e) => setNewService({ ...newService, serviceType: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-right"
                    data-testid="select-service-type"
                  >
                    <option value="henna-beauty">حناييات وتجميل</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 text-right">
                    الوصف
                  </label>
                  <Textarea
                    placeholder="وصف تفصيلي للخدمة..."
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    rows={3}
                    className="text-right"
                    data-testid="textarea-service-description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 text-right">
                    السعر (دج)
                  </label>
                  <Input
                    type="number"
                    placeholder="مثال: 5000"
                    value={newService.basePrice}
                    onChange={(e) => setNewService({ ...newService, basePrice: e.target.value })}
                    className="text-right"
                    data-testid="input-service-price"
                  />
                </div>

                {/* صور الخدمة */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 text-right">
                    صور الخدمة (اختياري)
                  </label>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="input-service-image"
                  />
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleImageUploadClick}
                    disabled={isUploading}
                    className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-500 h-20"
                    data-testid="button-upload-image"
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        <span className="text-sm">جاري الرفع...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">اضغط لرفع صورة من الهاتف</span>
                      </div>
                    )}
                  </Button>

                  {/* عرض الصور المرفوعة */}
                  {uploadedImages.length > 0 && (
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {uploadedImages.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={imageUrl}
                            alt={`صورة ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(imageUrl)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            data-testid={`button-remove-image-${index}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-3">
                  <Button
                    type="button"
                    onClick={handleAddService}
                    disabled={addServiceMutation.isPending || isUploading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    data-testid="button-submit-service"
                  >
                    {addServiceMutation.isPending ? "جاري النشر..." : "نشر الخدمة"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                    className="flex-1"
                    data-testid="button-cancel"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
          </DialogContent>
        </Dialog>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        )}

        {/* Services List */}
        {!isLoading && filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                data-testid={`service-card-${service.id}`}
              >
                {/* Service Images */}
                {service.images && service.images.length > 0 && (
                  <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
                    {service.images.length === 1 ? (
                      <img
                        src={service.images[0]}
                        alt={service.name}
                        className="w-full h-full object-cover"
                        data-testid={`service-image-${service.id}`}
                      />
                    ) : (
                      <div className="flex gap-1 h-full">
                        {service.images?.slice(0, 3).map((image: string, idx: number) => (
                          <img
                            key={idx}
                            src={image}
                            alt={`${service.name} ${idx + 1}`}
                            className={`object-cover ${service.images?.length === 2 ? 'w-1/2' : 'w-1/3'}`}
                            data-testid={`service-image-${service.id}-${idx}`}
                          />
                        ))}
                        {service.images.length > 3 && (
                          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md text-sm">
                            +{service.images.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                        {service.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                        {service.description}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
                      {service.serviceType}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{service.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>4.5</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-green-600">
                      {parseInt(service?.basePrice || '0').toLocaleString()} دج
                    </div>
                    <div className="flex gap-2">
                      {service.vendorId === currentUser?.id ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذه الخدمة؟')) {
                              deleteServiceMutation.mutate(service.id);
                            }
                          }}
                          disabled={deleteServiceMutation.isPending}
                          data-testid={`button-delete-${service.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          حذف
                        </Button>
                      ) : (
                        <Button
                          className="bg-whatsapp-green hover:bg-green-600 text-white"
                          onClick={() => requestServiceMutation.mutate({ serviceId: service.id, vendorId: service.vendorId })}
                          disabled={requestServiceMutation.isPending}
                          data-testid={`button-request-${service.id}`}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          اطلب الخدمة
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !isLoading && (
          <div className="text-center py-12">
            <Scissors className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              لا توجد خدمات تجميل متاحة حالياً
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              سنضيف المزيد من الخدمات قريباً في منطقتك
            </p>
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) لنشر خدمة */}
      <button
        onClick={() => setShowAddDialog(true)}
        className="fixed bottom-24 left-6 z-50 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full w-16 h-16 shadow-2xl flex items-center justify-center transform hover:scale-110 transition-all duration-300 animate-pulse hover:animate-none group"
        data-testid="button-fab-add-service"
        aria-label="انشر خدمة"
      >
        <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
        
        {/* Tooltip */}
        <span className="absolute left-20 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-xl">
          انشر خدمة تجميل
        </span>
        
        {/* Glow effect */}
        <span className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 opacity-75 blur-md animate-pulse"></span>
      </button>
    </div>
  );
}
