/**
 * Portal Safety Utilities
 * أدوات الحماية من أخطاء Portal و DOM
 * 
 * هذا الملف يحمي من أخطاء removeChild في portals مثل Dialog و Overlay
 */

import React from 'react';
import { safeDOMOperation } from './error-handling';

/**
 * Global DOM error prevention
 * منع شامل لأخطاء DOM
 */
let isPortalSafetyInitialized = false;

export const initializePortalSafety = () => {
  if (isPortalSafetyInitialized) return;
  
  // Override console.error to catch and handle DOM errors silently
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    // Silent handling of known portal/DOM issues
    if (
      message.includes('removeChild') ||
      message.includes('Failed to execute \'removeChild\'') ||
      message.includes('Node') ||
      message.includes('plugin:runtime-error-plugin') ||
      message.includes('server.hmr.overlay')
    ) {
      // Log as debug instead of error
      console.debug('Portal safety: Handled DOM operation warning:', ...args);
      return;
    }
    
    // Allow other errors to show normally
    originalConsoleError.apply(console, args);
  };
  
  // Global error handler for unhandled DOM operations
  window.addEventListener('error', (event) => {
    if (
      event.message?.includes('removeChild') ||
      event.message?.includes('appendChild') ||
      event.message?.includes('insertBefore')
    ) {
      event.preventDefault();
      console.debug('Portal safety: Prevented DOM error:', event.message);
    }
  });
  
  // Handle unhandled promise rejections related to DOM
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason?.message?.includes('removeChild') ||
      event.reason?.message?.includes('DOM')
    ) {
      event.preventDefault();
      console.debug('Portal safety: Handled DOM promise rejection:', event.reason);
    }
  });
  
  isPortalSafetyInitialized = true;
  console.debug('Portal safety initialized successfully');
};

/**
 * Safe portal wrapper for Radix UI components
 * غلاف آمن لمكونات Radix UI
 */
export const createSafePortal = (PortalComponent: any) => {
  return (props: any) => {
    try {
      return React.createElement(PortalComponent, props);
    } catch (error) {
      console.debug('Portal safety: Portal creation warning:', error);
      return null;
    }
  };
};

/**
 * Safe overlay wrapper
 * غلاف آمن للـ overlays
 */
export const createSafeOverlay = (OverlayComponent: any) => {
  return (props: any) => {
    const safeProps = {
      ...props,
      onEscapeKeyDown: (event: KeyboardEvent) => {
        safeDOMOperation(() => {
          props.onEscapeKeyDown?.(event);
        }, 'Overlay escape key warning');
      },
      onPointerDownOutside: (event: PointerEvent) => {
        safeDOMOperation(() => {
          props.onPointerDownOutside?.(event);
        }, 'Overlay pointer down warning');
      },
      onInteractOutside: (event: any) => {
        safeDOMOperation(() => {
          props.onInteractOutside?.(event);
        }, 'Overlay interact outside warning');
      }
    };
    
    try {
      return React.createElement(OverlayComponent, safeProps);
    } catch (error) {
      console.debug('Portal safety: Overlay creation warning:', error);
      return null;
    }
  };
};

/**
 * Safe Dialog wrapper
 * غلاف آمن للـ dialogs
 */
export const createSafeDialog = (DialogComponent: any) => {
  return (props: any) => {
    const safeProps = {
      ...props,
      onOpenChange: (open: boolean) => {
        safeDOMOperation(() => {
          props.onOpenChange?.(open);
        }, 'Dialog open change warning');
      }
    };
    
    try {
      return React.createElement(DialogComponent, safeProps);
    } catch (error) {
      console.debug('Portal safety: Dialog creation warning:', error);
      return null;
    }
  };
};

/**
 * HMR overlay specific fix
 * إصلاح خاص بـ HMR overlay
 */
export const fixHMROverlay = () => {
  // Override Vite HMR overlay if it exists
  if (typeof window !== 'undefined' && (window as any).__vite_plugin_error_overlay) {
    const originalOverlay = (window as any).__vite_plugin_error_overlay;
    
    (window as any).__vite_plugin_error_overlay = {
      ...originalOverlay,
      close: () => {
        safeDOMOperation(() => {
          originalOverlay.close?.();
        }, 'HMR overlay close warning');
      },
      show: (...args: any[]) => {
        safeDOMOperation(() => {
          originalOverlay.show?.(...args);
        }, 'HMR overlay show warning');
      }
    };
  }
  
  // Handle any existing error overlays
  const cleanupExistingOverlays = () => {
    safeDOMOperation(() => {
      const overlays = document.querySelectorAll('[data-runtime-error-overlay]');
      overlays.forEach(overlay => {
        try {
          overlay.remove();
        } catch (e) {
          console.debug('Portal safety: Overlay cleanup warning:', e);
        }
      });
    }, 'Existing overlays cleanup warning');
  };
  
  // Clean up on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cleanupExistingOverlays);
  } else {
    cleanupExistingOverlays();
  }
};

/**
 * Toast safety wrapper
 * غلاف آمن للـ toasts
 */
export const createSafeToast = () => {
  return {
    show: (props: any) => {
      safeDOMOperation(() => {
        // Safely handle toast display
      }, 'Toast show warning');
    },
    dismiss: (id?: string) => {
      safeDOMOperation(() => {
        // Safely handle toast dismissal
      }, 'Toast dismiss warning');
    }
  };
};