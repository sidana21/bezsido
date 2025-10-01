import { useRef, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import notificationSound from '../assets/notification.mp3';

interface NotificationOptions {
  enableSound?: boolean;
  enableBrowserNotifications?: boolean;
  soundVolume?: number;
}

// قراءة الإعدادات من localStorage
function getNotificationSettings() {
  try {
    const settings = localStorage.getItem('bizchat_notification_settings');
    if (settings) {
      return JSON.parse(settings);
    }
  } catch (error) {
    console.log('خطأ في قراءة إعدادات الإشعارات:', error);
  }
  return null;
}

export function useNotifications(options: NotificationOptions = {}) {
  const savedSettings = getNotificationSettings();
  
  const {
    enableSound = savedSettings?.enableSound ?? true,
    enableBrowserNotifications = savedSettings?.enableBrowserNotifications ?? true,
    soundVolume = savedSettings?.soundVolume ? savedSettings.soundVolume / 100 : 0.6
  } = options;

  const soundRef = useRef<HTMLAudioElement | null>(null);
  const lastUnreadCountRef = useRef<number>(0);
  const lastSocialUnreadCountRef = useRef<number>(0);
  const queryClient = useQueryClient();
  const hasUserInteractedRef = useRef<boolean>(false);

  // إنشاء صوت الإشعار
  useEffect(() => {
    if (enableSound) {
      try {
        // استخدام الملف المستورد من assets مباشرة لضمان الاستقرار
        soundRef.current = new Audio(notificationSound);
        soundRef.current.volume = soundVolume;
        soundRef.current.preload = 'auto';
        
        // تسجيل أحداث التحميل والأخطاء
        soundRef.current.addEventListener('loadstart', () => {
          console.log('🔊 بدأ تحميل صوت الإشعار...');
        }, { once: true });
        
        soundRef.current.addEventListener('canplaythrough', () => {
          console.log('✅ تم تحميل صوت الإشعار بنجاح وجاهز للتشغيل');
        }, { once: true });
        
        soundRef.current.addEventListener('error', (e) => {
          console.log('❌ فشل تحميل صوت الإشعار:', e);
          // استخدام الرنة الافتراضية كحل بديل
          try {
            soundRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjibzvPfiTcIG2m98OScTQwNUarm7blsGws5n9P1vmocBjiAyfTakTsIGGm98OScTQwNUarm7bhkHA=');
            soundRef.current.volume = soundVolume;
            soundRef.current.preload = 'auto';
            console.log('🔄 تم التبديل إلى الرنة الافتراضية');
          } catch (fallbackError) {
            console.log('❌ فشل تحميل الرنة الافتراضية أيضاً:', fallbackError);
          }
        }, { once: true });
        
      } catch (error) {
        console.log('❌ تعذر تحميل صوت الإشعار:', error);
      }
    }
  }, [enableSound, soundVolume]);

  // طلب إذن الإشعارات من المتصفح وتسجيل التفاعل مع المستخدم
  useEffect(() => {
    if (enableBrowserNotifications && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    // تسجيل التفاعل مع المستخدم لتمكين الصوت
    const enableAudio = () => {
      hasUserInteractedRef.current = true;
    };

    // إضافة مستمعات للأحداث للكشف عن تفاعل المستخدم
    window.addEventListener('click', enableAudio, { once: true });
    window.addEventListener('keydown', enableAudio, { once: true });
    window.addEventListener('touchstart', enableAudio, { once: true });

    return () => {
      window.removeEventListener('click', enableAudio);
      window.removeEventListener('keydown', enableAudio);
      window.removeEventListener('touchstart', enableAudio);
    };
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

  // الحصول على عدد الإشعارات الاجتماعية غير المقروءة
  const { data: socialUnreadCountData } = useQuery<{ unreadCount: number }>({
    queryKey: ['/api/notifications/social/unread-count'],
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: false, // تجنب إعادة المحاولة عند فشل الطلب
  });

  // الحصول على آخر الإشعارات الاجتماعية لعرض التفاصيل
  const { data: recentSocialNotifications } = useQuery<Array<{id: string, type: string, fromUserId: string, message: string, title: string, createdAt: string}>>({
    queryKey: ['/api/notifications/social'],
    refetchInterval: 5000, // تحديث كل 5 ثواني للإشعارات الاجتماعية
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const playNotificationSound = useCallback(() => {
    if (enableSound && soundRef.current && hasUserInteractedRef.current) {
      // إعادة تعيين الصوت إلى البداية
      soundRef.current.currentTime = 0;
      
      // محاولة تشغيل الصوت
      const playPromise = soundRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ تم تشغيل صوت الإشعار بنجاح');
          })
          .catch(err => {
            console.log('❌ لا يمكن تشغيل صوت الإشعار:', err);
            console.log('نوع الخطأ:', err.name);
            console.log('رسالة الخطأ:', err.message);
            
            if (err.name === 'NotAllowedError') {
              console.log('⚠️ يحتاج المستخدم إلى التفاعل مع الصفحة أولاً لتمكين الصوت');
            }
          });
      }
    } else if (enableSound && !hasUserInteractedRef.current) {
      console.log('⚠️ في انتظار تفاعل المستخدم مع الصفحة لتمكين الصوت');
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

  const showSocialBrowserNotification = useCallback((notification: {type: string, message: string, title: string}) => {
    if (enableBrowserNotifications && 'Notification' in window && Notification.permission === 'granted') {
      let title = '';
      let body = notification.message;
      let icon = '🔔';

      // تحديد نوع الإشعار والأيقونة المناسبة
      switch (notification.type) {
        case 'like':
          title = '👍 إعجاب جديد';
          icon = '👍';
          break;
        case 'comment':
          title = '💬 تعليق جديد';
          icon = '💬';
          break;
        case 'follow':
          title = '👥 متابع جديد';
          icon = '👥';
          break;
        default:
          title = '🔔 إشعار جديد';
      }

      const browserNotification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'bizchat-social', // لتجنب تكرار الإشعارات الاجتماعية
        requireInteraction: false,
        silent: false,
      });

      // إغلاق الإشعار تلقائياً بعد 5 ثواني
      setTimeout(() => {
        browserNotification.close();
      }, 5000);

      // التركيز على النافذة عند النقر على الإشعار
      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
      };
    }
  }, [enableBrowserNotifications]);

  // تشغيل الإشعارات عند تغيير عدد الرسائل غير المقروءة أو الإشعارات الاجتماعية
  useEffect(() => {
    try {
      const currentUnreadCount = unreadData?.unreadCount || 0;
      const currentSocialUnreadCount = socialUnreadCountData?.unreadCount || 0;
      const totalUnreadCount = currentUnreadCount + currentSocialUnreadCount;
      
      const latestMessage = recentMessages && Array.isArray(recentMessages) && recentMessages.length > 0 
        ? recentMessages[recentMessages.length - 1] 
        : undefined;
        
      const latestSocialNotification = recentSocialNotifications && Array.isArray(recentSocialNotifications) && recentSocialNotifications.length > 0
        ? recentSocialNotifications[0] // الأحدث أولاً
        : undefined;
      
      // إذا ازداد عدد الرسائل غير المقروءة
      if (currentUnreadCount > lastUnreadCountRef.current && currentUnreadCount > 0) {
        console.log('🔔 رسالة جديدة غير مقروءة، تشغيل الإشعار...');
        
        // تشغيل الصوت بشكل آمن
        try {
          playNotificationSound();
        } catch (soundError) {
          console.warn('تعذر تشغيل صوت الإشعار:', soundError);
        }
        
        // إظهار إشعار المتصفح بشكل آمن
        try {
          showBrowserNotification(currentUnreadCount, latestMessage);
        } catch (notificationError) {
          console.warn('تعذر إظهار إشعار المتصفح:', notificationError);
        }
      }
      
      // إذا ازداد عدد الإشعارات الاجتماعية غير المقروءة
      if (currentSocialUnreadCount > lastSocialUnreadCountRef.current && currentSocialUnreadCount > 0 && latestSocialNotification) {
        console.log('🔔 إشعار اجتماعي جديد، تشغيل الإشعار...');
        
        // تشغيل الصوت بشكل آمن
        try {
          playNotificationSound();
        } catch (soundError) {
          console.warn('تعذر تشغيل صوت الإشعار:', soundError);
        }
        
        // إظهار إشعار المتصفح للإشعارات الاجتماعية
        try {
          showSocialBrowserNotification(latestSocialNotification);
        } catch (notificationError) {
          console.warn('تعذر إظهار إشعار المتصفح الاجتماعي:', notificationError);
        }
      }
      
      lastUnreadCountRef.current = currentUnreadCount;
      lastSocialUnreadCountRef.current = currentSocialUnreadCount;
    } catch (error) {
      console.error('خطأ في معالجة الإشعارات:', error);
    }
  }, [unreadData?.unreadCount, socialUnreadCountData?.unreadCount, recentMessages, recentSocialNotifications, playNotificationSound, showBrowserNotification, showSocialBrowserNotification]);

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
    socialUnreadCount: socialUnreadCountData?.unreadCount || 0,
    totalUnreadCount: (unreadData?.unreadCount || 0) + (socialUnreadCountData?.unreadCount || 0),
    socialNotifications: recentSocialNotifications || [],
    playNotificationSound,
    showBrowserNotification,
    showSocialBrowserNotification,
    refreshUnreadCount: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats/unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/social/unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/social'] });
    }
  };
}