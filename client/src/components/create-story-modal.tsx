import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Upload, Type, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";

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
  const [backgroundColor, setBackgroundColor] = useState("#075e54");
  const [textColor, setTextColor] = useState("#ffffff");
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  
  const queryClient = useQueryClient();

  const createStoryMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/stories", {
        content: content.trim() || null,
        imageUrl: imageUrl.trim() || null,
        backgroundColor,
        textColor,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      onClose();
      resetForm();
    },
  });

  const resetForm = () => {
    setContent("");
    setImageUrl("");
    setBackgroundColor("#075e54");
    setTextColor("#ffffff");
    setActiveTab('text');
  };

  const handleSubmit = () => {
    if (!content.trim() && !imageUrl.trim()) {
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
                  placeholder="اكتب حالتك هنا..."
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
              {/* Image URL */}
              <div className="space-y-2">
                <Label htmlFor="imageUrl">رابط الصورة</Label>
                <Input
                  id="imageUrl"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  data-testid="input-image-url"
                />
              </div>

              {/* Caption */}
              <div className="space-y-2">
                <Label htmlFor="caption">تعليق (اختياري)</Label>
                <Input
                  id="caption"
                  placeholder="اكتب تعليق..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  data-testid="input-image-caption"
                />
              </div>

              {/* Image Preview */}
              {imageUrl && (
                <div className="space-y-2">
                  <Label>معاينة الصورة</Label>
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
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button variant="outline" onClick={handleClose} data-testid="button-cancel">
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={(!content.trim() && !imageUrl.trim()) || createStoryMutation.isPending}
              className="bg-[var(--whatsapp-primary)] hover:bg-[var(--whatsapp-secondary)]"
              data-testid="button-create"
            >
              {createStoryMutation.isPending ? "جاري الإنشاء..." : "إنشاء"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}