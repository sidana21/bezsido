import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  ShoppingCart, 
  CheckCircle, 
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    {
      title: 'لوحة التحكم',
      icon: LayoutDashboard,
      href: '/admin',
    },
    {
      title: 'طلبات التوثيق',
      icon: CheckCircle,
      href: '/admin/verification-requests',
    },
    {
      title: 'إدارة المستخدمين',
      icon: Users,
      href: '/admin/users',
    },
    {
      title: 'إدارة المتاجر',
      icon: Store,
      href: '/admin/stores',
    },
    {
      title: 'إدارة الطلبات',
      icon: ShoppingCart,
      href: '/admin/orders',
    },
    {
      title: 'الإعدادات',
      icon: Settings,
      href: '/admin/settings',
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/admin/login';
  };

  const Sidebar = ({ mobile = false }) => (
    <div className={cn(
      "bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800",
      mobile ? "w-full" : "w-64"
    )}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          لوحة الإدارة
        </h2>
        {mobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            data-testid="close-sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location === item.href || 
            (item.href !== '/admin' && location.startsWith(item.href));
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2",
                  "text-right",
                  isActive && "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                )}
                data-testid={`nav-${item.href.split('/').pop()}`}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 right-0 left-0 p-4 border-t border-gray-200 dark:border-gray-800">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
          data-testid="logout-button"
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir="rtl">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            data-testid="open-sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            لوحة الإدارة
          </h1>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block fixed top-0 right-0 h-full">
          <Sidebar />
        </div>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <>
            <div 
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="lg:hidden fixed top-0 right-0 h-full w-80 z-50">
              <Sidebar mobile />
            </div>
          </>
        )}

        {/* Main Content */}
        <div className="flex-1 lg:mr-64">
          <main className="p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}