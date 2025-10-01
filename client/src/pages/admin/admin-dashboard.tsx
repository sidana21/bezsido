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
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/dashboard-stats'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ['/api/admin/recent-activities'],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-yellow-600" />
                طلبات التوثيق المعلقة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-3xl font-bold text-yellow-600 mb-2">
                  {stats?.pendingVerifications || 0}
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  طلب في انتظار المراجعة
                </p>
                <a 
                  href="/admin/verification-requests"
                  className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                  data-testid="link-verification-requests"
                >
                  مراجعة الطلبات
                </a>
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