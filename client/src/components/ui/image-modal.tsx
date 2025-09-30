import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Download, Share2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  currentIndex?: number;
  title?: string;
  showNavigation?: boolean;
  showActions?: boolean;
  sellerId?: string;
  onQuickContact?: (sellerId: string) => void;
}

export function ImageModal({
  isOpen,
  onClose,
  images,
  currentIndex = 0,
  title,
  showNavigation = true,
  showActions = true,
  sellerId,
  onQuickContact,
}: ImageModalProps) {
  const [activeIndex, setActiveIndex] = useState(currentIndex);

  // Sync activeIndex with currentIndex when modal opens or currentIndex changes
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(currentIndex);
    }
  }, [isOpen, currentIndex]);

  const nextImage = () => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = images[activeIndex];
    link.download = `image-${activeIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareImage = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'صورة منتج',
          url: images[activeIndex],
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(images[activeIndex]);
        // You might want to show a toast here
      } catch (error) {
        console.log('Error copying to clipboard:', error);
      }
    }
  };

  if (!images || images.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl w-full h-full max-h-[90vh] p-0 bg-black/95 border-none"
        dir="rtl"
      >
        <DialogHeader className="absolute top-4 right-4 z-10">
          <DialogTitle className="sr-only">
            {title || `صورة ${activeIndex + 1} من ${images.length}`}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full"
            data-testid="button-close-modal"
          >
            <X className="h-6 w-6" />
          </Button>
        </DialogHeader>

        {/* Main Image */}
        <div className="relative flex items-center justify-center h-full">
          <img
            src={images[activeIndex]}
            alt={title || `صورة ${activeIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            data-testid={`image-modal-${activeIndex}`}
          />

          {/* Navigation Arrows */}
          {showNavigation && images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 rounded-full"
                data-testid="button-prev-image"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 rounded-full"
                data-testid="button-next-image"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-4">
          <div className="flex items-center justify-between">
            {/* Image Counter */}
            <div className="text-white text-sm">
              {images.length > 1 && (
                <span>
                  {activeIndex + 1} من {images.length}
                </span>
              )}
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex items-center gap-2">
                {sellerId && onQuickContact && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      onQuickContact(sellerId);
                      onClose();
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    data-testid="button-quick-contact"
                  >
                    <MessageCircle className="h-4 w-4 ml-2" />
                    توصل سريع
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shareImage}
                  className="text-white hover:bg-white/20"
                  data-testid="button-share-image"
                >
                  <Share2 className="h-4 w-4 ml-2" />
                  مشاركة
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadImage}
                  className="text-white hover:bg-white/20"
                  data-testid="button-download-image"
                >
                  <Download className="h-4 w-4 ml-2" />
                  تحميل
                </Button>
              </div>
            )}
          </div>

          {/* Thumbnail Navigation */}
          {images.length > 1 && images.length <= 10 && (
            <div className="flex justify-center gap-2 mt-4">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200",
                    activeIndex === index 
                      ? "border-white" 
                      : "border-transparent opacity-70 hover:opacity-100"
                  )}
                  data-testid={`thumbnail-${index}`}
                >
                  <img
                    src={image}
                    alt={`صورة مصغرة ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ImageModal;