import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { User, Call } from '@shared/schema';

interface UseVoiceCallsOptions {
  currentUserId?: string;
  onIncomingCall?: (call: Call & { caller: User }) => void;
}

export function useVoiceCalls({ currentUserId, onIncomingCall }: UseVoiceCallsOptions = {}) {
  const [activeCall, setActiveCall] = useState<(Call & { otherUser: User }) | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // استعلام المكالمات النشطة
  const { data: activeCalls = [] } = useQuery<(Call & { otherUser: User })[]>({
    queryKey: ['/api/calls/active'],
    queryFn: () => apiRequest('/api/calls/active'),
    enabled: !!currentUserId,
    refetchInterval: 3000, // التحقق كل 3 ثوانٍ من المكالمات الجديدة
  });

  // بدء مكالمة جديدة
  const startCallMutation = useMutation({
    mutationFn: async ({ receiverId, callType = 'voice' }: { receiverId: string; callType?: string }) => {
      return apiRequest('/api/calls/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId, callType }),
      });
    },
    onSuccess: (data) => {
      console.log('📞 تم بدء المكالمة بنجاح:', data.call);
      queryClient.invalidateQueries({ queryKey: ['/api/calls/active'] });
      
      // إعداد المكالمة الصادرة
      if (data.call) {
        setActiveCall({
          ...data.call,
          otherUser: data.receiver // المستقبل
        });
        setIsCallModalOpen(true);
      }
      
      toast({
        title: "جاري الاتصال",
        description: "يتم الاتصال بالمستخدم...",
      });
    },
    onError: (error: any) => {
      console.error('خطأ في بدء المكالمة:', error);
      toast({
        title: "فشل في الاتصال",
        description: error.message || "حدث خطأ أثناء محاولة الاتصال",
        variant: "destructive",
      });
    },
  });

  // قبول مكالمة واردة
  const acceptCallMutation = useMutation({
    mutationFn: async (callId: string) => {
      return apiRequest(`/api/calls/${callId}/accept`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calls/active'] });
      toast({
        title: "تم قبول المكالمة",
        description: "بدأت المحادثة الصوتية",
      });
    },
    onError: (error: any) => {
      console.error('خطأ في قبول المكالمة:', error);
      toast({
        title: "فشل في قبول المكالمة",
        description: error.message || "حدث خطأ أثناء قبول المكالمة",
        variant: "destructive",
      });
    },
  });

  // رفض مكالمة
  const rejectCallMutation = useMutation({
    mutationFn: async (callId: string) => {
      return apiRequest(`/api/calls/${callId}/reject`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calls/active'] });
      setActiveCall(null);
      setIsCallModalOpen(false);
      toast({
        title: "تم رفض المكالمة",
        description: "تم إنهاء المكالمة",
      });
    },
    onError: (error: any) => {
      console.error('خطأ في رفض المكالمة:', error);
      toast({
        title: "خطأ في رفض المكالمة",
        description: error.message || "حدث خطأ أثناء رفض المكالمة",
        variant: "destructive",
      });
    },
  });

  // إنهاء مكالمة
  const endCallMutation = useMutation({
    mutationFn: async ({ callId, duration = 0 }: { callId: string; duration?: number }) => {
      return apiRequest(`/api/calls/${callId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calls/active'] });
      setActiveCall(null);
      setIsCallModalOpen(false);
      toast({
        title: "انتهت المكالمة",
        description: "تم إنهاء المحادثة الصوتية",
      });
    },
    onError: (error: any) => {
      console.error('خطأ في إنهاء المكالمة:', error);
      toast({
        title: "خطأ في إنهاء المكالمة",
        description: error.message || "حدث خطأ أثناء إنهاء المكالمة",
        variant: "destructive",
      });
    },
  });

  // مراقبة المكالمات الواردة
  useEffect(() => {
    if (!currentUserId || !activeCalls.length) return;

    // البحث عن مكالمات واردة جديدة
    const incomingCall = activeCalls.find(call => 
      call.receiverId === currentUserId && 
      call.status === 'ringing' &&
      !activeCall // تجنب إظهار مكالمات متعددة
    );

    if (incomingCall && onIncomingCall) {
      console.log('📞 مكالمة واردة جديدة:', incomingCall);
      setActiveCall(incomingCall);
      setIsCallModalOpen(true);
      onIncomingCall(incomingCall as Call & { caller: User });
    }
  }, [activeCalls, currentUserId, activeCall, onIncomingCall]);

  // تنظيف الموارد عند الخروج
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // دوال مساعدة
  const startCall = (receiverId: string, callType: 'voice' | 'video' = 'voice') => {
    startCallMutation.mutate({ receiverId, callType });
  };

  const acceptCall = (callId: string) => {
    acceptCallMutation.mutate(callId);
  };

  const rejectCall = (callId: string) => {
    rejectCallMutation.mutate(callId);
  };

  const endCall = (callId: string, duration?: number) => {
    endCallMutation.mutate({ callId, duration });
  };

  const closeCallModal = () => {
    setIsCallModalOpen(false);
    setActiveCall(null);
  };

  return {
    // الحالة
    activeCall,
    isCallModalOpen,
    activeCalls,
    
    // الأعمال
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    closeCallModal,
    
    // حالة التحميل
    isStartingCall: startCallMutation.isPending,
    isAcceptingCall: acceptCallMutation.isPending,
    isRejectingCall: rejectCallMutation.isPending,
    isEndingCall: endCallMutation.isPending,
  };
}