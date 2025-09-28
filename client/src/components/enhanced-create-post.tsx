import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Camera, Video, Music, Tag, MapPin, Smile, X, Plus,
  Upload, Image as ImageIcon, Play, Volume2, VolumeX
} from "lucide-react";
import type { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface EnhancedCreatePostProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User;
}

interface MediaFile {
  file: File;
  url: string;
  type: 'image' | 'video';
  id: string;
}

export function EnhancedCreatePost({ isOpen, onClose, currentUser }: EnhancedCreatePostProps) {
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [location, setLocation] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [currentVideoPlaying, setCurrentVideoPlaying] = useState<string | null>(null);
  const [videosMuted, setVideosMuted] = useState<Record<string, boolean>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // إنشاء منشور جديد
  const createPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      return apiRequest("/api/posts", {
        method: "POST",
        body: JSON.stringify(postData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-feed"] });
      handleClose();
      toast({
        title: "تم النشر بنجاح! 🎉",
        description: "تم نشر منشورك بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في النشر",
        description: error.message || "حدث خطأ أثناء نشر المحتوى",
        variant: "destructive",
      });
    },
  });

  // رفع الملفات
  const uploadFiles = async (files: MediaFile[]): Promise<{ urls: string[], failed: string[] }> => {
    const uploadedUrls: string[] = [];
    const failedFiles: string[] = [];
    setIsUploading(true);
    
    const token = localStorage.getItem("auth_token");
    if (!token) {
      toast({
        title: "خطأ في المصادقة",
        description: "يرجى تسجيل الدخول أولاً",
        variant: "destructive",
      });
      setIsUploading(false);
      return { urls: [], failed: files.map(f => f.file.name) };
    }
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('media', file.file);
      
      try {
        setUploadProgress(((i + 1) / files.length) * 100);
        
        const response = await fetch('/api/upload/media', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'فشل في رفع الملف' }));
          throw new Error(errorData.message || 'فشل في رفع الملف');
        }
        
        const result = await response.json();
        if (result.mediaUrl) {
          uploadedUrls.push(result.mediaUrl);
        } else {
          throw new Error('لم يتم إرجاع رابط الملف من الخادم');
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        failedFiles.push(file.file.name);
        toast({
          title: "خطأ في رفع الملف",
          description: `فشل في رفع ${file.file.name}`,
          variant: "destructive",
        });
      }
    }
    
    setIsUploading(false);
    setUploadProgress(0);
    return { urls: uploadedUrls, failed: failedFiles };
  };

  const handleFileSelect = (files: FileList | null, type: 'image' | 'video') => {
    if (!files) return;
    
    const newFiles: MediaFile[] = [];
    Array.from(files).forEach((file) => {
      if (mediaFiles.length + newFiles.length >= 10) {
        toast({
          title: "تجاوزت الحد المسموح",
          description: "يمكنك رفع 10 ملفات كحد أقصى",
          variant: "destructive",
        });
        return;
      }
      
      const url = URL.createObjectURL(file);
      newFiles.push({
        file,
        url,
        type,
        id: Math.random().toString(36).substr(2, 9)
      });
    });
    
    setMediaFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setMediaFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.url);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#([a-zA-Z0-9_\u0621-\u064A]+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.slice(1)) : [];
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    const extractedHashtags = extractHashtags(value);
    setHashtags(extractedHashtags);
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) {
      toast({
        title: "محتوى مطلوب",
        description: "يرجى إضافة نص أو صور/فيديو للمنشور",
        variant: "destructive",
      });
      return;
    }

    try {
      let imageUrls: string[] = [];
      let videoUrl: string | null = null;

      if (mediaFiles.length > 0) {
        const uploadedUrls = await uploadFiles(mediaFiles);
        
        // فصل الصور عن الفيديوهات
        mediaFiles.forEach((file, index) => {
          if (file.type === 'image') {
            imageUrls.push(uploadedUrls[index]);
          } else if (file.type === 'video' && !videoUrl) {
            videoUrl = uploadedUrls[index];
          }
        });
      }

      const postData = {
        content: content.trim(),
        images: imageUrls,
        videoUrl,
        hashtags,
        locationInfo: location ? { name: location } : undefined,
        postType: 'regular',
        visibility: 'public',
        allowComments: true,
        allowShares: true,
      };

      await createPostMutation.mutateAsync(postData);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleClose = () => {
    setContent("");
    setMediaFiles([]);
    setLocation("");
    setHashtags([]);
    setUploadProgress(0);
    setIsUploading(false);
    setCurrentVideoPlaying(null);
    setVideosMuted({});
    onClose();
  };

  const toggleVideoPlay = (videoId: string) => {
    if (currentVideoPlaying === videoId) {
      setCurrentVideoPlaying(null);
    } else {
      setCurrentVideoPlaying(videoId);
    }
  };

  const toggleVideoMute = (videoId: string) => {
    setVideosMuted(prev => ({
      ...prev,
      [videoId]: !prev[videoId]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-center font-semibold">إنشاء منشور جديد</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 p-1">
          {/* معلومات المستخدم */}
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={currentUser?.avatar || undefined} />
              <AvatarFallback className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                {currentUser?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {currentUser?.name}
              </span>
              <p className="text-sm text-gray-500">منشور عام</p>
            </div>
          </div>

          {/* كتابة المحتوى */}
          <div className="space-y-3">
            <textarea
              placeholder="ماذا تريد أن تشارك؟ استخدم # للهاشتاغات"
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full h-32 p-3 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-500"
              data-testid="textarea-post-content"
            />

            {/* الهاشتاغات المستخرجة */}
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* الموقع */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <Input
              placeholder="أضف موقعاً"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="border-none bg-gray-50 dark:bg-gray-800 focus-visible:ring-1"
            />
          </div>

          {/* معاينة الملفات المرفوعة */}
          {mediaFiles.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {mediaFiles.map((file) => (
                <div key={file.id} className="relative group aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  {file.type === 'image' ? (
                    <img
                      src={file.url}
                      alt="معاينة"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      <video
                        src={file.url}
                        className="w-full h-full object-cover"
                        muted={videosMuted[file.id] !== false}
                        autoPlay={currentVideoPlaying === file.id}
                        loop
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full"
                          onClick={() => toggleVideoPlay(file.id)}
                        >
                          {currentVideoPlaying === file.id ? (
                            <Video className="w-6 h-6" />
                          ) : (
                            <Play className="w-6 h-6" />
                          )}
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute bottom-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full"
                        onClick={() => toggleVideoMute(file.id)}
                      >
                        {videosMuted[file.id] ? (
                          <VolumeX className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* شريط التقدم للرفع */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>جارِ رفع الملفات...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </div>

        {/* أزرار الأدوات والنشر */}
        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files, 'image')}
                className="hidden"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                data-testid="button-add-images"
              >
                <Camera className="w-5 h-5" />
              </Button>

              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={(e) => handleFileSelect(e.target.files, 'video')}
                className="hidden"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => videoInputRef.current?.click()}
                className="text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                data-testid="button-add-video"
              >
                <Video className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
              >
                <Smile className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Tag className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {mediaFiles.length}/10 ملف
              </span>
              <Button
                onClick={handleSubmit}
                disabled={(!content.trim() && mediaFiles.length === 0) || createPostMutation.isPending || isUploading}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6"
                data-testid="button-publish-post"
              >
                {createPostMutation.isPending || isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                    {isUploading ? 'جارِ الرفع...' : 'جارِ النشر...'}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 ml-2" />
                    نشر
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}