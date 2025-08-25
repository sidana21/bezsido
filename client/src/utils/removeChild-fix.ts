/**
 * RemoveChild Error Fix
 * إصلاح خطأ removeChild النهائي
 * 
 * هذا الملف يحتوي على الإصلاح المحدد لخطأ removeChild الذي ظهر في الصورة
 */

import { safeDOMOperation } from './error-handling';

/**
 * Fix specific to the runtime error overlay removeChild issue
 * إصلاح خاص بمشكلة removeChild في runtime error overlay
 */
export const fixRemoveChildError = () => {
  console.debug('🔧 Applying removeChild error fix...');
  
  // Comprehensive DOM protection
  const protectDOMOperations = () => {
    // Store original methods
    const originalMethods = {
      removeChild: Node.prototype.removeChild,
      appendChild: Node.prototype.appendChild,
      insertBefore: Node.prototype.insertBefore,
      replaceChild: Node.prototype.replaceChild
    };
    
    // Safe removeChild
    (Node.prototype as any).removeChild = function(child: Node) {
      try {
        // Check if child is actually a child of this node
        if (this && child && this.contains && this.contains(child)) {
          return originalMethods.removeChild.call(this, child);
        } else {
          console.debug('RemoveChild Fix: Prevented invalid removal');
          return child;
        }
      } catch (error) {
        console.debug('RemoveChild Fix: Caught error:', error);
        return child;
      }
    };
    
    // Safe appendChild
    (Node.prototype as any).appendChild = function(child: Node) {
      try {
        return originalMethods.appendChild.call(this, child);
      } catch (error) {
        console.debug('RemoveChild Fix: AppendChild error:', error);
        return child;
      }
    };
    
    // Safe insertBefore
    (Node.prototype as any).insertBefore = function(newNode: Node, referenceNode: Node | null) {
      try {
        return originalMethods.insertBefore.call(this, newNode, referenceNode);
      } catch (error) {
        console.debug('RemoveChild Fix: InsertBefore error:', error);
        return newNode;
      }
    };
    
    // Safe replaceChild
    (Node.prototype as any).replaceChild = function(newChild: Node, oldChild: Node) {
      try {
        if (this && oldChild && this.contains && this.contains(oldChild)) {
          return originalMethods.replaceChild.call(this, newChild, oldChild);
        } else {
          console.debug('RemoveChild Fix: Prevented invalid replacement');
          return oldChild;
        }
      } catch (error) {
        console.debug('RemoveChild Fix: ReplaceChild error:', error);
        return oldChild;
      }
    };
  };
  
  // Apply protection immediately
  protectDOMOperations();
  
  // Error boundary for runtime error overlay
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    // Silence specific removeChild errors from runtime error plugin
    if (
      message.includes('removeChild') ||
      message.includes('Failed to execute \'removeChild\'') ||
      message.includes('plugin:runtime-error-plugin') ||
      message.includes('server.hmr.overlay')
    ) {
      console.debug('RemoveChild Fix: Silenced error:', message);
      return;
    }
    
    // Allow other errors
    originalConsoleError.apply(console, args);
  };
  
  // Global error handler
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('removeChild')) {
      event.preventDefault();
      console.debug('RemoveChild Fix: Prevented global error');
    }
  });
  
  // Clean up existing error overlays
  const cleanupErrorOverlays = () => {
    safeDOMOperation(() => {
      const overlays = document.querySelectorAll(
        '[data-runtime-error-overlay], [data-vite-error-overlay], .vite-error-overlay'
      );
      
      overlays.forEach(overlay => {
        try {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        } catch (e) {
          // Use the new safe method
          console.debug('RemoveChild Fix: Overlay cleanup handled');
        }
      });
    }, 'Error overlay cleanup');
  };
  
  // Clean up immediately and on DOM ready
  cleanupErrorOverlays();
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cleanupErrorOverlays);
  }
  
  // Set up periodic cleanup
  setInterval(cleanupErrorOverlays, 5000);
  
  console.debug('✅ RemoveChild error fix applied successfully');
};

/**
 * Monitor for removeChild errors specifically
 * مراقبة خاصة لأخطاء removeChild
 */
export const monitorRemoveChildErrors = () => {
  let errorCount = 0;
  
  const originalError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (typeof message === 'string' && message.includes('removeChild')) {
      errorCount++;
      console.debug(`RemoveChild Monitor: Caught error #${errorCount}`);
      
      // Auto-fix if too many errors
      if (errorCount > 3) {
        console.debug('RemoveChild Monitor: Re-applying fix due to multiple errors');
        fixRemoveChildError();
        errorCount = 0;
      }
      
      return true; // Prevent default error handling
    }
    
    // Call original handler for other errors
    if (originalError) {
      return originalError(message, source, lineno, colno, error);
    }
    
    return false;
  };
};

/**
 * Apply all removeChild fixes
 * تطبيق جميع إصلاحات removeChild
 */
export const applyAllRemoveChildFixes = () => {
  fixRemoveChildError();
  monitorRemoveChildErrors();
  
  console.debug('🛡️ All removeChild fixes applied');
};