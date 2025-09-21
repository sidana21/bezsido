import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Mail, Send, Settings } from 'lucide-react';

interface EmailConfigStatus {
  isConfigured: boolean;
  service?: string;
  lastUpdated?: string;
  currentService: string;
  hasActiveService: boolean;
  fromEmail: string;
  configSource: string;
}

export default function EmailSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Gmail form state
  const [gmailData, setGmailData] = useState({
    user: '',
    password: '',
    fromEmail: ''
  });
  
  // SendGrid form state
  const [sendGridData, setSendGridData] = useState({
    apiKey: '',
    fromEmail: ''
  });
  
  const [testEmail, setTestEmail] = useState('');

  // Get email config status
  const { data: emailStatus, isLoading } = useQuery<EmailConfigStatus>({
    queryKey: ['/api/admin/email-config/status'],
  });

  // Gmail configuration mutation
  const gmailMutation = useMutation({
    mutationFn: async (data: typeof gmailData) => {
      return apiRequest('/api/admin/email-config/gmail', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      toast({
        title: '✅ تم حفظ إعدادات Gmail',
        description: `تم تكوين البريد الإلكتروني بنجاح. الخدمة: ${data.testResult?.service || 'Gmail'}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-config/status'] });
      setGmailData({ user: '', password: '', fromEmail: '' });
    },
    onError: (error: any) => {
      toast({
        title: '❌ خطأ في حفظ الإعدادات',
        description: error.message || 'فشل في حفظ إعدادات Gmail',
        variant: 'destructive',
      });
    },
  });

  // SendGrid configuration mutation
  const sendGridMutation = useMutation({
    mutationFn: async (data: typeof sendGridData) => {
      return apiRequest('/api/admin/email-config/sendgrid', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      toast({
        title: '✅ تم حفظ إعدادات SendGrid',
        description: `تم تكوين البريد الإلكتروني بنجاح. الخدمة: ${data.testResult?.service || 'SendGrid'}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-config/status'] });
      setSendGridData({ apiKey: '', fromEmail: '' });
    },
    onError: (error: any) => {
      toast({
        title: '❌ خطأ في حفظ الإعدادات',
        description: error.message || 'فشل في حفظ إعدادات SendGrid',
        variant: 'destructive',
      });
    },
  });

  // Test email mutation
  const testEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest('/api/admin/email-config/test', {
        method: 'POST',
        body: JSON.stringify({ testEmail: email }),
      });
    },
    onSuccess: (data) => {
      toast({
        title: '✅ تم إرسال البريد التجريبي',
        description: `تم إرسال رمز OTP: ${data.otp} عبر ${data.service}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ فشل إرسال البريد التجريبي',
        description: error.message || 'تأكد من صحة الإعدادات',
        variant: 'destructive',
      });
    },
  });

  // Auto-fill Gmail fromEmail when user changes
  useEffect(() => {
    if (gmailData.user && !gmailData.fromEmail) {
      setGmailData(prev => ({ ...prev, fromEmail: prev.user }));
    }
  }, [gmailData.user]);

  const handleGmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmailData.user || !gmailData.password) {
      toast({
        title: '❌ بيانات مطلوبة',
        description: 'يرجى إدخال البريد الإلكتروني وكلمة مرور التطبيق',
        variant: 'destructive',
      });
      return;
    }
    gmailMutation.mutate(gmailData);
  };

  const handleSendGridSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendGridData.apiKey || !sendGridData.fromEmail) {
      toast({
        title: '❌ بيانات مطلوبة',
        description: 'يرجى إدخال مفتاح SendGrid والبريد المرسل منه',
        variant: 'destructive',
      });
      return;
    }
    sendGridMutation.mutate(sendGridData);
  };

  const handleTestEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) {
      toast({
        title: '❌ بريد إلكتروني مطلوب',
        description: 'يرجى إدخال بريد إلكتروني للاختبار',
        variant: 'destructive',
      });
      return;
    }
    testEmailMutation.mutate(testEmail);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p>جاري تحميل إعدادات البريد الإلكتروني...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-emerald-600 mb-2">إعدادات البريد الإلكتروني</h1>
        <p className="text-gray-600">قم بتكوين خدمة البريد الإلكتروني لإرسال رموز التحقق</p>
      </div>

      {/* Current Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            الحالة الحالية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              {emailStatus?.hasActiveService ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span>الخدمة: {emailStatus?.currentService || 'غير مكونة'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <span>البريد المرسل: {emailStatus?.fromEmail || 'غير محدد'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                المصدر: {emailStatus?.configSource === 'environment' ? 'متغيرات البيئة' : 
                         emailStatus?.configSource === 'saved' ? 'محفوظ في التطبيق' : 'غير مكون'}
              </span>
            </div>
          </div>
          {emailStatus?.lastUpdated && (
            <p className="text-sm text-gray-500 mt-2">
              آخر تحديث: {new Date(emailStatus.lastUpdated).toLocaleString('ar')}
            </p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="gmail" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gmail">Gmail</TabsTrigger>
          <TabsTrigger value="sendgrid">SendGrid</TabsTrigger>
          <TabsTrigger value="test">اختبار الإرسال</TabsTrigger>
        </TabsList>

        {/* Gmail Configuration */}
        <TabsContent value="gmail">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات Gmail</CardTitle>
              <CardDescription>
                استخدم حساب Gmail الخاص بك مع كلمة مرور التطبيق
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertDescription>
                  <strong>مطلوب:</strong> يجب إنشاء كلمة مرور تطبيق في إعدادات أمان Google (16 رقم)
                </AlertDescription>
              </Alert>
              
              <form onSubmit={handleGmailSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="gmail-user">البريد الإلكتروني</Label>
                  <Input
                    id="gmail-user"
                    type="email"
                    placeholder="your-email@gmail.com"
                    value={gmailData.user}
                    onChange={(e) => setGmailData(prev => ({ ...prev, user: e.target.value }))}
                    data-testid="input-gmail-user"
                  />
                </div>
                
                <div>
                  <Label htmlFor="gmail-password">كلمة مرور التطبيق (16 رقم)</Label>
                  <Input
                    id="gmail-password"
                    type="password"
                    placeholder="أدخل كلمة مرور التطبيق"
                    value={gmailData.password}
                    onChange={(e) => setGmailData(prev => ({ ...prev, password: e.target.value }))}
                    data-testid="input-gmail-password"
                  />
                </div>
                
                <div>
                  <Label htmlFor="gmail-from">البريد المرسل منه (اختياري)</Label>
                  <Input
                    id="gmail-from"
                    type="email"
                    placeholder="سيتم استخدام نفس البريد الإلكتروني إذا ترك فارغاً"
                    value={gmailData.fromEmail}
                    onChange={(e) => setGmailData(prev => ({ ...prev, fromEmail: e.target.value }))}
                    data-testid="input-gmail-from"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={gmailMutation.isPending}
                  className="w-full"
                  data-testid="button-save-gmail"
                >
                  {gmailMutation.isPending ? 'جاري الحفظ...' : 'حفظ إعدادات Gmail'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SendGrid Configuration */}
        <TabsContent value="sendgrid">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات SendGrid</CardTitle>
              <CardDescription>
                استخدم SendGrid للمشاريع الإنتاجية الكبيرة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendGridSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="sendgrid-key">SendGrid API Key</Label>
                  <Input
                    id="sendgrid-key"
                    type="password"
                    placeholder="SG.xxxxxxxxxxxxxxxxxx"
                    value={sendGridData.apiKey}
                    onChange={(e) => setSendGridData(prev => ({ ...prev, apiKey: e.target.value }))}
                    data-testid="input-sendgrid-key"
                  />
                </div>
                
                <div>
                  <Label htmlFor="sendgrid-from">البريد المرسل منه</Label>
                  <Input
                    id="sendgrid-from"
                    type="email"
                    placeholder="noreply@yourdomain.com"
                    value={sendGridData.fromEmail}
                    onChange={(e) => setSendGridData(prev => ({ ...prev, fromEmail: e.target.value }))}
                    data-testid="input-sendgrid-from"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={sendGridMutation.isPending}
                  className="w-full"
                  data-testid="button-save-sendgrid"
                >
                  {sendGridMutation.isPending ? 'جاري الحفظ...' : 'حفظ إعدادات SendGrid'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Email */}
        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>اختبار إرسال البريد الإلكتروني</CardTitle>
              <CardDescription>
                تأكد من عمل الخدمة بإرسال رمز OTP تجريبي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTestEmail} className="space-y-4">
                <div>
                  <Label htmlFor="test-email">البريد الإلكتروني للاختبار</Label>
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    data-testid="input-test-email"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={testEmailMutation.isPending || !emailStatus?.hasActiveService}
                  className="w-full"
                  data-testid="button-send-test"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {testEmailMutation.isPending ? 'جاري الإرسال...' : 'إرسال رمز تجريبي'}
                </Button>
                
                {!emailStatus?.hasActiveService && (
                  <p className="text-sm text-amber-600 text-center">
                    يرجى تكوين خدمة البريد الإلكتروني أولاً
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}