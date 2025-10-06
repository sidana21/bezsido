import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";

interface ReportDialogProps {
  reportedEntityType: "user" | "post" | "story" | "message" | "product" | "vendor";
  reportedEntityId: number;
  reportedUserId?: number;
  children?: React.ReactNode;
}

export function ReportDialog({ 
  reportedEntityType, 
  reportedEntityId, 
  reportedUserId,
  children 
}: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const reportMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "تم الإبلاغ بنجاح",
        description: "شكراً لك. سنراجع بلاغك في أقرب وقت",
      });
      setOpen(false);
      setReason("");
      setDescription("");
    },
    onError: (error: any) => {
      toast({
        title: "فشل الإبلاغ",
        description: error.message || "حدث خطأ أثناء الإبلاغ",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!reason) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار سبب الإبلاغ",
        variant: "destructive",
      });
      return;
    }

    reportMutation.mutate({
      reportedEntityType,
      reportedEntityId,
      reportedUserId,
      reason,
      description: description.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            data-testid="button-report"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            إبلاغ
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>الإبلاغ عن محتوى مخالف</DialogTitle>
          <DialogDescription>
            ساعدنا في الحفاظ على مجتمع آمن من خلال الإبلاغ عن المحتوى المخالف
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">سبب الإبلاغ *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger data-testid="select-report-reason">
                <SelectValue placeholder="اختر السبب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spam">محتوى مزعج أو ترويجي</SelectItem>
                <SelectItem value="harassment">تحرش أو إساءة</SelectItem>
                <SelectItem value="inappropriate">محتوى غير لائق</SelectItem>
                <SelectItem value="violence">عنف أو تهديد</SelectItem>
                <SelectItem value="hate_speech">خطاب كراهية</SelectItem>
                <SelectItem value="misinformation">معلومات مضللة</SelectItem>
                <SelectItem value="impersonation">انتحال شخصية</SelectItem>
                <SelectItem value="copyright">انتهاك حقوق النشر</SelectItem>
                <SelectItem value="illegal">محتوى غير قانوني</SelectItem>
                <SelectItem value="other">أخرى</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">تفاصيل إضافية (اختياري)</Label>
            <Textarea
              id="description"
              data-testid="textarea-report-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="أضف أي تفاصيل إضافية تساعدنا في فهم البلاغ"
              className="min-h-[100px] resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-testid="button-cancel-report"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={reportMutation.isPending || !reason}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="button-submit-report"
            >
              {reportMutation.isPending ? "جارِ الإرسال..." : "إرسال البلاغ"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
