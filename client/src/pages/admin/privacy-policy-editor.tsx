import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Shield } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';

interface PrivacyPolicy {
  id: string;
  content: string;
  lastUpdatedBy: string;
  updatedAt: Date;
  createdAt: Date;
}

export default function PrivacyPolicyEditor() {
  const { toast } = useToast();
  const [content, setContent] = useState('');

  // Fetch current privacy policy
  const { data: policy, isLoading } = useQuery<PrivacyPolicy>({
    queryKey: ['/api/privacy-policy'],
  });

  // Update content when policy is loaded
  useEffect(() => {
    if (policy?.content) {
      setContent(policy.content);
    }
  }, [policy]);

  // Update privacy policy mutation
  const updateMutation = useMutation({
    mutationFn: async (newContent: string) => {
      return await apiRequest('/api/admin/privacy-policy', {
        method: 'PUT',
        body: JSON.stringify({ content: newContent }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/privacy-policy'] });
      toast({
        title: 'تم الحفظ بنجاح',
        description: 'تم تحديث سياسة الخصوصية بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'حدث خطأ',
        description: error.message || 'فشل في حفظ التغييرات',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    if (!content || content.trim() === '') {
      toast({
        title: 'تنبيه',
        description: 'يرجى إدخال محتوى سياسة الخصوصية',
        variant: 'destructive',
      });
      return;
    }
    updateMutation.mutate(content);
  };

  // Initialize content when policy is loaded
  if (policy && content === '' && policy.content) {
    setContent(policy.content);
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-4 max-w-5xl">
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <CardTitle className="text-2xl text-gray-900 dark:text-white">
                  تعديل سياسة الخصوصية
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
                  قم بتحرير محتوى سياسة الخصوصية الخاصة بالتطبيق
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12" data-testid="loading-spinner">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="mr-3 text-gray-600 dark:text-gray-400">جاري التحميل...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    محتوى سياسة الخصوصية
                  </label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="أدخل محتوى سياسة الخصوصية هنا..."
                    className="min-h-[500px] font-mono text-sm leading-relaxed resize-y"
                    data-testid="textarea-privacy-content"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    يمكنك استخدام تنسيق نصي عادي. سيتم عرض المحتوى كما هو للمستخدمين.
                  </p>
                </div>

                {policy && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm">
                    <p className="text-gray-600 dark:text-gray-400">
                      آخر تحديث: {new Date(policy.updatedAt).toLocaleString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {policy.lastUpdatedBy && (
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        بواسطة: المشرف
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    onClick={handleSave}
                    disabled={updateMutation.isPending || content.trim() === ''}
                    className="min-w-[120px]"
                    data-testid="button-save-privacy"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 ml-2" />
                        حفظ التغييرات
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
