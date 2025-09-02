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

  // إنشاء نغمة رنين جميلة ومطولة
  const createBeautifulRingtone = () => {
    // نغمة رنين عربية تقليدية محسنة مع ترددات جميلة
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const duration = 3; // مدة 3 ثواني
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    
    // إنشاء نغمة موسيقية عربية جميلة
    for (let i = 0; i < length; i++) {
      const time = i / sampleRate;
      
      // نغمات متعددة تشكل لحن عربي جميل
      const freq1 = 523.25; // نوتة دو
      const freq2 = 659.25; // نوتة مي
      const freq3 = 783.99; // نوتة صول
      const freq4 = 880.00; // نوتة لا
      
      // مزج النغمات مع تأثيرات تتلاشى وتظهر
      let sample = 0;
      const fadeIn = Math.min(time * 2, 1);
      const fadeOut = Math.max(0, 1 - (time - 2) * 2);
      const envelope = fadeIn * fadeOut;
      
      // إضافة النغمات الأساسية
      sample += Math.sin(2 * Math.PI * freq1 * time) * 0.3;
      sample += Math.sin(2 * Math.PI * freq2 * time) * 0.25;
      sample += Math.sin(2 * Math.PI * freq3 * time) * 0.2;
      sample += Math.sin(2 * Math.PI * freq4 * time) * 0.15;
      
      // إضافة تأثيرات إيقاعية
      const rhythm = Math.sin(2 * Math.PI * 2 * time); // إيقاع كل نصف ثانية
      sample *= (0.8 + 0.2 * rhythm);
      
      // تطبيق المغلف والتحكم في الحجم
      data[i] = sample * envelope * 0.4;
    }
    
    // تحويل إلى wav
    return bufferToWav(buffer);
  };

  // تحويل AudioBuffer إلى WAV
  const bufferToWav = (buffer: AudioBuffer) => {
    const length = buffer.length;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);
    const data = buffer.getChannelData(0);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
    
    return URL.createObjectURL(new Blob([arrayBuffer], { type: 'audio/wav' }));
  };

  // تهيئة صوت الرنين الجميل
  useEffect(() => {
    try {
      // نغمة رنين عربية جميلة محسنة للمكالمات
      const beautifulRingtone = createBeautifulRingtone();
      ringtoneSoundRef.current = new Audio(beautifulRingtone);
      ringtoneSoundRef.current.loop = true;
      ringtoneSoundRef.current.volume = 0.9; // صوت مرتفع
      
      // تشغيل النغمة للمكالمات الواردة والصادرة
      if (isIncoming || callStatus === 'ringing') {
        // تشغيل بعد تأخير قصير للتأكد من أن المتصفح يسمح بالصوت
        setTimeout(() => {
          ringtoneSoundRef.current?.play().catch(error => {
            console.log('🔊 نغمة الرنين جاهزة - سيتم تشغيلها عند التفاعل:', error);
          });
        }, 100);
      }
    } catch (error) {
      console.error('خطأ في تشغيل نغمة الرنين:', error);
    }

    return () => {
      if (ringtoneSoundRef.current) {
        ringtoneSoundRef.current.pause();
        ringtoneSoundRef.current = null;
      }
    };
  }, [isIncoming, callStatus]);

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
      onEnd();
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
      onEnd();
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
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900/90 to-purple-900/90 backdrop-blur-lg z-50 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-2xl border-0 ring-2 ring-white/20">
        <CardContent className="p-8 text-center relative overflow-hidden">
          {/* تأثير مرئي للنبضات */}
          <div className="absolute inset-0 pointer-events-none">
            {callStatus === 'ringing' && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-32 h-32 rounded-full bg-blue-400/20 animate-ping"></div>
                <div className="w-24 h-24 rounded-full bg-blue-400/30 animate-ping delay-75 absolute top-4 left-4"></div>
                <div className="w-16 h-16 rounded-full bg-blue-400/40 animate-ping delay-150 absolute top-8 left-8"></div>
              </div>
            )}
          </div>

          {/* صورة المستخدم */}
          <div className="mb-6 relative z-10">
            {otherUser.profilePicture ? (
              <img
                src={otherUser.profilePicture}
                alt={otherUser.name}
                className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white dark:border-gray-700 shadow-2xl ring-4 ring-blue-400/30"
              />
            ) : (
              <div className="w-32 h-32 rounded-full mx-auto bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center text-white text-3xl font-bold shadow-2xl ring-4 ring-blue-400/30">
                {otherUser.name?.charAt(0) || '؟'}
              </div>
            )}
            
            {/* مؤشر حالة المكالمة */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className={`w-6 h-6 rounded-full border-2 border-white ${
                callStatus === 'active' ? 'bg-green-500 animate-pulse' : 
                callStatus === 'ringing' ? 'bg-yellow-500 animate-bounce' : 
                'bg-gray-400'
              }`}></div>
            </div>
          </div>

          {/* اسم المستخدم */}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 drop-shadow-md">
            {otherUser.name}
          </h2>

          {/* معلومات إضافية */}
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            📱 {otherUser.phoneNumber}
          </p>

          {/* حالة المكالمة */}
          <Badge 
            variant={callStatus === 'active' ? 'default' : 'secondary'}
            className={`mb-8 text-lg px-6 py-3 font-semibold rounded-full shadow-lg ${
              callStatus === 'active' ? 'bg-green-500 text-white animate-pulse' :
              callStatus === 'ringing' ? 'bg-yellow-500 text-white animate-bounce' :
              'bg-blue-500 text-white'
            }`}
          >
            {callStatus === 'ringing' && '📞 '}{getStatusText()}
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
                onClick={endCall}
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
              onClick={endCall}
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