import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TikTokStoriesViewer } from "@/components/tiktok-stories-viewer";
import { CreateStoryModal } from "@/components/create-story-modal";
import { Story, User } from "@shared/schema";
import { useLocation } from "wouter";

interface StoryWithUser extends Story {
  user: User;
}

export default function Status() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [, setLocation] = useLocation();
  
  // جلب الحالات من قاعدة البيانات
  const { data: stories = [], isLoading } = useQuery<StoryWithUser[]>({
    queryKey: ["/api/stories"],
  });

  const handleClose = () => {
    setLocation("/chat");
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-xl">جاري تحميل الحالات...</div>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center z-50">
        <div className="text-center text-white p-8">
          <h2 className="text-3xl font-bold mb-4">لا توجد حالات متاحة</h2>
          <p className="text-lg text-gray-300 mb-8">كن أول من يشارك حالة جديدة!</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
          >
            إنشاء حالة جديدة
          </button>
          <button
            onClick={handleClose}
            className="block mx-auto mt-4 text-gray-400 hover:text-white transition-colors"
          >
            العودة للدردشة
          </button>
        </div>

        {/* نافذة إنشاء حالة جديدة */}
        <CreateStoryModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <>
      <TikTokStoriesViewer onClose={handleClose} />
      
      {/* نافذة إنشاء حالة جديدة */}
      <CreateStoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}