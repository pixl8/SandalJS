/**
 * Sandal - Modern DOM Utilities
 * Vanilla JavaScript helpers for DOM manipulation
 */

/**
 * Query single element
 * @param {string|Element} selector - CSS selector or element
 * @param {Element|Document} context - Context to search within
 * @returns {Element|null}
 */
export function $(selector, context = document) {
  if (selector instanceof Element) return selector;
  if (typeof selector === 'string') {
    return context.querySelector(selector);
  }
  return null;
}

/**
 * Query multiple elements
 * @param {string} selector - CSS selector
 * @param {Element|Document} context - Context to search within
 * @returns {Element[]}
 */
export function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

/**
 * Get element by data attribute
 * @param {string} name - Data attribute name (without 'data-' prefix)
 * @param {string} [value] - Optional value to match
 * @param {Element|Document} context - Context to search within
 * @returns {Element|null}
 */
export function getByData(name, value, context = document) {
  const selector = value !== undefined 
    ? `[data-${name}="${value}"]` 
    : `[data-${name}]`;
  return context.querySelector(selector);
}

/**
 * Get all elements by data attribute
 * @param {string} name - Data attribute name (without 'data-' prefix)
 * @param {string} [value] - Optional value to match
 * @param {Element|Document} context - Context to search within
 * @returns {Element[]}
 */
export function getAllByData(name, value, context = document) {
  const selector = value !== undefined 
    ? `[data-${name}="${value}"]` 
    : `[data-${name}]`;
  return Array.from(context.querySelectorAll(selector));
}

/**
 * Check if element matches selector
 * @param {Element} element
 * @param {string} selector
 * @returns {boolean}
 */
export function matches(element, selector) {
  if (!element || !element.matches) return false;
  return element.matches(selector);
}

/**
 * Find closest ancestor matching selector
 * @param {Element} element
 * @param {string} selector
 * @returns {Element|null}
 */
export function closest(element, selector) {
  if (!element || !element.closest) return null;
  return element.closest(selector);
}

/**
 * Get parent element
 * @param {Element} element
 * @returns {Element|null}
 */
export function parent(element) {
  if (!element) return null;
  return element.parentElement;
}

/**
 * Get siblings of element
 * @param {Element} element
 * @returns {Element[]}
 */
export function siblings(element) {
  if (!element || !element.parentElement) return [];
  return Array.from(element.parentElement.children).filter(child => child !== element);
}

/**
 * Get previous sibling element
 * @param {Element} element
 * @param {string} [selector] - Optional selector to match
 * @returns {Element|null}
 */
export function prev(element, selector) {
  if (!element) return null;
  let sibling = element.previousElementSibling;
  if (!selector) return sibling;
  while (sibling) {
    if (sibling.matches && sibling.matches(selector)) return sibling;
    sibling = sibling.previousElementSibling;
  }
  return null;
}

/**
 * Get next sibling element
 * @param {Element} element
 * @param {string} [selector] - Optional selector to match
 * @returns {Element|null}
 */
export function next(element, selector) {
  if (!element) return null;
  let sibling = element.nextElementSibling;
  if (!selector) return sibling;
  while (sibling) {
    if (sibling.matches && sibling.matches(selector)) return sibling;
    sibling = sibling.nextElementSibling;
  }
  return null;
}

/**
 * Get children of element
 * @param {Element} element
 * @param {string} [selector] - Optional selector to filter
 * @returns {Element[]}
 */
export function children(element, selector) {
  if (!element || !element.children) return [];
  const kids = Array.from(element.children);
  if (!selector) return kids;
  return kids.filter(child => child.matches && child.matches(selector));
}

/**
 * Find elements within context
 * @param {Element} element
 * @param {string} selector
 * @returns {Element[]}
 */
export function find(element, selector) {
  if (!element || !element.querySelectorAll) return [];
  return Array.from(element.querySelectorAll(selector));
}

/**
 * Add class(es) to element
 * @param {Element} element
 * @param {...string} classes
 */
export function addClass(element, ...classes) {
  if (!element || !element.classList) return;
  element.classList.add(...classes.flatMap(c => c.split(' ').filter(Boolean)));
}

/**
 * Remove class(es) from element
 * @param {Element} element
 * @param {...string} classes
 */
export function removeClass(element, ...classes) {
  if (!element || !element.classList) return;
  element.classList.remove(...classes.flatMap(c => c.split(' ').filter(Boolean)));
}

/**
 * Toggle class on element
 * @param {Element} element
 * @param {string} className
 * @param {boolean} [force] - Force add or remove
 * @returns {boolean}
 */
export function toggleClass(element, className, force) {
  if (!element || !element.classList) return false;
  return element.classList.toggle(className, force);
}

/**
 * Check if element has class
 * @param {Element} element
 * @param {string} className
 * @returns {boolean}
 */
export function hasClass(element, className) {
  if (!element || !element.classList) return false;
  return element.classList.contains(className);
}

/**
 * Set attribute(s) on element
 * @param {Element} element 
 * @param {string|Object} name - Attribute name or object of attributes
 * @param {string} [value] - Attribute value
 */
export function setAttr(element, name, value) {
  if (typeof name === 'object') {
    Object.entries(name).forEach(([key, val]) => {
      element.setAttribute(key, val);
    });
  } else {
    element.setAttribute(name, value);
  }
}

/**
 * Get attribute from element
 * @param {Element} element 
 * @param {string} name 
 * @returns {string|null}
 */
export function getAttr(element, name) {
  return element.getAttribute(name);
}

/**
 * Remove attribute from element
 * @param {Element} element 
 * @param {string} name 
 */
export function removeAttr(element, name) {
  element.removeAttribute(name);
}

/**
 * Get/set data attribute
 * @param {Element} element 
 * @param {string} key 
 * @param {*} [value] 
 * @returns {*}
 */
export function data(element, key, value) {
  if (value === undefined) {
    const val = element.dataset[toCamelCase(key)];
    // Try to parse JSON
    if (val === 'true') return true;
    if (val === 'false') return false;
    if (val && !isNaN(Number(val))) return Number(val);
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  element.dataset[toCamelCase(key)] = typeof value === 'object' ? JSON.stringify(value) : value;
}

/**
 * Convert kebab-case to camelCase
 * @param {string} str 
 * @returns {string}
 */
function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Set CSS property/properties
 * @param {Element} element 
 * @param {string|Object} prop - Property name or object of properties
 * @param {string} [value] - Property value
 */
export function css(element, prop, value) {
  if (typeof prop === 'object') {
    Object.entries(prop).forEach(([key, val]) => {
      element.style[key] = val;
    });
  } else if (value === undefined) {
    return getComputedStyle(element).getPropertyValue(prop);
  } else {
    element.style[prop] = value;
  }
}

/**
 * Get element dimensions
 * @param {Element} element 
 * @returns {{width: number, height: number}}
 */
export function dimensions(element) {
  return {
    width: element.offsetWidth,
    height: element.offsetHeight
  };
}

/**
 * Get element position relative to document
 * @param {Element} element 
 * @returns {{top: number, left: number}}
 */
export function offset(element) {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX
  };
}

/**
 * Get element position relative to offset parent
 * @param {Element} element 
 * @returns {{top: number, left: number}}
 */
export function position(element) {
  return {
    top: element.offsetTop,
    left: element.offsetLeft
  };
}

/**
 * Check if element is visible
 * @param {Element} element 
 * @returns {boolean}
 */
export function isVisible(element) {
  return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
}

/**
 * Check if element is hidden
 * @param {Element} element 
 * @returns {boolean}
 */
export function isHidden(element) {
  return !isVisible(element);
}

/**
 * Show element
 * @param {Element} element 
 */
export function show(element) {
  element.style.display = '';
  if (getComputedStyle(element).display === 'none') {
    element.style.display = 'block';
  }
}

/**
 * Hide element
 * @param {Element} element 
 */
export function hide(element) {
  element.style.display = 'none';
}

/**
 * Remove element from DOM
 * @param {Element} element 
 */
export function remove(element) {
  element.remove();
}

/**
 * Insert element before reference element
 * @param {Element} newElement 
 * @param {Element} refElement 
 */
export function insertBefore(newElement, refElement) {
  refElement.parentNode.insertBefore(newElement, refElement);
}

/**
 * Insert element after reference element
 * @param {Element} newElement 
 * @param {Element} refElement 
 */
export function insertAfter(newElement, refElement) {
  refElement.parentNode.insertBefore(newElement, refElement.nextSibling);
}

/**
 * Append element to parent
 * @param {Element} parent 
 * @param {Element} child 
 */
export function append(parent, child) {
  parent.appendChild(child);
}

/**
 * Prepend element to parent
 * @param {Element} parent 
 * @param {Element} child 
 */
export function prepend(parent, child) {
  parent.insertBefore(child, parent.firstChild);
}

/**
 * Create element from HTML string
 * @param {string} html 
 * @returns {Element}
 */
export function createFromHTML(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstChild;
}

/**
 * Get scroll position
 * @returns {{x: number, y: number}}
 */
export function getScroll() {
  return {
    x: window.scrollX || document.documentElement.scrollLeft,
    y: window.scrollY || document.documentElement.scrollTop
  };
}

/**
 * Get viewport dimensions
 * @returns {{width: number, height: number}}
 */
export function getViewport() {
  return {
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight
  };
}

/**
 * Check if element is in viewport
 * @param {Element} element 
 * @param {number} [threshold=0] - Percentage threshold (0-1)
 * @returns {boolean}
 */
export function isInViewport(element, threshold = 0) {
  const rect = element.getBoundingClientRect();
  const viewport = getViewport();
  
  const visibleHeight = Math.min(rect.bottom, viewport.height) - Math.max(rect.top, 0);
  const visibleWidth = Math.min(rect.right, viewport.width) - Math.max(rect.left, 0);
  
  const visibleArea = visibleHeight * visibleWidth;
  const totalArea = rect.height * rect.width;
  
  return visibleArea / totalArea >= threshold;
}

/**
 * Focus element with optional prevention of scroll
 * @param {Element} element 
 * @param {boolean} [preventScroll=false]
 */
export function focus(element, preventScroll = false) {
  element.focus({ preventScroll });
}

/**
 * Get focusable elements within container
 * @param {Element} container 
 * @returns {Element[]}
 */
export function getFocusable(container) {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');
  
  return Array.from(container.querySelectorAll(selector)).filter(isVisible);
}

export default {
  $,
  $$,
  getByData,
  getAllByData,
  matches,
  closest,
  parent,
  siblings,
  prev,
  next,
  children,
  find,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  setAttr,
  getAttr,
  removeAttr,
  data,
  css,
  dimensions,
  offset,
  position,
  isVisible,
  isHidden,
  show,
  hide,
  remove,
  insertBefore,
  insertAfter,
  append,
  prepend,
  createFromHTML,
  getScroll,
  getViewport,
  isInViewport,
  focus,
  getFocusable
};