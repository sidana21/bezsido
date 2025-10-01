import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Megaphone, Send, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function SendAnnouncement() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendAnnouncementMutation = useMutation({
    mutationFn: async (data: { title: string; message: string }) => {
      const response = await apiRequest('/api/admin/send-announcement', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "تم إرسال الإشعار بنجاح",
        description: `تم إرسال الإشعار إلى ${data.sentCount} مستخدم`,
      });
      setTitle('');
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard-stats'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "فشل إرسال الإشعار",
        description: error.message || "حدث خطأ أثناء إرسال الإشعار",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى إدخال عنوان للإشعار",
      });
      return;
    }
    
    if (!message.trim()) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى إدخال محتوى الإشعار",
      });
      return;
    }

    sendAnnouncementMutation.mutate({ title, message });
  };

  return (
    <AdminLayout>
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-2">
          <Megaphone className="w-8 h-8 text-yellow-600" />
          <h1 className="text-3xl font-bold">إرسال إشعار جماعي</h1>
        </div>

        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            سيتم إرسال هذا الإشعار إلى جميع المستخدمين المسجلين في التطبيق. سيظهر الإشعار بشكل مميز وينبض للفت انتباه المستخدمين.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              إنشاء إشعار إداري
            </CardTitle>
            <CardDescription>
              اكتب عنوان ومحتوى الإشعار الذي تريد إرساله لجميع المستخدمين
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان الإشعار</Label>
                <Input
                  id="title"
                  data-testid="input-announcement-title"
                  placeholder="مثال: تحديث جديد في التطبيق"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  className="text-right"
                />
                <p className="text-sm text-muted-foreground text-right">
                  {title.length}/100 حرف
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">محتوى الإشعار</Label>
                <Textarea
                  id="message"
                  data-testid="textarea-announcement-message"
                  placeholder="اكتب محتوى الإشعار هنا..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  maxLength={500}
                  className="text-right resize-none"
                />
                <p className="text-sm text-muted-foreground text-right">
                  {message.length}/500 حرف
                </p>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  معاينة الإشعار
                </h3>
                <div className="bg-background p-3 rounded-md border-2 border-yellow-400 shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center animate-pulse">
                      <Megaphone className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-yellow-600 dark:text-yellow-400 animate-pulse">
                        إشعار من الإدارة
                      </p>
                      <p className="font-semibold text-sm mt-1">
                        {title || 'عنوان الإشعار'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {message || 'محتوى الإشعار سيظهر هنا'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">الآن</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  data-testid="button-send-announcement"
                  disabled={sendAnnouncementMutation.isPending || !title.trim() || !message.trim()}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                >
                  {sendAnnouncementMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 ml-2" />
                      إرسال إلى جميع المستخدمين
                    </>
                  )}
                </Button>
              </div>

              {sendAnnouncementMutation.isSuccess && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    تم إرسال الإشعار بنجاح إلى جميع المستخدمين!
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
