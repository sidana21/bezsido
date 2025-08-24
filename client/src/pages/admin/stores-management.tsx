import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Store as StoreIcon, 
  Search, 
  CheckCircle, 
  XCircle,
  Clock,
  MapPin,
  Phone,
  Calendar,
  Star,
  Package
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Store {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  category: string;
  location: string;
  phoneNumber: string;
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  rating: number;
  totalProducts: number;
  createdAt: string;
  verifiedAt?: string;
  logo?: string;
}

interface StoresResponse {
  stores: Store[];
  total: number;
  page: number;
  totalPages: number;
}

export function StoresManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<StoresResponse>({
    queryKey: ['/api/admin/stores', { 
      search: searchTerm, 
      status: statusFilter === 'all' ? undefined : statusFilter
    }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('limit', '50');
      
      return apiRequest(`/api/admin/stores?${params.toString()}`);
    },
  });

  const updateStoreMutation = useMutation({
    mutationFn: ({ storeId, status, rejectionReason }: { storeId: string; status: string; rejectionReason?: string }) => 
      apiRequest(`/api/admin/stores/${storeId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, rejectionReason }),
      }),
    onSuccess: (updatedStore, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stores'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard-stats'] });
      
      // Also invalidate user store queries to trigger immediate updates for the user
      queryClient.invalidateQueries({ queryKey: ['/api/user/store'] });
      
      setSelectedStore(null);
      setAdminNote('');
      
      const statusText = variables.status === 'approved' ? 'تم الموافقة على المتجر' :
                        variables.status === 'rejected' ? 'تم رفض المتجر' :
                        variables.status === 'suspended' ? 'تم تعليق المتجر' : 'تم تحديث حالة المتجر';
      
      toast({
        title: 'تم التحديث',
        description: statusText + ' بنجاح',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث حالة المتجر',
        variant: 'destructive',
      });
    },
  });

  const handleApprove = (storeId: string) => {
    updateStoreMutation.mutate({ storeId, status: 'approved' });
  };

  const handleReject = (storeId: string) => {
    const reason = adminNote.trim() || 'لم يتم تحديد سبب الرفض';
    updateStoreMutation.mutate({ storeId, status: 'rejected', rejectionReason: reason });
  };

  const handleSuspend = (storeId: string) => {
    updateStoreMutation.mutate({ storeId, status: 'suspended' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200"><Clock className="w-3 h-3 ml-1" />في الانتظار</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 ml-1" />مفعل</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 ml-1" />مرفوض</Badge>;
      case 'suspended':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100"><XCircle className="w-3 h-3 ml-1" />معلق</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      'electronics': 'إلكترونيات',
      'fashion': 'أزياء',
      'food': 'طعام',
      'books': 'كتب',
      'sports': 'رياضة',
      'beauty': 'جمال',
      'home': 'منزل',
      'automotive': 'سيارات',
      'health': 'صحة',
      'other': 'أخرى'
    };
    return categories[category] || category;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
          />
        ))}
        <span className="text-sm text-gray-600 dark:text-gray-400 mr-1">
          ({rating.toFixed(1)})
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            إدارة المتاجر
          </h1>
          <div className="grid gap-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
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
            إدارة المتاجر
          </h1>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث بالاسم أو الفئة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                  data-testid="search-stores"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  data-testid="filter-all"
                >
                  الكل
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('pending')}
                  data-testid="filter-pending"
                >
                  في الانتظار
                </Button>
                <Button
                  variant={statusFilter === 'approved' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('approved')}
                  data-testid="filter-approved"
                >
                  مفعل
                </Button>
                <Button
                  variant={statusFilter === 'suspended' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('suspended')}
                  data-testid="filter-suspended"
                >
                  معلق
                </Button>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 self-center">
                إجمالي المتاجر: {data?.total || 0}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stores List */}
        <div className="grid gap-4">
          {data?.stores.map((store) => (
            <Card key={store.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Store Logo */}
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      {store.logo ? (
                        <img 
                          src={store.logo} 
                          alt={store.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <StoreIcon className="h-8 w-8 text-gray-400" />
                      )}
                    </div>

                    {/* Store Info */}
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{store.name}</h3>
                        {getStatusBadge(store.status)}
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(store.category)}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {store.description}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{store.phoneNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{store.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span>{store.totalProducts} منتج</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>انضم: {new Date(store.createdAt).toLocaleDateString('ar-DZ')}</span>
                        </div>
                      </div>

                      {store.rating > 0 && (
                        <div className="flex items-center gap-2">
                          {renderStars(store.rating)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    {store.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(store.id)}
                          disabled={updateStoreMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                          data-testid={`approve-${store.id}`}
                        >
                          <CheckCircle className="h-4 w-4 ml-1" />
                          موافقة
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleReject(store.id)}
                          disabled={updateStoreMutation.isPending}
                          data-testid={`reject-${store.id}`}
                        >
                          <XCircle className="h-4 w-4 ml-1" />
                          رفض
                        </Button>
                      </>
                    )}

                    {store.status === 'approved' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuspend(store.id)}
                        disabled={updateStoreMutation.isPending}
                        className="text-orange-600 hover:text-orange-700"
                        data-testid={`suspend-${store.id}`}
                      >
                        <Clock className="h-4 w-4 ml-1" />
                        تعليق
                      </Button>
                    )}

                    {store.status === 'suspended' && (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(store.id)}
                        disabled={updateStoreMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                        data-testid={`reactivate-${store.id}`}
                      >
                        <CheckCircle className="h-4 w-4 ml-1" />
                        إعادة تفعيل
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedStore(store)}
                      data-testid={`view-${store.id}`}
                    >
                      عرض التفاصيل
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {(!data?.stores.length) && (
            <Card>
              <CardContent className="p-12 text-center">
                <StoreIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  لا توجد متاجر
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  لم يتم العثور على متاجر تطابق معايير البحث
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Store Details Modal */}
        {selectedStore && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    {selectedStore.logo ? (
                      <img 
                        src={selectedStore.logo} 
                        alt={selectedStore.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <StoreIcon className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedStore.name}</h2>
                    {getStatusBadge(selectedStore.status)}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>الفئة:</strong>
                    <p>{getCategoryLabel(selectedStore.category)}</p>
                  </div>
                  <div>
                    <strong>رقم الهاتف:</strong>
                    <p>{selectedStore.phoneNumber}</p>
                  </div>
                  <div>
                    <strong>الموقع:</strong>
                    <p>{selectedStore.location}</p>
                  </div>
                  <div>
                    <strong>عدد المنتجات:</strong>
                    <p>{selectedStore.totalProducts} منتج</p>
                  </div>
                  <div>
                    <strong>تاريخ الانضمام:</strong>
                    <p>{new Date(selectedStore.createdAt).toLocaleDateString('ar-DZ')}</p>
                  </div>
                  {selectedStore.verifiedAt && (
                    <div>
                      <strong>تاريخ التوثيق:</strong>
                      <p>{new Date(selectedStore.verifiedAt).toLocaleDateString('ar-DZ')}</p>
                    </div>
                  )}
                </div>

                <div>
                  <strong>الوصف:</strong>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {selectedStore.description}
                  </p>
                </div>

                {selectedStore.rating > 0 && (
                  <div>
                    <strong>التقييم:</strong>
                    <div className="mt-1">
                      {renderStars(selectedStore.rating)}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedStore(null)}
                    data-testid="close-details"
                  >
                    إغلاق
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}