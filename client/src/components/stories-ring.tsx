import { useQuery } from "@tanstack/react-query";
import { Plus, Circle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { Story, User } from "@shared/schema";

interface StoriesRingProps {
  onStoryClick: (storyId: string) => void;
  onCreateStory: () => void;
}

interface StoryWithUser extends Story {
  user: User;
}

export function StoriesRing({ onStoryClick, onCreateStory }: StoriesRingProps) {
  const { data: stories = [], isLoading } = useQuery<StoryWithUser[]>({
    queryKey: ['/api/stories'],
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/user/current'],
  });

  // Group stories by user
  const storiesByUser = stories.reduce((acc, story) => {
    const userId = story.userId;
    if (!acc[userId]) {
      acc[userId] = [];
    }
    acc[userId].push(story);
    return acc;
  }, {} as Record<string, StoryWithUser[]>);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">جاري تحميل الحالات...</div>
      </div>
    );
  }

  const userStories = Object.entries(storiesByUser);

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 relative overflow-hidden">
      {/* شبكة الخلفية الجميلة */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" style={{width: '200%', height: '200%'}}></div>
      </div>
      
      <div className="relative p-3 sm:p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <Circle className="w-4 h-4 text-white fill-white" />
            </div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-white bg-clip-text text-transparent">الحالات</h3>
          </div>
          <div className="relative">
            <span className="text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-600 px-3 py-1.5 rounded-full shadow-lg animate-pulse">
              انشر منتجك الآن ✨
            </span>
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full blur opacity-30 animate-pulse"></div>
          </div>
        </div>
        
        <div className="flex space-x-3 sm:space-x-4 overflow-x-auto pb-3 scrolling-touch rtl-scroll story-container">
          {/* Add Story Button */}
          <div className="flex-shrink-0 story-item">
            <Button
              onClick={onCreateStory}
              variant="ghost"
              className="flex flex-col items-center p-2 sm:p-3 space-y-2 mobile-touch-target hover:scale-105 transition-all duration-300 group"
              data-testid="button-create-story"
            >
              <div className="relative">
                {/* تأثير النبضة الخارجية */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-ping opacity-20 scale-110"></div>
                
                {/* حلقة متدرجة جميلة */}
                <div className="relative p-1 bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-xl group-hover:shadow-2xl transition-all duration-300">
                  <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-3 border-white dark:border-gray-900 shadow-lg">
                    <AvatarImage 
                      src={currentUser?.avatar || undefined} 
                      alt={currentUser?.name || "المستخدم"} 
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                      {currentUser?.name?.[0] || "أ"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                {/* أيقونة الإضافة بتأثيرات */}
                <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center border-3 border-white dark:border-gray-900 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Plus className="w-3 h-3 text-white drop-shadow-sm" />
                </div>
              </div>
              
              <div className="text-center space-y-1">
                <span className="text-xs font-medium bg-gradient-to-r from-gray-600 to-gray-800 dark:from-gray-300 dark:to-white bg-clip-text text-transparent">حالتي</span>
                <div className="text-xs font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent animate-pulse">
                  انشر منتجك
                </div>
              </div>
            </Button>
          </div>

          {/* User Stories */}
          {userStories.map(([userId, userStoryList]) => {
            const firstStory = userStoryList[0];
            const hasUnviewedStories = userStoryList.some(story => 
              !story.viewers?.includes("current-user")
            );
            
            // محاكاة حالة الاتصال (يمكن أن تأتي من API في المستقبل)
            const isOnline = Math.random() > 0.3; // 70% احتمال أن يكون متصل
            
            return (
              <div key={userId} className="flex-shrink-0 story-item">
                <Button
                  onClick={() => onStoryClick(firstStory.id)}
                  variant="ghost"
                  className="flex flex-col items-center p-2 sm:p-3 space-y-2 mobile-touch-target hover:scale-105 transition-all duration-300 group"
                  data-testid={`story-ring-${userId}`}
                >
                  <div className="relative">
                    {/* تأثيرات خاصة للحالات غير المقروءة */}
                    {hasUnviewedStories && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full animate-pulse opacity-30 scale-110"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-ping opacity-20 scale-125"></div>
                      </>
                    )}
                    
                    {/* حلقة الحالة */}
                    <div className={`relative p-1 rounded-full shadow-xl group-hover:shadow-2xl transition-all duration-300 ${
                      hasUnviewedStories 
                        ? 'bg-gradient-to-tr from-pink-500 via-purple-500 to-orange-500 animate-pulse' 
                        : 'bg-gradient-to-tr from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700'
                    }`}>
                      <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-3 border-white dark:border-gray-900 shadow-lg">
                        <AvatarImage 
                          src={firstStory.user.avatar || undefined} 
                          alt={firstStory.user.name} 
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                          {firstStory.user.name[0]}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    {/* مؤشر الاتصال */}
                    <div className={`absolute -bottom-0 -right-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-3 border-white dark:border-gray-900 shadow-lg transition-all duration-300 ${
                      isOnline 
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse' 
                        : 'bg-gradient-to-r from-gray-400 to-gray-500'
                    }`}>
                      {isOnline && (
                        <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-40"></div>
                      )}
                    </div>
                    
                    {/* عداد الحالات */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900 group-hover:scale-110 transition-transform duration-300">
                      {userStoryList.length}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs font-medium">
                      <span className="bg-gradient-to-r from-gray-600 to-gray-800 dark:from-gray-300 dark:to-white bg-clip-text text-transparent truncate max-w-16">
                        {firstStory.user.name}
                      </span>
                      {firstStory.user.isVerified && (
                        <VerifiedBadge className="w-3 h-3 flex-shrink-0" />
                      )}
                    </div>
                    {/* مؤشر حالة الاتصال النصي */}
                    <div className={`text-xs font-medium mt-0.5 ${
                      isOnline 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-gray-400'
                    }`}>
                      {isOnline ? 'متصل الآن' : 'غير متصل'}
                    </div>
                  </div>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}