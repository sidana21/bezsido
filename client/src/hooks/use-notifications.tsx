import { useRef, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface NotificationOptions {
  enableSound?: boolean;
  enableBrowserNotifications?: boolean;
  soundVolume?: number;
}

export function useNotifications(options: NotificationOptions = {}) {
  const {
    enableSound = true,
    enableBrowserNotifications = true,
    soundVolume = 0.6
  } = options;

  const soundRef = useRef<HTMLAudioElement | null>(null);
  const lastUnreadCountRef = useRef<number>(0);
  const queryClient = useQueryClient();

  // إنشاء صوت الإشعار
  useEffect(() => {
    if (enableSound) {
      // استخدام الرنة الجديدة المخصصة
      try {
        soundRef.current = new Audio('/sounds/notification.mp3');
        soundRef.current.volume = soundVolume;
        soundRef.current.preload = 'auto';
      } catch (error) {
        console.log('تعذر تحميل الرنة المخصصة، استخدام الافتراضية');
        // استخدام الرنة الافتراضية كحل بديل
        soundRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjibzvPfiTcIG2m98OScTQwNUarm7blsGws5n9P1vmocBjiAyfTakTsIGGm98OScTQwNUarm7bhkHA=');
        soundRef.current.volume = soundVolume;
        soundRef.current.preload = 'auto';
      }
    }
  }, [enableSound, soundVolume]);

  // طلب إذن الإشعارات من المتصفح
  useEffect(() => {
    if (enableBrowserNotifications && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [enableBrowserNotifications]);

  // الحصول على عدد الرسائل غير المقروءة
  const { data: unreadData } = useQuery<{ unreadCount: number }>({
    queryKey: ['/api/chats/unread-count'],
    refetchInterval: 3000, // تحديث كل 3 ثواني
    refetchIntervalInBackground: true, // تفعيل التحديث في الخلفية
    refetchOnWindowFocus: true,
  });

  // الحصول على آخر الرسائل لعرض تفاصيل المرسل
  const { data: recentMessages } = useQuery<Array<{id: string, senderId: string, senderName: string, content: string, chatId: string}>>({
    queryKey: ['/api/chats/recent-messages'],
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const playNotificationSound = useCallback(() => {
    if (enableSound && soundRef.current) {
      soundRef.current.play().catch(err => {
        console.log('لا يمكن تشغيل صوت الإشعار:', err);
      });
    }
  }, [enableSound]);

  const showBrowserNotification = useCallback((unreadCount: number, latestMessage?: {senderName: string, content: string}) => {
    if (enableBrowserNotifications && 'Notification' in window && Notification.permission === 'granted') {
      // عرض الإشعار حتى لو كانت النافذة مفتوحة (كما طلب المستخدم)
      // لكن نتجنب العرض فقط إذا كان المستخدم في نفس المحادثة
      const currentPath = window.location.pathname;
      const isInCurrentChat = currentPath.includes('/chat/') && latestMessage;
      
      if (isInCurrentChat) {
        return; // لا نعرض إشعار إذا كان في نفس المحادثة
      }

      let title = `رسالة جديدة في BizChat`;
      let body = '';

      if (latestMessage) {
        title = `رسالة من ${latestMessage.senderName}`;
        body = latestMessage.content.length > 50 
          ? latestMessage.content.substring(0, 50) + '...'
          : latestMessage.content;
      } else {
        body = unreadCount === 1 
          ? 'لديك رسالة جديدة واحدة'
          : `لديك ${unreadCount} رسائل جديدة`;
      }

      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'bizchat-messages', // لتجنب تكرار الإشعارات
        requireInteraction: false,
        silent: false,
      });

      // إغلاق الإشعار تلقائياً بعد 7 ثواني
      setTimeout(() => {
        notification.close();
      }, 7000);

      // التركيز على النافذة عند النقر على الإشعار
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }, [enableBrowserNotifications]);

  // تشغيل الإشعارات عند تغيير عدد الرسائل غير المقروءة
  useEffect(() => {
    const currentUnreadCount = unreadData?.unreadCount || 0;
    const latestMessage = recentMessages && recentMessages.length > 0 
      ? recentMessages[recentMessages.length - 1] 
      : undefined;
    
    // إذا ازداد عدد الرسائل غير المقروءة
    if (currentUnreadCount > lastUnreadCountRef.current && currentUnreadCount > 0) {
      playNotificationSound();
      showBrowserNotification(currentUnreadCount, latestMessage);
    }
    
    lastUnreadCountRef.current = currentUnreadCount;
  }, [unreadData?.unreadCount, recentMessages, playNotificationSound, showBrowserNotification]);

  // تنظيف الموارد
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.pause();
        soundRef.current = null;
      }
    };
  }, []);

  return {
    unreadCount: unreadData?.unreadCount || 0,
    playNotificationSound,
    showBrowserNotification,
    refreshUnreadCount: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats/unread-count'] });
    }
  };
}