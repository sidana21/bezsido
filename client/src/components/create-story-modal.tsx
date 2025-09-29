import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Upload, Type, Palette, Camera, ImageIcon, Play, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const backgroundColors = [
  "#075e54", "#25D366", "#128C7E", "#34B7F1", "#DCF8C6",
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FECA57"
];

const textColors = [
  "#ffffff", "#000000", "#333333", "#666666", "#999999"
];

export function CreateStoryModal({ isOpen, onClose }: CreateStoryModalProps) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#075e54");
  const [textColor, setTextColor] = useState("#ffffff");
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
        throw new Error("فشل في رفع الملف");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.fileType === 'video') {
        setVideoUrl(data.mediaUrl);
        setImageUrl("");
      } else {
        setImageUrl(data.mediaUrl);
        setVideoUrl("");
      }
      setSelectedFile(null);
      setIsUploading(false);
      toast({
        title: "تم رفع الملف",
        description: `تم رفع ${data.fileType === 'video' ? 'الفيديو' : 'الصورة'} بنجاح`,
      });
    },
    onError: (error: any) => {
      setIsUploading(false);
      toast({
        title: "خطأ",
        description: error.message || "فشل في رفع الملف",
        variant: "destructive",
      });
    },
  });

  const createStoryMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim() || null,
          imageUrl: imageUrl.trim() || null,
          videoUrl: videoUrl.trim() || null,
          backgroundColor,
          textColor,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      toast({
        title: "تم النشر",
        description: "تم نشر حالتك بنجاح",
      });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في نشر الحالة",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsUploading(true);
      uploadImageMutation.mutate(file);
    }
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const resetForm = () => {
    setContent("");
    setImageUrl("");
    setVideoUrl("");
    setSelectedFile(null);
    setIsUploading(false);
    setBackgroundColor("#075e54");
    setTextColor("#ffffff");
    setActiveTab('text');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    if (!content.trim() && !imageUrl.trim() && !videoUrl.trim()) {
      return;
    }
    createStoryMutation.mutate();
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" data-testid="create-story-modal">
        <DialogHeader>
          <DialogTitle>إنشاء حالة جديدة</DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">انشر منتجك واعرضه لجميع متابعيك</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tab Selection */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <Button
              variant={activeTab === 'text' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('text')}
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--whatsapp-primary)]"
              data-testid="tab-text"
            >
              <Type className="w-4 h-4 ml-2" />
              نص
            </Button>
            <Button
              variant={activeTab === 'image' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('image')}
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--whatsapp-primary)]"
              data-testid="tab-image"
            >
              <Upload className="w-4 h-4 ml-2" />
              صورة
            </Button>
          </div>

          {activeTab === 'text' ? (
            <>
              {/* Text Content */}
              <div className="space-y-2">
                <Label htmlFor="content">المحتوى</Label>
                <Textarea
                  id="content"
                  placeholder="انشر منتجك هنا... اكتب وصف منتجك أو خدمتك"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[100px]"
                  data-testid="input-story-content"
                />
              </div>

              {/* Background Color */}
              <div className="space-y-2">
                <Label>لون الخلفية</Label>
                <div className="flex flex-wrap gap-2">
                  {backgroundColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setBackgroundColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        backgroundColor === color ? 'border-gray-800 dark:border-white' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      data-testid={`color-bg-${color}`}
                    />
                  ))}
                </div>
              </div>

              {/* Text Color */}
              <div className="space-y-2">
                <Label>لون النص</Label>
                <div className="flex flex-wrap gap-2">
                  {textColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setTextColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        textColor === color ? 'border-gray-800 dark:border-white' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      data-testid={`color-text-${color}`}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>معاينة</Label>
                <div 
                  className="w-full h-40 rounded-lg flex items-center justify-center p-4"
                  style={{ backgroundColor }}
                >
                  <p 
                    className="text-center break-words"
                    style={{ color: textColor }}
                  >
                    {content || "معاينة الحالة"}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* File Upload Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>إضافة صورة أو فيديو</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCameraCapture}
                      className="h-24 flex-col space-y-2"
                      disabled={isUploading}
                      data-testid="button-camera-upload"
                    >
                      <Camera className="w-8 h-8" />
                      <span className="text-sm">كاميرا</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCameraCapture}
                      className="h-24 flex-col space-y-2"
                      disabled={isUploading}
                      data-testid="button-gallery-upload"
                    >
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-sm">معرض الصور</span>
                    </Button>
                  </div>
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="input-file-upload"
                  />
                  
                  {isUploading && (
                    <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                      جاري رفع الملف...
                    </div>
                  )}
                </div>

                {/* OR Divider */}
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 px-2">أو</span>
                  <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                </div>

                {/* Image URL */}
                <div className="space-y-2">
                  <Label htmlFor="mediaUrl">رابط الصورة أو الفيديو</Label>
                  <Input
                    id="mediaUrl"
                    placeholder="https://example.com/media.jpg"
                    value={imageUrl || videoUrl}
                    onChange={(e) => {
                      const url = e.target.value;
                      if (url.includes('.mp4') || url.includes('.mov') || url.includes('.webm') || url.includes('video')) {
                        setVideoUrl(url);
                        setImageUrl("");
                      } else {
                        setImageUrl(url);
                        setVideoUrl("");
                      }
                    }}
                    disabled={isUploading}
                    data-testid="input-media-url"
                  />
                </div>

                {/* Caption */}
                <div className="space-y-2">
                  <Label htmlFor="caption">تعليق (اختياري)</Label>
                  <Input
                    id="caption"
                    placeholder="انشر منتجك... اكتب وصف المنتج"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    data-testid="input-image-caption"
                  />
                </div>

                {/* Media Preview محسّن */}
                {(imageUrl || videoUrl) && (
                  <div className="space-y-2">
                    <Label>{videoUrl ? 'معاينة الفيديو' : 'معاينة الصورة'}</Label>
                    {videoUrl ? (
                      <div className="relative bg-black rounded-2xl overflow-hidden" style={{ aspectRatio: '9/16', maxHeight: '300px' }}>
                        <video
                          src={videoUrl}
                          className="w-full h-full object-cover rounded-2xl"
                          controls={false}
                          muted
                          autoPlay
                          loop
                          playsInline
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        
                        {/* طبقة تدرج لونية */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-2xl" />
                        
                        {/* أيقونة تشغيل أنيقة */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30">
                            <Play className="w-8 h-8 text-white ml-1" />
                          </div>
                        </div>
                        
                        {/* مؤشر الفيديو */}
                        <div className="absolute top-3 left-3 bg-black/60 rounded-full px-2 py-1 backdrop-blur-sm">
                          <span className="text-white text-xs font-medium">فيديو</span>
                        </div>
                        
                        {/* أزرار التحكم */}
                        <div className="absolute top-3 right-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="bg-black/40 hover:bg-black/60 text-white rounded-full w-8 h-8 backdrop-blur-sm"
                          >
                            <Volume2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-40 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                        <img 
                          src={imageUrl} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button variant="outline" onClick={handleClose} data-testid="button-cancel">
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={(!content.trim() && !imageUrl.trim() && !videoUrl.trim()) || createStoryMutation.isPending || isUploading}
              className="bg-[var(--whatsapp-primary)] hover:bg-[var(--whatsapp-secondary)]"
              data-testid="button-create"
            >
              {createStoryMutation.isPending ? "جاري الإنشاء..." : isUploading ? "جاري رفع الملف..." : "إنشاء"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}