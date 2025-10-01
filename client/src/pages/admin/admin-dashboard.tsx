import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Store, 
  ShoppingCart, 
  CheckCircle, 
  TrendingUp,
  Clock,
  UserCheck,
  DollarSign,
  Bell,
  FileText,
  User,
  Ban
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

interface AdminStats {
  totalUsers: number;
  totalStores: number;
  totalOrders: number;
  pendingVerifications: number;
  recentOrders: number;
  totalRevenue: string;
  activeUsers: number;
  verifiedUsers: number;
}

interface Activity {
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
  link: string;
}

export function AdminDashboard() {
  const [previousPendingCount, setPreviousPendingCount] = React.useState<number | null>(null);
  const [hasPlayedSound, setHasPlayedSound] = React.useState(false);

  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/dashboard-stats'],
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Check every 30 seconds for new activities
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ['/api/admin/recent-activities'],
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Check every 30 seconds
  });

  // Play notification sound when new verification requests arrive
  React.useEffect(() => {
    if (stats?.pendingVerifications && previousPendingCount !== null) {
      if (stats.pendingVerifications > previousPendingCount && !hasPlayedSound) {
        // Play notification sound
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSyBzvLZiTYIGWi77eeeSwINUKXi8LZjHAU5ktjzy3gsBSN2yPDekEELFF+z6ey');
        audio.volume = 0.5;
        audio.play().catch(err => console.log('Could not play notification sound:', err));
        setHasPlayedSound(true);
        
        // Reset sound flag after 5 seconds
        setTimeout(() => setHasPlayedSound(false), 5000);
      }
    }
    setPreviousPendingCount(stats?.pendingVerifications ?? 0);
  }, [stats?.pendingVerifications, previousPendingCount, hasPlayedSound]);

  const getActivityIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      'user': User,
      'shopping-cart': ShoppingCart,
      'check-circle': CheckCircle,
      'file-text': FileText
    };
    return iconMap[iconName] || Bell;
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
      'blue': { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-600', border: 'border-blue-200' },
      'green': { bg: 'bg-green-50 dark:bg-green-950', text: 'text-green-600', border: 'border-green-200' },
      'yellow': { bg: 'bg-yellow-50 dark:bg-yellow-950', text: 'text-yellow-600', border: 'border-yellow-200' },
      'purple': { bg: 'bg-purple-50 dark:bg-purple-950', text: 'text-purple-600', border: 'border-purple-200' }
    };
    return colorMap[color] || colorMap['blue'];
  };

  const statCards = [
    {
      title: 'إجمالي المستخدمين',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      testId: 'stat-total-users'
    },
    {
      title: 'المستخدمون النشطون',
      value: stats?.activeUsers || 0,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
      testId: 'stat-active-users'
    },
    {
      title: 'المستخدمون الموثقون',
      value: stats?.verifiedUsers || 0,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950',
      testId: 'stat-verified-users'
    },
    {
      title: 'إجمالي المتاجر',
      value: stats?.totalStores || 0,
      icon: Store,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      testId: 'stat-total-stores'
    },
    {
      title: 'إجمالي الطلبات',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
      testId: 'stat-total-orders'
    },
    {
      title: 'طلبات اليوم',
      value: stats?.recentOrders || 0,
      icon: Clock,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950',
      testId: 'stat-recent-orders'
    },
    {
      title: 'طلبات التوثيق المعلقة',
      value: stats?.pendingVerifications || 0,
      icon: CheckCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
      testId: 'stat-pending-verifications'
    },
    {
      title: 'إجمالي الإيرادات',
      value: `${stats?.totalRevenue || '0'} دج`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
      testId: 'stat-total-revenue'
    },
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            لوحة التحكم
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            لوحة التحكم
          </h1>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            آخر تحديث: {new Date().toLocaleString('ar-DZ')}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${card.bgColor}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className={`text-2xl font-bold ${card.color}`}
                  data-testid={card.testId}
                >
                  {typeof card.value === 'string' ? card.value : card.value.toLocaleString('ar-DZ')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className={cn(
            "relative overflow-hidden transition-all duration-300",
            stats?.pendingVerifications && stats.pendingVerifications > 0 
              ? "ring-2 ring-yellow-500 ring-offset-2 shadow-xl" 
              : ""
          )}>
            {stats?.pendingVerifications && stats.pendingVerifications > 0 && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 animate-pulse"></div>
            )}
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-yellow-600" />
                  طلبات التوثيق المعلقة
                </div>
                {stats?.pendingVerifications && stats.pendingVerifications > 0 && (
                  <span className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    جديد
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className={cn(
                  "text-5xl font-bold mb-2",
                  stats?.pendingVerifications && stats.pendingVerifications > 0 
                    ? "text-yellow-600 animate-pulse" 
                    : "text-yellow-600"
                )}>
                  {stats?.pendingVerifications || 0}
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4 font-semibold">
                  {stats?.pendingVerifications === 0 
                    ? "لا توجد طلبات معلقة" 
                    : stats?.pendingVerifications === 1 
                    ? "طلب واحد في انتظار المراجعة" 
                    : `${stats?.pendingVerifications} طلبات في انتظار المراجعة`}
                </p>
                <Link href="/admin/verification-requests">
                  <button 
                    className={cn(
                      "inline-flex items-center px-6 py-3 rounded-md transition-all duration-300 font-bold",
                      stats?.pendingVerifications && stats.pendingVerifications > 0
                        ? "bg-yellow-600 text-white hover:bg-yellow-700 shadow-lg hover:shadow-xl"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    )}
                    data-testid="link-verification-requests"
                  >
                    {stats?.pendingVerifications && stats.pendingVerifications > 0 ? (
                      <>
                        <Bell className="h-5 w-5 ml-2 animate-bounce" />
                        مراجعة الطلبات الآن
                      </>
                    ) : (
                      <>مشاهدة الطلبات</>
                    )}
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                النشاط اليومي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    طلبات جديدة اليوم
                  </span>
                  <span className="font-semibold text-green-600">
                    {stats?.recentOrders || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    مستخدمون نشطون
                  </span>
                  <span className="font-semibold text-blue-600">
                    {stats?.activeUsers || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    معدل التوثيق
                  </span>
                  <span className="font-semibold text-purple-600">
                    {stats?.totalUsers 
                      ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100)
                      : 0
                    }%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities and Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              آخر الأنشطة والإشعارات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-3 p-3 border rounded-lg">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {activities.map((activity, index) => {
                  const IconComponent = getActivityIcon(activity.icon);
                  const colors = getColorClasses(activity.color);
                  
                  return (
                    <Link key={index} href={activity.link}>
                      <div 
                        className={`flex items-start gap-3 p-3 border ${colors.border} rounded-lg hover:shadow-md transition-shadow cursor-pointer`}
                        data-testid={`activity-${activity.type}-${index}`}
                      >
                        <div className={`p-2 rounded-full ${colors.bg}`}>
                          <IconComponent className={`h-5 w-5 ${colors.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-semibold ${colors.text}`}>
                            {activity.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {new Date(activity.timestamp).toLocaleString('ar-DZ')}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  لا توجد إشعارات حالياً
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}