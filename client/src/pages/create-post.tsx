import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Camera, Video, Type, MapPin, Tag, Users,
  ShoppingBag, DollarSign, Package, Sparkles, Send,
  Image as ImageIcon, X, Plus, Globe, Eye, EyeOff,
  Star, Heart, MessageCircle, Share, Bookmark
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { InsertProduct } from "@shared/schema";

interface CreatePostData {
  content: string;
  images?: string[];
  videoUrl?: string;
  location?: string;
  tags?: string[];
  isBusinessPost: boolean;
  productInfo?: {
    name: string;
    price: number;
    category: string;
    description: string;
    inStock: boolean;
  };
  visibility: 'public' | 'followers' | 'private';
  allowComments: boolean;
  allowSharing: boolean;
}

export default function CreatePost() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // بيانات المنشور
  const [postData, setPostData] = useState<CreatePostData>({
    content: "",
    images: [],
    location: "",
    tags: [],
    isBusinessPost: false,
    visibility: 'public',
    allowComments: true,
    allowSharing: true
  });

  const [currentTag, setCurrentTag] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("content");

  // إنشاء المنشور
  const createPostMutation = useMutation({
    mutationFn: async (data: CreatePostData) => {
      const postPayload = {
        content: data.content,
        images: data.images,
        videoUrl: data.videoUrl,
        location: data.location,
        tags: data.tags,
        isBusinessPost: data.isBusinessPost,
        visibility: data.visibility,
        allowComments: data.allowComments,
        allowSharing: data.allowSharing
      };

      const response = await apiRequest("/api/posts", {
        method: "POST",
        body: JSON.stringify(postPayload),
      });

      // إذا كان منشور تجاري وفيه معلومات منتج، إنشاء منتج منفصل
      if (data.isBusinessPost && data.productInfo) {
        const productPayload = {
          name: data.productInfo.name,
          originalPrice: data.productInfo.price.toString(),
          categoryId: data.productInfo.category,
          description: data.productInfo.description,
          images: data.images,
          inStock: data.productInfo.inStock,
          relatedPostId: response.id // ربط المنتج بالمنشور
        };

        await apiRequest("/api/products", {
          method: "POST",
          body: JSON.stringify(productPayload),
        });
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "تم النشر بنجاح! 🎉",
        description: postData.isBusinessPost 
          ? "تم نشر منشورك التجاري وإنشاء المنتج"
          : "تم نشر منشورك بنجاح",
      });
      navigate("/social-feed");
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في النشر",
        description: error.message || "حدث خطأ أثناء نشر المحتوى",
        variant: "destructive",
      });
    },
  });

  // رفع الصور
  const handleImageUpload = async (files: FileList) => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) throw new Error('فشل في رفع الصورة');
        
        const data = await response.json();
        return data.url;
      });

      const urls = await Promise.all(uploadPromises);
      setPostData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...urls]
      }));
    } catch (error) {
      toast({
        title: "خطأ في رفع الصور",
        description: "فشل في رفع بعض الصور",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // إضافة تاج
  const addTag = () => {
    if (currentTag.trim() && !postData.tags?.includes(currentTag.trim())) {
      setPostData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), currentTag.trim()]
      }));
      setCurrentTag("");
    }
  };

  // حذف تاج
  const removeTag = (tagToRemove: string) => {
    setPostData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove)
    }));
  };

  // حذف صورة
  const removeImage = (imageToRemove: string) => {
    setPostData(prev => ({
      ...prev,
      images: prev.images?.filter(img => img !== imageToRemove)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/social-feed")}
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  إنشاء منشور
                </h1>
                <p className="text-sm text-gray-500">
                  شارك محتواك مع العالم
                </p>
              </div>
            </div>

            <Button
              onClick={() => createPostMutation.mutate(postData)}
              disabled={!postData.content.trim() || createPostMutation.isPending}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              data-testid="button-publish"
            >
              {createPostMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                  جارِ النشر...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 ml-2" />
                  نشر
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="content" className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                المحتوى
              </TabsTrigger>
              <TabsTrigger value="media" className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                الوسائط
              </TabsTrigger>
              <TabsTrigger value="business" className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                تجاري
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                الإعدادات
              </TabsTrigger>
            </TabsList>

            {/* محتوى المنشور */}
            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="w-5 h-5 text-blue-500" />
                    اكتب منشورك
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Textarea
                      placeholder="ما الذي تفكر فيه؟ شارك أفكارك، تجاربك، أو أي شيء مميز..."
                      value={postData.content}
                      onChange={(e) => setPostData(prev => ({ ...prev, content: e.target.value }))}
                      className="min-h-[120px] text-lg border-2 focus:border-blue-400"
                      data-testid="input-content"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      {postData.content.length}/2000 حرف
                    </p>
                  </div>

                  {/* الموقع */}
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4" />
                      الموقع (اختياري)
                    </Label>
                    <Input
                      placeholder="أين أنت؟"
                      value={postData.location}
                      onChange={(e) => setPostData(prev => ({ ...prev, location: e.target.value }))}
                      data-testid="input-location"
                    />
                  </div>

                  {/* التاجات */}
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Tag className="w-4 h-4" />
                      التاجات
                    </Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="أضف تاج..."
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        className="flex-1"
                        data-testid="input-tag"
                      />
                      <Button onClick={addTag} size="icon" variant="outline">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {postData.tags && postData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {postData.tags.map((tag, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="bg-blue-100 text-blue-700 hover:bg-blue-200"
                          >
                            #{tag}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTag(tag)}
                              className="w-4 h-4 p-0 ml-1 hover:bg-transparent"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* الوسائط */}
            <TabsContent value="media" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-purple-500" />
                    الصور والفيديو
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* رفع الصور */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                      className="hidden"
                    />
                    
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="w-full h-24 border-2 border-dashed hover:border-blue-400"
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-2" />
                          جارِ رفع الصور...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 text-gray-400 ml-2" />
                          اضغط لاختيار الصور
                        </>
                      )}
                    </Button>
                  </div>

                  {/* معاينة الصور */}
                  {postData.images && postData.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {postData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`صورة ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <Button
                            onClick={() => removeImage(image)}
                            size="icon"
                            variant="destructive"
                            className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* رابط الفيديو */}
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Video className="w-4 h-4" />
                      رابط الفيديو (اختياري)
                    </Label>
                    <Input
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={postData.videoUrl || ""}
                      onChange={(e) => setPostData(prev => ({ ...prev, videoUrl: e.target.value }))}
                      data-testid="input-video"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* الميزات التجارية */}
            <TabsContent value="business" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-green-500" />
                    المنشور التجاري
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* تفعيل المنشور التجاري */}
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div>
                      <h3 className="font-semibold text-green-800 dark:text-green-200">
                        منشور تجاري
                      </h3>
                      <p className="text-sm text-green-600 dark:text-green-300">
                        حول منشورك إلى منتج قابل للشراء (اختياري)
                      </p>
                    </div>
                    <Switch
                      checked={postData.isBusinessPost}
                      onCheckedChange={(checked) => 
                        setPostData(prev => ({ ...prev, isBusinessPost: checked }))
                      }
                      data-testid="switch-business"
                    />
                  </div>

                  {/* معلومات المنتج */}
                  {postData.isBusinessPost && (
                    <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        معلومات المنتج
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>اسم المنتج</Label>
                          <Input
                            placeholder="اسم المنتج"
                            value={postData.productInfo?.name || ""}
                            onChange={(e) => setPostData(prev => ({
                              ...prev,
                              productInfo: { ...prev.productInfo!, name: e.target.value }
                            }))}
                            data-testid="input-product-name"
                          />
                        </div>
                        
                        <div>
                          <Label className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            السعر
                          </Label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={postData.productInfo?.price || ""}
                            onChange={(e) => setPostData(prev => ({
                              ...prev,
                              productInfo: { ...prev.productInfo!, price: parseFloat(e.target.value) || 0 }
                            }))}
                            data-testid="input-product-price"
                          />
                        </div>
                        
                        <div>
                          <Label>الفئة</Label>
                          <Input
                            placeholder="فئة المنتج"
                            value={postData.productInfo?.category || ""}
                            onChange={(e) => setPostData(prev => ({
                              ...prev,
                              productInfo: { ...prev.productInfo!, category: e.target.value }
                            }))}
                            data-testid="input-product-category"
                          />
                        </div>
                        
                        <div>
                          <Label>حالة المخزون</Label>
                          <div className="flex items-center gap-2 mt-2">
                            <Switch
                              checked={postData.productInfo?.inStock ?? true}
                              onCheckedChange={(checked) => setPostData(prev => ({
                                ...prev,
                                productInfo: { ...prev.productInfo!, inStock: checked }
                              }))}
                            />
                            <span className="text-sm">
                              {postData.productInfo?.inStock ? "متوفر" : "غير متوفر"}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label>وصف المنتج</Label>
                        <Textarea
                          placeholder="اكتب وصفاً مفصلاً للمنتج..."
                          value={postData.productInfo?.description || ""}
                          onChange={(e) => setPostData(prev => ({
                            ...prev,
                            productInfo: { ...prev.productInfo!, description: e.target.value }
                          }))}
                          data-testid="input-product-description"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* إعدادات النشر */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-500" />
                    إعدادات النشر
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* مستوى الخصوصية */}
                  <div>
                    <Label className="flex items-center gap-2 mb-3">
                      {postData.visibility === 'public' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      مستوى الخصوصية
                    </Label>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { value: 'public', label: 'عام', desc: 'يمكن لأي شخص رؤية المنشور', icon: Globe },
                        { value: 'followers', label: 'المتابعين فقط', desc: 'المتابعين فقط يمكنهم رؤيته', icon: Users },
                        { value: 'private', label: 'خاص', desc: 'أنت فقط يمكنك رؤيته', icon: EyeOff }
                      ].map((option) => {
                        const Icon = option.icon;
                        return (
                          <div
                            key={option.value}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              postData.visibility === option.value
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setPostData(prev => ({ ...prev, visibility: option.value as any }))}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-5 h-5 text-blue-500" />
                              <div>
                                <div className="font-medium">{option.label}</div>
                                <div className="text-sm text-gray-500">{option.desc}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* خيارات التفاعل */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">خيارات التفاعل</h4>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-3">
                        <MessageCircle className="w-5 h-5 text-blue-500" />
                        <div>
                          <div className="font-medium">السماح بالتعليقات</div>
                          <div className="text-sm text-gray-500">يمكن للمستخدمين التعليق</div>
                        </div>
                      </div>
                      <Switch
                        checked={postData.allowComments}
                        onCheckedChange={(checked) => setPostData(prev => ({ ...prev, allowComments: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-3">
                        <Share className="w-5 h-5 text-green-500" />
                        <div>
                          <div className="font-medium">السماح بالمشاركة</div>
                          <div className="text-sm text-gray-500">يمكن للمستخدمين مشاركة المنشور</div>
                        </div>
                      </div>
                      <Switch
                        checked={postData.allowSharing}
                        onCheckedChange={(checked) => setPostData(prev => ({ ...prev, allowSharing: checked }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* معاينة المنشور */}
          {postData.content.trim() && (
            <Card className="mt-6 border-2 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Eye className="w-5 h-5" />
                  معاينة المنشور
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      أ
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">أنت</span>
                        {postData.isBusinessPost && (
                          <Badge className="bg-green-100 text-green-700">تجاري</Badge>
                        )}
                        <span className="text-sm text-gray-500">الآن</span>
                      </div>
                      
                      <p className="text-gray-800 dark:text-gray-200 mb-3 whitespace-pre-wrap">
                        {postData.content}
                      </p>
                      
                      {postData.images && postData.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {postData.images.slice(0, 4).map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt=""
                              className="w-full h-32 object-cover rounded"
                            />
                          ))}
                        </div>
                      )}
                      
                      {postData.location && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                          <MapPin className="w-4 h-4" />
                          {postData.location}
                        </div>
                      )}
                      
                      {postData.tags && postData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {postData.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-6 text-gray-500 text-sm pt-3 border-t">
                        <button className="flex items-center gap-1 hover:text-red-500">
                          <Heart className="w-4 h-4" />
                          إعجاب
                        </button>
                        <button className="flex items-center gap-1 hover:text-blue-500">
                          <MessageCircle className="w-4 h-4" />
                          تعليق
                        </button>
                        <button className="flex items-center gap-1 hover:text-green-500">
                          <Share className="w-4 h-4" />
                          مشاركة
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}