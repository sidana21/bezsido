import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">الحالة</h3>
        
        <div className="flex space-x-4 space-x-reverse overflow-x-auto pb-2">
          {/* Add Story Button */}
          <div className="flex-shrink-0">
            <Button
              onClick={onCreateStory}
              variant="ghost"
              className="flex flex-col items-center p-2 space-y-2"
              data-testid="button-create-story"
            >
              <div className="relative">
                <Avatar className="w-14 h-14 border-2 border-gray-300 dark:border-gray-600">
                  <AvatarImage 
                    src={currentUser?.avatar || undefined} 
                    alt={currentUser?.name || "المستخدم"} 
                  />
                  <AvatarFallback>{currentUser?.name?.[0] || "أ"}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-[var(--whatsapp-primary)] rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                  <Plus className="w-3 h-3 text-white" />
                </div>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-300">حالتي</span>
            </Button>
          </div>

          {/* User Stories */}
          {userStories.map(([userId, userStoryList]) => {
            const firstStory = userStoryList[0];
            const hasUnviewedStories = userStoryList.some(story => 
              !story.viewers?.includes("current-user")
            );
            
            return (
              <div key={userId} className="flex-shrink-0">
                <Button
                  onClick={() => onStoryClick(firstStory.id)}
                  variant="ghost"
                  className="flex flex-col items-center p-2 space-y-2"
                  data-testid={`story-ring-${userId}`}
                >
                  <div className="relative">
                    <Avatar 
                      className={`w-14 h-14 border-2 ${
                        hasUnviewedStories 
                          ? 'border-[var(--whatsapp-primary)]' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <AvatarImage 
                        src={firstStory.user.avatar || undefined} 
                        alt={firstStory.user.name} 
                      />
                      <AvatarFallback>{firstStory.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--whatsapp-primary)] text-white rounded-full text-xs flex items-center justify-center">
                      {userStoryList.length}
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-16">
                    {firstStory.user.name}
                  </span>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}