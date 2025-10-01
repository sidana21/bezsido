import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/use-notifications";
import { useState } from "react";
import { NotificationsListModal } from "@/components/notifications-list-modal";
import { NotificationsSettingsModal } from "@/components/notifications-settings-modal";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title?: string;
  className?: string;
}

export function TopBar({ title, className }: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <>
      <div 
        className={cn(
          "fixed top-0 left-0 right-0 z-40 bg-[#075e54] dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800",
          className
        )}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {title && (
              <h1 className="text-xl font-bold text-white dark:text-white">
                {title}
              </h1>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(true)}
              className="relative text-white hover:bg-white hover:bg-opacity-20"
              data-testid="button-notifications"
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 bg-red-500 text-white border-2 border-[#075e54] dark:border-gray-900 min-w-[20px] h-5 flex items-center justify-center px-1"
                  data-testid="badge-notification-count"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      <NotificationsListModal 
        open={showNotifications}
        onOpenChange={setShowNotifications}
        onOpenSettings={() => {
          setShowNotifications(false);
          setShowSettings(true);
        }}
      />
      
      <NotificationsSettingsModal 
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </>
  );
}
