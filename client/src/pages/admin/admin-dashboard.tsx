import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Store, 
  ShoppingCart, 
  CheckCircle, 
  TrendingUp,
  Clock,
  UserCheck,
  DollarSign
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/admin-layout';

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

export function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/dashboard-stats'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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
      </div>
    </AdminLayout>
  );
}