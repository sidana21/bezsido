import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Camera, Edit3, Phone, MapPin, User as UserIcon, Save, ShieldCheck, Star, AlertCircle, Check, Clock, Upload, Image, Trash2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import type { User, VerificationRequest } from "@shared/schema";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationReason, setVerificationReason] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const { toast } = useToast();
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading } = useQuery<User>({
    queryKey: ["/api/user/current"],
  });

  const { data: verificationRequests = [] } = useQuery<VerificationRequest[]>({
    queryKey: ["/api/user/verification-requests"],
    enabled: !!currentUser,
  });

  // Update form fields when user data changes
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setLocation(currentUser.location || "");
      setAvatarUrl(currentUser.avatar || "");
    }
  }, [currentUser]);

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: { name: string; location: string; avatar?: string }) => {
      console.log("🔐 Saving profile changes permanently to database...");
      return apiRequest("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/current"] });
      setIsEditing(false);
      
      // Update local backup with new data for protection
      const currentBackup = localStorage.getItem("user_backup");
      if (currentBackup) {
        try {
          const backup = JSON.parse(currentBackup);
          const enhancedBackup = {
            ...backup,
            ...updatedUser,
            lastUpdated: new Date().toISOString()
          };
          localStorage.setItem("user_backup", JSON.stringify(enhancedBackup));
          localStorage.setItem("profile_cache", JSON.stringify({
            userId: updatedUser.id,
            userPhone: updatedUser.phoneNumber,
            cachedAt: Date.now()
          }));
          console.log("✅ Profile backup updated with latest changes");
        } catch (error) {
          console.warn("Failed to update profile backup:", error);
        }
      }
      
      toast({
        title: "تم تحديث الملف الشخصي 🎉",
        description: "تم حفظ التغييرات بنجاح في قاعدة البيانات",
      });
    },
    onError: (error: any) => {
      // Save changes locally as backup if server fails
      const localBackup = {
        name: name.trim(),
        location: location.trim(),
        avatar: avatarUrl,
        lastLocalUpdate: new Date().toISOString()
      };
      localStorage.setItem("profile_pending_changes", JSON.stringify(localBackup));
      
      toast({
        title: "خطأ في الحفظ",
        description: "فشل في تحديث الملف الشخصي - البيانات محفوظة محلياً",
        variant: "destructive",
      });
    },
  });

  const uploadAvatarMutation = useMutation({
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
      setAvatarUrl(data.mediaUrl);
      toast({
        title: "تم رفع الصورة",
        description: "تم رفع صورة الملف الشخصي بنجاح",
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

  const submitVerificationMutation = useMutation({
    mutationFn: async (requestData: { requestType: string; reason: string }) => {
      return apiRequest("/api/verification-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/verification-requests"] });
      setShowVerificationDialog(false);
      setVerificationReason("");
      toast({
        title: "تم إرسال الطلب",
        description: "تم إرسال طلب التوثيق بنجاح، سيتم مراجعته قريباً",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إرسال طلب التوثيق",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/user/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({
        title: "تم حذف الحساب",
        description: "تم حذف حسابك بنجاح",
      });
      // Clear auth token and redirect to login
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف الحساب",
        variant: "destructive",
      });
    },
  });


  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB for images)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "خطأ",
          description: "حجم الصورة كبير جداً. يرجى اختيار صورة أصغر من 10 ميجابايت",
          variant: "destructive",
        });
        return;
      }

      // Check if it's actually an image
      if (!file.type.startsWith('image/')) {
        toast({
          title: "خطأ",
          description: "يرجى اختيار ملف صورة صحيح",
          variant: "destructive",
        });
        return;
      }

      // If not in editing mode, automatically enable it when uploading
      if (!isEditing) {
        setIsEditing(true);
      }

      uploadAvatarMutation.mutate(file);
    }
    
    // Reset the input to allow re-selecting the same file
    event.target.value = '';
  };

  const handleSave = () => {
    if (!name.trim() || !location.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate({
      name: name.trim(),
      location: location.trim(),
      avatar: avatarUrl,
    });
  };

  const handleCancel = () => {
    if (currentUser) {
      setName(currentUser.name || "");
      setLocation(currentUser.location || "");
      setAvatarUrl(currentUser.avatar || "");
    }
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "تم تسجيل الخروج",
        description: "تم تسجيل خروجك بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الخروج",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 flex items-center justify-center">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
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
            <h1 className="text-2xl font-bold">الملف الشخصي</h1>
          </div>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="ghost"
              className="text-white hover:bg-green-600 px-4 py-2 rounded-xl"
              data-testid="button-edit"
            >
              <Edit3 className="w-5 h-5 ml-2" />
              تعديل
            </Button>
          )}
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="w-32 h-32">
              <AvatarImage src={avatarUrl || currentUser?.avatar || undefined} alt={name || currentUser?.name} />
              <AvatarFallback className="text-2xl">
                {(name || currentUser?.name)?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            
            <div className="absolute bottom-0 right-0">
              <label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-whatsapp-green hover:bg-green-600 flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105">
                  {uploadAvatarMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Upload className="w-5 h-5 text-white" />
                  )}
                </div>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*,image/jpeg,image/png,image/gif,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
                data-testid="input-avatar-upload"
              />
            </div>
          </div>
          
          {uploadAvatarMutation.isPending ? (
            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              جاري رفع الصورة...
            </div>
          ) : (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              اضغط لتحميل صورة من هاتفك
            </div>
          )}
        </div>

        {/* Profile Information */}
        <div className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 text-lg">
              <UserIcon className="w-5 h-5" />
              الاسم
              {currentUser?.isVerified && (
                <div title="حساب موثق">
                  <ShieldCheck className="w-4 h-4 text-blue-500" data-testid="badge-verified-user" />
                </div>
              )}
            </Label>
            {isEditing ? (
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسمك"
                className="text-lg h-12 rounded-xl"
                data-testid="input-name"
              />
            ) : (
              <div className="text-xl p-3 bg-white dark:bg-gray-800 rounded-xl">
                {currentUser?.name || "غير محدد"}
              </div>
            )}
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-lg">
              <Phone className="w-5 h-5" />
              رقم الهاتف
            </Label>
            <div className="text-xl p-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-400">
              {currentUser?.phoneNumber || "غير محدد"}
            </div>
          </div>

          {/* Location Field */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5" />
              المنطقة
            </Label>
            {isEditing ? (
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="أدخل منطقتك"
                className="text-lg h-12 rounded-xl"
                data-testid="input-location"
              />
            ) : (
              <div className="text-xl p-3 bg-white dark:bg-gray-800 rounded-xl">
                {currentUser?.location || "غير محدد"}
              </div>
            )}
          </div>
        </div>

        {/* Verification Section */}
        {!isEditing && (
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Star className="w-5 h-5" />
                توثيق الحساب
              </CardTitle>
              <CardDescription>
                احصل على العلامة الزرقاء واستمتع بالمزايا الحصرية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentUser?.isVerified ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="font-medium">حسابك موثق ✨</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Benefits List */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">مزايا التوثيق:</h4>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>النجمة الزرقاء بجانب اسمك</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>أولوية في نتائج البحث</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>زيادة الثقة مع العملاء</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>دعم فني مخصص</span>
                      </li>
                    </ul>
                  </div>

                  {/* Current Request Status */}
                  {verificationRequests.length > 0 && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                        {verificationRequests[0].status === "pending" && (
                          <>
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">طلبك قيد المراجعة...</span>
                          </>
                        )}
                        {verificationRequests[0].status === "approved" && (
                          <>
                            <Check className="w-4 h-4" />
                            <span className="text-sm">تم قبول طلبك!</span>
                          </>
                        )}
                        {verificationRequests[0].status === "rejected" && (
                          <>
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">تم رفض الطلب</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Request Button */}
                  {verificationRequests.filter(r => r.status === "pending").length === 0 && (
                    <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full bg-blue-500 hover:bg-blue-600"
                          data-testid="button-request-verification"
                        >
                          <Star className="w-4 h-4 ml-2" />
                          طلب توثيق الحساب
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>طلب توثيق الحساب</DialogTitle>
                          <DialogDescription>
                            أخبرنا لماذا تستحق التوثيق واحصل على العلامة الزرقاء
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="verification-reason">سبب طلب التوثيق:</Label>
                            <Textarea
                              id="verification-reason"
                              placeholder="مثال: أنا صاحب متجر معروف في المنطقة أو لدي خبرة في التجارة..."
                              value={verificationReason}
                              onChange={(e) => setVerificationReason(e.target.value)}
                              className="mt-2"
                              data-testid="textarea-verification-reason"
                            />
                          </div>
                          <div className="flex gap-3">
                            <Button 
                              variant="outline" 
                              onClick={() => setShowVerificationDialog(false)}
                              className="flex-1"
                            >
                              إلغاء
                            </Button>
                            <Button 
                              onClick={() => submitVerificationMutation.mutate({ 
                                requestType: "user", 
                                reason: verificationReason 
                              })}
                              disabled={!verificationReason.trim() || submitVerificationMutation.isPending}
                              className="flex-1 bg-blue-500 hover:bg-blue-600"
                              data-testid="button-submit-verification"
                            >
                              {submitVerificationMutation.isPending ? "جاري الإرسال..." : "إرسال الطلب"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}


        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-3 pt-6">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex-1 h-12 text-lg rounded-xl"
              data-testid="button-cancel"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateProfileMutation.isPending}
              className="flex-1 h-12 text-lg rounded-xl bg-whatsapp-green hover:bg-green-600"
              data-testid="button-save"
            >
              {updateProfileMutation.isPending ? (
                "جاري الحفظ..."
              ) : (
                <>
                  <Save className="w-5 h-5 ml-2" />
                  حفظ
                </>
              )}
            </Button>
          </div>
        )}

        {/* Account Actions Section */}
        {!isEditing && (
          <div className="pt-8 border-t border-gray-200 dark:border-gray-700 space-y-4">
            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full h-12 text-lg rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              data-testid="button-logout"
            >
              <LogOut className="w-5 h-5 ml-2" />
              تسجيل الخروج
            </Button>
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full h-12 text-lg rounded-xl bg-red-500 hover:bg-red-600"
                  data-testid="button-delete-account"
                >
                  <Trash2 className="w-5 h-5 ml-2" />
                  حذف الحساب
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-red-600">حذف الحساب</DialogTitle>
                  <DialogDescription>
                    هل أنت متأكد من رغبتك في حذف حسابك نهائياً؟
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                      <div className="space-y-2 text-sm text-red-700 dark:text-red-400">
                        <p className="font-medium">تحذير هام:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• سيتم حذف جميع بياناتك نهائياً</li>
                          <li>• سيتم حذف متجرك وجميع منتجاتك</li>
                          <li>• سيتم حذف جميع محادثاتك ورسائلك</li>
                          <li>• لن تتمكن من استرداد هذه البيانات</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteDialog(false)}
                      className="flex-1"
                      data-testid="button-cancel-delete"
                    >
                      إلغاء
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => deleteAccountMutation.mutate()}
                      disabled={deleteAccountMutation.isPending}
                      className="flex-1 bg-red-500 hover:bg-red-600"
                      data-testid="button-confirm-delete"
                    >
                      {deleteAccountMutation.isPending ? "جاري الحذف..." : "حذف نهائياً"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}