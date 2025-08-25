/**
 * Audio recording utilities
 * أدوات التسجيل الصوتي مع معالجة آمنة للأخطاء
 */

import { safeDOMOperation } from './error-handling';

/**
 * Safe media stream cleanup
 * تنظيف آمن لتدفق الوسائط
 */
export const safeStopMediaStream = (stream: MediaStream | null) => {
  if (!stream) return;
  
  safeDOMOperation(() => {
    stream.getTracks().forEach(track => {
      safeDOMOperation(
        () => track.stop(),
        'Media track stop warning'
      );
    });
  }, 'Media stream cleanup warning');
};

/**
 * Safe microphone initialization
 * تهيئة آمنة للمايكروفون
 */
export const safeInitMicrophone = async (): Promise<MediaStream | null> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100
      }
    });
    return stream;
  } catch (error) {
    console.debug('Microphone initialization warning:', error);
    return null;
  }
};

/**
 * Safe MediaRecorder creation
 * إنشاء آمن لـ MediaRecorder
 */
export const safeCreateMediaRecorder = (
  stream: MediaStream,
  onDataAvailable: (event: BlobEvent) => void,
  onStop?: () => void
): MediaRecorder | null => {
  try {
    // Optimized MIME type selection
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav'
    ];
    
    let mimeType = '';
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        mimeType = type;
        break;
      }
    }
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: mimeType || undefined,
      audioBitsPerSecond: 128000
    });
    
    mediaRecorder.ondataavailable = onDataAvailable;
    if (onStop) {
      mediaRecorder.onstop = onStop;
    }
    
    return mediaRecorder;
  } catch (error) {
    console.debug('MediaRecorder creation warning:', error);
    return null;
  }
};

/**
 * Safe recording timer management
 * إدارة آمنة لمؤقت التسجيل
 */
export const createRecordingTimer = (
  onTick: (duration: number) => void,
  interval = 100
) => {
  let startTime = Date.now();
  let timerId: NodeJS.Timeout | null = null;
  
  const start = () => {
    startTime = Date.now();
    timerId = setInterval(() => {
      const duration = Date.now() - startTime;
      safeDOMOperation(
        () => onTick(duration),
        'Recording timer tick warning'
      );
    }, interval);
  };
  
  const stop = () => {
    if (timerId) {
      safeDOMOperation(
        () => clearInterval(timerId!),
        'Recording timer cleanup warning'
      );
      timerId = null;
    }
  };
  
  return { start, stop };
};