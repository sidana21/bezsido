/**
 * DOM cleanup utilities
 * أدوات تنظيف DOM ومنع أخطاء removeChild
 */

import { safeDOMOperation } from './error-handling';

/**
 * Safe event listener removal
 * إزالة آمنة لمستمعي الأحداث
 */
export const safeRemoveEventListener = (
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | EventListenerOptions
) => {
  safeDOMOperation(
    () => target.removeEventListener(type, listener, options),
    'Event listener removal warning'
  );
};

/**
 * Safe event listener addition with cleanup
 * إضافة آمنة لمستمعي الأحداث مع تنظيف
 */
export const safeAddEventListener = (
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
) => {
  try {
    target.addEventListener(type, listener, options);
    return () => safeRemoveEventListener(target, type, listener, options);
  } catch (error) {
    console.debug('Event listener addition warning:', error);
    return () => {}; // Return empty cleanup function
  }
};

/**
 * Safe interval management
 * إدارة آمنة للفواصل الزمنية
 */
export const safeInterval = (callback: () => void, delay: number) => {
  const interval = setInterval(() => {
    safeDOMOperation(callback, 'Interval callback warning');
  }, delay);

  return () => {
    safeDOMOperation(
      () => clearInterval(interval),
      'Interval cleanup warning'
    );
  };
};

/**
 * Safe timeout management
 * إدارة آمنة للمهلات الزمنية
 */
export const safeTimeout = (callback: () => void, delay: number) => {
  const timeout = setTimeout(() => {
    safeDOMOperation(callback, 'Timeout callback warning');
  }, delay);

  return () => {
    safeDOMOperation(
      () => clearTimeout(timeout),
      'Timeout cleanup warning'
    );
  };
};

/**
 * Create safe useEffect cleanup
 * إنشاء تنظيف آمن لـ useEffect
 */
export const createSafeCleanup = (cleanupOperations: (() => void)[]) => {
  return () => {
    cleanupOperations.forEach((operation, index) => {
      safeDOMOperation(operation, `Cleanup operation ${index} warning`);
    });
  };
};