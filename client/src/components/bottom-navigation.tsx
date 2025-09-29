import { useState } from "react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { MessageSquare, Users, Phone, TrendingUp, Store, ShoppingCart, Sparkles, MapPin, Camera, Bell, BellDot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFeatures } from "@/hooks/use-features";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationsSettingsModal } from "./notifications-settings-modal";

export function BottomNavigation() {
  const [location] = useLocation();
  const { isFeatureEnabled } = useFeatures();
  const [showNotificationsSettings, setShowNotificationsSettings] = useState(false);
  
  const { data: cartItems = [] } = useQuery<any[]>({
    queryKey: ["/api/cart"],
  });

  // استخدام نظام الإشعارات الجديد (دردشة + اجتماعية)
  const { totalUnreadCount, socialUnreadCount } = useNotifications({
    enableSound: true,
    enableBrowserNotifications: true,
    soundVolume: 0.6
  });

  const allNavItems = [
    {
      label: "المحدثات",
      icon: MessageSquare,
      href: "/",
      isActive: location === "/",
      featureId: "messaging",
      badge: totalUnreadCount > 0 ? totalUnreadCount : undefined,
      color: "from-blue-500 to-cyan-600",
      activeColor: "from-blue-600 to-cyan-700"
    },
    {
      label: "الحالات", 
      icon: Users,
      href: "/status",
      isActive: location === "/status",
      featureId: "stories",
      color: "from-purple-500 to-pink-600",
      activeColor: "from-purple-600 to-pink-700",
      hasSpecialEffect: true
    },
    {
      label: "المكالمات",
      icon: Phone,
      href: "/calls",
      isActive: location === "/calls",
      featureId: "voice_calls",
      color: "from-green-500 to-emerald-600",
      activeColor: "from-green-600 to-emerald-700"
    },
    {
      label: "المتاجر",
      icon: Store,
      href: "/stores",
      isActive: location === "/stores" || location === "/my-store",
      featureId: "marketplace",
      color: "from-emerald-500 to-green-600",
      activeColor: "from-emerald-600 to-green-700"
    },
    {
      label: "السلة",
      icon: ShoppingCart,
      href: "/cart",
      isActive: location === "/cart" || location === "/orders",
      badge: cartItems.length > 0 ? cartItems.length : undefined,
      featureId: "cart",
      color: "from-orange-500 to-red-600",
      activeColor: "from-orange-600 to-red-700"
    },
    {
      label: "المنشورات",
      icon: Camera,
      href: "/social-feed",
      isActive: location === "/social-feed" || location.startsWith("/profile/"),
      featureId: "social_feed",
      badge: socialUnreadCount > 0 ? socialUnreadCount : undefined,
      color: "from-purple-500 to-pink-600",
      activeColor: "from-purple-600 to-pink-700"
    },
    {
      label: "التسويق",
      icon: TrendingUp,
      href: "/affiliate",
      isActive: location === "/affiliate",
      featureId: "affiliate",
      color: "from-indigo-500 to-purple-600",
      activeColor: "from-indigo-600 to-purple-700"
    },
  ];

  // Filter navigation items based on enabled features
  const navItems = allNavItems.filter(item => isFeatureEnabled(item.featureId));

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-t border-gray-200 dark:border-gray-700 z-50 backdrop-blur-lg">
        {/* خلفية متدرجة جميلة */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10"></div>
        
        {/* شريط الإشعارات العلوي */}
        <div className="relative px-4 py-2 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              بيز شات
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotificationsSettings(true)}
              className="h-8 px-2 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 relative"
              data-testid="button-notifications-settings"
            >
              {totalUnreadCount > 0 ? (
                <BellDot className="h-4 w-4 text-emerald-600" />
              ) : (
                <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              )}
              {totalUnreadCount > 0 && (
                <div className="absolute -top-1 -right-1">
                  <Badge className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center p-0 font-bold">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </Badge>
                </div>
              )}
            </Button>
          </div>
        </div>
        
        <div className="relative px-1">
        <nav className="flex justify-around items-center h-18 min-h-[72px] py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const itemProps = item as any;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-300 min-h-[56px] min-w-[56px] active:scale-95 touch-none relative group overflow-hidden",
                  item.isActive 
                    ? "text-white transform scale-110 shadow-2xl" 
                    : "text-gray-600 dark:text-gray-400 hover:scale-105 hover:shadow-lg"
                )}
                data-testid={`nav-${item.label}`}
              >
                {/* خلفية متدرجة للعنصر النشط */}
                {item.isActive && (
                  <>
                    <div className={`absolute inset-0 bg-gradient-to-br ${itemProps.activeColor} rounded-2xl shadow-xl`}></div>
                    <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse"></div>
                    <div className={`absolute -inset-1 bg-gradient-to-br ${itemProps.activeColor} rounded-2xl blur opacity-50 animate-pulse`}></div>
                  </>
                )}
                
                {/* خلفية للعنصر غير النشط */}
                {!item.isActive && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-gray-700/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm"></div>
                )}
                
                <div className="relative z-10">
                  <div className="relative flex items-center justify-center">
                    {/* أيقونة خاصة للحالات */}
                    {itemProps.hasSpecialEffect && !item.isActive && (
                      <div className="absolute inset-0 animate-spin-slow">
                        <Sparkles className="w-7 h-7 text-purple-500 opacity-30" />
                      </div>
                    )}
                    
                    {/* الأيقونة الرئيسية */}
                    <Icon className={cn(
                      "w-7 h-7 mb-1 transition-all duration-300",
                      item.isActive ? "text-white drop-shadow-lg" : "",
                      itemProps.hasSpecialEffect && !item.isActive ? "relative z-10" : ""
                    )} />
                    
                    {/* تأثير خاص للحالات */}
                    {itemProps.hasSpecialEffect && item.isActive && (
                      <>
                        <div className="absolute inset-0 animate-ping bg-white/30 rounded-full"></div>
                        <div className="absolute -inset-2 animate-pulse bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 blur-sm"></div>
                      </>
                    )}
                    
                    {/* الشارات */}
                    {itemProps.badge && (
                      <div className="absolute -top-1 -right-1 z-20">
                        <div className="relative">
                          <Badge className="bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center p-0 font-bold shadow-lg border-2 border-white">
                            {itemProps.badge}
                          </Badge>
                          <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-40"></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* النص */}
                  <span className={cn(
                    "text-xs font-bold tracking-tight transition-all duration-300 relative",
                    item.isActive 
                      ? "text-white drop-shadow-sm" 
                      : "text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200",
                    itemProps.hasSpecialEffect && item.isActive ? "animate-pulse" : ""
                  )}>
                    {item.label}
                    
                    {/* تأثير نص خاص للحالات */}
                    {itemProps.hasSpecialEffect && item.isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent animate-pulse font-extrabold">
                        {item.label}
                      </div>
                    )}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
      
        {/* خط متدرج سفلي */}
        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20"></div>
      </div>
      
      {/* حوار إعدادات الإشعارات */}
      <NotificationsSettingsModal
        open={showNotificationsSettings}
        onOpenChange={setShowNotificationsSettings}
      />
    </>
  );
}