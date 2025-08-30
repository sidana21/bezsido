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
      // صوت إشعار محسن ومناسب للتطبيقات العربية
      soundRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjibzvPfiTcIG2m98OScTQwNUarm7blsGws5n9P1vmocBjiAyfTakTsIGGm98OScTQwNUarm7bhkHA=');
      soundRef.current.volume = soundVolume;
      
      // تحسين توافق المتصفحات
      soundRef.current.preload = 'auto';
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
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  // تشغيل الإشعارات عند تغيير عدد الرسائل غير المقروءة
  useEffect(() => {
    const currentUnreadCount = unreadData?.unreadCount || 0;
    
    // إذا ازداد عدد الرسائل غير المقروءة
    if (currentUnreadCount > lastUnreadCountRef.current && currentUnreadCount > 0) {
      playNotificationSound();
      showBrowserNotification(currentUnreadCount);
    }
    
    lastUnreadCountRef.current = currentUnreadCount;
  }, [unreadData?.unreadCount]);

  const playNotificationSound = useCallback(() => {
    if (enableSound && soundRef.current) {
      soundRef.current.play().catch(err => {
        console.log('لا يمكن تشغيل صوت الإشعار:', err);
      });
    }
  }, [enableSound]);

  const showBrowserNotification = useCallback((unreadCount: number) => {
    if (enableBrowserNotifications && 'Notification' in window && Notification.permission === 'granted') {
      // تجنب عرض الإشعار إذا كانت النافذة مفتوحة ومرئية
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        return;
      }

      const title = `رسائل جديدة في BizChat`;
      const body = unreadCount === 1 
        ? 'لديك رسالة جديدة واحدة'
        : `لديك ${unreadCount} رسائل جديدة`;

      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'bizchat-messages', // لتجنب تكرار الإشعارات
        requireInteraction: false,
        silent: false,
      });

      // إغلاق الإشعار تلقائياً بعد 5 ثواني
      setTimeout(() => {
        notification.close();
      }, 5000);

      // التركيز على النافذة عند النقر على الإشعار
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }, [enableBrowserNotifications]);

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