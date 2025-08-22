import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Camera, Edit3, Phone, MapPin, User as UserIcon, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading } = useQuery<User>({
    queryKey: ["/api/user/current"],
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
      return apiRequest("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/current"] });
      setIsEditing(false);
      toast({
        title: "تم التحديث",
        description: "تم تحديث ملفك الشخصي بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث الملف الشخصي",
        variant: "destructive",
      });
    },
  });

  const uploadAvatarMutation = useMutation({
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

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAvatarMutation.mutate(file);
    }
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
              size="icon"
              className="text-white hover:bg-green-600 w-12 h-12 rounded-full"
              data-testid="button-edit"
            >
              <Edit3 className="w-6 h-6" />
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
            
            {isEditing && (
              <div className="absolute bottom-0 right-0">
                <label htmlFor="avatar-upload">
                  <Button
                    size="sm"
                    className="w-10 h-10 rounded-full bg-whatsapp-green hover:bg-green-600"
                    disabled={uploadAvatarMutation.isPending}
                    data-testid="button-avatar-upload"
                  >
                    <Camera className="w-5 h-5" />
                  </Button>
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
            )}
          </div>
          
          {uploadAvatarMutation.isPending && (
            <div className="text-sm text-gray-600">جاري رفع الصورة...</div>
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
      </div>
    </div>
  );
}