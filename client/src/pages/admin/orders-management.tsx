import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Eye, Package, Truck, CheckCircle, XCircle, Clock, MapPin, Phone, User } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: string;
  totalPrice: string;
}

interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  storeId: string | null;
  status: 'pending' | 'confirmed' | 'prepared' | 'delivered' | 'cancelled';
  totalAmount: string;
  paymentMethod: string;
  deliveryAddress: string;
  customerPhone: string;
  customerName: string;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}

const statusConfig = {
  pending: { label: 'في الانتظار', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed: { label: 'مؤكد', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  prepared: { label: 'جاهز', color: 'bg-purple-100 text-purple-800', icon: Package },
  delivered: { label: 'تم التسليم', color: 'bg-green-100 text-green-800', icon: Truck },
  cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export function OrdersManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<OrdersResponse>({
    queryKey: ['/api/admin/orders', { 
      search: searchTerm, 
      status: statusFilter === 'all' ? undefined : statusFilter
    }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('limit', '50');
      
      return apiRequest(`/api/admin/orders?${params.toString()}`);
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) => 
      apiRequest(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard-stats'] });
      setSelectedOrder(null);
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث حالة الطلب بنجاح',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث حالة الطلب',
        variant: 'destructive',
      });
    },
  });

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateOrderMutation.mutate({ orderId, status: newStatus });
  };

  const filteredOrders = data?.orders || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            إدارة الطلبات
          </h1>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="ابحث بالرقم أو اسم العميل..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="search-orders"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48" data-testid="filter-status">
                  <SelectValue placeholder="حالة الطلب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">في الانتظار</SelectItem>
                  <SelectItem value="confirmed">مؤكد</SelectItem>
                  <SelectItem value="prepared">جاهز</SelectItem>
                  <SelectItem value="delivered">تم التسليم</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="grid gap-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">جاري تحميل الطلبات...</div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">لا توجد طلبات</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => {
              const config = statusConfig[order.status];
              const StatusIcon = config.icon;
              
              return (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              طلب #{order.id.slice(-8)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString('ar-SA')}
                            </p>
                          </div>
                          <Badge className={config.color}>
                            <StatusIcon className="h-3 w-3 ml-1" />
                            {config.label}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span>{order.customerName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{order.customerPhone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{order.deliveryAddress}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-lg font-medium text-gray-900 dark:text-white">
                            {order.totalAmount} دج
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.items.length} منتج
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mr-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          data-testid={`view-order-${order.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {order.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                            data-testid={`confirm-order-${order.id}`}
                          >
                            تأكيد
                          </Button>
                        )}
                        
                        {order.status === 'confirmed' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(order.id, 'prepared')}
                            data-testid={`prepare-order-${order.id}`}
                          >
                            جاهز
                          </Button>
                        )}
                        
                        {order.status === 'prepared' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(order.id, 'delivered')}
                            data-testid={`deliver-order-${order.id}`}
                          >
                            تم التسليم
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: data.totalPages }, (_, i) => (
              <Button
                key={i + 1}
                variant={data.page === i + 1 ? "default" : "outline"}
                size="sm"
                data-testid={`page-${i + 1}`}
              >
                {i + 1}
              </Button>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}