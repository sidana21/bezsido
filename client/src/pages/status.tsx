import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StoriesRing } from "@/components/stories-ring";
import { StoryViewer } from "@/components/story-viewer";
import { CreateStoryModal } from "@/components/create-story-modal";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Camera, Edit } from "lucide-react";
import { Link } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Story, User } from "@shared/schema";

export default function Status() {
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: stories = [], isLoading } = useQuery<(Story & { user: User })[]>({
    queryKey: ["/api/stories"],
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user/current"],
  });

  const handleStorySelect = (index: number) => {
    setSelectedStoryIndex(index);
  };

  const handleCloseViewer = () => {
    setSelectedStoryIndex(null);
  };

  const handleNextStory = () => {
    if (selectedStoryIndex !== null && selectedStoryIndex < stories.length - 1) {
      setSelectedStoryIndex(selectedStoryIndex + 1);
    } else {
      handleCloseViewer();
    }
  };

  const handlePrevStory = () => {
    if (selectedStoryIndex !== null && selectedStoryIndex > 0) {
      setSelectedStoryIndex(selectedStoryIndex - 1);
    }
  };

  if (selectedStoryIndex !== null && stories[selectedStoryIndex]) {
    return (
      <StoryViewer
        storyId={stories[selectedStoryIndex].id}
        onClose={handleCloseViewer}
      />
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-900 pb-16 sm:pb-20">
      {/* Header */}
      <div className="bg-whatsapp-green text-white p-3 sm:p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-green-600"
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">الحالات</h1>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            size="icon"
            className="bg-green-600 hover:bg-green-700 text-white"
            data-testid="button-create-story"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-3 sm:p-4">
        {/* Promote banner */}
        <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="text-center">
            <h2 className="text-lg font-bold mb-2">انشر منتجك 📱</h2>
            <p className="text-sm opacity-90">استخدم الحالات لعرض منتجاتك وخدماتك للمستخدمين في منطقتك</p>
          </div>
        </div>

        {/* My Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-4 sm:mb-6">
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-lg font-semibold">حالتي</h3>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                size="sm"
                className="bg-whatsapp-green hover:bg-green-600"
                data-testid="button-my-status"
              >
                إضافة حالة
              </Button>
            </div>
            
            {currentUser && (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={currentUser.avatar || "/placeholder-avatar.png"}
                    alt={currentUser.name}
                    className="w-12 h-12 rounded-full object-cover"
                    data-testid="img-my-avatar"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-whatsapp-green rounded-full flex items-center justify-center">
                    <Plus className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <p className="font-medium">{currentUser.name}</p>
                  <p className="text-sm text-green-600">انشر منتجك</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Updates */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold">التحديثات الأخيرة</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              من منطقة {currentUser?.location}
            </p>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              جاري التحميل...
            </div>
          ) : stories.length > 0 ? (
            <div className="p-3 sm:p-4">
              <StoriesRing 
                onStoryClick={(storyId) => {
                  const index = stories.findIndex(s => s.id === storyId);
                  if (index !== -1) handleStorySelect(index);
                }}
                onCreateStory={() => setIsCreateModalOpen(true)}
              />
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <p className="mb-2">لا توجد حالات حديثة</p>
              <p className="text-sm">كن أول من يشارك حالة في منطقتك!</p>
            </div>
          )}
        </div>
      </div>

      <CreateStoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Floating Action Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-16 h-16 rounded-full bg-[var(--whatsapp-primary)] hover:bg-[var(--whatsapp-primary)]/90 shadow-lg transition-transform hover:scale-110"
          data-testid="fab-new-status"
        >
          <Camera className="h-6 w-6 text-white" />
        </Button>
      </div>
    </div>
  );
}