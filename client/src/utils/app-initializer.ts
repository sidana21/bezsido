/**
 * App Initializer
 * مُهيئ التطبيق
 * 
 * يقوم بتهيئة جميع الحمايات والإصلاحات عند بدء التطبيق
 */

import { initializeRuntimeErrorFixes, checkDOMHealth, emergencyDOMCleanup } from './runtime-error-fixes';
import { initializePortalSafety } from './portal-safety';
import { applyAllRemoveChildFixes } from './removeChild-fix';

/**
 * Initialize the entire application safety system
 * تهيئة نظام الحماية الشامل للتطبيق
 */
export const initializeApp = () => {
  console.debug('🛡️ Initializing Bivochat safety systems...');
  
  try {
    // Initialize runtime error fixes
    initializeRuntimeErrorFixes();
    
    // Initialize portal safety
    initializePortalSafety();
    
    // Apply specific removeChild fixes
    applyAllRemoveChildFixes();
    
    // Perform initial DOM health check
    checkDOMHealth();
    
    // Set up periodic health checks
    setupPeriodicHealthChecks();
    
    // Set up page visibility change handler
    setupVisibilityChangeHandler();
    
    console.debug('✅ Bivochat safety systems initialized successfully');
    
  } catch (error) {
    console.debug('⚠️ Safety system initialization warning:', error);
    // Even if initialization fails, we continue
  }
};

/**
 * Set up periodic DOM health checks
 * إعداد فحوصات دورية لصحة DOM
 */
const setupPeriodicHealthChecks = () => {
  // Check DOM health every 30 seconds
  setInterval(() => {
    checkDOMHealth();
  }, 30000);
  
  // Emergency cleanup every 5 minutes
  setInterval(() => {
    emergencyDOMCleanup();
  }, 300000);
};

/**
 * Set up page visibility change handler
 * إعداد معالج تغيير رؤية الصفحة
 */
const setupVisibilityChangeHandler = () => {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // When page becomes visible, check DOM health
      setTimeout(() => {
        checkDOMHealth();
      }, 1000);
    }
  });
};

/**
 * Development mode specific initializations
 * تهيئات خاصة بوضع التطوير
 */
export const initializeDevelopmentMode = () => {
  if (import.meta.env.DEV) {
    console.debug('🔧 Initializing development mode safety...');
    
    // More frequent health checks in development
    setInterval(() => {
      checkDOMHealth();
    }, 10000);
    
    // Clean up on HMR updates
    if (import.meta.hot) {
      import.meta.hot.on('vite:beforeUpdate', () => {
        emergencyDOMCleanup();
      });
      
      import.meta.hot.on('vite:afterUpdate', () => {
        setTimeout(() => {
          checkDOMHealth();
        }, 500);
      });
    }
  }
};

/**
 * Production mode specific initializations
 * تهيئات خاصة بوضع الإنتاج
 */
export const initializeProductionMode = () => {
  if (import.meta.env.PROD) {
    console.debug('🚀 Initializing production mode safety...');
    
    // Less frequent but still important health checks
    setInterval(() => {
      checkDOMHealth();
    }, 60000);
  }
};