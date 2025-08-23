import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  User,
  Calendar,
  MessageSquare
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface VerificationRequest {
  id: string;
  userId: string;
  requestType: string;
  status: string;
  reason?: string;
  documents: string[];
  adminNote?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

interface VerificationRequestsResponse {
  requests: VerificationRequest[];
  total: number;
  page: number;
  totalPages: number;
}

export function VerificationRequests() {
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery<VerificationRequestsResponse>({
    queryKey: ['/api/admin/verification-requests', { status: statusFilter }],
    queryFn: () => apiRequest(`/api/admin/verification-requests?status=${statusFilter}&limit=50`),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ requestId, status, adminNote }: { 
      requestId: string; 
      status: 'approved' | 'rejected'; 
      adminNote?: string;
    }) => apiRequest(`/api/admin/verification-requests/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, adminNote }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard-stats'] });
      setSelectedRequest(null);
      setAdminNote('');
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

  const handleApprove = (requestId: string) => {
    updateStatusMutation.mutate({ 
      requestId, 
      status: 'approved', 
      adminNote: adminNote || undefined 
    });
  };

  const handleReject = (requestId: string) => {
    if (!adminNote.trim()) {
      toast({
        title: 'مطلوب',
        description: 'يجب إضافة ملاحظة عند رفض الطلب',
        variant: 'destructive',
      });
      return;
    }
    updateStatusMutation.mutate({ 
      requestId, 
      status: 'rejected', 
      adminNote: adminNote.trim() 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200"><Clock className="w-3 h-3 ml-1" />معلق</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 ml-1" />موافق عليه</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 ml-1" />مرفوض</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'account':
        return 'توثيق الحساب';
      case 'store':
        return 'توثيق المتجر';
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            طلبات التوثيق
          </h1>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
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
            طلبات التوثيق
          </h1>
          
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('pending')}
              data-testid="filter-pending"
            >
              المعلقة
            </Button>
            <Button
              variant={statusFilter === 'approved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('approved')}
              data-testid="filter-approved"
            >
              الموافق عليها
            </Button>
            <Button
              variant={statusFilter === 'rejected' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('rejected')}
              data-testid="filter-rejected"
            >
              المرفوضة
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          إجمالي الطلبات: {data?.total || 0}
        </div>

        <div className="grid gap-4">
          {data?.requests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        معرف المستخدم: {request.userId}
                      </span>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <FileText className="h-4 w-4" />
                      <span>نوع الطلب: {getRequestTypeLabel(request.requestType)}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>
                        تاريخ التقديم: {new Date(request.submittedAt).toLocaleDateString('ar-DZ')}
                      </span>
                    </div>

                    {request.reason && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>السبب:</strong> {request.reason}
                      </div>
                    )}

                    {request.adminNote && (
                      <div className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="h-4 w-4" />
                          <strong>ملاحظة الإدارة:</strong>
                        </div>
                        <p>{request.adminNote}</p>
                      </div>
                    )}

                    {request.documents.length > 0 && (
                      <div className="text-sm">
                        <strong>المستندات:</strong> {request.documents.length} مستند مرفق
                      </div>
                    )}
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        onClick={() => setSelectedRequest(request)}
                        size="sm"
                        data-testid={`review-${request.id}`}
                      >
                        مراجعة
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {(!data?.requests.length) && (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  لا توجد طلبات
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  لا توجد طلبات توثيق {statusFilter === 'pending' ? 'معلقة' : statusFilter === 'approved' ? 'موافق عليها' : 'مرفوضة'} حالياً
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Review Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>
                  مراجعة طلب التوثيق - {getRequestTypeLabel(selectedRequest.requestType)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>معرف المستخدم:</strong> {selectedRequest.userId}
                  </div>
                  <div>
                    <strong>تاريخ التقديم:</strong> {new Date(selectedRequest.submittedAt).toLocaleDateString('ar-DZ')}
                  </div>
                </div>

                {selectedRequest.reason && (
                  <div>
                    <strong>سبب الطلب:</strong>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedRequest.reason}</p>
                  </div>
                )}

                {selectedRequest.documents.length > 0 && (
                  <div>
                    <strong>المستندات المرفقة:</strong>
                    <div className="mt-2 space-y-2">
                      {selectedRequest.documents.map((doc, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4" />
                          <span>مستند {index + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    ملاحظة الإدارة:
                  </label>
                  <Textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="أضف ملاحظة للمستخدم (مطلوبة عند الرفض)"
                    className="resize-none"
                    rows={4}
                    data-testid="admin-note"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedRequest(null);
                      setAdminNote('');
                    }}
                    data-testid="cancel-review"
                  >
                    إلغاء
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(selectedRequest.id)}
                    disabled={updateStatusMutation.isPending}
                    data-testid="reject-request"
                  >
                    {updateStatusMutation.isPending ? 'جاري الرفض...' : 'رفض'}
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedRequest.id)}
                    disabled={updateStatusMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="approve-request"
                  >
                    {updateStatusMutation.isPending ? 'جاري الموافقة...' : 'موافقة'}
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