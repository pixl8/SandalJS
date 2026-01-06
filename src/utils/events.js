/**
 * Sandal - Event Utilities
 * Simplified to use JQNext for core event handling
 * Keeps only unique utilities not provided by JQNext
 */

import $ from 'jqnext';

// Re-export JQNext for convenience
export { $ };

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

export default {
  $,
  onTransitionEnd,
  onAnimationEnd,
  debounce,
  throttle,
  isKey,
  Keys
};