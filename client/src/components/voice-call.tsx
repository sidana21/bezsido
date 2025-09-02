import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface VoiceCallProps {
  call: any; // Call object with otherUser
  currentUser: User | undefined;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onClose: () => void;
  isAccepting?: boolean;
  isRejecting?: boolean;
  isEnding?: boolean;
}

export function VoiceCall({ 
  call, 
  currentUser,
  onAccept, 
  onReject, 
  onEnd,
  onClose,
  isAccepting = false,
  isRejecting = false,
  isEnding = false
}: VoiceCallProps) {
  
  // استخراج بيانات المكالمة
  const callId = call?.id;
  const otherUser = call?.otherUser;
  const isIncoming = call?.receiverId === currentUser?.id;
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'active' | 'ended'>('ringing');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const ringtoneSoundRef = useRef<HTMLAudioElement | null>(null);
  
  const { toast } = useToast();

  // تهيئة صوت الرنين
  useEffect(() => {
    if (isIncoming) {
      try {
        // استخدام نغمة رنين بسيطة للمكالمات الواردة
        const ringtoneData = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjibzvPfiTcIG2m98OScTQwNUarm7blsGws5n9P1vmocBjiAyfTakTsIGGm98OScTQwNUarm7bhkHA=';
        ringtoneSoundRef.current = new Audio(ringtoneData);
        ringtoneSoundRef.current.loop = true;
        ringtoneSoundRef.current.volume = 0.7;
        ringtoneSoundRef.current.play();
      } catch (error) {
        console.error('خطأ في تشغيل نغمة الرنين:', error);
      }
    }

    return () => {
      if (ringtoneSoundRef.current) {
        ringtoneSoundRef.current.pause();
        ringtoneSoundRef.current = null;
      }
    };
  }, [isIncoming]);

  // تهيئة WebRTC
  useEffect(() => {
    initializeWebRTC();
    
    return () => {
      cleanup();
    };
  }, []);

  // عداد مدة المكالمة
  useEffect(() => {
    if (callStatus === 'active') {
      intervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [callStatus]);

  const initializeWebRTC = async () => {
    try {
      // طلب إذن الميكروفون
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      setLocalStream(stream);
      
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        localAudioRef.current.muted = true; // كتم الصوت المحلي لتجنب التغذية الراجعة
      }

      // إنشاء اتصال WebRTC
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      peerConnectionRef.current = peerConnection;

      // إضافة المسارات المحلية
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // التعامل مع المسارات البعيدة
      peerConnection.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setRemoteStream(remoteStream);
        
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
        }
      };

      // التعامل مع تغييرات حالة الاتصال
      peerConnection.onconnectionstatechange = () => {
        console.log('حالة الاتصال:', peerConnection.connectionState);
        
        if (peerConnection.connectionState === 'connected') {
          setCallStatus('active');
          if (ringtoneSoundRef.current) {
            ringtoneSoundRef.current.pause();
          }
        } else if (peerConnection.connectionState === 'disconnected' || 
                   peerConnection.connectionState === 'failed') {
          endCall();
        }
      };

    } catch (error) {
      console.error('خطأ في تهيئة WebRTC:', error);
      toast({
        title: "خطأ في المكالمة",
        description: "لا يمكن الوصول إلى الميكروفون. يرجى التحقق من الأذونات.",
        variant: "destructive",
      });
      onCallEnd();
    }
  };

  // دوال التحكم في المكالمة
  const handleAcceptCall = async () => {
    try {
      if (ringtoneSoundRef.current) {
        ringtoneSoundRef.current.pause();
      }
      
      setCallStatus('connecting');
      onAccept(); // استخدام الدالة المرسلة من المكون الأب
      
      toast({
        title: "تم قبول المكالمة",
        description: `بدء المكالمة مع ${otherUser?.name}`,
      });
      
    } catch (error) {
      console.error('خطأ في قبول المكالمة:', error);
      toast({
        title: "خطأ في قبول المكالمة",
        description: "حدث خطأ أثناء قبول المكالمة",
        variant: "destructive",
      });
    }
  };

  const handleRejectCall = async () => {
    try {
      if (ringtoneSoundRef.current) {
        ringtoneSoundRef.current.pause();
      }
      
      setCallStatus('ended');
      onReject(); // استخدام الدالة المرسلة من المكون الأب
      
    } catch (error) {
      console.error('خطأ في رفض المكالمة:', error);
      onClose(); // إغلاق المكالمة في حالة الخطأ
    }
  };

  const endCall = async () => {
    try {
      if (ringtoneSoundRef.current) {
        ringtoneSoundRef.current.pause();
      }
      
      // إخبار الخادم بإنهاء المكالمة
      await apiRequest(`/api/calls/${callId}/end`, {
        method: 'POST'
      });
      
    } catch (error) {
      console.error('خطأ في إنهاء المكالمة:', error);
    } finally {
      setCallStatus('ended');
      cleanup();
      onCallEnd();
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // في بيئة الويب، لا يمكن التحكم في مكبر الصوت مباشرة
    // ولكن يمكن تغيير مستوى الصوت
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = isSpeakerOn ? 0.5 : 1.0;
    }
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (ringtoneSoundRef.current) {
      ringtoneSoundRef.current.pause();
      ringtoneSoundRef.current = null;
    }
  };

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'ringing':
        return isIncoming ? 'مكالمة واردة...' : 'جاري الاتصال...';
      case 'connecting':
        return 'جاري الاتصال...';
      case 'active':
        return formatCallDuration(callDuration);
      case 'ended':
        return 'انتهت المكالمة';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          {/* صورة المستخدم */}
          <div className="mb-6">
            {otherUser.profilePicture ? (
              <img
                src={otherUser.profilePicture}
                alt={otherUser.name}
                className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white dark:border-gray-700 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {otherUser.name?.charAt(0) || '؟'}
              </div>
            )}
          </div>

          {/* اسم المستخدم */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {otherUser.name}
          </h2>

          {/* حالة المكالمة */}
          <Badge 
            variant={callStatus === 'active' ? 'default' : 'secondary'}
            className="mb-6 text-lg px-4 py-2"
          >
            {getStatusText()}
          </Badge>

          {/* أزرار التحكم */}
          {isIncoming && callStatus === 'ringing' ? (
            // أزرار قبول/رفض للمكالمات الواردة
            <div className="flex justify-center gap-6">
              <Button
                onClick={handleRejectCall}
                disabled={isRejecting}
                size="lg"
                variant="destructive"
                className="rounded-full w-16 h-16"
                data-testid="button-reject-call"
              >
                {isRejecting ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <PhoneOff className="h-6 w-6" />
                )}
              </Button>
              <Button
                onClick={handleAcceptCall}
                disabled={isAccepting}
                size="lg"
                className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-600"
                data-testid="button-accept-call"
              >
                {isAccepting ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Phone className="h-6 w-6" />
                )}
              </Button>
            </div>
          ) : callStatus === 'active' ? (
            // أزرار التحكم أثناء المكالمة
            <div className="flex justify-center gap-4">
              <Button
                onClick={toggleMute}
                size="lg"
                variant={isMuted ? "destructive" : "secondary"}
                className="rounded-full w-12 h-12"
                data-testid="button-toggle-mute"
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              
              <Button
                onClick={toggleSpeaker}
                size="lg"
                variant={isSpeakerOn ? "default" : "secondary"}
                className="rounded-full w-12 h-12"
                data-testid="button-toggle-speaker"
              >
                {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </Button>
              
              <Button
                onClick={handleEndCall}
                disabled={isEnding}
                size="lg"
                variant="destructive"
                className="rounded-full w-12 h-12"
                data-testid="button-end-call"
              >
                {isEnding ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <PhoneOff className="h-5 w-5" />
                )}
              </Button>
            </div>
          ) : (
            // زر إنهاء للمكالمات الصادرة في حالة الرنين
            <Button
              onClick={handleEndCall}
              disabled={isEnding}
              size="lg"
              variant="destructive"
              className="rounded-full w-16 h-16"
              data-testid="button-end-call"
            >
              {isEnding ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <PhoneOff className="h-6 w-6" />
              )}
            </Button>
          )}

          {/* عناصر الصوت المخفية */}
          <audio ref={localAudioRef} autoPlay muted style={{ display: 'none' }} />
          <audio ref={remoteAudioRef} autoPlay style={{ display: 'none' }} />
        </CardContent>
      </Card>
    </div>
  );
}