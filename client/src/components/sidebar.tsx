import { useQuery } from "@tanstack/react-query";
import { Search, MessageCircle, MoreVertical, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import { StoriesRing } from "./stories-ring";
import { StoryViewer } from "./story-viewer";
import { CreateStoryModal } from "./create-story-modal";
import { useState } from "react";

interface Chat {
  id: string;
  name: string | null;
  isGroup: boolean;
  avatar: string | null;
  participants: string[];
  lastMessage?: {
    content: string;
    timestamp: Date;
    senderId: string;
    messageType: string;
  } | null;
  unreadCount: number;
  otherParticipant?: {
    id: string;
    name: string;
    avatar: string | null;
    isOnline: boolean;
    lastSeen: Date;
  } | null;
}

interface SidebarProps {
  selectedChatId: string | null;
  onChatSelect: (chatId: string) => void;
  isVisible: boolean;
  onToggle: () => void;
}

export function Sidebar({ selectedChatId, onChatSelect, isVisible, onToggle }: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingStoryId, setViewingStoryId] = useState<string | null>(null);
  const [showCreateStory, setShowCreateStory] = useState(false);

  const { data: currentUser } = useQuery<any>({
    queryKey: ['/api/user/current'],
  });

  const { data: chats = [], isLoading } = useQuery<Chat[]>({
    queryKey: ['/api/chats'],
  });

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const formatTime = (date: Date) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 168) { // Less than a week
      return messageDate.toLocaleDateString('ar-SA', { weekday: 'long' });
    } else {
      return messageDate.toLocaleDateString('ar-SA');
    }
  };

  const getLastMessagePreview = (chat: Chat) => {
    if (!chat.lastMessage) return "لا توجد رسائل";
    
    if (chat.lastMessage.messageType === 'image') {
      return "📷 صورة";
    }
    
    return chat.lastMessage.content;
  };

  const getChatDisplayName = (chat: Chat) => {
    if (chat.isGroup) {
      return chat.name || "مجموعة";
    }
    return chat.otherParticipant?.name || "مستخدم";
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.isGroup) {
      return chat.avatar;
    }
    return chat.otherParticipant?.avatar;
  };

  const isOnline = (chat: Chat) => {
    if (chat.isGroup) return false;
    return chat.otherParticipant?.isOnline || false;
  };

  const filteredChats = chats.filter(chat => {
    const name = getChatDisplayName(chat).toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  if (!isVisible) return null;

  return (
    <div className="w-full md:w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="bg-[var(--whatsapp-secondary)] dark:bg-gray-700 p-4 flex items-center justify-between">
        <Avatar className="w-10 h-10 border-2 border-white" data-testid="user-avatar">
          <AvatarImage 
            src={currentUser?.avatar} 
            alt={currentUser?.name || "المستخدم"} 
          />
          <AvatarFallback>{currentUser?.name?.[0] || "أ"}</AvatarFallback>
        </Avatar>
        
        <div className="flex items-center space-x-3 space-x-reverse">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-white hover:text-gray-200 hover:bg-white/10"
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:text-gray-200 hover:bg-white/10"
            data-testid="button-new-chat"
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:text-gray-200 hover:bg-white/10"
            data-testid="button-menu"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="البحث أو بدء محادثة جديدة"
            className="w-full bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg py-2 pr-10 pl-4 focus:border-[var(--whatsapp-primary)]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search"
          />
        </div>
      </div>

      {/* Stories Ring */}
      <StoriesRing
        onStoryClick={(storyId) => setViewingStoryId(storyId)}
        onCreateStory={() => setShowCreateStory(true)}
      />

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto chat-scroll">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            جاري التحميل...
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            {searchTerm ? "لا توجد محادثات مطابقة" : "لا توجد محادثات"}
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors flex items-center border-b border-gray-100 dark:border-gray-700 ${
                selectedChatId === chat.id
                  ? "bg-[var(--whatsapp-light)] dark:bg-gray-600 border-r-4 border-[var(--whatsapp-primary)]"
                  : ""
              }`}
              onClick={() => {
                onChatSelect(chat.id);
                if (window.innerWidth < 768) {
                  onToggle();
                }
              }}
              data-testid={`chat-item-${chat.id}`}
            >
              <div className="relative ml-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage 
                    src={getChatAvatar(chat) || undefined} 
                    alt={getChatDisplayName(chat)} 
                  />
                  <AvatarFallback>{getChatDisplayName(chat)[0]}</AvatarFallback>
                </Avatar>
                {isOnline(chat) && (
                  <span 
                    className="absolute -bottom-1 -left-1 w-4 h-4 bg-[var(--whatsapp-online)] rounded-full border-2 border-white dark:border-gray-800"
                    data-testid="status-online"
                  />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100" data-testid="chat-name">
                    {getChatDisplayName(chat)}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400" data-testid="chat-time">
                    {chat.lastMessage ? formatTime(chat.lastMessage.timestamp) : ""}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate" data-testid="chat-preview">
                    {getLastMessagePreview(chat)}
                  </p>
                  <div className="flex items-center">
                    {chat.unreadCount > 0 && (
                      <Badge 
                        className="bg-[var(--whatsapp-primary)] text-white rounded-full min-w-[20px] h-5 flex items-center justify-center text-xs mr-1"
                        data-testid="unread-count"
                      >
                        {chat.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Story Viewer */}
      {viewingStoryId && (
        <StoryViewer
          storyId={viewingStoryId}
          onClose={() => setViewingStoryId(null)}
        />
      )}

      {/* Create Story Modal */}
      <CreateStoryModal
        isOpen={showCreateStory}
        onClose={() => setShowCreateStory(false)}
      />
    </div>
  );
}
