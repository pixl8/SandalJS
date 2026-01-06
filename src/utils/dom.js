/**
 * Sandal - DOM Utilities
 * Simplified to use JQNext for core DOM operations
 * Keeps only unique utilities not provided by JQNext
 */

import $ from 'jqnext';

// Re-export JQNext as $ for convenience
export { $ };

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
  
  return Array.from(container.querySelectorAll(selector)).filter(el => {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  });
}

export default {
  $,
  getByData,
  getAllByData,
  createFromHTML,
  getScroll,
  getViewport,
  isInViewport,
  focus,
  getFocusable
};