import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, MessageCircle, MoreVertical, Moon, Sun, Trash2, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { useTheme } from "@/components/theme-provider";
import appIconUrl from '@/assets/app-icon.png';
import { StoriesRing } from "./stories-ring";
import { StoryViewer } from "./story-viewer";
import { CreateStoryModal } from "./create-story-modal";
import { ContactsModal } from "./contacts-modal";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

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
    isVerified?: boolean;
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
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingStoryId, setViewingStoryId] = useState<string | null>(null);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const { data: currentUser } = useQuery<any>({
    queryKey: ['/api/user/current'],
  });

  const { data: chats = [], isLoading } = useQuery<Chat[]>({
    queryKey: ['/api/chats'],
    refetchInterval: 5000, // تحديث قائمة المحادثات كل 5 ثواني
    refetchIntervalInBackground: false, // لا تحدث في الخلفية
    refetchOnWindowFocus: true, // تحديث عند العودة للنافذة
  });

  // Delete chat mutation
  const deleteChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      return apiRequest(`/api/chats/${chatId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      setShowDeleteDialog(false);
      setChatToDelete(null);
      
      // If the deleted chat was selected, clear selection
      if (selectedChatId === chatToDelete?.id) {
        onChatSelect("");
      }
      
      toast({
        title: "تم حذف المحادثة",
        description: "تم حذف المحادثة وجميع رسائلها بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف المحادثة",
        variant: "destructive",
      });
    },
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

  const handleLongPressStart = (chat: Chat) => {
    longPressTimer.current = setTimeout(() => {
      setChatToDelete(chat);
      setShowDeleteDialog(true);
    }, 800); // 800ms for long press
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDeleteChat = () => {
    if (chatToDelete) {
      deleteChatMutation.mutate(chatToDelete.id);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="w-full sm:w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="bg-[var(--whatsapp-secondary)] dark:bg-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={appIconUrl} alt="BizChat" className="w-16 h-16 object-contain" />
          <Avatar className="w-10 h-10 border-2 border-white" data-testid="user-avatar">
            <AvatarImage 
              src={currentUser?.avatar} 
              alt={currentUser?.name || "المستخدم"} 
            />
            <AvatarFallback>{currentUser?.name?.[0] || "أ"}</AvatarFallback>
          </Avatar>
        </div>
        
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
            onClick={() => setShowContacts(true)}
            className="text-white hover:text-gray-200 hover:bg-white/10"
            data-testid="button-contacts"
          >
            <Users className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:text-gray-200 hover:bg-white/10"
            data-testid="button-new-chat"
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:text-gray-200 hover:bg-white/10"
                data-testid="button-menu"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <Link href="/profile">
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" data-testid="menu-profile">
                  <User className="h-4 w-4" />
                  <span>الملف الشخصي</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
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
                if (window.innerWidth < 640) {
                  onToggle();
                }
              }}
              onMouseDown={() => handleLongPressStart(chat)}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              onTouchStart={() => handleLongPressStart(chat)}
              onTouchEnd={handleLongPressEnd}
              onTouchCancel={handleLongPressEnd}
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
                  <div className="flex items-center gap-1">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100" data-testid="chat-name">
                      {getChatDisplayName(chat)}
                    </h3>
                    {!chat.isGroup && chat.otherParticipant?.isVerified && (
                      <VerifiedBadge className="w-3.5 h-3.5" />
                    )}
                  </div>
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

      {/* Contacts Modal */}
      <ContactsModal
        isOpen={showContacts}
        onClose={() => setShowContacts(false)}
        onStartChat={(chatId) => {
          onChatSelect(chatId);
          setShowContacts(false);
        }}
      />

      {/* Delete Chat Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              حذف المحادثة
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في حذف المحادثة مع{" "}
              <span className="font-semibold">
                {chatToDelete ? getChatDisplayName(chatToDelete) : ""}
              </span>
              ؟
              <br />
              <span className="text-red-600">
                سيتم حذف جميع الرسائل ولا يمكن التراجع عن هذا الإجراء.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteChatMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteChat}
              disabled={deleteChatMutation.isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteChatMutation.isPending ? "جارِ الحذف..." : "حذف المحادثة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
