/**
 * Sandal - Modern Event Utilities
 * Vanilla JavaScript helpers for event handling
 */

// WeakMap to store event handlers for cleanup
const handlerStorage = new WeakMap();

/**
 * Add event listener
 * @param {Element|Window|Document} element 
 * @param {string} eventType - Event type(s), space-separated for multiple
 * @param {Function|string} handler - Handler function or selector for delegation
 * @param {Function} [delegatedHandler] - Handler when using delegation
 * @param {Object} [options] - addEventListener options
 */
export function on(element, eventType, handler, delegatedHandler, options = {}) {
  const events = eventType.split(' ').filter(Boolean);
  
  events.forEach(event => {
    let actualHandler;
    let selector = null;
    
    // Check if using event delegation
    if (typeof handler === 'string') {
      selector = handler;
      actualHandler = (e) => {
        const target = e.target.closest(selector);
        if (target && element.contains(target)) {
          delegatedHandler.call(target, e, target);
        }
      };
    } else {
      actualHandler = handler;
    }
    
    element.addEventListener(event, actualHandler, options);
    
    // Store for potential removal
    if (!handlerStorage.has(element)) {
      handlerStorage.set(element, new Map());
    }
    const elementHandlers = handlerStorage.get(element);
    const key = `${event}${selector || ''}`;
    if (!elementHandlers.has(key)) {
      elementHandlers.set(key, []);
    }
    elementHandlers.get(key).push({
      original: handler,
      actual: actualHandler,
      selector,
      options
    });
  });
}

/**
 * Remove event listener
 * @param {Element|Window|Document} element 
 * @param {string} eventType - Event type(s), space-separated
 * @param {Function|string} [handler] - Original handler or selector
 */
export function off(element, eventType, handler) {
  const events = eventType.split(' ').filter(Boolean);
  const elementHandlers = handlerStorage.get(element);
  
  if (!elementHandlers) return;
  
  events.forEach(event => {
    if (!handler) {
      // Remove all handlers for this event
      elementHandlers.forEach((handlers, key) => {
        if (key.startsWith(event)) {
          handlers.forEach(h => {
            element.removeEventListener(event, h.actual, h.options);
          });
          elementHandlers.delete(key);
        }
      });
    } else {
      const selector = typeof handler === 'string' ? handler : '';
      const key = `${event}${selector}`;
      const handlers = elementHandlers.get(key);
      
      if (handlers) {
        const idx = handlers.findIndex(h => 
          typeof handler === 'string' 
            ? h.selector === handler 
            : h.original === handler
        );
        if (idx !== -1) {
          element.removeEventListener(event, handlers[idx].actual, handlers[idx].options);
          handlers.splice(idx, 1);
        }
      }
    }
  });
}

/**
 * Add one-time event listener
 * @param {Element} element 
 * @param {string} eventType 
 * @param {Function} handler 
 */
export function once(element, eventType, handler) {
  on(element, eventType, handler, null, { once: true });
}

/**
 * Trigger custom event
 * @param {Element} element 
 * @param {string} eventType 
 * @param {Object} [detail] - Event detail data
 * @param {Object} [options] - Event options
 * @returns {boolean} - Whether event was not cancelled
 */
export function trigger(element, eventType, detail = {}, options = {}) {
  const event = new CustomEvent(eventType, {
    bubbles: options.bubbles !== false,
    cancelable: options.cancelable !== false,
    detail
  });
  return element.dispatchEvent(event);
}

/**
 * Delegate event handler to parent
 * @param {Element} parent 
 * @param {string} eventType 
 * @param {string} selector 
 * @param {Function} handler 
 * @param {Object} [options]
 */
export function delegate(parent, eventType, selector, handler, options = {}) {
  on(parent, eventType, selector, handler, options);
}

/**
 * Wait for transition end
 * @param {Element} element 
 * @param {number} [fallbackDuration=350] - Fallback duration in ms
 * @returns {Promise<void>}
 */
export function onTransitionEnd(element, fallbackDuration = 350) {
  return new Promise(resolve => {
    // Check if element has transitions
    const styles = getComputedStyle(element);
    const duration = parseFloat(styles.transitionDuration) * 1000;
    
    if (duration === 0) {
      resolve();
      return;
    }
    
    let resolved = false;
    
    const handler = () => {
      if (!resolved) {
        resolved = true;
        element.removeEventListener('transitionend', handler);
        resolve();
      }
    };
    
    element.addEventListener('transitionend', handler);
    
    // Fallback timeout
    setTimeout(handler, duration || fallbackDuration);
  });
}

/**
 * Wait for animation end
 * @param {Element} element 
 * @param {number} [fallbackDuration=350] - Fallback duration in ms
 * @returns {Promise<void>}
 */
export function onAnimationEnd(element, fallbackDuration = 350) {
  return new Promise(resolve => {
    const styles = getComputedStyle(element);
    const duration = parseFloat(styles.animationDuration) * 1000;
    
    if (duration === 0) {
      resolve();
      return;
    }
    
    let resolved = false;
    
    const handler = () => {
      if (!resolved) {
        resolved = true;
        element.removeEventListener('animationend', handler);
        resolve();
      }
    };
    
    element.addEventListener('animationend', handler);
    setTimeout(handler, duration || fallbackDuration);
  });
}

/**
 * Debounce function
 * @param {Function} func 
 * @param {number} wait 
 * @returns {Function}
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 * @param {Function} func 
 * @param {number} limit 
 * @returns {Function}
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Get event path (for older browsers)
 * @param {Event} event 
 * @returns {Element[]}
 */
export function getEventPath(event) {
  if (event.composedPath) {
    return event.composedPath();
  }
  
  const path = [];
  let target = event.target;
  while (target) {
    path.push(target);
    target = target.parentNode;
  }
  return path;
}

/**
 * Prevent default and stop propagation
 * @param {Event} event 
 */
export function stop(event) {
  event.preventDefault();
  event.stopPropagation();
}

/**
 * Check if key event matches key
 * @param {KeyboardEvent} event 
 * @param {string} key - Key name (e.g., 'Escape', 'Enter', 'ArrowDown')
 * @returns {boolean}
 */
export function isKey(event, key) {
  return event.key === key;
}

/**
 * Common key codes for keyboard navigation
 */
export const Keys = {
  TAB: 'Tab',
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  SPACE: ' ',
  END: 'End',
  HOME: 'Home',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_UP: 'ArrowUp',
  ARROW_RIGHT: 'ArrowRight',
  ARROW_DOWN: 'ArrowDown'
};

/**
 * Wait for DOM ready
 * @returns {Promise<void>}
 */
export function ready() {
  return new Promise(resolve => {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      resolve();
    } else {
      document.addEventListener('DOMContentLoaded', resolve, { once: true });
    }
  });
}

export default {
  on,
  off,
  once,
  trigger,
  delegate,
  onTransitionEnd,
  onAnimationEnd,
  debounce,
  throttle,
  getEventPath,
  stop,
  isKey,
  Keys,
  ready
};