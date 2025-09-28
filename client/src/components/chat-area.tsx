import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Search, Phone, Video, MoreVertical, Smile, Paperclip, Send, ArrowRight, Menu, X, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageBubble } from "./message-bubble";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { Message, User, Sticker } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { safeExecute } from "@/utils/error-handling";
import { safeAddEventListener, createSafeCleanup } from "@/utils/dom-cleanup";
import { safeStopMediaStream, safeInitMicrophone, safeCreateMediaRecorder, createRecordingTimer } from "@/utils/audio-recording";
import { useNotifications } from "@/hooks/use-notifications";
import { useToast } from "@/hooks/use-toast";
import { useVoiceCalls } from '@/hooks/use-voice-calls';
import { VoiceCall } from './voice-call';
import { useFeatureEnabled, FeatureGuard } from '@/hooks/use-features';

interface ChatAreaProps {
  chatId: string | null;
  onToggleSidebar: () => void;
}

interface ChatMessage extends Message {
  sender?: User;
}

// دالة للتحقق من صحة الرسالة
function validateMessage(message: any): message is ChatMessage {
  try {
    if (!message || typeof message !== 'object') {
      console.warn('رسالة غير صالحة: البيانات فارغة أو ليست كائن', message);
      return false;
    }
    
    if (!message.id || typeof message.id !== 'string') {
      console.warn('رسالة غير صالحة: لا يوجد معرف فريد', message);
      return false;
    }
    
    if (!message.senderId || typeof message.senderId !== 'string') {
      console.warn('رسالة غير صالحة: لا يوجد معرف مرسل', message);
      return false;
    }
    
    // التحقق من وجود المحتوى أو نوع الرسالة
    if (!message.content && !message.imageUrl && !message.audioUrl && !message.stickerUrl) {
      console.warn('رسالة غير صالحة: لا يوجد محتوى', message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('خطأ في التحقق من صحة الرسالة:', error, message);
    return false;
  }
}

// دالة لتنظيف وإصلاح الرسائل
function sanitizeMessage(message: any): ChatMessage | null {
  try {
    if (!validateMessage(message)) {
      return null;
    }
    
    // إنشاء كائن رسالة آمن مع قيم افتراضية
    const sanitizedMessage: ChatMessage = {
      id: message.id,
      chatId: message.chatId || '',
      senderId: message.senderId,
      content: message.content || '',
      messageType: message.messageType || 'text',
      imageUrl: message.imageUrl || null,
      audioUrl: message.audioUrl || null,
      stickerUrl: message.stickerUrl || null,
      stickerId: message.stickerId || null,
      locationLat: message.locationLat || null,
      locationLon: message.locationLon || null,
      locationName: message.locationName || null,
      replyToMessageId: message.replyToMessageId || null,
      timestamp: message.timestamp || new Date(),
      isRead: Boolean(message.isRead),
      isDelivered: Boolean(message.isDelivered),
      isEdited: Boolean(message.isEdited),
      editedAt: message.editedAt || null,
      deletedAt: message.deletedAt || null,
      sender: message.sender ? {
        id: message.sender.id || '',
        name: message.sender.name || 'مستخدم',
        email: message.sender.email || '',
        password: null,
        location: message.sender.location || '',
        avatar: message.sender.avatar || null,
        isOnline: Boolean(message.sender.isOnline),
        isVerified: Boolean(message.sender.isVerified),
        verifiedAt: message.sender.verifiedAt || null,
        isAdmin: Boolean(message.sender.isAdmin),
        lastSeen: message.sender.lastSeen || new Date(),
        points: message.sender.points || 0,
        streak: message.sender.streak || 0,
        lastStreakDate: message.sender.lastStreakDate || null,
        createdAt: message.sender.createdAt || new Date(),
        updatedAt: message.sender.updatedAt || new Date()
      } : undefined
    };
    
    return sanitizedMessage;
  } catch (error) {
    console.error('خطأ في تنظيف الرسالة:', error, message);
    return null;
  }
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
  const [isDraggedForCancel, setIsDraggedForCancel] = useState(false);
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startPositionRef = useRef<{ x: number; y: number } | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: currentUser } = useQuery({
    queryKey: ['/api/user/current'],
  });

  // إعداد hook المكالمات مع حماية من البيانات الناقصة
  const voiceCalls = useVoiceCalls({
    currentUserId: (currentUser && typeof currentUser === 'object' && 'id' in currentUser && currentUser.id) ? String(currentUser.id) : '',
    onIncomingCall: (call) => {
      console.log('📞 مكالمة واردة جديدة في ChatArea:', call);
      toast({
        title: "مكالمة واردة",
        description: `يتصل بك ${call.caller?.name || 'مستخدم غير معروف'}`,
      });
    },
  });

  const { data: rawMessages = [], isLoading, isSuccess, error } = useQuery<any[]>({
    queryKey: ['/api/chats', chatId, 'messages'],
    enabled: !!chatId,
    refetchInterval: 3000, // تحديث الرسائل كل 3 ثواني
    refetchIntervalInBackground: false, // لا تحدث في الخلفية لتوفير الموارد
    refetchOnWindowFocus: true, // تحديث عند العودة للنافذة
  });

  // معالجة الأخطاء في تحميل الرسائل
  useEffect(() => {
    if (error) {
      console.error('خطأ في تحميل الرسائل:', error);
      toast({
        title: "خطأ في تحميل الرسائل",
        description: "حدث خطأ أثناء تحميل الرسائل. يرجى إعادة المحاولة",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // معالجة وتنظيف الرسائل لضمان سلامتها
  const messages = useMemo(() => {
    try {
      if (!rawMessages) {
        console.warn('لا توجد رسائل للمعالجة');
        return [];
      }

      if (!Array.isArray(rawMessages)) {
        console.warn('البيانات الواردة ليست مصفوفة، محاولة التحويل...', rawMessages);
        // محاولة إصلاح البيانات إذا كانت في شكل كائن
        if (typeof rawMessages === 'object' && rawMessages !== null) {
          return [];
        }
        return [];
      }

      return rawMessages
        .map((message, index) => {
          try {
            if (!message) {
              console.warn(`رسالة فارغة في الموضع ${index}`);
              return null;
            }
            return sanitizeMessage(message);
          } catch (error) {
            console.error(`خطأ في معالجة رسالة في الموضع ${index}:`, error, message);
            return null;
          }
        })
        .filter((message): message is ChatMessage => message !== null);
        
    } catch (error) {
      console.error('خطأ عام في معالجة الرسائل:', error);
      return [];
    }
  }, [rawMessages]);

  const { data: chats = [] } = useQuery<any[]>({
    queryKey: ['/api/chats'],
  });

  const { data: stickers = [] } = useQuery<Sticker[]>({
    queryKey: ['/api/stickers'],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      try {
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
      } catch (error) {
        console.error("خطأ في إرسال الرسالة:", error);
        toast({
          title: "فشل إرسال الرسالة",
          description: "حصل خطأ أثناء إرسال الرسالة، يرجى المحاولة مرة أخرى",
          variant: "destructive",
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("تحديث قائمة الرسائل...");
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      // تحديث عدد الرسائل غير المقروءة
      refreshUnreadCount();
      setMessageText("");
      setReplyingTo(null);
    },
    onError: (error) => {
      console.error("خطأ في إرسال الرسالة:", error);
      toast({
        title: "فشل إرسال الرسالة",
        description: "حصل خطأ، يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى",
        variant: "destructive",
      });
    },
  });

  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      try {
        return await apiRequest(`/api/messages/${messageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
      } catch (error) {
        console.error("خطأ في تعديل الرسالة:", error);
        toast({
          title: "فشل تعديل الرسالة",
          description: "حصل خطأ أثناء تعديل الرسالة، يرجى المحاولة مرة أخرى",
          variant: "destructive",
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'messages'] });
      toast({
        title: "تم تعديل الرسالة",
        description: "تم تعديل الرسالة بنجاح",
      });
    },
    onError: (error) => {
      console.error("خطأ في تعديل الرسالة:", error);
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      try {
        return await apiRequest(`/api/messages/${messageId}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.error("خطأ في حذف الرسالة:", error);
        toast({
          title: "فشل حذف الرسالة",
          description: "حصل خطأ أثناء حذف الرسالة، يرجى المحاولة مرة أخرى",
          variant: "destructive",
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'messages'] });
      toast({
        title: "تم حذف الرسالة",
        description: "تم حذف الرسالة بنجاح",
      });
    },
    onError: (error) => {
      console.error("خطأ في حذف الرسالة:", error);
    },
  });

  // استخدام نظام الإشعارات الجديد
  const { refreshUnreadCount } = useNotifications({
    enableSound: true,
    enableBrowserNotifications: true,
    soundVolume: 0.7
  });


  // تمييز الرسائل كمقروءة عند دخول المحادثة
  useEffect(() => {
    if (chatId && messages.length > 0 && currentUser && typeof currentUser === 'object' && 'id' in currentUser && currentUser.id) {
      const currentUserId = currentUser.id as string;
      const unreadMessages = messages.filter(msg => !msg.isRead && msg.senderId !== currentUserId);
      if (unreadMessages.length > 0) {
        unreadMessages.forEach(async (message) => {
          try {
            // استدعاء API لتمييز الرسالة كمقروءة مع التوثيق
            await apiRequest(`/api/messages/${message.id}/read`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' }
            });
          } catch (err) {
            console.log('Failed to mark message as read:', err);
          }
        });
        
        // تحديث عدد الرسائل غير المقروءة بعد قراءة الرسائل
        setTimeout(() => {
          refreshUnreadCount();
        }, 500);
      }
    }
  }, [chatId, messages, currentUser, refreshUnreadCount]);

  // Initialize microphone stream (cached for better performance)
  const initMicrophone = async () => {
    if (mediaStreamRef.current) {
      return mediaStreamRef.current;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('MediaRecorder not supported');
    }

    setIsRequestingMic(true);
    try {
      // Optimized audio constraints for better performance
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Reduced from 44100 for better performance
          channelCount: 1 // Mono for smaller file sizes
        } 
      });
      
      mediaStreamRef.current = stream;
      return stream;
    } finally {
      setIsRequestingMic(false);
    }
  };

  const startRecording = async (event: React.MouseEvent | React.TouchEvent) => {
    // Debounce to prevent multiple rapid clicks
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    if (isRecording || isRequestingMic) {
      return; // Prevent multiple simultaneous recordings
    }

    console.log('Starting recording...');
    
    try {
      // حفظ موقع البداية
      const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
      const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
      startPositionRef.current = { x: clientX, y: clientY };
      
      console.log('Initializing microphone...');
      const stream = await initMicrophone();
      
      console.log('Microphone ready, creating MediaRecorder...');
      
      // Optimized MIME type selection
      let mimeType = '';
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav'
      ];
      
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      console.log('Using MIME type:', mimeType || 'default');
      
      mediaRecorderRef.current = new MediaRecorder(
        stream, 
        mimeType ? { mimeType } : undefined
      );
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        console.log('Recording stopped. Chunks:', audioChunksRef.current.length);
        if (!isDraggedForCancel && audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: mimeType || 'audio/webm' 
          });
          console.log('Audio blob created:', audioBlob.size, 'bytes');
          sendAudioMessage(audioBlob);
        }
        setIsDraggedForCancel(false);
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setIsRecording(false);
      };

      // Start recording with smaller chunks for better responsiveness
      mediaRecorderRef.current.start(500);
      setIsRecording(true);
      setRecordingTime(0);
      setIsDraggedForCancel(false);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      console.log('Recording started successfully');
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      setIsRequestingMic(false);
      
      const err = error as any;
      if (err.name === 'NotAllowedError') {
        alert('يرجى السماح بالوصول للميكروفون في إعدادات المتصفح.');
      } else if (err.name === 'NotFoundError') {
        alert('لم يتم العثور على ميكروفون. تأكد من توصيل ميكروفون بالجهاز.');
      } else {
        alert('خطأ في بدء التسجيل: ' + (err.message || 'خطأ غير معروف'));
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const handleDragMove = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isRecording || !startPositionRef.current) return;

    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const deltaX = startPositionRef.current.x - clientX;

    // Optimized threshold calculation with better responsiveness
    const cancelThreshold = 80; // Reduced from 100 for better UX
    const shouldCancel = deltaX > cancelThreshold;
    
    if (shouldCancel !== isDraggedForCancel) {
      setIsDraggedForCancel(shouldCancel);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      setIsDraggedForCancel(true);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const sendAudioMessage = async (audioBlob: Blob) => {
    if (!chatId) return;
    
    console.log('Sending audio message...', audioBlob.size, 'bytes');

    try {
      // إنشاء FormData لرفع الملف الصوتي
      const formData = new FormData();
      
      // تحديد امتداد الملف بناءً على النوع
      let filename = 'voice-message.webm';
      if (audioBlob.type.includes('mp4')) {
        filename = 'voice-message.mp4';
      } else if (audioBlob.type.includes('wav')) {
        filename = 'voice-message.wav';
      }
      
      formData.append('audio', audioBlob, filename);
      formData.append('messageType', 'audio');
      formData.append('chatId', chatId);
      if (replyingTo?.id) {
        formData.append('replyToId', replyingTo.id);
      }

      console.log('Sending FormData with file:', filename);

      // استخدام apiRequest مع المصادقة الصحيحة
      const response = await apiRequest(`/api/chats/${chatId}/messages/audio`, {
        method: 'POST',
        body: formData,
        // لا نحتاج لتعيين Content-Type هنا لأن FormData سيعينه تلقائياً
      });

      console.log('Audio message sent successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      // تحديث عدد الرسائل غير المقروءة
      refreshUnreadCount();
      setReplyingTo(null);
      
      toast({
        title: "تم إرسال الرسالة الصوتية",
        description: "تم إرسال رسالتك الصوتية بنجاح",
      });
    } catch (error) {
      console.error('Error sending audio message:', error);
      const err = error as any;
      toast({
        title: "فشل إرسال الرسالة الصوتية",
        description: `حصل خطأ أثناء إرسال الرسالة الصوتية: ${err.message || 'خطأ غير معروف'}`,
        variant: "destructive",
      });
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sendSticker = async (sticker: Sticker) => {
    if (!chatId) return;

    try {
      console.log("إرسال ملصق:", sticker.name);
      
      const result = await apiRequest(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: sticker.name,
          messageType: "sticker",
          stickerUrl: sticker.imageUrl,
          replyToId: replyingTo?.id || null,
        }),
      });
      
      console.log("تم إرسال الملصق بنجاح:", result);
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      // تحديث عدد الرسائل غير المقروءة
      refreshUnreadCount();
      setReplyingTo(null);
      setShowStickers(false);
      
      toast({
        title: "تم إرسال الملصق",
        description: `تم إرسال ملصق ${sticker.name} بنجاح`,
      });
    } catch (error) {
      console.error("خطأ في إرسال الملصق:", error);
      toast({
        title: "فشل إرسال الملصق",
        description: "حصل خطأ أثناء إرسال الملصق، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Optimized event listeners with passive events for better performance
  useEffect(() => {
    if (!isRecording) return;

    const handleMouseMove = (event: Event) => {
      safeExecute(handleDragMove, event as any);
    };

    const handleTouchMove = (event: Event) => {
      safeExecute(handleDragMove, event as any);
    };

    const handleMouseUp = () => {
      safeExecute(stopRecording);
    };

    const handleTouchEnd = () => {
      safeExecute(stopRecording);
    };

    // Add listeners using safe utilities
    const cleanupMouseMove = safeAddEventListener(window, 'mousemove', handleMouseMove, { passive: true });
    const cleanupTouchMove = safeAddEventListener(window, 'touchmove', handleTouchMove, { passive: true });
    const cleanupMouseUp = safeAddEventListener(window, 'mouseup', handleMouseUp);
    const cleanupTouchEnd = safeAddEventListener(window, 'touchend', handleTouchEnd);

    return createSafeCleanup([cleanupMouseMove, cleanupTouchMove, cleanupMouseUp, cleanupTouchEnd]);
  }, [isRecording, handleDragMove, stopRecording]);

  // Cleanup microphone stream on component unmount
  useEffect(() => {
    return createSafeCleanup([
      () => safeStopMediaStream(mediaStreamRef.current),
      () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
      },
      () => {
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      }
    ]);
  }, []);

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

  // دالة بدء المكالمة
  const handleStartCall = () => {
    if (!currentUser || typeof currentUser !== 'object' || !('id' in currentUser) || !currentUser.id) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }

    // الحصول على معرف المحادثة والمستخدم الآخر
    const currentChatForCall = chats?.find((chat: any) => chat?.id === chatId);
    if (!currentChatForCall) {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على المحادثة",
        variant: "destructive",
      });
      return;
    }

    // العثور على المستخدم الآخر في المحادثة
    const currentUserId = (currentUser && typeof currentUser === 'object' && 'id' in currentUser && currentUser.id) ? currentUser.id as string : '';
    const otherUserId = currentChatForCall.participants?.find((id: string) => id !== currentUserId);
    if (!otherUserId) {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على المستخدم للاتصال به",
        variant: "destructive",
      });
      return;
    }

    console.log('📞 بدء مكالمة مع:', otherUserId);
    voiceCalls.startCall(otherUserId, 'voice');
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
    try {
      setReplyingTo(message);
      toast({
        title: "رد على الرسالة",
        description: `سيتم الرد على رسالة ${message.sender?.name || 'المرسل'}`,
      });
    } catch (error) {
      console.error("خطأ في بدء الرد على الرسالة:", error);
      toast({
        title: "خطأ",
        description: "حصل خطأ أثناء بدء الرد على الرسالة",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (message: Message) => {
    try {
      const newContent = prompt("تحرير الرسالة:", message.content || "");
      if (newContent && newContent.trim() !== message.content) {
        editMessageMutation.mutate({ messageId: message.id, content: newContent.trim() });
      }
    } catch (error) {
      console.error("خطأ في تعديل الرسالة:", error);
      toast({
        title: "خطأ في التعديل",
        description: "حصل خطأ أثناء محاولة تعديل الرسالة",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (messageId: string) => {
    try {
      if (confirm("هل أنت متأكد من حذف هذه الرسالة؟")) {
        deleteMessageMutation.mutate(messageId);
      }
    } catch (error) {
      console.error("خطأ في حذف الرسالة:", error);
      toast({
        title: "خطأ في الحذف",
        description: "حصل خطأ أثناء محاولة حذف الرسالة",
        variant: "destructive",
      });
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

  const currentChat = chats?.find((chat: any) => chat?.id === chatId);
  const chatDisplayName = currentChat?.isGroup 
    ? currentChat?.name || "مجموعة"
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
            <div className="flex items-center gap-2">
              <h2 className="font-medium text-gray-900 dark:text-gray-100" data-testid="chat-header-name">
                {chatDisplayName}
              </h2>
              {!currentChat?.isGroup && currentChat?.otherParticipant?.isVerified && (
                <VerifiedBadge className="w-5 h-5" variant="default" title="حساب موثق ⭐" />
              )}
            </div>
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
          <FeatureGuard feature="voice_calls">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleStartCall()}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 mobile-touch-target"
              data-testid="button-call"
            >
              <Phone className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                toast({
                  title: "مكالمات الفيديو",
                  description: "ميزة مكالمات الفيديو ستكون متاحة قريباً!",
                });
              }}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 mobile-touch-target hidden sm:flex"
              data-testid="button-video-call"
            >
              <Video className="h-5 w-5" />
            </Button>
          </FeatureGuard>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              toast({
                title: "خيارات إضافية",
                description: "المزيد من الخيارات ستكون متاحة قريباً!",
              });
            }}
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
          messages?.filter(Boolean)?.map((message: ChatMessage) => message && (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === ((currentUser && typeof currentUser === 'object' && 'id' in currentUser && currentUser.id) ? currentUser.id : '')}
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
            onClick={() => setShowStickers(!showStickers)}
            className={`mobile-touch-target ${
              showStickers 
                ? 'text-[var(--whatsapp-primary)] bg-[var(--whatsapp-primary)]/10' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
            data-testid="button-stickers"
          >
            <span className="text-lg">😊</span>
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
              <div className={`absolute -top-14 left-0 right-0 p-3 rounded-xl text-center transition-all duration-300 transform ${
                isDraggedForCancel 
                  ? 'bg-gray-500 shadow-lg scale-105' 
                  : 'bg-red-500 shadow-xl scale-105'
              } text-white animate-in slide-in-from-bottom-2`}>
                <div className="flex items-center justify-center space-x-2 space-x-reverse">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${
                    isDraggedForCancel ? 'bg-gray-200' : 'bg-white'
                  }`}></div>
                  <span className="text-sm font-medium">
                    {isDraggedForCancel 
                      ? '← اسحب لليسار للإلغاء' 
                      : `🎙️ تسجيل... ${formatRecordingTime(recordingTime)}`
                    }
                  </span>
                  {!isDraggedForCancel && (
                    <div className="flex space-x-1 items-end">
                      <div className="w-1 bg-white rounded-full animate-wave animation-delay-0"></div>
                      <div className="w-1 bg-white rounded-full animate-wave animation-delay-75"></div>
                      <div className="w-1 bg-white rounded-full animate-wave animation-delay-150"></div>
                      <div className="w-1 bg-white rounded-full animate-wave animation-delay-300"></div>
                      <div className="w-1 bg-white rounded-full animate-wave animation-delay-150"></div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <Input
              type="text"
              placeholder={
                isRequestingMic ? "جاري تجهيز الميكروفون..." : 
                isRecording ? "جاري التسجيل..." : 
                "اكتب رسالة..."
              }
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full py-2 sm:py-3 px-4 sm:px-5 focus:border-[var(--whatsapp-primary)] focus:bg-white dark:focus:bg-gray-600 text-base"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sendMessageMutation.isPending || isRecording || isRequestingMic}
              data-testid="input-message"
            />
          </div>
          
          {/* زر ديناميكي واحد مثل WhatsApp */}
          {messageText.trim() ? (
            <Button
              onClick={handleSendMessage}
              disabled={sendMessageMutation.isPending}
              className="bg-[var(--whatsapp-primary)] hover:bg-[var(--whatsapp-secondary)] text-white p-2 sm:p-3 rounded-full shadow-lg mobile-touch-target transition-all duration-200 transform hover:scale-105 active:scale-95"
              size="icon"
              data-testid="button-send"
            >
              <Send className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onMouseDown={(e) => {
                e.preventDefault();
                debounceTimerRef.current = setTimeout(() => {
                  startRecording(e);
                }, 50); // Small debounce for better UX
              }}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={(e) => {
                e.preventDefault();
                debounceTimerRef.current = setTimeout(() => {
                  startRecording(e);
                }, 50);
              }}
              onTouchEnd={stopRecording}
              onTouchMove={handleDragMove}
              disabled={isRequestingMic}
              className={`mobile-touch-target p-2 sm:p-3 rounded-full shadow-lg transition-all duration-200 transform ${
                isRecording
                  ? isDraggedForCancel
                    ? "bg-gray-500 text-white hover:bg-gray-600 scale-110 shadow-xl animate-bounce"
                    : "bg-red-500 text-white hover:bg-red-600 scale-110 shadow-xl animate-pulse"
                  : isRequestingMic
                    ? "bg-blue-500 text-white opacity-75 scale-105"
                    : "bg-[var(--whatsapp-primary)] hover:bg-[var(--whatsapp-secondary)] text-white hover:scale-110 active:scale-95 shadow-md hover:shadow-lg"
              }`}
              data-testid="button-voice"
            >
              {isRequestingMic ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : isRecording ? (
                isDraggedForCancel ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Square className="h-4 w-4" />
                )
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>

        {/* Stickers Panel */}
        {showStickers && (
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">الملصقات المجانية</h3>
              
              {/* Stickers by Category */}
              {stickers.length > 0 ? (
                <div className="space-y-4">
                  {/* Emotions Category */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">🙂 التعابير والوجوه</h4>
                    <div className="grid grid-cols-8 gap-1">
                      {stickers.filter(s => s.category === 'emotions').slice(0, 24).map((sticker) => (
                        <button
                          key={sticker.id}
                          onClick={() => sendSticker(sticker)}
                          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-2xl flex items-center justify-center"
                          title={sticker.name}
                          data-testid={`sticker-${sticker.id}`}
                        >
                          {sticker.imageUrl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hearts Category */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">❤️ القلوب والحب</h4>
                    <div className="grid grid-cols-8 gap-1">
                      {stickers.filter(s => s.category === 'hearts').slice(0, 16).map((sticker) => (
                        <button
                          key={sticker.id}
                          onClick={() => sendSticker(sticker)}
                          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-2xl flex items-center justify-center"
                          title={sticker.name}
                          data-testid={`sticker-${sticker.id}`}
                        >
                          {sticker.imageUrl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hands Category */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">👋 الأيدي والإيماءات</h4>
                    <div className="grid grid-cols-8 gap-1">
                      {stickers.filter(s => s.category === 'hands').slice(0, 16).map((sticker) => (
                        <button
                          key={sticker.id}
                          onClick={() => sendSticker(sticker)}
                          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-2xl flex items-center justify-center"
                          title={sticker.name}
                          data-testid={`sticker-${sticker.id}`}
                        >
                          {sticker.imageUrl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Animals Category */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">🐶 الحيوانات</h4>
                    <div className="grid grid-cols-8 gap-1">
                      {stickers.filter(s => s.category === 'animals').slice(0, 16).map((sticker) => (
                        <button
                          key={sticker.id}
                          onClick={() => sendSticker(sticker)}
                          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-2xl flex items-center justify-center"
                          title={sticker.name}
                          data-testid={`sticker-${sticker.id}`}
                        >
                          {sticker.imageUrl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Food Category */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">🍎 الطعام والمشروبات</h4>
                    <div className="grid grid-cols-8 gap-1">
                      {stickers.filter(s => s.category === 'food').slice(0, 16).map((sticker) => (
                        <button
                          key={sticker.id}
                          onClick={() => sendSticker(sticker)}
                          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-2xl flex items-center justify-center"
                          title={sticker.name}
                          data-testid={`sticker-${sticker.id}`}
                        >
                          {sticker.imageUrl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sports Category */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">⚽ الرياضة والأنشطة</h4>
                    <div className="grid grid-cols-8 gap-1">
                      {stickers.filter(s => s.category === 'sports').slice(0, 16).map((sticker) => (
                        <button
                          key={sticker.id}
                          onClick={() => sendSticker(sticker)}
                          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-2xl flex items-center justify-center"
                          title={sticker.name}
                          data-testid={`sticker-${sticker.id}`}
                        >
                          {sticker.imageUrl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Business Category */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">💰 الأعمال والمال</h4>
                    <div className="grid grid-cols-8 gap-1">
                      {stickers.filter(s => s.category === 'business').slice(0, 16).map((sticker) => (
                        <button
                          key={sticker.id}
                          onClick={() => sendSticker(sticker)}
                          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-2xl flex items-center justify-center"
                          title={sticker.name}
                          data-testid={`sticker-${sticker.id}`}
                        >
                          {sticker.imageUrl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Flags Category */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">🇸🇦 الأعلام العربية</h4>
                    <div className="grid grid-cols-8 gap-1">
                      {stickers.filter(s => s.category === 'flags').map((sticker) => (
                        <button
                          key={sticker.id}
                          onClick={() => sendSticker(sticker)}
                          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-2xl flex items-center justify-center"
                          title={sticker.name}
                          data-testid={`sticker-${sticker.id}`}
                        >
                          {sticker.imageUrl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  جاري تحميل الملصقات...
                </div>
              )}
            </div>
          </div>
        )}
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

      {/* Voice Call Component */}
      <FeatureGuard feature="voice_calls">
        {voiceCalls.isCallModalOpen && voiceCalls.activeCall && (
          <VoiceCall
            call={voiceCalls.activeCall}
            currentUser={currentUser as any}
            onAccept={() => voiceCalls.acceptCall(voiceCalls.activeCall!.id)}
            onReject={() => voiceCalls.rejectCall(voiceCalls.activeCall!.id)}
            onEnd={() => voiceCalls.endCall(voiceCalls.activeCall!.id)}
            onClose={voiceCalls.closeCallModal}
            isAccepting={voiceCalls.isAcceptingCall}
            isRejecting={voiceCalls.isRejectingCall}
            isEnding={voiceCalls.isEndingCall}
          />
        )}
      </FeatureGuard>
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
