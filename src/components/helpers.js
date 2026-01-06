/**
 * Shared component helpers
 * Wraps JQNext functions for component use
 */

import $ from 'jqnext';

// Element selection
export const $$ = (selector, context) => Array.from((context || document).querySelectorAll(selector));
export const $1 = (selector, context) => (context || document).querySelector(selector);

// DOM traversal
export const closest = (el, selector) => $(el).closest(selector)[0];
export const parent = (el) => el.parentElement;
export const children = (el) => Array.from(el.children);
export const siblings = (el) => Array.from(el.parentElement?.children || []).filter(child => child !== el);
export const find = (el, selector) => $(el).find(selector).get();

// Classes
export const hasClass = (el, className) => $(el).hasClass(className);
export const addClass = (el, className) => $(el).addClass(className);
export const removeClass = (el, className) => $(el).removeClass(className);
export const toggleClass = (el, className) => $(el).toggleClass(className);

// Attributes
export const getAttr = (el, attr) => $(el).attr(attr);
export const setAttr = (el, attr, value) => $(el).attr(attr, value);
export const removeAttr = (el, attr) => $(el).removeAttr(attr);

// Data
export const getData = (el, key) => $(el).data(key);
export const setData = (el, key, value) => $(el).data(key, value);
export const data = getData; // Alias for getData

// CSS
export const css = (el, prop, value) => value !== undefined ? $(el).css(prop, value) : $(el).css(prop);

// Display
export const show = (el) => $(el).show();
export const hide = (el) => $(el).hide();
export const remove = (el) => $(el).remove();

// Dimensions
export const dimensions = (el) => ({ width: $(el).width(), height: $(el).height() });
export const offset = (el) => $(el).offset();

// Events - Support delegated events and options like jQuery
export const on = (el, event, selectorOrHandler, handlerOrOptions, options) => {
  const $el = $(el);
  
  // Case 1: on(el, event, handler) - Simple event
  if (typeof selectorOrHandler === 'function' && !handlerOrOptions) {
    $el.on(event, selectorOrHandler);
  }
  // Case 2: on(el, event, selector, handler) - Delegated event
  else if (typeof selectorOrHandler === 'string' && typeof handlerOrOptions === 'function') {
    $el.on(event, selectorOrHandler, handlerOrOptions);
  }
  // Case 3: on(el, event, handler, options) - Event with options (ignore options, not supported)
  else if (typeof selectorOrHandler === 'function' && typeof handlerOrOptions === 'object') {
    $el.on(event, selectorOrHandler);
  }
};

export const off = (el, event, selector) => {
  if (selector) {
    $(el).off(event, selector);
  } else {
    $(el).off(event);
  }
};

export const trigger = (el, event, data) => {
  if (typeof event === 'string') {
    // Create jQuery event if string
    const evt = $.Event(event);
    if (data) {
      Object.assign(evt, data);
    }
    $(el).trigger(evt);
  } else {
    $(el).trigger(event, data);
  }
};

// Animation - Return promises that resolve when animation completes
export const fadeIn = (el, options = {}) => {
  return new Promise(resolve => {
    const duration = options.duration !== undefined ? options.duration : 150;
    $(el).fadeIn(duration, function() {
      resolve();
    });
  });
};

export const fadeOut = (el, options = {}) => {
  return new Promise(resolve => {
    const duration = options.duration !== undefined ? options.duration : 150;
    $(el).fadeOut(duration, function() {
      resolve();
    });
  });
};

// Reflow
export const reflow = (el) => el.offsetHeight;

// Utilities
export const sanitizeHTML = (html) => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

export default {
  $$, closest, parent,
  hasClass, addClass, removeClass, toggleClass,
  getAttr, setAttr, removeAttr,
  getData, setData,
  css,
  show, hide, remove,
  dimensions, offset,
  on, off, trigger,
  sanitizeHTML
};