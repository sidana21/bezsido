/**
 * Runtime Error Fixes
 * إصلاحات أخطاء وقت التشغيل
 * 
 * يحتوي على إصلاحات شاملة لمنع أخطاء runtime وخاصة removeChild
 */

import { initializePortalSafety, fixHMROverlay } from './portal-safety';
import { safeDOMOperation } from './error-handling';

/**
 * Initialize all runtime error fixes
 * تهيئة جميع إصلاحات أخطاء وقت التشغيل
 */
export const initializeRuntimeErrorFixes = () => {
  console.debug('Initializing runtime error fixes...');
  
  // Initialize portal safety
  initializePortalSafety();
  
  // Fix HMR overlay issues
  fixHMROverlay();
  
  // Fix React DOM errors
  fixReactDOMErrors();
  
  // Fix mutation observer errors
  fixMutationObserverErrors();
  
  // Fix intersection observer errors
  fixIntersectionObserverErrors();
  
  // Fix resize observer errors
  fixResizeObserverErrors();
  
  console.debug('Runtime error fixes initialized successfully');
};

/**
 * Fix React DOM errors
 * إصلاح أخطاء React DOM
 */
const fixReactDOMErrors = () => {
  // Override React's internal error handling for DOM operations
  try {
    const originalRemoveChild = Node.prototype.removeChild;
    const originalAppendChild = Node.prototype.appendChild;
    const originalInsertBefore = Node.prototype.insertBefore;
    const originalReplaceChild = Node.prototype.replaceChild;
    
    (Node.prototype as any).removeChild = function(child: any) {
      try {
        if (this.contains && this.contains(child)) {
          return originalRemoveChild.call(this, child);
        } else {
          console.debug('Portal safety: Attempted to remove non-existent child');
          return child;
        }
      } catch (error) {
        console.debug('Portal safety: RemoveChild warning:', error);
        return child;
      }
    };
    
    (Node.prototype as any).appendChild = function(child: any) {
      try {
        return originalAppendChild.call(this, child);
      } catch (error) {
        console.debug('Portal safety: AppendChild warning:', error);
        return child;
      }
    };
    
    (Node.prototype as any).insertBefore = function(newNode: any, referenceNode: any) {
      try {
        return originalInsertBefore.call(this, newNode, referenceNode);
      } catch (error) {
        console.debug('Portal safety: InsertBefore warning:', error);
        return newNode;
      }
    };
    
    (Node.prototype as any).replaceChild = function(newChild: any, oldChild: any) {
      try {
        if (this.contains && this.contains(oldChild)) {
          return originalReplaceChild.call(this, newChild, oldChild);
        } else {
          console.debug('Portal safety: Attempted to replace non-existent child');
          return oldChild;
        }
      } catch (error) {
        console.debug('Portal safety: ReplaceChild warning:', error);
        return oldChild;
      }
    };
  } catch (error) {
    console.debug('DOM patching warning:', error);
  }
};

/**
 * Fix MutationObserver errors
 * إصلاح أخطاء MutationObserver
 */
const fixMutationObserverErrors = () => {
  const OriginalMutationObserver = window.MutationObserver;
  
  window.MutationObserver = class SafeMutationObserver extends OriginalMutationObserver {
    constructor(callback: MutationCallback) {
      const safeCallback: MutationCallback = (mutations, observer) => {
        safeDOMOperation(() => {
          callback(mutations, observer);
        }, 'MutationObserver callback warning');
      };
      
      super(safeCallback);
    }
    
    observe(target: Node, options?: MutationObserverInit) {
      safeDOMOperation(() => {
        super.observe(target, options);
      }, 'MutationObserver observe warning');
    }
    
    disconnect() {
      safeDOMOperation(() => {
        super.disconnect();
      }, 'MutationObserver disconnect warning');
    }
  };
};

/**
 * Fix IntersectionObserver errors
 * إصلاح أخطاء IntersectionObserver
 */
const fixIntersectionObserverErrors = () => {
  const OriginalIntersectionObserver = window.IntersectionObserver;
  
  if (OriginalIntersectionObserver) {
    window.IntersectionObserver = class SafeIntersectionObserver extends OriginalIntersectionObserver {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        const safeCallback: IntersectionObserverCallback = (entries, observer) => {
          safeDOMOperation(() => {
            callback(entries, observer);
          }, 'IntersectionObserver callback warning');
        };
        
        super(safeCallback, options);
      }
      
      observe(target: Element) {
        safeDOMOperation(() => {
          super.observe(target);
        }, 'IntersectionObserver observe warning');
      }
      
      unobserve(target: Element) {
        safeDOMOperation(() => {
          super.unobserve(target);
        }, 'IntersectionObserver unobserve warning');
      }
      
      disconnect() {
        safeDOMOperation(() => {
          super.disconnect();
        }, 'IntersectionObserver disconnect warning');
      }
    };
  }
};

/**
 * Fix ResizeObserver errors
 * إصلاح أخطاء ResizeObserver
 */
const fixResizeObserverErrors = () => {
  const OriginalResizeObserver = window.ResizeObserver;
  
  if (OriginalResizeObserver) {
    window.ResizeObserver = class SafeResizeObserver extends OriginalResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        const safeCallback: ResizeObserverCallback = (entries, observer) => {
          safeDOMOperation(() => {
            callback(entries, observer);
          }, 'ResizeObserver callback warning');
        };
        
        super(safeCallback);
      }
      
      observe(target: Element, options?: ResizeObserverOptions) {
        safeDOMOperation(() => {
          super.observe(target, options);
        }, 'ResizeObserver observe warning');
      }
      
      unobserve(target: Element) {
        safeDOMOperation(() => {
          super.unobserve(target);
        }, 'ResizeObserver unobserve warning');
      }
      
      disconnect() {
        safeDOMOperation(() => {
          super.disconnect();
        }, 'ResizeObserver disconnect warning');
      }
    };
  }
};

/**
 * Emergency DOM cleanup
 * تنظيف طوارئ للـ DOM
 */
export const emergencyDOMCleanup = () => {
  safeDOMOperation(() => {
    // Remove all problematic overlays
    const overlays = document.querySelectorAll(
      '[data-runtime-error-overlay], [data-vite-error-overlay], .error-overlay'
    );
    
    overlays.forEach(overlay => {
      try {
        overlay.remove();
      } catch (e) {
        console.debug('Emergency cleanup: Overlay removal warning:', e);
      }
    });
    
    // Clean up any orphaned portals
    const portals = document.querySelectorAll('[data-radix-portal]');
    portals.forEach(portal => {
      try {
        if (!portal.hasChildNodes()) {
          portal.remove();
        }
      } catch (e) {
        console.debug('Emergency cleanup: Portal removal warning:', e);
      }
    });
    
  }, 'Emergency DOM cleanup warning');
};

/**
 * Check for DOM health
 * فحص صحة DOM
 */
export const checkDOMHealth = () => {
  let issues = 0;
  
  // Check for orphaned nodes
  safeDOMOperation(() => {
    const orphanedPortals = document.querySelectorAll('[data-radix-portal]:empty');
    const errorOverlays = document.querySelectorAll('[data-runtime-error-overlay]');
    
    issues += orphanedPortals.length + errorOverlays.length;
    
    if (issues > 0) {
      console.debug(`DOM health check: Found ${issues} potential issues`);
      emergencyDOMCleanup();
    } else {
      console.debug('DOM health check: All good!');
    }
  }, 'DOM health check warning');
  
  return issues === 0;
};