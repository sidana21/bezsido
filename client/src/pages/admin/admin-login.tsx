import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Phone, KeyRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const otpSchema = z.object({
  phoneNumber: z.string().min(1, 'رقم الهاتف مطلوب'),
});

const verifySchema = z.object({
  code: z.string().min(6, 'كود التحقق يجب أن يكون 6 أرقام').max(6, 'كود التحقق يجب أن يكون 6 أرقام'),
});

type OtpForm = z.infer<typeof otpSchema>;
type VerifyForm = z.infer<typeof verifySchema>;

export function AdminLogin() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const { toast } = useToast();

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      phoneNumber: '',
    },
  });

  const verifyForm = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      code: '',
    },
  });

  const sendOtpMutation = useMutation({
    mutationFn: (data: OtpForm) => apiRequest('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({
        title: 'تم إرسال الكود',
        description: 'تحقق من رسائل SMS للحصول على كود التحقق',
      });
      setStep('verify');
      setPhoneNumber(otpForm.getValues().phoneNumber);
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'فشل في إرسال كود التحقق. حاول مرة أخرى.',
        variant: 'destructive',
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (data: VerifyForm) => apiRequest('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        phoneNumber,
        code: data.code,
        name: 'Admin',
        location: 'Admin'
      }),
    }),
    onSuccess: (data: any) => {
      // Check if user is admin
      if (!data.user.isAdmin) {
        toast({
          title: 'غير مصرح',
          description: 'ليس لديك صلاحية الوصول للوحة الإدارة',
          variant: 'destructive',
        });
        return;
      }

      localStorage.setItem('token', data.token);
      toast({
        title: 'مرحباً بك',
        description: 'تم تسجيل الدخول بنجاح',
      });
      setLocation('/admin');
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'كود التحقق غير صحيح أو انتهت صلاحيته',
        variant: 'destructive',
      });
    },
  });

  const onSendOtp = (data: OtpForm) => {
    sendOtpMutation.mutate(data);
  };

  const onVerifyOtp = (data: VerifyForm) => {
    verifyOtpMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold">
            لوحة الإدارة
          </CardTitle>
          <CardDescription>
            {step === 'phone' 
              ? 'أدخل رقم هاتف المدير للدخول' 
              : 'أدخل كود التحقق المرسل لهاتفك'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'phone' && (
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(onSendOtp)} className="space-y-4">
                <FormField
                  control={otpForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الهاتف</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            type="tel"
                            placeholder="+213555123456"
                            className="pr-10"
                            data-testid="input-phone"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={sendOtpMutation.isPending}
                  data-testid="button-send-otp"
                >
                  {sendOtpMutation.isPending ? 'جاري الإرسال...' : 'إرسال كود التحقق'}
                </Button>
              </form>
            </Form>
          )}

          {step === 'verify' && (
            <Form {...verifyForm}>
              <form onSubmit={verifyForm.handleSubmit(onVerifyOtp)} className="space-y-4">
                <FormField
                  control={verifyForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كود التحقق</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <KeyRound className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            type="text"
                            maxLength={6}
                            placeholder="123456"
                            className="pr-10 text-center text-lg tracking-widest"
                            data-testid="input-code"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={verifyOtpMutation.isPending}
                    data-testid="button-verify"
                  >
                    {verifyOtpMutation.isPending ? 'جاري التحقق...' : 'تسجيل الدخول'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setStep('phone')}
                    data-testid="button-back"
                  >
                    العودة لإدخال رقم الهاتف
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}