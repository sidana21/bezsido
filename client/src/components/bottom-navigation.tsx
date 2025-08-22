import { useLocation } from "wouter";
import { Link } from "wouter";
import { MessageSquare, Users, TrendingUp, Store, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

export function BottomNavigation() {
  const [location] = useLocation();
  
  const { data: cartItems = [] } = useQuery<any[]>({
    queryKey: ["/api/cart"],
  });

  const navItems = [
    {
      label: "المحدثات",
      icon: MessageSquare,
      href: "/",
      isActive: location === "/",
    },
    {
      label: "الحالات", 
      icon: Users,
      href: "/status",
      isActive: location === "/status",
    },
    {
      label: "المتاجر",
      icon: Store,
      href: "/stores",
      isActive: location === "/stores" || location === "/my-store",
    },
    {
      label: "السلة",
      icon: ShoppingCart,
      href: "/cart",
      isActive: location === "/cart" || location === "/orders",
      badge: cartItems.length > 0 ? cartItems.length : undefined,
    },
    {
      label: "التسويق",
      icon: TrendingUp,
      href: "/affiliate",
      isActive: location === "/affiliate",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="px-1">
        <nav className="flex justify-around items-center h-18 min-h-[72px] py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all duration-200 min-h-[56px] min-w-[56px] active:scale-95 touch-none relative",
                  item.isActive 
                    ? "text-whatsapp-green bg-green-50 dark:bg-green-950/30 scale-105" 
                    : "text-gray-600 dark:text-gray-400 hover:text-whatsapp-green hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
                data-testid={`nav-${item.label}`}
              >
                <div className="relative">
                  <Icon className="w-7 h-7 mb-1" />
                  {(item as any).badge && (
                    <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center p-0">
                      {(item as any).badge}
                    </Badge>
                  )}
                </div>
                <span className="text-sm font-semibold tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}