/**
 * Error handling utilities
 * يحتوي على دوال مساعدة لمعالجة الأخطاء وحماية التطبيق
 */

/**
 * Safe function execution with error handling
 * تنفيذ آمن للدوال مع معالجة الأخطاء
 */
export const safeExecute = <T extends (...args: any[]) => any>(
  fn: T | undefined,
  ...args: Parameters<T>
): ReturnType<T> | undefined => {
  try {
    if (typeof fn === 'function') {
      return fn(...args);
    }
  } catch (error) {
    console.debug('Safe execution warning:', error);
  }
  return undefined;
};

/**
 * Safe async function execution
 * تنفيذ آمن للدوال غير المتزامنة
 */
export const safeExecuteAsync = async <T extends (...args: any[]) => Promise<any>>(
  fn: T | undefined,
  ...args: Parameters<T>
): Promise<Awaited<ReturnType<T>> | undefined> => {
  try {
    if (typeof fn === 'function') {
      return await fn(...args);
    }
  } catch (error) {
    console.debug('Safe async execution warning:', error);
  }
  return undefined;
};

/**
 * Safe DOM operation wrapper
 * غلاف آمن لعمليات DOM
 */
export const safeDOMOperation = (operation: () => void, errorMessage = 'DOM operation warning') => {
  try {
    operation();
  } catch (error) {
    console.debug(errorMessage, error);
  }
};

/**
 * Validate function before execution
 * التحقق من صحة الدالة قبل التنفيذ
 */
export const isValidFunction = (fn: any): fn is Function => {
  return typeof fn === 'function';
};