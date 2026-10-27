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

// Bootstrap 3.4.1's default allow list for the `sanitize` option: tag name ->
// allowed attributes, with '*' applying to every tag
const ARIA_ATTRIBUTE_PATTERN = /^aria-[\w-]*$/i;

export const DEFAULT_ALLOW_LIST = {
  '*': ['class', 'dir', 'id', 'lang', 'role', ARIA_ATTRIBUTE_PATTERN],
  a: ['target', 'href', 'title', 'rel'],
  area: [],
  b: [],
  br: [],
  col: [],
  code: [],
  div: [],
  em: [],
  hr: [],
  h1: [],
  h2: [],
  h3: [],
  h4: [],
  h5: [],
  h6: [],
  i: [],
  img: ['src', 'alt', 'title', 'width', 'height'],
  li: [],
  ol: [],
  p: [],
  pre: [],
  s: [],
  small: [],
  span: [],
  sub: [],
  sup: [],
  strong: [],
  u: [],
  ul: []
};

const URI_ATTRIBUTES = ['background', 'cite', 'href', 'itemtype', 'longdesc', 'poster', 'src', 'xlink:href'];
const SAFE_URL_PATTERN = /^(?:(?:https?|mailto|ftp|tel|file):|[^&:/?#]*(?:[/?#]|$))/i;
const DATA_URL_PATTERN = /^data:(?:image\/(?:bmp|gif|jpeg|jpg|png|tiff|webp)|video\/(?:mpeg|mp4|ogg|webm)|audio\/(?:mp3|oga|ogg|opus));base64,[a-z0-9+/]+=*$/i;

const allowedAttribute = (attr, allowed) => {
  const name = attr.nodeName.toLowerCase();

  if (allowed.some(rule => rule instanceof RegExp ? rule.test(name) : rule === name)) {
    if (URI_ATTRIBUTES.includes(name)) {
      return SAFE_URL_PATTERN.test(attr.nodeValue) || DATA_URL_PATTERN.test(attr.nodeValue);
    }
    return true;
  }

  return false;
};

/**
 * Sanitize an HTML string as Bootstrap 3.4.1 does: elements not in the allow
 * list are removed, and so are attributes not allowed for their element
 * (and unsafe URLs)
 * @param {string} html
 * @param {Object} allowList - tag name -> allowed attributes (strings or RegExps)
 * @param {Function} sanitizeFn - replaces the built-in sanitizer when given
 * @returns {string}
 */
export const sanitizeHTML = (html, allowList = DEFAULT_ALLOW_LIST, sanitizeFn = null) => {
  if (!html || !html.length) {
    return html;
  }
  if (typeof sanitizeFn === 'function') {
    return sanitizeFn(html);
  }

  const body = new DOMParser().parseFromString(html, 'text/html').body;
  const elements = Array.from(body.querySelectorAll('*'));

  elements.forEach(el => {
    const tagName = el.nodeName.toLowerCase();

    if (!Object.prototype.hasOwnProperty.call(allowList, tagName)) {
      el.remove();
      return;
    }

    const allowed = [...(allowList['*'] || []), ...(allowList[tagName] || [])];
    Array.from(el.attributes).forEach(attr => {
      if (!allowedAttribute(attr, allowed)) {
        el.removeAttribute(attr.nodeName);
      }
    });
  });

  return body.innerHTML;
};

const isNodeList = (value) => value instanceof Node ||
  ( value !== null && typeof value === 'object' && typeof value.length === 'number' );

/**
 * Put a tooltip's or popover's title or content into an element, as Bootstrap
 * 3 does: a string is set as HTML (sanitized when `sanitize` is on) or as
 * text, and an element or jQuery/JQNext object is inserted as it is (or as
 * its text, without `html`)
 * @param {Element} el
 * @param {string|Node|Object} value
 * @param {Object} options - the component's options (html, sanitize, allowList, sanitizeFn)
 */
export const setContent = (el, value, options = {}) => {
  if (isNodeList(value)) {
    const nodes = value instanceof Node ? [value] : Array.from(value);

    if (options.html) {
      el.innerHTML = '';
      nodes.forEach(node => el.appendChild(node));
    } else {
      el.textContent = nodes.map(node => node.textContent).join('');
    }
    return;
  }

  const text = value === null || value === undefined ? '' : String(value);

  if (options.html) {
    el.innerHTML = options.sanitize ? sanitizeHTML(text, options.allowList, options.sanitizeFn) : text;
  } else {
    el.textContent = text;
  }
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
  sanitizeHTML, setContent, DEFAULT_ALLOW_LIST
};