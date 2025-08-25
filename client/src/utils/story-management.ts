/**
 * Story management utilities
 * أدوات إدارة القصص مع معالجة آمنة للأخطاء
 */

import { safeExecute } from './error-handling';
import { safeInterval } from './dom-cleanup';

/**
 * Safe story progress management
 * إدارة آمنة لتقدم القصة
 */
export const createStoryProgressManager = (
  onProgress: (progress: number) => void,
  onComplete: () => void,
  duration = 5000 // 5 seconds default
) => {
  const interval = 50; // Update every 50ms
  const incrementPerTick = (100 / duration) * interval;
  let currentProgress = 0;
  let isActive = false;
  let cleanupInterval: (() => void) | null = null;
  
  const start = () => {
    if (isActive) return;
    
    isActive = true;
    currentProgress = 0;
    
    cleanupInterval = safeInterval(() => {
      if (!isActive) return;
      
      currentProgress += incrementPerTick;
      
      if (currentProgress >= 100) {
        currentProgress = 100;
        safeExecute(onProgress, currentProgress);
        stop();
        safeExecute(onComplete);
      } else {
        safeExecute(onProgress, currentProgress);
      }
    }, interval);
  };
  
  const stop = () => {
    isActive = false;
    if (cleanupInterval) {
      cleanupInterval();
      cleanupInterval = null;
    }
  };
  
  const pause = () => {
    isActive = false;
  };
  
  const resume = () => {
    if (currentProgress < 100) {
      isActive = true;
    }
  };
  
  const reset = () => {
    stop();
    currentProgress = 0;
    safeExecute(onProgress, 0);
  };
  
  return {
    start,
    stop,
    pause,
    resume,
    reset,
    getProgress: () => currentProgress,
    isActive: () => isActive
  };
};

/**
 * Safe story navigation
 * تنقل آمن في القصص
 */
export const createStoryNavigator = (
  onNext?: () => void,
  onPrevious?: () => void,
  onClose?: () => void
) => {
  const safeNext = () => {
    safeExecute(onNext);
  };
  
  const safePrevious = () => {
    safeExecute(onPrevious);
  };
  
  const safeClose = () => {
    safeExecute(onClose);
  };
  
  return {
    next: safeNext,
    previous: safePrevious,
    close: safeClose
  };
};

/**
 * Story viewer state manager
 * مدير حالة عارض القصص
 */
export const createStoryViewerState = () => {
  let isPlaying = true;
  let progress = 0;
  
  const setState = (newState: { isPlaying?: boolean; progress?: number }) => {
    if (newState.isPlaying !== undefined) {
      isPlaying = newState.isPlaying;
    }
    if (newState.progress !== undefined) {
      progress = Math.max(0, Math.min(100, newState.progress));
    }
  };
  
  const getState = () => ({
    isPlaying,
    progress
  });
  
  const togglePlay = () => {
    isPlaying = !isPlaying;
    return isPlaying;
  };
  
  return {
    setState,
    getState,
    togglePlay
  };
};