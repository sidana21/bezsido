import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  Search, 
  Shield, 
  ShieldCheck,
  CheckCircle,
  XCircle,
  User,
  MapPin,
  Phone,
  Calendar,
  Ban,
  FileText,
  Trash2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface User {
  id: string;
  name: string;
  phoneNumber: string;
  location: string;
  isVerified: boolean;
  isAdmin: boolean;
  isOnline: boolean;
  isBlocked?: boolean;
  postsCount?: number;
  avatar?: string;
  createdAt: string;
  lastSeen: string;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

export function UsersManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
  const [adminFilter, setAdminFilter] = useState<string>('all');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<UsersResponse>({
    queryKey: ['/api/admin/users', { 
      search: searchTerm, 
      isVerified: verifiedFilter === 'all' ? undefined : verifiedFilter === 'verified',
      isAdmin: adminFilter === 'all' ? undefined : adminFilter === 'admin'
    }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (verifiedFilter !== 'all') params.append('isVerified', verifiedFilter === 'verified' ? 'true' : 'false');
      if (adminFilter !== 'all') params.append('isAdmin', adminFilter === 'admin' ? 'true' : 'false');
      params.append('limit', '50');
      
      return apiRequest(`/api/admin/users?${params.toString()}`);
    },
  });

  const toggleAdminMutation = useMutation({
    mutationFn: ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => 
      apiRequest(`/api/admin/users/${userId}/admin`, {
        method: 'PUT',
        body: JSON.stringify({ isAdmin }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث صلاحيات المستخدم بنجاح',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث صلاحيات المستخدم',
        variant: 'destructive',
      });
    },
  });

  const toggleVerificationMutation = useMutation({
    mutationFn: ({ userId, isVerified }: { userId: string; isVerified: boolean }) => 
      apiRequest(`/api/admin/users/${userId}/verify`, {
        method: 'PUT',
        body: JSON.stringify({ isVerified }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث حالة التوثيق بنجاح',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث حالة التوثيق',
        variant: 'destructive',
      });
    },
  });

  const toggleBlockMutation = useMutation({
    mutationFn: ({ userId, isBlocked }: { userId: string; isBlocked: boolean }) => 
      apiRequest(`/api/admin/users/${userId}/${isBlocked ? 'unblock' : 'block'}`, {
        method: 'PUT',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث حالة حظر المستخدم بنجاح',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث حالة الحظر',
        variant: 'destructive',
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => 
      apiRequest(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard-stats'] });
      setUserToDelete(null);
      toast({
        title: 'تم الحذف',
        description: 'تم حذف المستخدم بنجاح',
      });
    },
    onError: (error: any) => {
      console.error('Delete user error:', error);
      toast({
        title: 'خطأ',
        description: error?.message || 'فشل في حذف المستخدم',
        variant: 'destructive',
      });
    },
  });

  const handleToggleAdmin = (user: User) => {
    toggleAdminMutation.mutate({ 
      userId: user.id, 
      isAdmin: !user.isAdmin 
    });
  };

  const handleToggleVerification = (user: User) => {
    toggleVerificationMutation.mutate({ 
      userId: user.id, 
      isVerified: !user.isVerified 
    });
  };

  const handleToggleBlock = (user: User) => {
    toggleBlockMutation.mutate({ 
      userId: user.id, 
      isBlocked: user.isBlocked || false
    });
  };

  const handleDeleteUser = (user: User) => {
    if (user.isAdmin) {
      toast({
        title: 'تحذير',
        description: 'لا يمكن حذف حساب مدير',
        variant: 'destructive',
      });
      return;
    }
    setUserToDelete(user);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.isAdmin && user.isVerified) {
      return (
        <div className="flex items-center gap-2">
          <Badge className="bg-purple-100 text-purple-800"><Shield className="w-3 h-3 ml-1" />مدير</Badge>
          <VerifiedBadge className="w-5 h-5" variant="premium" title="حساب موثق ومميز ⭐" />
        </div>
      );
    }
    if (user.isAdmin) {
      return <Badge className="bg-purple-100 text-purple-800"><Shield className="w-3 h-3 ml-1" />مدير</Badge>;
    }
    if (user.isVerified) {
      return (
        <div className="flex items-center gap-1">
          <VerifiedBadge className="w-5 h-5" title="حساب موثق ⭐" />
          <span className="text-sm text-emerald-600 font-medium">موثق</span>
        </div>
      );
    }
    return <Badge variant="outline"><XCircle className="w-3 h-3 ml-1" />غير موثق</Badge>;
  };

  const getOnlineStatus = (user: User) => {
    if (user.isOnline) {
      return <div className="flex items-center gap-1 text-green-600">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-xs">متصل</span>
      </div>;
    }
    
    const lastSeen = new Date(user.lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
    
    let lastSeenText = '';
    if (diffInMinutes < 5) {
      lastSeenText = 'قبل قليل';
    } else if (diffInMinutes < 60) {
      lastSeenText = `قبل ${diffInMinutes} دقيقة`;
    } else if (diffInMinutes < 1440) {
      lastSeenText = `قبل ${Math.floor(diffInMinutes / 60)} ساعة`;
    } else {
      lastSeenText = `قبل ${Math.floor(diffInMinutes / 1440)} يوم`;
    }
    
    return <div className="flex items-center gap-1 text-gray-500">
      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
      <span className="text-xs">{lastSeenText}</span>
    </div>;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            إدارة المستخدمين
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
            إدارة المستخدمين
          </h1>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث بالاسم أو رقم الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                  data-testid="search-users"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant={verifiedFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVerifiedFilter('all')}
                  data-testid="filter-all-verified"
                >
                  الكل
                </Button>
                <Button
                  variant={verifiedFilter === 'verified' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVerifiedFilter('verified')}
                  data-testid="filter-verified"
                >
                  موثق
                </Button>
                <Button
                  variant={verifiedFilter === 'unverified' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVerifiedFilter('unverified')}
                  data-testid="filter-unverified"
                >
                  غير موثق
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={adminFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAdminFilter('all')}
                  data-testid="filter-all-admin"
                >
                  الكل
                </Button>
                <Button
                  variant={adminFilter === 'admin' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAdminFilter('admin')}
                  data-testid="filter-admin"
                >
                  مديرين
                </Button>
                <Button
                  variant={adminFilter === 'user' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAdminFilter('user')}
                  data-testid="filter-regular-users"
                >
                  مستخدمين عاديين
                </Button>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 self-center">
                إجمالي المستخدمين: {data?.total || 0}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="grid gap-4">
          {data?.users.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-gray-400" />
                      )}
                    </div>

                    {/* User Info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{user.name}</h3>
                        {getStatusBadge(user)}
                        {getOnlineStatus(user)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{user.phoneNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{user.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>المنشورات: {user.postsCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>انضم: {new Date(user.createdAt).toLocaleDateString('ar-DZ')}</span>
                        </div>
                      </div>
                      
                      {user.isBlocked && (
                        <div className="flex items-center gap-2 text-red-600 font-semibold text-sm mt-2">
                          <Ban className="h-4 w-4" />
                          <span>محظور</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    <div className="flex gap-2">
                      <Button
                        variant={user.isVerified ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleToggleVerification(user)}
                        disabled={toggleVerificationMutation.isPending}
                        className={user.isVerified ? "text-red-600 hover:text-red-700" : "bg-green-600 hover:bg-green-700"}
                        data-testid={`toggle-verification-${user.id}`}
                      >
                        {user.isVerified ? (
                          <>
                            <XCircle className="h-4 w-4 ml-1" />
                            إلغاء التوثيق
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 ml-1" />
                            توثيق
                          </>
                        )}
                      </Button>

                      <Button
                        variant={user.isAdmin ? "outline" : "secondary"}
                        size="sm"
                        onClick={() => handleToggleAdmin(user)}
                        disabled={toggleAdminMutation.isPending}
                        className={user.isAdmin ? "text-orange-600 hover:text-orange-700" : ""}
                        data-testid={`toggle-admin-${user.id}`}
                      >
                        {user.isAdmin ? (
                          <>
                            <Shield className="h-4 w-4 ml-1" />
                            إزالة إدارة
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-4 w-4 ml-1" />
                            جعل مدير
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <Button
                      variant={user.isBlocked ? "default" : "destructive"}
                      size="sm"
                      onClick={() => handleToggleBlock(user)}
                      disabled={toggleBlockMutation.isPending}
                      className={user.isBlocked ? "bg-green-600 hover:bg-green-700" : ""}
                      data-testid={`toggle-block-${user.id}`}
                    >
                      {user.isBlocked ? (
                        <>
                          <CheckCircle className="h-4 w-4 ml-1" />
                          إلغاء الحظر
                        </>
                      ) : (
                        <>
                          <Ban className="h-4 w-4 ml-1" />
                          حظر المستخدم
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user)}
                      disabled={deleteUserMutation.isPending || user.isAdmin}
                      className="bg-red-600 hover:bg-red-700"
                      data-testid={`delete-user-${user.id}`}
                    >
                      <Trash2 className="h-4 w-4 ml-1" />
                      حذف الحساب
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {(!data?.users.length) && (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  لا توجد مستخدمين
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  لم يتم العثور على مستخدمين يطابقون معايير البحث
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600">
                تأكيد حذف المستخدم
              </AlertDialogTitle>
              <AlertDialogDescription className="text-right">
                هل أنت متأكد من حذف المستخدم <strong>{userToDelete?.name}</strong>؟
                <br />
                <br />
                سيتم حذف جميع بيانات المستخدم بشكل نهائي بما في ذلك:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>المنشورات والتعليقات</li>
                  <li>المنتجات والخدمات</li>
                  <li>الرسائل والمحادثات</li>
                  <li>الطلبات والمشتريات</li>
                </ul>
                <br />
                <span className="text-red-600 font-bold">
                  هذا الإجراء لا يمكن التراجع عنه!
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="cancel-delete-user">
                إلغاء
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteUser}
                className="bg-red-600 hover:bg-red-700"
                data-testid="confirm-delete-user"
              >
                نعم، حذف الحساب
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}