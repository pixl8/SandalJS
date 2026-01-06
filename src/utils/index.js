/**
 * Sandal - Utility Modules
 * Simplified to use JQNext for core functionality
 */

import $ from 'jqnext';

export * from './dom.js';
export * from './events.js';
export * from './animation.js';
export * from './position.js';

// Re-export JQNext
export { $ };

// Default exports as namespaces
export { default as DOM } from './dom.js';
export { default as Events } from './events.js';
export { default as Animation } from './animation.js';
export { default as Position } from './position.js';

/**
 * Store component instance on element using JQNext's data system
 * @param {Element} element 
 * @param {string} key - Component key (e.g., 'bs.modal')
 * @param {Object} instance 
 */
export function setInstance(element, key, instance) {
  $(element).data(key, instance);
}

/**
 * Get component instance from element using JQNext's data system
 * @param {Element} element 
 * @param {string} key 
 * @returns {Object|null}
 */
export function getInstance(element, key) {
  return $(element).data(key) || null;
}

/**
 * Remove component instance from element using JQNext's data system
 * @param {Element} element 
 * @param {string} key 
 */
export function removeInstance(element, key) {
  $(element).removeData(key);
}

/**
 * Get or create component instance
 * @param {Element} element 
 * @param {string} key 
 * @param {Function} Constructor 
 * @param {Object} options 
 * @returns {Object}
 */
export function getOrCreateInstance(element, key, Constructor, options) {
  let instance = getInstance(element, key);
  if (!instance) {
    instance = new Constructor(element, options);
    setInstance(element, key, instance);
  }
  return instance;
}

/**
 * Parse options from data attributes
 * @param {Element} element 
 * @param {Object} defaults - Default options
 * @param {string} prefix - Data attribute prefix (e.g., 'bs' for data-bs-*)
 * @returns {Object}
 */
export function parseDataOptions(element, defaults = {}, prefix = '') {
  const options = { ...defaults };
  const dataPrefix = prefix ? `${prefix}-` : '';
  
  Object.keys(defaults).forEach(key => {
    // Convert camelCase to kebab-case for data attribute lookup
    const dataKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    const attrName = `data-${dataPrefix}${dataKey}`;
    const value = element.getAttribute(attrName);
    
    if (value !== null) {
      // Type coercion
      if (value === 'true') {
        options[key] = true;
      } else if (value === 'false') {
        options[key] = false;
      } else if (!isNaN(Number(value)) && value !== '') {
        options[key] = Number(value);
      } else {
        try {
          options[key] = JSON.parse(value);
        } catch {
          options[key] = value;
        }
      }
    }
  });
  
  return options;
}

/**
 * Get unique ID
 * @param {string} [prefix='sandal'] 
 * @returns {string}
 */
let idCounter = 0;
export function getUID(prefix = 'sandal') {
  do {
    idCounter++;
  } while (document.getElementById(`${prefix}${idCounter}`));
  
  return `${prefix}${idCounter}`;
}

/**
 * Check if element is disabled
 * @param {Element} element 
 * @returns {boolean}
 */
export function isDisabled(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return true;
  
  if (element.classList.contains('disabled')) return true;
  if (element.hasAttribute('disabled')) return true;
  if (element.getAttribute('aria-disabled') === 'true') return true;
  
  return false;
}

/**
 * Execute callback or return selector element
 * @param {string|Element|Function} value 
 * @param {Element} [context] 
 * @returns {Element|null}
 */
export function getElement(value, context = document) {
  if (value instanceof Element) return value;
  if (typeof value === 'string') {
    return context.querySelector(value);
  }
  return null;
}

/**
 * Trap focus within element
 * @param {Element} element 
 * @returns {Function} - Cleanup function
 */
export function trapFocus(element) {
  const focusable = getFocusable(element);
  if (focusable.length === 0) return () => {};
  
  const firstFocusable = focusable[0];
  const lastFocusable = focusable[focusable.length - 1];
  
  const handleKeydown = (e) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  };
  
  element.addEventListener('keydown', handleKeydown);
  return () => element.removeEventListener('keydown', handleKeydown);
}

/**
 * Get focusable elements within container
 * @param {Element} container 
 * @returns {Element[]}
 */
function getFocusable(container) {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');
  
  return Array.from(container.querySelectorAll(selector)).filter(el => {
    return el.offsetWidth > 0 || el.offsetHeight > 0;
  });
}

/**
 * Merge configuration objects deeply
 * @param {Object} target 
 * @param {...Object} sources 
 * @returns {Object}
 */
export function mergeConfig(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();
  
  if (isPlainObject(target) && isPlainObject(source)) {
    for (const key in source) {
      if (isPlainObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeConfig(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  
  return mergeConfig(target, ...sources);
}

/**
 * Check if value is plain object
 * @param {*} value 
 * @returns {boolean}
 */
function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}