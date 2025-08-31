import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Plus, Play, Pause, Volume2, VolumeX, MessageCircle, Heart, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Story {
  id: string;
  userId: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  backgroundColor?: string;
  createdAt: string;
}

// حالات تجريبية آمنة
const sampleStories: Story[] = [
  {
    id: "sample-1",
    userId: "user-1",
    content: "مرحباً بكم في الحالات! 🌟",
    backgroundColor: "#075e54",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sample-2", 
    userId: "user-2",
    content: "يوم جميل اليوم! ☀️",
    backgroundColor: "#128c7e",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sample-3",
    userId: "user-3", 
    content: "أتمنى لكم يوماً سعيداً! 😊",
    backgroundColor: "#25d366",
    createdAt: new Date().toISOString(),
  }
];

export default function Status() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // جلب الحالات من قاعدة البيانات
  const { data: stories = [], isLoading } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
  });

  // استخدام الحالات التجريبية إذا لم توجد حالات فعلية
  const displayStories = stories.length > 0 ? stories : sampleStories;

  const nextStory = () => {
    setCurrentIndex((prev) => (prev + 1) % displayStories.length);
  };

  const prevStory = () => {
    setCurrentIndex((prev) => (prev - 1 + displayStories.length) % displayStories.length);
  };

  const formatTime = (dateString: string) => {
    const now = new Date();
    const storyDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - storyDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} دقيقة`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ساعة`;
    return `${Math.floor(diffInMinutes / 1440)} يوم`;
  };

  // التنقل التلقائي بين الحالات
  useEffect(() => {
    const timer = setInterval(() => {
      nextStory();
    }, 5000); // 5 ثواني لكل حالة

    return () => clearInterval(timer);
  }, [currentIndex]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">تحميل الحالات...</div>
      </div>
    );
  }

  const currentStory = displayStories[currentIndex];

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20"
          onClick={() => window.history.back()}
        >
          <ArrowRight className="w-5 h-5" />
        </Button>
        
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <div className="text-white text-sm">
            {currentIndex + 1} من {displayStories.length}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* شريط التقدم */}
      <div className="absolute top-16 left-4 right-4 z-10">
        <div className="flex space-x-1 rtl:space-x-reverse">
          {displayStories.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className={`h-full bg-white transition-all duration-300 ${
                  index === currentIndex ? 'w-full' : index < currentIndex ? 'w-full' : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* محتوى الحالة */}
      <div
        className="flex-1 flex items-center justify-center relative"
        style={{ backgroundColor: currentStory?.backgroundColor || '#075e54' }}
        onClick={nextStory}
      >
        {/* النص */}
        {currentStory?.content && (
          <div className="text-center p-8 max-w-md">
            <h1 className="text-white text-2xl font-bold mb-4 leading-relaxed">
              {currentStory.content}
            </h1>
            <div className="text-white/80 text-sm">
              {formatTime(currentStory.createdAt)} مضت
            </div>
          </div>
        )}

        {/* الصورة */}
        {currentStory?.imageUrl && (
          <img
            src={currentStory.imageUrl}
            alt={currentStory.content || ''}
            className="w-full h-full object-cover"
          />
        )}

        {/* منطقة التحكم في التنقل */}
        <div className="absolute inset-0 flex">
          <div
            className="flex-1 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              prevStory();
            }}
          />
          <div
            className="flex-1 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              nextStory();
            }}
          />
        </div>
      </div>

      {/* أزرار التفاعل السفلية */}
      <div className="absolute bottom-6 left-4 right-4 z-10">
        <div className="flex items-center justify-center space-x-6 rtl:space-x-reverse">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 p-3 rounded-full"
          >
            <Heart className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 p-3 rounded-full"
          >
            <MessageCircle className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 p-3 rounded-full"
          >
            <Share className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* نافذة إنشاء حالة جديدة */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-xl font-bold mb-4">إنشاء حالة جديدة</h2>
                <p className="text-gray-600 mb-4">
                  ميزة إنشاء الحالات ستكون متاحة قريباً!
                </p>
                <Button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-full"
                >
                  إغلاق
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}