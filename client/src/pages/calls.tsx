import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Phone, PhoneIncoming, PhoneOff, PhoneMissed, Video, PhoneCall, MoreVertical, UserCheck } from "lucide-react";
import { format, formatDistance } from "date-fns";
import { ar } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { FeatureGuard } from "@/hooks/use-features";

interface CallRecord {
  id: string;
  callerId: string;
  receiverId: string;
  status: 'ringing' | 'accepted' | 'rejected' | 'ended' | 'missed';
  callType: 'voice' | 'video';
  startedAt: string;
  endedAt: string | null;
  duration: number;
  caller?: {
    id: string;
    name: string;
    avatar?: string;
    phoneNumber: string;
    location: string;
    isOnline: boolean;
  };
  receiver?: {
    id: string;
    name: string;
    avatar?: string;
    phoneNumber: string;
    location: string;
    isOnline: boolean;
  };
}

export default function Calls() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // جلب تاريخ المكالمات
  const { data: callHistory = [], isLoading } = useQuery<CallRecord[]>({
    queryKey: ["/api/calls/history"],
    refetchInterval: 5000, // تحديث كل 5 ثواني
  });

  // جلب بيانات المستخدم الحالي
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user/current"],
  });

  // بدء مكالمة جديدة
  const startCallMutation = useMutation({
    mutationFn: async ({ receiverId, callType }: { receiverId: string; callType: 'voice' | 'video' }) => {
      return apiRequest(`/api/calls/start`, 'POST', { receiverId, callType });
    },
    onSuccess: () => {
      toast({
        title: "تم بدء المكالمة",
        description: "تم إرسال طلب المكالمة بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/calls/history"] });
    },
    onError: () => {
      toast({
        title: "خطأ في المكالمة",
        description: "فشل في بدء المكالمة، حاول مرة أخرى",
        variant: "destructive",
      });
    },
  });

  const getCallIcon = (call: CallRecord) => {
    const isOutgoing = call.callerId === (currentUser?.id || '');
    const isVideo = call.callType === 'video';
    
    if (call.status === 'missed') {
      return <PhoneMissed className="w-5 h-5 text-red-500" />;
    }
    
    if (isVideo) {
      return <Video className={cn("w-5 h-5", isOutgoing ? "text-green-600" : "text-blue-600")} />;
    }
    
    if (isOutgoing) {
      return <Phone className="w-5 h-5 text-green-600 transform -rotate-45" />;
    } else {
      return <PhoneIncoming className="w-5 h-5 text-blue-600" />;
    }
  };

  const getCallStatus = (call: CallRecord) => {
    const isOutgoing = call.callerId === currentUser?.id;
    
    switch (call.status) {
      case 'missed':
        return 'فائتة';
      case 'rejected':
        return isOutgoing ? 'مرفوضة' : 'رفضت';
      case 'ended':
        return 'انتهت';
      case 'accepted':
        return 'مقبولة';
      case 'ringing':
        return 'ترن...';
      default:
        return '';
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds === 0) return '';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds} ثانية`;
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };

  const getContactInfo = (call: CallRecord) => {
    const isOutgoing = call.callerId === currentUser?.id;
    return isOutgoing ? call.receiver : call.caller;
  };

  const handleCallBack = (call: CallRecord) => {
    const contact = getContactInfo(call);
    if (contact) {
      startCallMutation.mutate({
        receiverId: contact.id,
        callType: call.callType
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جارِ تحميل سجل المكالمات...</p>
        </div>
      </div>
    );
  }

  return (
    <FeatureGuard feature="voice_calls">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900" data-testid="calls-page">
      {/* العنوان */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <PhoneCall className="w-6 h-6 text-green-600" />
            المكالمات
          </h1>
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            {callHistory.length} مكالمة
          </Badge>
        </div>
      </div>

      <div className="p-4">
        {callHistory.length === 0 ? (
          <div className="text-center py-16">
            <PhoneCall className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              لا توجد مكالمات بعد
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              ستظهر هنا جميع مكالماتك الصادرة والواردة
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {callHistory.map((call) => {
              const contact = getContactInfo(call);
              const isOutgoing = call.callerId === currentUser?.id;
              
              if (!contact) return null;
              
              return (
                <div
                  key={call.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
                  data-testid={`call-item-${call.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      {/* أيقونة نوع المكالمة */}
                      <div className="flex-shrink-0">
                        {getCallIcon(call)}
                      </div>
                      
                      {/* صورة المتصل */}
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={contact.avatar || undefined} alt={contact.name} />
                        <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {contact.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* تفاصيل المكالمة */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {contact.name}
                          </p>
                          {contact.isOnline && (
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <span>{contact.location}</span>
                          <span>•</span>
                          <span className={cn(
                            "font-medium",
                            call.status === 'missed' ? "text-red-600 dark:text-red-400" : "",
                            call.status === 'ended' ? "text-green-600 dark:text-green-400" : ""
                          )}>
                            {getCallStatus(call)}
                          </span>
                          {call.duration > 0 && (
                            <>
                              <span>•</span>
                              <span>{formatDuration(call.duration)}</span>
                            </>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatDistance(new Date(call.startedAt), new Date(), { 
                            addSuffix: true, 
                            locale: ar 
                          })}
                        </p>
                      </div>
                    </div>
                    
                    {/* أزرار العمليات */}
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      {/* زر إعادة الاتصال */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCallBack(call)}
                        disabled={startCallMutation.isPending}
                        className="h-9 w-9 p-0 hover:bg-green-100 dark:hover:bg-green-900"
                        data-testid={`callback-${call.id}`}
                      >
                        {call.callType === 'video' ? (
                          <Video className="w-4 h-4 text-green-600" />
                        ) : (
                          <Phone className="w-4 h-4 text-green-600" />
                        )}
                      </Button>
                      
                      {/* قائمة الخيارات */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-9 w-9 p-0"
                            data-testid={`options-${call.id}`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleCallBack(call)}>
                            <Phone className="w-4 h-4 mr-2" />
                            مكالمة صوتية
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => startCallMutation.mutate({ receiverId: contact.id, callType: 'video' })}>
                            <Video className="w-4 h-4 mr-2" />
                            مكالمة فيديو
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <UserCheck className="w-4 h-4 mr-2" />
                            عرض جهة الاتصال
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
        {/* إضافة padding في الأسفل للتنقل السفلي */}
        <div className="h-20"></div>
      </div>
    </FeatureGuard>
  );
}