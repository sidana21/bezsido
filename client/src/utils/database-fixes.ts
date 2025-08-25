/**
 * Database operation fixes
 * إصلاحات عمليات قاعدة البيانات
 */

/**
 * Safe OTP generation
 * إنشاء آمن لرمز OTP
 */
export const generateSecureOTP = (): string => {
  const digits = '0123456789';
  let otp = '';
  
  // Use crypto.getRandomValues for secure random generation
  const array = new Uint8Array(6);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < 6; i++) {
    otp += digits[array[i] % 10];
  }
  
  return otp;
};

/**
 * Safe OTP validation
 * تحقق آمن من رمز OTP
 */
export const validateOTP = (otp: string): boolean => {
  // Remove whitespace and validate format
  const cleanOTP = otp.trim();
  
  // Check if it's exactly 6 digits
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(cleanOTP);
};

/**
 * Safe phone number validation
 * تحقق آمن من رقم الهاتف
 */
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Remove all non-digit characters except +
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  
  // Check for international format (+country code + number)
  const phoneRegex = /^\+\d{10,15}$/;
  return phoneRegex.test(cleanPhone);
};

/**
 * Safe user data validation
 * تحقق آمن من بيانات المستخدم
 */
export const validateUserData = (data: {
  name?: string;
  location?: string;
  phoneNumber?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('الاسم مطلوب ويجب أن يكون أكثر من حرفين');
  }
  
  if (!data.location || data.location.trim().length < 2) {
    errors.push('الموقع مطلوب ويجب أن يكون أكثر من حرفين');
  }
  
  if (data.phoneNumber && !validatePhoneNumber(data.phoneNumber)) {
    errors.push('تنسيق رقم الهاتف غير صحيح');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Safe database error handling
 * معالجة آمنة لأخطاء قاعدة البيانات
 */
export const handleDatabaseError = (error: any, operation: string): string => {
  console.error(`Database error in ${operation}:`, error);
  
  // Map common database errors to user-friendly Arabic messages
  if (error.code === '23505') {
    return 'هذا السجل موجود بالفعل';
  }
  
  if (error.code === '23503') {
    return 'لا يمكن العثور على السجل المرتبط';
  }
  
  if (error.code === '23502') {
    return 'يجب ملء جميع الحقول المطلوبة';
  }
  
  if (error.message?.includes('timeout')) {
    return 'انتهت مهلة الاتصال بقاعدة البيانات';
  }
  
  if (error.message?.includes('connection')) {
    return 'فشل في الاتصال بقاعدة البيانات';
  }
  
  return 'حدث خطأ في قاعدة البيانات';
};