import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Search, Phone, Video, MoreVertical, Smile, Paperclip, Send, ArrowRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageBubble } from "./message-bubble";
import { Message, User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface ChatAreaProps {
  chatId: string | null;
  onToggleSidebar: () => void;
}

interface ChatMessage extends Message {
  sender?: User;
}

export function ChatArea({ chatId, onToggleSidebar }: ChatAreaProps) {
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['/api/user/current'],
  });

  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chats', chatId, 'messages'],
    enabled: !!chatId,
  });

  const { data: chats = [] } = useQuery<any[]>({
    queryKey: ['/api/chats'],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!chatId) throw new Error("No chat selected");
      return apiRequest("POST", `/api/chats/${chatId}/messages`, {
        content,
        messageType: "text",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      setMessageText("");
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    sendMessageMutation.mutate(messageText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  if (!chatId) {
    return (
      <div className="flex-1 flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-center hidden lg:flex">
        <div className="max-w-md">
          <div className="w-20 h-20 bg-[var(--whatsapp-primary)] rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="text-white text-3xl" />
          </div>
          <h2 className="text-2xl font-light text-gray-800 dark:text-gray-200 mb-4">واتساب ويب</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            أرسل واستقبل الرسائل بدون الحاجة للهاتف متصلاً بالإنترنت.
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              اختر محادثة من القائمة الجانبية للبدء في المراسلة
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentChat = chats.find((chat: any) => chat.id === chatId);
  const chatDisplayName = currentChat?.isGroup 
    ? currentChat.name || "مجموعة"
    : currentChat?.otherParticipant?.name || "مستخدم";
  const chatAvatar = currentChat?.isGroup 
    ? currentChat.avatar 
    : currentChat?.otherParticipant?.avatar;
  const isOnline = currentChat?.isGroup 
    ? false 
    : currentChat?.otherParticipant?.isOnline;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="sm:hidden ml-3 text-gray-600 dark:text-gray-300 mobile-touch-target"
            data-testid="button-toggle-sidebar"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          
          <div className="relative ml-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={chatAvatar || undefined} alt={chatDisplayName} />
              <AvatarFallback>{chatDisplayName[0]}</AvatarFallback>
            </Avatar>
            {isOnline && (
              <span 
                className="absolute -bottom-1 -left-1 w-3 h-3 bg-[var(--whatsapp-online)] rounded-full border-2 border-white dark:border-gray-800"
                data-testid="status-online"
              />
            )}
          </div>
          
          <div className="mr-3">
            <h2 className="font-medium text-gray-900 dark:text-gray-100" data-testid="chat-header-name">
              {chatDisplayName}
            </h2>
            <p className="text-sm text-[var(--whatsapp-online)]" data-testid="chat-status">
              {isOnline ? "متصل" : "آخر ظهور مؤخراً"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4 space-x-reverse">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 mobile-touch-target hidden sm:flex"
            data-testid="button-search"
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 mobile-touch-target"
            data-testid="button-call"
          >
            <Phone className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 mobile-touch-target hidden sm:flex"
            data-testid="button-video-call"
          >
            <Video className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 mobile-touch-target"
            data-testid="button-menu"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto chat-scroll p-3 sm:p-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800" 
        style={{
          backgroundImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><defs><pattern id='grain' width='100' height='100' patternUnits='userSpaceOnUse'><circle cx='25' cy='25' r='1' fill='%23f3f4f6' opacity='0.1'/><circle cx='75' cy='75' r='1' fill='%23f3f4f6' opacity='0.1'/><circle cx='50' cy='10' r='0.5' fill='%23f3f4f6' opacity='0.05'/></pattern></defs><rect width='100' height='100' fill='url(%23grain)'/></svg>")`,
        }}
        data-testid="messages-container"
      >
        {/* Date Separator */}
        <div className="flex justify-center mb-4">
          <div className="bg-white dark:bg-gray-600 px-3 py-1 rounded-lg shadow-sm">
            <span className="text-xs text-gray-500 dark:text-gray-300">اليوم</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-gray-500 dark:text-gray-400">جاري تحميل الرسائل...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-gray-500 dark:text-gray-400">لا توجد رسائل بعد</div>
          </div>
        ) : (
          messages.map((message: any) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUser?.id}
            />
          ))
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4">
        <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mobile-touch-target"
            data-testid="button-emoji"
          >
            <Smile className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mobile-touch-target"
            data-testid="button-attach"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="اكتب رسالة..."
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full py-2 sm:py-3 px-4 sm:px-5 focus:border-[var(--whatsapp-primary)] focus:bg-white dark:focus:bg-gray-600 text-base"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sendMessageMutation.isPending}
              data-testid="input-message"
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            className="bg-[var(--whatsapp-primary)] hover:bg-[var(--whatsapp-secondary)] text-white p-2 sm:p-3 rounded-full shadow-lg mobile-touch-target"
            size="icon"
            data-testid="button-send"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L1 23l6.71-1.97C9.02 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
    </svg>
  );
}
