import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings, Mail, Lock, Eye, EyeOff, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { AdminLayout } from '@/components/admin/admin-layout';

const settingsSchema = z.object({
  currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  newEmail: z.string().email('يرجى إدخال بريد إلكتروني صحيح'),
  newPassword: z.string().min(6, 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'),
  confirmPassword: z.string().min(6, 'تأكيد كلمة المرور مطلوب'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "كلمتا المرور غير متطابقتان",
  path: ["confirmPassword"],
});

type SettingsForm = z.infer<typeof settingsSchema>;

export function AdminSettings() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      currentPassword: '',
      newEmail: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: SettingsForm) => apiRequest('/api/admin/update-credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }),
    onSuccess: (data: any) => {
      toast({
        title: 'تم تحديث البيانات بنجاح',
        description: data.message,
      });
      // Clear form
      form.reset();
      
      // Show instructions in console for environment variables
      console.log('تعليمات تحديث متغيرات البيئة:');
      console.log('ADMIN_EMAIL =', data.newEmail);
      console.log('ADMIN_PASSWORD =', data.newPassword);
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في تحديث البيانات',
        description: error.message || 'حدث خطأ أثناء تحديث البيانات',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: SettingsForm) => {
    updateSettingsMutation.mutate(data);
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              إعدادات الإدارة
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              تحديث بيانات اعتماد الإدارة
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>تحديث بيانات الاعتماد</CardTitle>
            <CardDescription>
              قم بتحديث الإيميل وكلمة المرور الخاصة بحساب الإدارة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كلمة المرور الحالية</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            type={showCurrentPassword ? 'text' : 'password'}
                            placeholder="أدخل كلمة المرور الحالية"
                            className="pr-10 pl-10"
                            data-testid="input-current-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute left-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                            data-testid="toggle-current-password"
                          >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    البيانات الجديدة
                  </h3>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="newEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الإيميل الجديد</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                {...field}
                                type="email"
                                placeholder="أدخل الإيميل الجديد"
                                className="pr-10"
                                data-testid="input-new-email"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>كلمة المرور الجديدة</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                {...field}
                                type={showNewPassword ? 'text' : 'password'}
                                placeholder="أدخل كلمة المرور الجديدة"
                                className="pr-10 pl-10"
                                data-testid="input-new-password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute left-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                                data-testid="toggle-new-password"
                              >
                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تأكيد كلمة المرور الجديدة</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                {...field}
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="أعد إدخال كلمة المرور الجديدة"
                                className="pr-10 pl-10"
                                data-testid="input-confirm-password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute left-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                                data-testid="toggle-confirm-password"
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t">
                  <Button 
                    type="submit" 
                    disabled={updateSettingsMutation.isPending}
                    className="flex-1"
                    data-testid="button-save-settings"
                  >
                    <Save className="h-4 w-4 ml-2" />
                    {updateSettingsMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => form.reset()}
                    className="flex-1"
                    data-testid="button-reset-form"
                  >
                    إعادة تعيين
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-yellow-100 dark:bg-yellow-900 rounded">
                <Settings className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  ملاحظة هامة
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  بعد تحديث بيانات الاعتماد، ستحتاج لتسجيل الدخول مرة أخرى باستخدام البيانات الجديدة.
                  تأكد من حفظ البيانات الجديدة في مكان آمن.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}