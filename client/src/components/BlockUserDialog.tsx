import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Ban } from "lucide-react";

interface BlockUserDialogProps {
  userId: number;
  userName?: string;
  onBlockSuccess?: () => void;
  children?: React.ReactNode;
}

export function BlockUserDialog({ userId, userName, onBlockSuccess, children }: BlockUserDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const blockMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/blocked-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedUserId: userId }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blocked-users'] });
      toast({
        title: "تم حظر المستخدم",
        description: `لن تتمكن من رؤية محتوى ${userName || 'هذا المستخدم'} بعد الآن`,
      });
      setOpen(false);
      onBlockSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "فشل الحظر",
        description: error.message || "حدث خطأ أثناء حظر المستخدم",
        variant: "destructive",
      });
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {children || (
          <Button 
            variant="ghost" 
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            data-testid="button-block"
          >
            <Ban className="w-4 h-4 mr-2" />
            حظر
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>حظر {userName || 'هذا المستخدم'}؟</AlertDialogTitle>
          <AlertDialogDescription>
            عند حظر هذا المستخدم:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>لن تتمكن من رؤية محتواه (منشورات، قصص، تعليقات)</li>
              <li>لن يتمكن من إرسال رسائل إليك</li>
              <li>يمكنك إلغاء الحظر في أي وقت من الإعدادات</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-block">إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              blockMutation.mutate();
            }}
            disabled={blockMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
            data-testid="button-confirm-block"
          >
            {blockMutation.isPending ? "جارِ الحظر..." : "حظر"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
