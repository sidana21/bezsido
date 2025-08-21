import { useLocation } from "wouter";
import { Link } from "wouter";
import { MessageSquare, Users, Store } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNavigation() {
  const [location] = useLocation();

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
      isActive: location === "/stores",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="max-w-7xl mx-auto px-2">
        <nav className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors",
                  item.isActive 
                    ? "text-whatsapp-green bg-green-50 dark:bg-green-950/20" 
                    : "text-gray-600 dark:text-gray-400 hover:text-whatsapp-green hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
                data-testid={`nav-${item.label}`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}