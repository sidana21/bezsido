import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bell, Heart, MessageCircle, UserPlus, X, Trash2, Settings } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface NotificationsListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenSettings: () => void;
}

interface SocialNotification {
  id: string;
  type: string;
  fromUserId: string;
  fromUserName?: string;
  fromUserAvatar?: string;
  postId?: string;
  postContent?: string;
  createdAt: string;
  isRead: boolean;
}

export function NotificationsListModal({ open, onOpenChange, onOpenSettings }: NotificationsListModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // جلب قائمة الإشعارات الاجتماعية
  const { data: notificationsResponse, isLoading } = useQuery<{
    notifications: SocialNotification[];
    unreadCount: number;
  }>({
    queryKey: ["/api/notifications/social"],
    enabled: open,
    refetchInterval: open ? 5000 : false,
  });

  // دالة لتحديد نوع الإشعار
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  // دالة لتحديد نص الإشعار
  const getNotificationText = (notification: SocialNotification) => {
    const userName = notification.fromUserName || "مستخدم";
    switch (notification.type) {
      case 'like':
        return `أعجب ${userName} بمنشورك`;
      case 'comment':
        return `علق ${userName} على منشورك`;
      case 'follow':
        return `بدأ ${userName} بمتابعتك`;
      default:
        return `إشعار جديد من ${userName}`;
    }
  };

  // دالة للانتقال إلى ملف المستخدم الشخصي
  const handleUserClick = (userId: string) => {
    setLocation(`/profile/${userId}`);
    onOpenChange(false);
  };

  // دالة لتمييز الإشعار كمقروء
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => 
      apiRequest(`/api/notifications/social/${notificationId}/read`, {
        method: 'POST'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/social"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/social/unread-count"] });
    },
  });

  // دالة لحذف الإشعار
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => 
      apiRequest(`/api/notifications/social/${notificationId}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/social"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/social/unread-count"] });
      toast({
        title: "تم حذف الإشعار",
        description: "تم حذف الإشعار بنجاح",
      });
    },
  });

  // دالة للانتقال إلى المنشور
  const handlePostClick = (postId: string, notificationId: string) => {
    if (postId) {
      setLocation(`/social-feed`);
      onOpenChange(false);
      
      // تمييز كمقروء
      if (!notificationsResponse?.notifications.find(n => n.id === notificationId)?.isRead) {
        markAsReadMutation.mutate(notificationId);
      }
    }
  };

  const notifications = notificationsResponse?.notifications || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full mx-auto max-h-[80vh] p-0">
        <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              الإشعارات
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenSettings}
                className="h-8 w-8 p-0"
                data-testid="button-notification-settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0"
                data-testid="button-close-notifications"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-0">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">جاري تحميل الإشعارات...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">لا توجد إشعارات حالياً</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* أيقونة نوع الإشعار */}
                      <div className="flex-shrink-0 pt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* صورة المستخدم */}
                      <button
                        onClick={() => handleUserClick(notification.fromUserId)}
                        className="flex-shrink-0 hover:scale-105 transition-transform"
                        data-testid={`avatar-${notification.fromUserId}`}
                      >
                        <Avatar className="h-10 w-10 border-2 border-white dark:border-gray-700 shadow-sm">
                          <AvatarImage src={notification.fromUserAvatar} />
                          <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-blue-500 text-white font-semibold">
                            {notification.fromUserName?.charAt(0) || 'م'}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                      
                      {/* محتوى الإشعار */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => {
                              if (notification.postId) {
                                handlePostClick(notification.postId, notification.id);
                              } else {
                                handleUserClick(notification.fromUserId);
                              }
                            }}
                            className="text-right flex-1 hover:opacity-80 transition-opacity"
                            data-testid={`notification-${notification.id}`}
                          >
                            <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                              {getNotificationText(notification)}
                            </p>
                            {notification.postContent && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                {notification.postContent}
                              </p>
                            )}
                          </button>
                          
                          {/* أزرار الإجراءات */}
                          <div className="flex items-center gap-1 ml-2">
                            {!notification.isRead && (
                              <Badge className="bg-blue-500 text-white text-xs h-2 w-2 rounded-full p-0" />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotificationMutation.mutate(notification.id);
                              }}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                              data-testid={`delete-notification-${notification.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* وقت الإشعار */}
                        <p className="text-xs text-gray-400 mt-1 text-right">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: ar,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}