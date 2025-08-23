import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Phone, Video, MoreVertical, Smile, Paperclip, Send, ArrowRight, Menu, X, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['/api/user/current'],
  });

  const { data: messages = [], isLoading, isSuccess } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chats', chatId, 'messages'],
    enabled: !!chatId,
    refetchInterval: 3000, // تحديث الرسائل كل 3 ثواني
    refetchIntervalInBackground: false, // لا تحدث في الخلفية لتوفير الموارد
    refetchOnWindowFocus: true, // تحديث عند العودة للنافذة
  });

  const { data: chats = [] } = useQuery<any[]>({
    queryKey: ['/api/chats'],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!chatId) {
        console.error("لا يوجد محادثة محددة لإرسال الرسالة");
        throw new Error("No chat selected");
      }
      
      console.log("إرسال رسالة إلى:", chatId, "المحتوى:", content);
      
      const result = await apiRequest(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          messageType: "text",
          replyToId: replyingTo?.id || null,
        }),
      });
      
      console.log("تم إرسال الرسالة بنجاح:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("تحديث قائمة الرسائل...");
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      setMessageText("");
      setReplyingTo(null);
    },
    onError: (error) => {
      console.error("خطأ في إرسال الرسالة:", error);
    },
  });

  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      return apiRequest(`/api/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'messages'] });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return apiRequest(`/api/messages/${messageId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'messages'] });
    },
  });

  // إعداد الصوت للتنبيه
  useEffect(() => {
    // إنشاء صوت التنبيه (بسيط للغاية)
    notificationSoundRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjibzvPfiTcIG2m98OScTQwNUarm7blsGws5n9P1vmocBjiAyfTakTsIGGm98OScTQwNUarm7bhkHA=');
    notificationSoundRef.current.volume = 0.5;
  }, []);

  // تشغيل صوت التنبيه عند استلام رسائل جديدة غير مقروءة
  useEffect(() => {
    if (isSuccess && messages.length > 0) {
      const unreadMessages = messages.filter(msg => !msg.isRead && msg.senderId !== (currentUser as any)?.id);
      if (unreadMessages.length > 0) {
        // تشغيل صوت التنبيه
        notificationSoundRef.current?.play().catch(err => console.log('Cannot play notification sound:', err));
      }
    }
  }, [messages, isSuccess, currentUser]);

  // تمييز الرسائل كمقروءة عند دخول المحادثة
  useEffect(() => {
    if (chatId && messages.length > 0 && currentUser) {
      const unreadMessages = messages.filter(msg => !msg.isRead && msg.senderId !== (currentUser as any)?.id);
      unreadMessages.forEach(message => {
        // استدعاء API لتمييز الرسالة كمقروءة
        fetch(`/api/messages/${message.id}/read`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' }
        }).catch(err => console.log('Failed to mark message as read:', err));
      });
    }
  }, [chatId, messages, currentUser]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        sendAudioMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('خطأ في الوصول للميكروفون. تأكد من السماح بالوصول للميكروفون.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const sendAudioMessage = async (audioBlob: Blob) => {
    if (!chatId) return;

    try {
      // إنشاء FormData لرفع الملف الصوتي
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-message.wav');
      formData.append('messageType', 'audio');
      formData.append('chatId', chatId);
      if (replyingTo?.id) {
        formData.append('replyToId', replyingTo.id);
      }

      // استخدام apiRequest مع المصادقة الصحيحة
      const response = await apiRequest(`/api/chats/${chatId}/messages/audio`, {
        method: 'POST',
        body: formData,
        // لا نحتاج لتعيين Content-Type هنا لأن FormData سيعينه تلقائياً
      });

      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      setReplyingTo(null);
    } catch (error) {
      console.error('Error sending audio message:', error);
      alert('فشل في إرسال الرسالة الصوتية');
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    const trimmedText = messageText.trim();
    if (!trimmedText) {
      console.log("الرسالة فارغة، لا يمكن الإرسال");
      return;
    }
    
    if (!chatId) {
      console.error("لا يوجد معرف محادثة");
      return;
    }
    
    console.log("بدء إرسال الرسالة:", trimmedText);
    sendMessageMutation.mutate(trimmedText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSearch = async (term: string) => {
    if (!chatId || !term.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await apiRequest(`/api/chats/${chatId}/messages/search?q=${encodeURIComponent(term.trim())}`);
      setSearchResults(results);
    } catch (error) {
      console.error("فشل في البحث:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const openSearchModal = () => {
    setShowSearchModal(true);
    setSearchTerm("");
    setSearchResults([]);
  };

  const closeSearchModal = () => {
    setShowSearchModal(false);
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleReply = (message: ChatMessage) => {
    setReplyingTo(message);
  };

  const handleEdit = (message: Message) => {
    const newContent = prompt("تحرير الرسالة:", message.content || "");
    if (newContent && newContent.trim() !== message.content) {
      editMessageMutation.mutate({ messageId: message.id, content: newContent.trim() });
    }
  };

  const handleDelete = (messageId: string) => {
    if (confirm("هل أنت متأكد من حذف هذه الرسالة؟")) {
      deleteMessageMutation.mutate(messageId);
    }
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  if (!chatId) {
    return (
      <div className="flex-1 flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-center hidden lg:flex">
        <div className="max-w-md">
          <h2 className="text-2xl font-light text-gray-800 dark:text-gray-200 mb-4">BizChat</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            منصة التواصل التجاري الذكية - تواصل مع عملائك وأنجز صفقاتك.
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
            onClick={openSearchModal}
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
          messages.map((message: ChatMessage) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === (currentUser as any)?.id}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4">
        {/* Reply Preview */}
        {replyingTo && (
          <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-[var(--whatsapp-primary)]">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-[var(--whatsapp-primary)] mb-1">
                  رد على {replyingTo.sender?.name || "غير معروف"}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
                  {replyingTo.content}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelReply}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
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
            {isRecording && (
              <div className="absolute -top-12 left-0 right-0 bg-red-500 text-white p-2 rounded-lg text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-sm">تسجيل... {formatRecordingTime(recordingTime)}</span>
                </div>
              </div>
            )}
            <Input
              type="text"
              placeholder={isRecording ? "جاري التسجيل..." : "اكتب رسالة..."}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full py-2 sm:py-3 px-4 sm:px-5 focus:border-[var(--whatsapp-primary)] focus:bg-white dark:focus:bg-gray-600 text-base"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sendMessageMutation.isPending || isRecording}
              data-testid="input-message"
            />
          </div>
          
          {/* مجموعة أزرار الإرسال والصوت مدمجة */}
          <div className="flex items-center space-x-1 space-x-reverse">
            {/* Voice Message Button */}
            <Button
              variant="ghost"
              size="icon"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`mobile-touch-target rounded-l-full ${
                isRecording
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-600"
              }`}
              data-testid="button-voice"
            >
              {isRecording ? (
                <Square className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>
            
            <Button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || sendMessageMutation.isPending || isRecording}
              className="bg-[var(--whatsapp-primary)] hover:bg-[var(--whatsapp-secondary)] text-white p-2 sm:p-3 rounded-r-full shadow-lg mobile-touch-target"
              size="icon"
              data-testid="button-send"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <Dialog open={showSearchModal} onOpenChange={setShowSearchModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">البحث في الرسائل</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="ابحث في المحادثة..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="w-full text-right"
                data-testid="input-search"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="text-center py-4 text-gray-500">جار البحث...</div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map((message) => (
                    <div
                      key={message.id}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      data-testid={`search-result-${message.id}`}
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {message.sender?.name || "غير معروف"}
                      </div>
                      <div className="text-gray-700 dark:text-gray-300 text-right">
                        {message.content}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 text-right">
                        {message.timestamp ? new Date(message.timestamp).toLocaleString('ar-SA') : ''}
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchTerm ? (
                <div className="text-center py-4 text-gray-500">لم يتم العثور على نتائج</div>
              ) : (
                <div className="text-center py-4 text-gray-500">اكتب للبحث في الرسائل</div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
