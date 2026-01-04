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
function $(selector, context = document) {
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
function $$$1(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

/**
 * Find closest ancestor matching selector
 * @param {Element} element
 * @param {string} selector
 * @returns {Element|null}
 */
function closest(element, selector) {
  if (!element || !element.closest) return null;
  return element.closest(selector);
}

/**
 * Get children of element
 * @param {Element} element
 * @param {string} [selector] - Optional selector to filter
 * @returns {Element[]}
 */
function children(element, selector) {
  if (!element || !element.children) return [];
  const kids = Array.from(element.children);
  if (!selector) return kids;
  return kids.filter(child => child.matches && child.matches(selector));
}

/**
 * Add class(es) to element
 * @param {Element} element
 * @param {...string} classes
 */
function addClass(element, ...classes) {
  if (!element || !element.classList) return;
  element.classList.add(...classes.flatMap(c => c.split(' ').filter(Boolean)));
}

/**
 * Remove class(es) from element
 * @param {Element} element
 * @param {...string} classes
 */
function removeClass(element, ...classes) {
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
function toggleClass(element, className, force) {
  if (!element || !element.classList) return false;
  return element.classList.toggle(className, force);
}

/**
 * Check if element has class
 * @param {Element} element
 * @param {string} className
 * @returns {boolean}
 */
function hasClass(element, className) {
  if (!element || !element.classList) return false;
  return element.classList.contains(className);
}

/**
 * Set attribute(s) on element
 * @param {Element} element 
 * @param {string|Object} name - Attribute name or object of attributes
 * @param {string} [value] - Attribute value
 */
function setAttr(element, name, value) {
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
function getAttr(element, name) {
  return element.getAttribute(name);
}

/**
 * Remove attribute from element
 * @param {Element} element 
 * @param {string} name 
 */
function removeAttr(element, name) {
  element.removeAttribute(name);
}

/**
 * Remove element from DOM
 * @param {Element} element 
 */
function remove(element) {
  element.remove();
}

/**
 * Create element from HTML string
 * @param {string} html 
 * @returns {Element}
 */
function createFromHTML(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstChild;
}

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
function on(element, eventType, handler, delegatedHandler, options = {}) {
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
function off(element, eventType, handler) {
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
 * Sandal - Modern Animation Utilities
 * Web Animation API based helpers
 */

/**
 * Default animation options
 */
const DEFAULT_OPTIONS = {
  duration: 300,
  easing: 'ease',
  fill: 'forwards'
};

/**
 * Animate element using Web Animation API
 * @param {Element} element 
 * @param {Keyframe[]} keyframes 
 * @param {Object} options 
 * @returns {Promise<Animation>}
 */
function animate(element, keyframes, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const animation = element.animate(keyframes, opts);
  
  return new Promise((resolve, reject) => {
    animation.onfinish = () => resolve(animation);
    animation.oncancel = () => reject(new Error('Animation cancelled'));
  });
}

/**
 * Fade out element
 * @param {Element} element 
 * @param {Object} options 
 * @returns {Promise<Animation>}
 */
async function fadeOut(element, options = {}) {
  await animate(element, [
    { opacity: 1 },
    { opacity: 0 }
  ], { duration: 150, ...options });
  
  element.style.display = 'none';
  element.style.opacity = '';
}

/**
 * Reflow element (force layout recalculation)
 * @param {Element} element 
 */
function reflow(element) {
  return element.offsetHeight;
}

/**
 * Sandal - Modern Positioning Utilities
 * Uses Floating UI for tooltip/popover positioning
 * Falls back to basic positioning if Floating UI is not available
 */


/**
 * Get Floating UI instance
 * @returns {Object|null}
 */
function getFloatingUI() {
  return (typeof window !== 'undefined' && window.FloatingUIDOM);
}

/**
 * Bootstrap placement to Floating UI placement mapping
 */
const PLACEMENT_MAP = {
  top: 'top',
  bottom: 'bottom',
  left: 'left',
  right: 'right',
  auto: 'top' // Default for auto
};

/**
 * Calculate position using Floating UI
 * @param {Element} reference - Reference element (trigger)
 * @param {Element} floating - Floating element (tooltip/popover)
 * @param {Object} options 
 * @returns {Promise<{x: number, y: number, placement: string}>}
 */
async function computePosition(reference, floating, options = {}) {
  const {
    placement = 'top',
    offset: offsetValue = 0,
    flip = true,
    shift = true,
    arrow = null,
    container = null
  } = options;

  const fui = getFloatingUI();
  
  if (fui && fui.computePosition) {
    // Use Floating UI
    const middleware = [];
    
    if (offsetValue) {
      middleware.push(fui.offset(offsetValue));
    }
    
    if (flip) {
      middleware.push(fui.flip());
    }
    
    if (shift) {
      middleware.push(fui.shift({ padding: 5 }));
    }
    
    if (arrow) {
      middleware.push(fui.arrow({ element: arrow }));
    }
    
    const result = await fui.computePosition(reference, floating, {
      placement: PLACEMENT_MAP[placement] || placement,
      middleware
    });
    
    return {
      x: result.x,
      y: result.y,
      placement: result.placement,
      middlewareData: result.middlewareData
    };
  }
  
  // Fallback: basic positioning without Floating UI
  return computePositionFallback(reference, floating, options);
}

/**
 * Fallback positioning without Floating UI
 * @param {Element} reference 
 * @param {Element} floating 
 * @param {Object} options 
 * @returns {{x: number, y: number, placement: string}}
 */
function computePositionFallback(reference, floating, options = {}) {
  const { placement = 'top', offset: offsetValue = 10 } = options;
  
  const refRect = reference.getBoundingClientRect();
  const floatRect = floating.getBoundingClientRect();
  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  const scrollY = window.scrollY || document.documentElement.scrollTop;
  
  let x, y;
  let finalPlacement = placement;
  
  // Calculate base position
  switch (placement) {
    case 'top':
      x = refRect.left + (refRect.width - floatRect.width) / 2;
      y = refRect.top - floatRect.height - offsetValue;
      break;
    case 'bottom':
      x = refRect.left + (refRect.width - floatRect.width) / 2;
      y = refRect.bottom + offsetValue;
      break;
    case 'left':
      x = refRect.left - floatRect.width - offsetValue;
      y = refRect.top + (refRect.height - floatRect.height) / 2;
      break;
    case 'right':
      x = refRect.right + offsetValue;
      y = refRect.top + (refRect.height - floatRect.height) / 2;
      break;
    case 'auto':
    default:
      // Auto: try top first, then bottom
      x = refRect.left + (refRect.width - floatRect.width) / 2;
      y = refRect.top - floatRect.height - offsetValue;
      
      // Check if it would go above viewport
      if (y < 0) {
        y = refRect.bottom + offsetValue;
        finalPlacement = 'bottom';
      } else {
        finalPlacement = 'top';
      }
      break;
  }
  
  // Simple flip: check if it goes off-screen
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  
  // Flip vertical
  if ((finalPlacement === 'top' && y < 0) || 
      (finalPlacement === 'bottom' && y + floatRect.height > viewport.height)) {
    if (finalPlacement === 'top') {
      y = refRect.bottom + offsetValue;
      finalPlacement = 'bottom';
    } else {
      y = refRect.top - floatRect.height - offsetValue;
      finalPlacement = 'top';
    }
  }
  
  // Flip horizontal
  if ((finalPlacement === 'left' && x < 0) || 
      (finalPlacement === 'right' && x + floatRect.width > viewport.width)) {
    if (finalPlacement === 'left') {
      x = refRect.right + offsetValue;
      finalPlacement = 'right';
    } else {
      x = refRect.left - floatRect.width - offsetValue;
      finalPlacement = 'left';
    }
  }
  
  // Shift: keep within viewport bounds
  x = Math.max(5, Math.min(x, viewport.width - floatRect.width - 5));
  y = Math.max(5, Math.min(y, viewport.height - floatRect.height - 5));
  
  // Add scroll offset for absolute positioning
  return {
    x: x + scrollX,
    y: y + scrollY,
    placement: finalPlacement
  };
}

/**
 * Apply position to floating element
 * @param {Element} floating 
 * @param {{x: number, y: number}} position 
 */
function applyPosition(floating, { x, y }) {
  Object.assign(floating.style, {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    margin: '0'
  });
}

/**
 * Auto-update position on scroll/resize (using Floating UI autoUpdate)
 * @param {Element} reference 
 * @param {Element} floating 
 * @param {Function} update - Update callback
 * @returns {Function} - Cleanup function
 */
function autoUpdate(reference, floating, update) {
  const fui = getFloatingUI();
  
  if (fui && fui.autoUpdate) {
    return fui.autoUpdate(reference, floating, update);
  }
  
  // Fallback: basic scroll/resize listeners
  const events = ['scroll', 'resize'];
  const parents = getScrollParents(reference);
  
  const handleUpdate = () => requestAnimationFrame(update);
  
  events.forEach(event => {
    window.addEventListener(event, handleUpdate, true);
  });
  
  parents.forEach(parent => {
    parent.addEventListener('scroll', handleUpdate, true);
  });
  
  // Initial position
  update();
  
  // Return cleanup function
  return () => {
    events.forEach(event => {
      window.removeEventListener(event, handleUpdate, true);
    });
    parents.forEach(parent => {
      parent.removeEventListener('scroll', handleUpdate, true);
    });
  };
}

/**
 * Get scroll parent elements
 * @param {Element} element 
 * @returns {Element[]}
 */
function getScrollParents(element) {
  const parents = [];
  let current = element.parentElement;
  
  while (current) {
    const style = getComputedStyle(current);
    const overflow = style.overflow + style.overflowX + style.overflowY;
    
    if (/auto|scroll|overlay/.test(overflow)) {
      parents.push(current);
    }
    
    current = current.parentElement;
  }
  
  return parents;
}

/**
 * Get container element for positioning
 * @param {string|Element|boolean} container 
 * @param {Element} defaultContainer 
 * @returns {Element}
 */
function getContainer(container, defaultContainer = document.body) {
  if (container === false) return defaultContainer;
  if (container === 'body') return document.body;
  if (typeof container === 'string') return document.querySelector(container) || defaultContainer;
  if (container instanceof Element) return container;
  return defaultContainer;
}

/**
 * Sandal - Utility Modules
 * Modern vanilla JavaScript utilities
 */


/**
 * Instance storage using WeakMap (modern alternative to $.data)
 */
const instanceStorage = new WeakMap();

/**
 * Store component instance on element
 * @param {Element} element 
 * @param {string} key - Component key (e.g., 'bs.modal')
 * @param {Object} instance 
 */
function setInstance(element, key, instance) {
  if (!instanceStorage.has(element)) {
    instanceStorage.set(element, new Map());
  }
  instanceStorage.get(element).set(key, instance);
}

/**
 * Get component instance from element
 * @param {Element} element 
 * @param {string} key 
 * @returns {Object|null}
 */
function getInstance(element, key) {
  if (!instanceStorage.has(element)) return null;
  return instanceStorage.get(element).get(key) || null;
}

/**
 * Remove component instance from element
 * @param {Element} element 
 * @param {string} key 
 */
function removeInstance(element, key) {
  if (!instanceStorage.has(element)) return;
  instanceStorage.get(element).delete(key);
}

/**
 * Parse options from data attributes
 * @param {Element} element 
 * @param {Object} defaults - Default options
 * @param {string} prefix - Data attribute prefix (e.g., 'bs' for data-bs-*)
 * @returns {Object}
 */
function parseDataOptions(element, defaults = {}, prefix = '') {
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
 * Sanitize HTML string (basic XSS prevention)
 * @param {string} html 
 * @returns {string}
 */
function sanitizeHTML(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Get unique ID
 * @param {string} [prefix='sandal'] 
 * @returns {string}
 */
let idCounter = 0;
function getUID(prefix = 'sandal') {
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
function isDisabled(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return true;
  
  if (element.classList.contains('disabled')) return true;
  if (element.hasAttribute('disabled')) return true;
  if (element.getAttribute('aria-disabled') === 'true') return true;
  
  return false;
}

/**
 * Trap focus within element
 * @param {Element} element 
 * @returns {Function} - Cleanup function
 */
function trapFocus(element) {
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
 * Sandal Modal Component
 * Modern vanilla JS implementation with Bootstrap 3 API compatibility
 * Uses Web Animation API for smooth animations
 */


// Constants
const NAME$9 = 'modal';
const DATA_KEY$a = 'bs.modal';
const EVENT_KEY$9 = `.bs.${NAME$9}`;

const DEFAULTS$7 = {
  backdrop: true,
  keyboard: true,
  show: true,
  focus: true
};

const EVENTS$8 = {
  SHOW: `show${EVENT_KEY$9}`,
  SHOWN: `shown${EVENT_KEY$9}`,
  HIDE: `hide${EVENT_KEY$9}`,
  HIDDEN: `hidden${EVENT_KEY$9}`,
  LOADED: `loaded${EVENT_KEY$9}`
};

const CLASSES$9 = {
  SCROLLBAR_MEASURER: 'modal-scrollbar-measure',
  BACKDROP: 'modal-backdrop',
  OPEN: 'modal-open',
  FADE: 'fade',
  IN: 'in',
  SHOW: 'show'
};

const SELECTORS$a = {
  DIALOG: '.modal-dialog',
  MODAL_BODY: '.modal-body',
  DATA_TOGGLE: '[data-toggle="modal"]',
  DATA_DISMISS: '.presidecms [data-dismiss="modal"]',
  FIXED_CONTENT: '.navbar-fixed-top, .navbar-fixed-bottom'
};

const TRANSITION_DURATION$2 = 300;
const BACKDROP_DURATION = 150;

/**
 * Modal Class
 * Provides modal dialog functionality
 */
class Modal {
  /**
   * Create a Modal instance
   * @param {Element} element - The modal element
   * @param {Object} options - Configuration options
   */
  constructor(element, options = {}) {
    this._element = typeof element === 'string' ? $(element) : element;
    
    if (!this._element) return;
    
    this._dialog = $(SELECTORS$a.DIALOG, this._element);
    this._backdrop = null;
    this._isShown = false;
    this._isTransitioning = false;
    this._scrollbarWidth = 0;
    this._focusTrap = null;
    
    // Parse options
    this._options = {
      ...DEFAULTS$7,
      ...parseDataOptions(this._element, DEFAULTS$7),
      ...options
    };
    
    // Bind events
    this._bindEvents();
    
    // Store instance
    setInstance(this._element, DATA_KEY$a, this);
  }
  
  /**
   * Get modal element
   * @returns {Element}
   */
  get element() {
    return this._element;
  }
  
  /**
   * Get options
   * @returns {Object}
   */
  get options() {
    return this._options;
  }
  
  /**
   * Toggle modal
   * @param {Element} [relatedTarget] - Related target element
   */
  toggle(relatedTarget) {
    return this._isShown ? this.hide() : this.show(relatedTarget);
  }
  
  /**
   * Show modal
   * @param {Element} [relatedTarget] - Related target element
   */
  async show(relatedTarget) {
    if (this._isShown || this._isTransitioning) return;
    
    // Dispatch show event (cancelable)
    const showEvent = this._triggerEvent(EVENTS$8.SHOW, { relatedTarget });
    if (showEvent.defaultPrevented) return;
    
    this._isShown = true;
    this._isTransitioning = true;
    
    // Check scrollbar and add padding
    this._checkScrollbar();
    this._setScrollbar();
    
    // Add modal-open class to body
    addClass(document.body, CLASSES$9.OPEN);
    
    // Set up modal
    this._escape();
    this._resize();
    
    // Dismiss button handler
    on(this._element, 'click', SELECTORS$a.DATA_DISMISS, () => this.hide());
    
    // Backdrop click handler
    on(this._dialog, 'mousedown', () => {
      on(this._element, 'mouseup', (e) => {
        off(this._element, 'mouseup');
        if (e.target === this._element) {
          this._ignoreBackdropClick = true;
        }
      }, { once: true });
    });
    
    // Show backdrop then modal
    await this._showBackdrop();
    await this._showModal();
    
    this._isTransitioning = false;
    
    // Focus management
    if (this._options.focus) {
      this._element.focus();
      this._focusTrap = trapFocus(this._element);
    }
    
    // Dispatch shown event
    this._triggerEvent(EVENTS$8.SHOWN, { relatedTarget });
  }
  
  /**
   * Hide modal
   */
  async hide() {
    if (!this._isShown || this._isTransitioning) return;
    
    // Dispatch hide event (cancelable)
    const hideEvent = this._triggerEvent(EVENTS$8.HIDE);
    if (hideEvent.defaultPrevented) return;
    
    this._isShown = false;
    this._isTransitioning = true;
    
    // Clean up focus trap
    if (this._focusTrap) {
      this._focusTrap();
      this._focusTrap = null;
    }
    
    // Remove escape handler
    off(document, 'keydown', this._escapeHandler);
    
    // Remove resize handler
    off(window, 'resize', this._resizeHandler);
    
    // Hide modal then backdrop
    removeClass(this._element, CLASSES$9.IN);
    
    if (hasClass(this._element, CLASSES$9.FADE)) {
      await this._waitForTransition(this._element, TRANSITION_DURATION$2);
    }
    
    await this._hideModal();
    
    this._isTransitioning = false;
    
    // Dispatch hidden event
    this._triggerEvent(EVENTS$8.HIDDEN);
  }
  
  /**
   * Handle update (adjust for scrollbar)
   */
  handleUpdate() {
    this._adjustDialog();
  }
  
  /**
   * Destroy the modal instance
   */
  dispose() {
    // Remove event listeners
    off(this._element, 'click');
    off(this._dialog, 'mousedown');
    off(document, 'keydown', this._escapeHandler);
    off(window, 'resize', this._resizeHandler);
    
    // Remove focus trap
    if (this._focusTrap) {
      this._focusTrap();
    }
    
    // Remove backdrop
    if (this._backdrop) {
      this._backdrop.remove();
    }
    
    // Clean up instance
    removeInstance(this._element, DATA_KEY$a);
    this._element = null;
    this._dialog = null;
    this._backdrop = null;
    this._options = null;
  }
  
  // Private methods
  
  /**
   * Bind modal events
   * @private
   */
  _bindEvents() {
    on(this._element, 'click', (e) => {
      if (e.target !== this._element) return;
      if (this._ignoreBackdropClick) {
        this._ignoreBackdropClick = false;
        return;
      }
      if (this._options.backdrop === true) {
        this.hide();
      }
    });
  }
  
  /**
   * Show backdrop
   * @returns {Promise}
   * @private
   */
  async _showBackdrop() {
    if (this._options.backdrop) {
      this._backdrop = document.createElement('div');
      this._backdrop.className = CLASSES$9.BACKDROP;
      
      if (hasClass(this._element, CLASSES$9.FADE)) {
        addClass(this._backdrop, CLASSES$9.FADE);
      }
      
      document.body.appendChild(this._backdrop);
      
      // Click handler for backdrop
      on(this._backdrop, 'click', () => {
        if (this._options.backdrop !== 'static') {
          this.hide();
        }
      });
      
      // Animate in
      reflow(this._backdrop);
      addClass(this._backdrop, CLASSES$9.IN);
      
      if (hasClass(this._backdrop, CLASSES$9.FADE)) {
        await this._waitForTransition(this._backdrop, BACKDROP_DURATION);
      }
    }
  }
  
  /**
   * Show modal element
   * @returns {Promise}
   * @private
   */
  async _showModal() {
    this._element.style.display = 'block';
    this._element.removeAttribute('aria-hidden');
    setAttr(this._element, 'aria-modal', 'true');
    setAttr(this._element, 'role', 'dialog');
    this._element.scrollTop = 0;
    
    if (this._dialog) {
      this._dialog.scrollTop = 0;
    }
    
    this._adjustDialog();
    
    reflow(this._element);
    addClass(this._element, CLASSES$9.IN);
    
    if (hasClass(this._element, CLASSES$9.FADE)) {
      await this._waitForTransition(this._dialog || this._element, TRANSITION_DURATION$2);
    }
  }
  
  /**
   * Hide modal element
   * @returns {Promise}
   * @private
   */
  async _hideModal() {
    this._element.style.display = 'none';
    setAttr(this._element, 'aria-hidden', 'true');
    removeAttr(this._element, 'aria-modal');
    removeAttr(this._element, 'role');
    
    // Reset scrollbar
    this._resetScrollbar();
    removeClass(document.body, CLASSES$9.OPEN);
    
    // Remove backdrop
    if (this._backdrop) {
      removeClass(this._backdrop, CLASSES$9.IN);
      
      if (hasClass(this._backdrop, CLASSES$9.FADE)) {
        await this._waitForTransition(this._backdrop, BACKDROP_DURATION);
      }
      
      this._backdrop.remove();
      this._backdrop = null;
    }
  }
  
  /**
   * Set up escape key handler
   * @private
   */
  _escape() {
    if (this._options.keyboard) {
      this._escapeHandler = (e) => {
        if (e.key === 'Escape' && this._isShown) {
          e.preventDefault();
          this.hide();
        }
      };
      on(document, 'keydown', this._escapeHandler);
    }
  }
  
  /**
   * Set up resize handler
   * @private
   */
  _resize() {
    this._resizeHandler = () => {
      if (this._isShown) {
        this._adjustDialog();
      }
    };
    on(window, 'resize', this._resizeHandler);
  }
  
  /**
   * Adjust dialog for scrollbar
   * @private
   */
  _adjustDialog() {
    const isModalOverflowing = this._element.scrollHeight > document.documentElement.clientHeight;
    
    if (!this._isBodyOverflowing && isModalOverflowing) {
      this._element.style.paddingLeft = `${this._scrollbarWidth}px`;
    }
    
    if (this._isBodyOverflowing && !isModalOverflowing) {
      this._element.style.paddingRight = `${this._scrollbarWidth}px`;
    }
  }
  
  /**
   * Check scrollbar width
   * @private
   */
  _checkScrollbar() {
    const rect = document.body.getBoundingClientRect();
    this._isBodyOverflowing = rect.left + rect.right < window.innerWidth;
    this._scrollbarWidth = this._getScrollbarWidth();
  }
  
  /**
   * Get scrollbar width
   * @returns {number}
   * @private
   */
  _getScrollbarWidth() {
    const scrollDiv = document.createElement('div');
    scrollDiv.className = CLASSES$9.SCROLLBAR_MEASURER;
    scrollDiv.style.cssText = 'position:absolute;top:-9999px;width:50px;height:50px;overflow:scroll;';
    document.body.appendChild(scrollDiv);
    const scrollbarWidth = scrollDiv.getBoundingClientRect().width - scrollDiv.clientWidth;
    scrollDiv.remove();
    return scrollbarWidth;
  }
  
  /**
   * Set scrollbar padding on body
   * @private
   */
  _setScrollbar() {
    if (this._isBodyOverflowing) {
      // Save original padding
      this._originalPadding = document.body.style.paddingRight;
      const computedPadding = parseFloat(getComputedStyle(document.body).paddingRight);
      document.body.style.paddingRight = `${computedPadding + this._scrollbarWidth}px`;
      
      // Fixed elements
      const fixedContent = $$$1(SELECTORS$a.FIXED_CONTENT);
      for (const element of fixedContent) {
        const actualPadding = element.style.paddingRight;
        const calculatedPadding = parseFloat(getComputedStyle(element).paddingRight);
        element.dataset.paddingRight = actualPadding;
        element.style.paddingRight = `${calculatedPadding + this._scrollbarWidth}px`;
      }
    }
  }
  
  /**
   * Reset scrollbar padding
   * @private
   */
  _resetScrollbar() {
    document.body.style.paddingRight = this._originalPadding || '';
    
    const fixedContent = $$$1(SELECTORS$a.FIXED_CONTENT);
    for (const element of fixedContent) {
      const padding = element.dataset.paddingRight;
      if (padding !== undefined) {
        element.style.paddingRight = padding;
        delete element.dataset.paddingRight;
      }
    }
  }
  
  /**
   * Wait for transition to complete
   * @param {Element} element 
   * @param {number} duration 
   * @returns {Promise}
   * @private
   */
  _waitForTransition(element, duration) {
    return new Promise(resolve => {
      const handler = () => {
        element.removeEventListener('transitionend', handler);
        resolve();
      };
      element.addEventListener('transitionend', handler);
      setTimeout(resolve, duration + 50); // Fallback
    });
  }
  
  /**
   * Trigger custom event
   * @param {string} eventType
   * @param {Object} detail
   * @returns {Event}
   * @private
   */
  _triggerEvent(eventType, detail = {}) {
    // Use jQuery/JQNext trigger if available - this ensures proper namespace handling
    // and compatibility with jQuery event handlers (like those in preside.iframe.modal.js)
    const $ = window.jQuery || window.presideJQuery;
    
    if ($ && $.fn && $.fn.trigger) {
      // Use jQuery's trigger which properly handles namespaced events
      const event = $.Event(eventType, detail);
      $(this._element).trigger(event);
      return event;
    }
    
    // Fallback to native CustomEvent if jQuery is not available
    // Parse event type and namespace (e.g., "hide.bs.modal" -> type: "hide", namespace: "bs.modal")
    const parts = eventType.split('.');
    const baseType = parts[0];
    
    const event = new CustomEvent(baseType, {
      bubbles: true,
      cancelable: eventType === EVENTS$8.SHOW || eventType === EVENTS$8.HIDE,
      detail
    });
    
    this._element.dispatchEvent(event);
    return event;
  }
  
  // Static methods
  
  /**
   * Get Modal instance from element
   * @param {Element} element 
   * @returns {Modal|null}
   */
  static getInstance(element) {
    return getInstance(element, DATA_KEY$a);
  }
  
  /**
   * Get or create Modal instance
   * @param {Element} element 
   * @param {Object} options 
   * @returns {Modal}
   */
  static getOrCreateInstance(element, options = {}) {
    return Modal.getInstance(element) || new Modal(element, options);
  }
  
  /**
   * Handle click on modal toggle
   * @param {Event} event 
   */
  static handleToggle(event) {
    const trigger = event.currentTarget || event.target.closest(SELECTORS$a.DATA_TOGGLE);
    if (!trigger) return;
    
    // Get target
    let target = getAttr(trigger, 'data-target');
    if (!target) {
      const href = getAttr(trigger, 'href');
      if (href) {
        target = href.replace(/.*(?=#[^\s]+$)/, ''); // Strip for IE7
      }
    }
    
    const modalElement = $(target);
    if (!modalElement) return;
    
    event.preventDefault();
    
    // Get options from trigger
    const options = {};
    if (trigger.hasAttribute('data-backdrop')) {
      const backdrop = getAttr(trigger, 'data-backdrop');
      options.backdrop = backdrop === 'static' ? 'static' : backdrop !== 'false';
    }
    if (trigger.hasAttribute('data-keyboard')) {
      options.keyboard = getAttr(trigger, 'data-keyboard') !== 'false';
    }
    
    const instance = Modal.getOrCreateInstance(modalElement, options);
    instance.toggle(trigger);
  }
  
  /**
   * Version
   */
  static get VERSION() {
    return '1.0.0';
  }
  
  /**
   * Data key
   */
  static get DATA_KEY() {
    return DATA_KEY$a;
  }
  
  /**
   * Default options
   */
  static get DEFAULTS() {
    return DEFAULTS$7;
  }
}

/**
 * Sandal Dropdown Component
 * Modern vanilla JS implementation with Bootstrap 3 API compatibility
 */


// Constants
const NAME$8 = 'dropdown';
const DATA_KEY$9 = 'bs.dropdown';
const EVENT_KEY$8 = `.bs.${NAME$8}`;

const DEFAULTS$6 = {
  offset: 0,
  flip: true,
  boundary: 'scrollParent',
  reference: 'toggle',
  display: 'dynamic'
};

const EVENTS$7 = {
  SHOW: `show${EVENT_KEY$8}`,
  SHOWN: `shown${EVENT_KEY$8}`,
  HIDE: `hide${EVENT_KEY$8}`,
  HIDDEN: `hidden${EVENT_KEY$8}`
};

const CLASSES$8 = {
  DISABLED: 'disabled',
  SHOW: 'show',
  OPEN: 'open',
  DROPUP: 'dropup',
  DROPDOWN_MENU: 'dropdown-menu',
  DROPDOWN_MENU_RIGHT: 'dropdown-menu-right'
};

const SELECTORS$9 = {
  DATA_TOGGLE: '[data-toggle="dropdown"]',
  DROPDOWN: '.dropdown, .dropup, .btn-group',
  DROPDOWN_MENU: '.dropdown-menu',
  VISIBLE_ITEMS: '.dropdown-menu li:not(.divider):not(.disabled) a',
  FORM_CHILD: '.dropdown form'
};

const KEYS = {
  TAB: 'Tab',
  ESCAPE: 'Escape',
  SPACE: ' ',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown'
};

/**
 * Dropdown Class
 * Provides dropdown menu functionality
 */
class Dropdown {
  /**
   * Create a Dropdown instance
   * @param {Element} element - The dropdown toggle element
   * @param {Object} options - Configuration options
   */
  constructor(element, options = {}) {
    this._element = typeof element === 'string' ? $(element) : element;
    
    if (!this._element) return;
    
    // Get parent dropdown element
    this._parent = this._getParentElement();
    
    // Get menu element
    this._menu = this._getMenuElement();
    
    // Parse options
    this._options = {
      ...DEFAULTS$6,
      ...parseDataOptions(this._element, DEFAULTS$6),
      ...options
    };
    
    // Bind events
    this._bindEvents();
    
    // Store instance
    setInstance(this._element, DATA_KEY$9, this);
  }
  
  /**
   * Get toggle element
   * @returns {Element}
   */
  get element() {
    return this._element;
  }
  
  /**
   * Toggle dropdown
   */
  toggle() {
    if (isDisabled(this._element)) return;
    
    const isOpen = this._isShown();
    
    // Close other dropdowns
    Dropdown.closeAll();
    
    if (isOpen) return;
    
    this.show();
  }
  
  /**
   * Show dropdown
   */
  show() {
    if (isDisabled(this._element) || this._isShown()) return;
    
    // Dispatch show event (cancelable)
    const showEvent = this._triggerEvent(EVENTS$7.SHOW, { relatedTarget: this._element });
    if (showEvent.defaultPrevented) return;
    
    // Add open class to parent
    addClass(this._parent, CLASSES$8.OPEN);
    
    // Update ARIA
    setAttr(this._element, 'aria-expanded', 'true');
    
    // Add document click listener to close
    this._addDocumentListener();
    
    // Focus first item or toggle
    this._element.focus();
    
    // Dispatch shown event
    this._triggerEvent(EVENTS$7.SHOWN, { relatedTarget: this._element });
  }
  
  /**
   * Hide dropdown
   */
  hide() {
    if (!this._isShown()) return;
    
    // Dispatch hide event (cancelable)
    const hideEvent = this._triggerEvent(EVENTS$7.HIDE, { relatedTarget: this._element });
    if (hideEvent.defaultPrevented) return;
    
    // Remove open class
    removeClass(this._parent, CLASSES$8.OPEN);
    
    // Update ARIA
    setAttr(this._element, 'aria-expanded', 'false');
    
    // Remove document listener
    this._removeDocumentListener();
    
    // Dispatch hidden event
    this._triggerEvent(EVENTS$7.HIDDEN, { relatedTarget: this._element });
  }
  
  /**
   * Update dropdown position (noop for Bootstrap 3 compat)
   */
  update() {
    // In Bootstrap 3, position is handled by CSS
    // This method exists for API compatibility
  }
  
  /**
   * Destroy the dropdown instance
   */
  dispose() {
    this._removeDocumentListener();
    off(this._element, 'click');
    off(this._element, 'keydown');
    removeInstance(this._element, DATA_KEY$9);
    this._element = null;
    this._menu = null;
    this._parent = null;
    this._options = null;
  }
  
  // Private methods
  
  /**
   * Bind toggle events (keyboard only - clicks handled by data-api)
   * @private
   */
  _bindEvents() {
    // Note: Click events are handled by the data-api in sandal.js
    // We only bind keyboard events here to avoid double-handling
    on(this._element, 'keydown', (e) => {
      this._handleKeydown(e);
    });
  }
  
  /**
   * Add document click listener
   * @private
   */
  _addDocumentListener() {
    this._documentClickHandler = (e) => {
      // Don't close if clicking inside dropdown
      if (this._parent.contains(e.target)) {
        // But do close if clicking a menu item (unless it's in a form)
        const isMenuItem = closest(e.target, SELECTORS$9.VISIBLE_ITEMS);
        const isInForm = closest(e.target, SELECTORS$9.FORM_CHILD);
        if (!isMenuItem || isInForm) return;
      }
      this.hide();
    };
    
    this._documentKeyHandler = (e) => {
      if (e.key === KEYS.ESCAPE) {
        this.hide();
        this._element.focus();
      }
    };
    
    // Delay adding listener to avoid immediate close
    setTimeout(() => {
      document.addEventListener('click', this._documentClickHandler, true);
      document.addEventListener('keydown', this._documentKeyHandler);
    }, 0);
  }
  
  /**
   * Remove document listeners
   * @private
   */
  _removeDocumentListener() {
    if (this._documentClickHandler) {
      document.removeEventListener('click', this._documentClickHandler, true);
      this._documentClickHandler = null;
    }
    if (this._documentKeyHandler) {
      document.removeEventListener('keydown', this._documentKeyHandler);
      this._documentKeyHandler = null;
    }
  }
  
  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} event 
   * @private
   */
  _handleKeydown(event) {
    // Only handle specific keys
    if (![KEYS.ARROW_UP, KEYS.ARROW_DOWN, KEYS.ESCAPE, KEYS.SPACE].includes(event.key)) {
      return;
    }
    
    event.preventDefault();
    event.stopPropagation();
    
    if (event.key === KEYS.ESCAPE) {
      this.hide();
      this._element.focus();
      return;
    }
    
    if (event.key === KEYS.SPACE) {
      this.toggle();
      return;
    }
    
    // Arrow navigation
    if (!this._isShown()) {
      this.show();
      return;
    }
    
    const items = $$$1(SELECTORS$9.VISIBLE_ITEMS, this._menu);
    if (items.length === 0) return;
    
    let index = items.indexOf(document.activeElement);
    
    if (event.key === KEYS.ARROW_UP && index > 0) {
      index--;
    }
    
    if (event.key === KEYS.ARROW_DOWN && index < items.length - 1) {
      index++;
    }
    
    if (index < 0) index = 0;
    
    items[index].focus();
  }
  
  /**
   * Check if dropdown is shown
   * @returns {boolean}
   * @private
   */
  _isShown() {
    return hasClass(this._parent, CLASSES$8.OPEN);
  }
  
  /**
   * Get parent dropdown element
   * @returns {Element}
   * @private
   */
  _getParentElement() {
    // Preside Bootstrap just uses direct parent (like Bootstrap 3)
    // Don't look for specific classes - just use the direct parent
    const selector = getAttr(this._element, 'data-target');
    if (selector) {
      return $(selector);
    }
    
    return this._element.parentElement;
  }
  
  /**
   * Get menu element
   * @returns {Element}
   * @private
   */
  _getMenuElement() {
    if (this._parent) {
      return $(SELECTORS$9.DROPDOWN_MENU, this._parent);
    }
    return null;
  }
  
  /**
   * Trigger custom event
   * @param {string} eventType 
   * @param {Object} detail 
   * @returns {CustomEvent}
   * @private
   */
  _triggerEvent(eventType, detail = {}) {
    const event = new CustomEvent(eventType, {
      bubbles: true,
      cancelable: eventType === EVENTS$7.SHOW || eventType === EVENTS$7.HIDE,
      detail
    });
    this._element.dispatchEvent(event);
    return event;
  }
  
  // Static methods
  
  /**
   * Get Dropdown instance from element
   * @param {Element} element 
   * @returns {Dropdown|null}
   */
  static getInstance(element) {
    return getInstance(element, DATA_KEY$9);
  }
  
  /**
   * Get or create Dropdown instance
   * @param {Element} element 
   * @param {Object} options 
   * @returns {Dropdown}
   */
  static getOrCreateInstance(element, options = {}) {
    return Dropdown.getInstance(element) || new Dropdown(element, options);
  }
  
  /**
   * Close all open dropdowns
   */
  static closeAll() {
    const openDropdowns = $$$1(`.${CLASSES$8.OPEN}`);
    for (const dropdown of openDropdowns) {
      const toggle = $(SELECTORS$9.DATA_TOGGLE, dropdown);
      if (toggle) {
        const instance = Dropdown.getInstance(toggle);
        if (instance) {
          instance.hide();
        } else {
          removeClass(dropdown, CLASSES$8.OPEN);
        }
      } else {
        removeClass(dropdown, CLASSES$8.OPEN);
      }
    }
  }
  
  /**
   * Handle click on dropdown toggle
   * @param {Event} event 
   */
  static handleToggle(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const toggle = event.currentTarget || event.target.closest(SELECTORS$9.DATA_TOGGLE);
    if (!toggle) return;
    
    const instance = Dropdown.getOrCreateInstance(toggle);
    instance.toggle();
  }
  
  /**
   * Handle keydown on dropdown
   * @param {KeyboardEvent} event 
   */
  static handleKeydown(event) {
    // Check if this is a dropdown-related key
    if (![KEYS.ARROW_UP, KEYS.ARROW_DOWN, KEYS.ESCAPE].includes(event.key)) {
      return;
    }
    
    const toggle = event.target.closest(SELECTORS$9.DATA_TOGGLE);
    if (!toggle) return;
    
    const instance = Dropdown.getOrCreateInstance(toggle);
    instance._handleKeydown(event);
  }
  
  /**
   * Version
   */
  static get VERSION() {
    return '1.0.0';
  }
  
  /**
   * Data key
   */
  static get DATA_KEY() {
    return DATA_KEY$9;
  }
  
  /**
   * Default options
   */
  static get DEFAULTS() {
    return DEFAULTS$6;
  }
}

/**
 * Sandal Tooltip Component
 * Modern vanilla JS implementation with Bootstrap 3 API compatibility
 * Uses modern positioning (Floating UI compatible)
 */


// Constants
const NAME$7 = 'tooltip';
const DATA_KEY$8 = 'bs.tooltip';
const EVENT_KEY$7 = `.bs.${NAME$7}`;

const DEFAULTS$5 = {
  animation: true,
  template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
  trigger: 'hover focus',
  title: '',
  delay: 0,
  html: false,
  selector: false,
  placement: 'top',
  offset: 0,
  container: false,
  fallbackPlacement: 'flip',
  boundary: 'scrollParent',
  sanitize: true,
  viewport: { selector: 'body', padding: 0 }
};

const EVENTS$6 = {
  SHOW: `show${EVENT_KEY$7}`,
  SHOWN: `shown${EVENT_KEY$7}`,
  HIDE: `hide${EVENT_KEY$7}`,
  HIDDEN: `hidden${EVENT_KEY$7}`,
  INSERTED: `inserted${EVENT_KEY$7}`
};

const CLASSES$7 = {
  FADE: 'fade',
  IN: 'in',
  SHOW: 'show',
  TOP: 'top',
  RIGHT: 'right',
  BOTTOM: 'bottom',
  LEFT: 'left'
};

const TRIGGERS = {
  HOVER: 'hover',
  FOCUS: 'focus',
  CLICK: 'click',
  MANUAL: 'manual'
};

const SELECTORS$8 = {
  TOOLTIP_INNER: '.tooltip-inner',
  TOOLTIP_ARROW: '.tooltip-arrow'
};

const TRANSITION_DURATION$1 = 150;

/**
 * Tooltip Class
 * Provides tooltip functionality
 */
class Tooltip {
  /**
   * Create a Tooltip instance
   * @param {Element} element - The trigger element
   * @param {Object} options - Configuration options
   */
  constructor(element, options = {}) {
    this._element = typeof element === 'string' ? $(element) : element;
    
    if (!this._element) return;
    
    // Parse options
    this._options = this._getOptions(options);
    
    this._tip = null;
    this._isEnabled = true;
    this._timeout = null;
    this._hoverState = '';
    this._activeTrigger = {};
    this._cleanupAutoUpdate = null;
    
    // Bind events
    this._setListeners();
    
    // Store instance
    setInstance(this._element, DATA_KEY$8, this);
  }
  
  /**
   * Get tip element
   * @returns {Element}
   */
  get tip() {
    if (!this._tip) {
      this._tip = createFromHTML(this._options.template);
    }
    return this._tip;
  }
  
  /**
   * Get element
   * @returns {Element}
   */
  get element() {
    return this._element;
  }
  
  /**
   * Enable tooltip
   */
  enable() {
    this._isEnabled = true;
  }
  
  /**
   * Disable tooltip
   */
  disable() {
    this._isEnabled = false;
  }
  
  /**
   * Toggle enabled state
   */
  toggleEnabled() {
    this._isEnabled = !this._isEnabled;
  }
  
  /**
   * Toggle tooltip
   * @param {Event} [event] 
   */
  toggle(event) {
    if (!this._isEnabled) return;
    
    if (event) {
      this._getDelegateConfig();
      
      if (!this._activeTrigger.click) {
        this._activeTrigger.click = true;
      } else {
        this._activeTrigger.click = false;
      }
      
      if (this._isWithActiveTrigger()) {
        this._enter();
      } else {
        this._leave();
      }
    } else {
      if (hasClass(this.tip, CLASSES$7.IN)) {
        this._leave();
      } else {
        this._enter();
      }
    }
  }
  
  /**
   * Show tooltip
   */
  async show() {
    if (!this._isEnabled) {
      return;
    }
    
    // Dispatch show event (cancelable)
    const showEvent = this._triggerEvent(EVENTS$6.SHOW);
    if (showEvent.defaultPrevented) {
      return;
    }
    
    const tip = this.tip;
    const title = this._getTitle();
    
    if (!title) {
      return;
    }
    
    this._setContent(tip, title);
    
    // Remove existing classes
    removeClass(tip, CLASSES$7.IN);
    removeClass(tip, CLASSES$7.TOP);
    removeClass(tip, CLASSES$7.BOTTOM);
    removeClass(tip, CLASSES$7.LEFT);
    removeClass(tip, CLASSES$7.RIGHT);
    
    // Set ID for accessibility
    const tipId = getUID(this.constructor.NAME || NAME$7);
    setAttr(tip, 'id', tipId);
    setAttr(this._element, 'aria-describedby', tipId);
    
    // Add fade class if animated
    if (this._options.animation) {
      addClass(tip, CLASSES$7.FADE);
    }
    
    // CRITICAL: Hide tooltip during initial positioning to prevent visual shift
    // Set initial styles to make tooltip invisible but measurable
    tip.style.position = 'absolute';
    tip.style.top = '0';
    tip.style.left = '0';
    tip.style.opacity = '0';
    tip.style.visibility = 'hidden';
    tip.style.display = 'block';
    tip.style.pointerEvents = 'none';
    
    // Get container and append tip
    const container = getContainer(this._options.container, this._element.ownerDocument.body);
    container.appendChild(tip);
    
    // Dispatch inserted event
    this._triggerEvent(EVENTS$6.INSERTED);
    
    // Position the tooltip WHILE INVISIBLE
    await this._updatePosition();
    
    // Now make visible - remove hiding styles and show
    tip.style.visibility = '';
    tip.style.pointerEvents = '';
    
    // Show with animation
    reflow(tip);
    addClass(tip, CLASSES$7.IN);
    
    // Force opacity for visibility
    tip.style.opacity = '1';
    
    if (this._options.animation) {
      await this._waitForTransition(tip, TRANSITION_DURATION$1);
    }
    
    // Set up auto-update for repositioning
    this._cleanupAutoUpdate = autoUpdate(this._element, tip, () => {
      this._updatePosition();
    });
    
    this._hoverState = '';
    
    // Dispatch shown event
    this._triggerEvent(EVENTS$6.SHOWN);
  }
  
  /**
   * Hide tooltip
   */
  async hide() {
    const tip = this.tip;
    
    // Dispatch hide event (cancelable)
    const hideEvent = this._triggerEvent(EVENTS$6.HIDE);
    if (hideEvent.defaultPrevented) return;
    
    // Clean up auto-update
    if (this._cleanupAutoUpdate) {
      this._cleanupAutoUpdate();
      this._cleanupAutoUpdate = null;
    }
    
    // Hide with animation
    removeClass(tip, CLASSES$7.IN);
    
    if (this._options.animation && hasClass(tip, CLASSES$7.FADE)) {
      await this._waitForTransition(tip, TRANSITION_DURATION$1);
    }
    
    this._hoverState = '';
    this._activeTrigger = {};
    
    // Remove tip from DOM
    if (tip.parentNode) {
      tip.parentNode.removeChild(tip);
    }
    
    // Remove aria
    removeAttr(this._element, 'aria-describedby');
    
    // Dispatch hidden event
    this._triggerEvent(EVENTS$6.HIDDEN);
  }
  
  /**
   * Update tooltip position
   */
  async update() {
    await this._updatePosition();
  }
  
  /**
   * Destroy tooltip instance
   */
  dispose() {
    clearTimeout(this._timeout);
    
    // Clean up auto-update
    if (this._cleanupAutoUpdate) {
      this._cleanupAutoUpdate();
    }
    
    // Remove event listeners
    this._removeListeners();
    
    // Remove tip
    if (this._tip) {
      remove(this._tip);
    }
    
    // Clean up instance
    removeInstance(this._element, DATA_KEY$8);
    this._element = null;
    this._options = null;
    this._tip = null;
  }
  
  // Private methods
  
  /**
   * Get merged options
   * @param {Object} options 
   * @returns {Object}
   * @private
   */
  _getOptions(options) {
    const defaults = this.constructor.DEFAULTS || DEFAULTS$5;
    const dataOptions = parseDataOptions(this._element, defaults);
    
    // Also get title from data attribute or title attribute
    if (!options.title && !dataOptions.title) {
      dataOptions.title = getAttr(this._element, 'title') || 
                          getAttr(this._element, 'data-original-title') || '';
      
      // Store original title and remove
      if (getAttr(this._element, 'title')) {
        setAttr(this._element, 'data-original-title', dataOptions.title);
        this._element.removeAttribute('title');
      }
    }
    
    return {
      ...defaults,
      ...dataOptions,
      ...options
    };
  }
  
  /**
   * Get title content
   * @returns {string}
   * @private
   */
  _getTitle() {
    let title = this._options.title;
    
    if (typeof title === 'function') {
      title = title.call(this._element);
    }
    
    return title ? String(title) : '';
  }
  
  /**
   * Set content in tooltip
   * @param {Element} tip 
   * @param {string} title 
   * @private
   */
  _setContent(tip, title) {
    const inner = $(SELECTORS$8.TOOLTIP_INNER, tip);
    if (inner) {
      if (this._options.html) {
        if (this._options.sanitize) {
          inner.innerHTML = sanitizeHTML(title);
        } else {
          inner.innerHTML = title;
        }
      } else {
        inner.textContent = title;
      }
    }
  }
  
  /**
   * Update tooltip position
   * @private
   */
  async _updatePosition() {
    const tip = this.tip;
    if (!tip || !tip.parentNode) return;
    
    const placement = this._getPlacement();
    
    // Use modern positioning
    const position = await computePosition(this._element, tip, {
      placement,
      offset: 10, // Arrow + gap
      flip: this._options.fallbackPlacement === 'flip',
      shift: true
    });
    
    // Apply position
    applyPosition(tip, position);
    
    // Update placement class
    const actualPlacement = position.placement.split('-')[0];
    removeClass(tip, CLASSES$7.TOP);
    removeClass(tip, CLASSES$7.RIGHT);
    removeClass(tip, CLASSES$7.BOTTOM);
    removeClass(tip, CLASSES$7.LEFT);
    addClass(tip, actualPlacement);
  }
  
  /**
   * Get placement
   * @returns {string}
   * @private
   */
  _getPlacement() {
    const placement = this._options.placement;
    
    if (typeof placement === 'function') {
      return placement.call(this, this.tip, this._element);
    }
    
    return placement;
  }
  
  /**
   * Set up event listeners
   * @private
   */
  _setListeners() {
    const triggers = this._options.trigger.split(' ');
    
    for (const trigger of triggers) {
      if (trigger === TRIGGERS.CLICK) {
        on(this._element, 'click', () => this.toggle());
      } else if (trigger !== TRIGGERS.MANUAL) {
        const eventIn = trigger === TRIGGERS.HOVER ? 'mouseenter' : 'focusin';
        const eventOut = trigger === TRIGGERS.HOVER ? 'mouseleave' : 'focusout';
        
        on(this._element, eventIn, () => this._enter());
        on(this._element, eventOut, () => this._leave());
      }
    }
    
    // Focus out on tip click
    if (this._options.selector) ;
  }
  
  /**
   * Remove event listeners
   * @private
   */
  _removeListeners() {
    off(this._element, 'click');
    off(this._element, 'mouseenter');
    off(this._element, 'mouseleave');
    off(this._element, 'focusin');
    off(this._element, 'focusout');
  }
  
  /**
   * Handle enter (show)
   * @private
   */
  _enter() {
    if (this._hoverState === 'out') {
      this._hoverState = '';
    }
    
    clearTimeout(this._timeout);
    this._hoverState = 'in';
    
    if (!this._options.delay || !this._options.delay.show) {
      this.show();
      return;
    }
    
    const delay = typeof this._options.delay === 'number'
      ? this._options.delay
      : this._options.delay.show;
    
    this._timeout = setTimeout(() => {
      if (this._hoverState === 'in') {
        this.show();
      }
    }, delay);
  }
  
  /**
   * Handle leave (hide)
   * @private
   */
  _leave() {
    clearTimeout(this._timeout);
    this._hoverState = 'out';
    
    if (!this._options.delay || !this._options.delay.hide) {
      this.hide();
      return;
    }
    
    const delay = typeof this._options.delay === 'number' 
      ? this._options.delay 
      : this._options.delay.hide;
    
    this._timeout = setTimeout(() => {
      if (this._hoverState === 'out') {
        this.hide();
      }
    }, delay);
  }
  
  /**
   * Check if has active trigger
   * @returns {boolean}
   * @private
   */
  _isWithActiveTrigger() {
    return Object.values(this._activeTrigger).includes(true);
  }
  
  /**
   * Get delegate config
   * @returns {Object}
   * @private
   */
  _getDelegateConfig() {
    const config = {};
    
    if (this._options) {
      for (const key in this._options) {
        if (DEFAULTS$5[key] !== this._options[key]) {
          config[key] = this._options[key];
        }
      }
    }
    
    return config;
  }
  
  /**
   * Wait for transition
   * @param {Element} element 
   * @param {number} duration 
   * @returns {Promise}
   * @private
   */
  _waitForTransition(element, duration) {
    return new Promise(resolve => {
      const handler = () => {
        element.removeEventListener('transitionend', handler);
        resolve();
      };
      element.addEventListener('transitionend', handler);
      setTimeout(resolve, duration + 50);
    });
  }
  
  /**
   * Trigger custom event
   * @param {string} eventType 
   * @returns {CustomEvent}
   * @private
   */
  _triggerEvent(eventType) {
    const event = new CustomEvent(eventType, {
      bubbles: true,
      cancelable: eventType === EVENTS$6.SHOW || eventType === EVENTS$6.HIDE
    });
    this._element.dispatchEvent(event);
    return event;
  }
  
  // Static methods
  
  /**
   * Get Tooltip instance from element
   * @param {Element} element 
   * @returns {Tooltip|null}
   */
  static getInstance(element) {
    return getInstance(element, DATA_KEY$8);
  }
  
  /**
   * Get or create Tooltip instance
   * @param {Element} element 
   * @param {Object} options 
   * @returns {Tooltip}
   */
  static getOrCreateInstance(element, options = {}) {
    return Tooltip.getInstance(element) || new Tooltip(element, options);
  }
  
  /**
   * Component name
   */
  static get NAME() {
    return NAME$7;
  }
  
  /**
   * Version
   */
  static get VERSION() {
    return '1.0.0';
  }
  
  /**
   * Data key
   */
  static get DATA_KEY() {
    return DATA_KEY$8;
  }
  
  /**
   * Default options
   */
  static get DEFAULTS() {
    return DEFAULTS$5;
  }
}

/**
 * Sandal Popover Component
 * Modern vanilla JS implementation with Bootstrap 3 API compatibility
 * Extends Tooltip functionality
 */


// Constants
const NAME$6 = 'popover';
const DATA_KEY$7 = 'bs.popover';
const EVENT_KEY$6 = `.bs.${NAME$6}`;

const DEFAULTS$4 = {
  ...Tooltip.DEFAULTS,
  placement: 'right',
  trigger: 'click',
  content: '',
  template: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
};

const EVENTS$5 = {
  SHOW: `show${EVENT_KEY$6}`,
  SHOWN: `shown${EVENT_KEY$6}`,
  HIDE: `hide${EVENT_KEY$6}`,
  HIDDEN: `hidden${EVENT_KEY$6}`,
  INSERTED: `inserted${EVENT_KEY$6}`
};

const SELECTORS$7 = {
  TITLE: '.popover-title',
  CONTENT: '.popover-content',
  ARROW: '.arrow'
};

/**
 * Popover Class
 * Extends Tooltip with title and content support
 */
class Popover extends Tooltip {
  /**
   * Create a Popover instance
   * @param {Element} element - The trigger element
   * @param {Object} options - Configuration options
   */
  constructor(element, options = {}) {
    // Call parent constructor with modified data key
    super(element, options);
    
    if (!this._element) return;
    
    // Re-store with popover data key
    removeInstance(this._element, Tooltip.DATA_KEY);
    setInstance(this._element, DATA_KEY$7, this);
  }
  
  /**
   * Get tip element
   * @returns {Element}
   */
  get tip() {
    if (!this._tip) {
      this._tip = createFromHTML(this._options.template);
    }
    return this._tip;
  }
  
  /**
   * Destroy popover instance
   */
  dispose() {
    // Remove event listeners
    this._removeListeners();
    
    // Clean up auto-update
    if (this._cleanupAutoUpdate) {
      this._cleanupAutoUpdate();
    }
    
    // Remove tip
    if (this._tip && this._tip.parentNode) {
      this._tip.parentNode.removeChild(this._tip);
    }
    
    // Clean up instance
    removeInstance(this._element, DATA_KEY$7);
    this._element = null;
    this._options = null;
    this._tip = null;
  }
  
  // Private methods (override parent)
  
  /**
   * Get merged options
   * @param {Object} options 
   * @returns {Object}
   * @private
   */
  _getOptions(options) {
    const defaults = this.constructor.DEFAULTS || DEFAULTS$4;
    const dataOptions = parseDataOptions(this._element, defaults);
    
    // Get title from data attribute or title attribute
    if (!options.title && !dataOptions.title) {
      dataOptions.title = getAttr(this._element, 'data-original-title') ||
                          getAttr(this._element, 'title') || '';
      
      // Store original title and remove
      if (getAttr(this._element, 'title')) {
        setAttr(this._element, 'data-original-title', dataOptions.title);
        this._element.removeAttribute('title');
      }
    }
    
    // Get content from data attribute
    if (!options.content && !dataOptions.content) {
      dataOptions.content = getAttr(this._element, 'data-content') || '';
    }
    
    return {
      ...defaults,
      ...dataOptions,
      ...options
    };
  }
  
  /**
   * Get title content
   * @returns {string}
   * @private
   */
  _getTitle() {
    let title = this._options.title;
    
    if (typeof title === 'function') {
      title = title.call(this._element);
    }
    
    return title ? String(title) : '';
  }
  
  /**
   * Get content
   * @returns {string}
   * @private
   */
  _getContent() {
    let content = this._options.content;
    
    if (typeof content === 'function') {
      content = content.call(this._element);
    }
    
    return content ? String(content) : '';
  }
  
  /**
   * Set content in popover
   * @param {Element} tip 
   * @param {string} title 
   * @private
   */
  _setContent(tip, title) {
    const titleEl = $(SELECTORS$7.TITLE, tip);
    const contentEl = $(SELECTORS$7.CONTENT, tip);
    
    // Set title
    if (titleEl) {
      const titleText = this._getTitle();
      if (titleText) {
        if (this._options.html) {
          if (this._options.sanitize) {
            titleEl.innerHTML = sanitizeHTML(titleText);
          } else {
            titleEl.innerHTML = titleText;
          }
        } else {
          titleEl.textContent = titleText;
        }
      } else {
        // Hide title if empty
        titleEl.style.display = 'none';
      }
    }
    
    // Set content
    if (contentEl) {
      const content = this._getContent();
      if (this._options.html) {
        if (this._options.sanitize) {
          contentEl.innerHTML = sanitizeHTML(content);
        } else {
          contentEl.innerHTML = content;
        }
      } else {
        contentEl.textContent = content;
      }
    }
  }
  
  /**
   * Check if has content
   * @returns {boolean}
   * @private
   */
  _hasContent() {
    return this._getTitle() || this._getContent();
  }
  
  /**
   * Show popover (override to check content)
   */
  async show() {
    if (!this._hasContent()) {
      return;
    }
    
    await super.show();
  }
  
  /**
   * Trigger custom event
   * @param {string} eventType 
   * @returns {CustomEvent}
   * @private
   */
  _triggerEvent(eventType) {
    // Map tooltip events to popover events
    const popoverEventType = eventType.replace('.bs.tooltip', EVENT_KEY$6);
    
    const event = new CustomEvent(popoverEventType, {
      bubbles: true,
      cancelable: popoverEventType === EVENTS$5.SHOW || popoverEventType === EVENTS$5.HIDE
    });
    this._element.dispatchEvent(event);
    return event;
  }
  
  // Static methods
  
  /**
   * Get Popover instance from element
   * @param {Element} element 
   * @returns {Popover|null}
   */
  static getInstance(element) {
    return getInstance(element, DATA_KEY$7);
  }
  
  /**
   * Get or create Popover instance
   * @param {Element} element 
   * @param {Object} options 
   * @returns {Popover}
   */
  static getOrCreateInstance(element, options = {}) {
    return Popover.getInstance(element) || new Popover(element, options);
  }
  
  /**
   * Component name
   */
  static get NAME() {
    return NAME$6;
  }
  
  /**
   * Version
   */
  static get VERSION() {
    return '1.0.0';
  }
  
  /**
   * Data key
   */
  static get DATA_KEY() {
    return DATA_KEY$7;
  }
  
  /**
   * Default options
   */
  static get DEFAULTS() {
    return DEFAULTS$4;
  }
}

/**
 * Sandal Tab Component
 * Modern vanilla JS implementation with Bootstrap 3 API compatibility
 */


// Constants
const NAME$5 = 'tab';
const DATA_KEY$6 = 'bs.tab';
const EVENT_KEY$5 = `.bs.${NAME$5}`;

const EVENTS$4 = {
  SHOW: `show${EVENT_KEY$5}`,
  SHOWN: `shown${EVENT_KEY$5}`,
  HIDE: `hide${EVENT_KEY$5}`,
  HIDDEN: `hidden${EVENT_KEY$5}`
};

const CLASSES$6 = {
  DROPDOWN_MENU: 'dropdown-menu',
  ACTIVE: 'active',
  DISABLED: 'disabled',
  FADE: 'fade',
  IN: 'in'
};

const SELECTORS$6 = {
  DATA_TOGGLE: '[data-toggle="tab"], [data-toggle="pill"]',
  DROPDOWN: '.dropdown',
  NAV_LIST_GROUP: '.nav, .list-group',
  ACTIVE: '.active',
  ACTIVE_UL: '> li > .active',
  ACTIVE_CHILD: '> .active',
  DATA_TOGGLE_CHILD: '> li > [data-toggle="tab"], > li > [data-toggle="pill"], > [data-toggle="tab"], > [data-toggle="pill"]'
};

// Static transitioning state per nav container
const transitioningContainers = new WeakSet();

/**
 * Tab Class
 * Provides tab and pill navigation functionality
 */
class Tab {
  /**
   * Create a Tab instance
   * @param {Element} element - The tab trigger element
   */
  constructor(element) {
    this._element = typeof element === 'string' ? $(element) : element;
    
    if (!this._element) return;
    
    // Store instance
    setInstance(this._element, DATA_KEY$6, this);
  }
  
  /**
   * Get tab element
   * @returns {Element}
   */
  get element() {
    return this._element;
  }
  
  /**
   * Show the tab
   */
  show() {
    if (!this._element) return;
    
    // Check if already active or disabled
    const listElement = closest(this._element, SELECTORS$6.NAV_LIST_GROUP);
    const targetSelector = getAttr(this._element, 'data-target') || getAttr(this._element, 'href');
    
    // Prevent concurrent transitions on the same nav container
    if (listElement && transitioningContainers.has(listElement)) {
      return;
    }
    
    // Check if link is inside an active li
    const parentLi = this._element.parentElement;
    if (parentLi && hasClass(parentLi, CLASSES$6.ACTIVE)) {
      return;
    }
    
    // Check if disabled
    if (hasClass(this._element, CLASSES$6.DISABLED) ||
        (parentLi && hasClass(parentLi, CLASSES$6.DISABLED))) {
      return;
    }
    
    // Find currently active element
    let previous = null;
    let previousTab = null;
    
    if (listElement) {
      // Find active child - check both direct children and li > a patterns
      const activeChildren = children(listElement).filter(child => hasClass(child, CLASSES$6.ACTIVE));
      if (activeChildren.length > 0) {
        previous = activeChildren[0];
        previousTab = $(SELECTORS$6.DATA_TOGGLE, previous) || previous;
      } else {
        // Check for li > .active pattern
        const activeLi = listElement.querySelector(':scope > li > .active');
        if (activeLi) {
          previousTab = activeLi;
          previous = activeLi.parentElement;
        }
      }
    }
    
    // Dispatch show event (cancelable)
    const showEvent = this._triggerEvent(EVENTS$4.SHOW, {
      relatedTarget: previousTab
    });
    
    if (showEvent.defaultPrevented) return;
    
    // Dispatch hide event on previous tab
    if (previousTab && previousTab !== this._element) {
      const hideEvent = this._triggerEventOn(previousTab, EVENTS$4.HIDE, {
        relatedTarget: this._element
      });
      
      if (hideEvent.defaultPrevented) return;
    }
    
    // Lock the container
    if (listElement) {
      transitioningContainers.add(listElement);
    }
    
    // Activate the tab synchronously to avoid race conditions
    this._activate(this._element, listElement, false);
    
    // Activate the pane
    const target = targetSelector ? $(targetSelector) : null;
    if (target) {
      const container = target.parentElement;
      this._activate(target, container, true);
    }
    
    // Unlock after a frame to allow CSS transitions
    requestAnimationFrame(() => {
      if (listElement) {
        transitioningContainers.delete(listElement);
      }
      
      // Dispatch shown event
      this._triggerEvent(EVENTS$4.SHOWN, {
        relatedTarget: previousTab
      });
      
      // Dispatch hidden event on previous tab
      if (previousTab && previousTab !== this._element) {
        this._triggerEventOn(previousTab, EVENTS$4.HIDDEN, {
          relatedTarget: this._element
        });
      }
    });
  }
  
  /**
   * Destroy the tab instance
   */
  dispose() {
    removeInstance(this._element, DATA_KEY$6);
    this._element = null;
  }
  
  // Private methods
  
  /**
   * Activate element within container
   * @param {Element} element - Element to activate
   * @param {Element} container - Container element
   * @param {boolean} [isPane=false] - Whether activating a pane
   * @private
   */
  _activate(element, container, isPane = false) {
    if (!container) return;
    
    if (isPane) {
      // For panes - find active sibling pane and deactivate
      const activePanes = children(container).filter(child => hasClass(child, CLASSES$6.ACTIVE));
      for (const activePane of activePanes) {
        removeClass(activePane, CLASSES$6.ACTIVE);
        removeClass(activePane, CLASSES$6.IN);
      }
      
      // Activate new pane
      addClass(element, CLASSES$6.ACTIVE);
      
      // Handle fade transition
      if (hasClass(element, CLASSES$6.FADE)) {
        reflow(element);
        addClass(element, CLASSES$6.IN);
      }
    } else {
      // For tabs - Bootstrap 3 only sets active on <li>, not on <a>
      // First, remove active from ALL li elements in this nav
      const allLiElements = children(container).filter(child => child.tagName === 'LI');
      for (const li of allLiElements) {
        if (hasClass(li, CLASSES$6.ACTIVE)) {
          removeClass(li, CLASSES$6.ACTIVE);
          
          // Also remove from any anchors inside (cleanup from previous bugs)
          const anchorsInLi = li.querySelectorAll('a.active');
          anchorsInLi.forEach(a => removeClass(a, CLASSES$6.ACTIVE));
          
          // Update aria on the tab link
          const tabLink = li.querySelector('[data-toggle="tab"], [data-toggle="pill"]');
          if (tabLink && tabLink.hasAttribute('aria-selected')) {
            setAttr(tabLink, 'aria-selected', 'false');
          }
        }
      }
      
      // Also handle dropdown menus that might have active items
      const activeDropdownItems = container.querySelectorAll('.dropdown-menu .active');
      activeDropdownItems.forEach(item => removeClass(item, CLASSES$6.ACTIVE));
      
      // Now activate the new tab's parent li (Bootstrap 3 style)
      const parentLi = element.parentElement;
      if (parentLi && parentLi.tagName === 'LI') {
        addClass(parentLi, CLASSES$6.ACTIVE);
      }
      
      // Handle dropdown parent - mark the dropdown's li as active too
      const dropdownMenu = closest(element, '.dropdown-menu');
      if (dropdownMenu) {
        const dropdownLi = closest(dropdownMenu, 'li.dropdown');
        if (dropdownLi) {
          addClass(dropdownLi, CLASSES$6.ACTIVE);
        }
      }
      
      // Update aria on the new tab
      if (element.hasAttribute('aria-selected')) {
        setAttr(element, 'aria-selected', 'true');
      }
    }
  }
  
  /**
   * Trigger custom event
   * @param {string} eventType 
   * @param {Object} detail 
   * @returns {CustomEvent}
   * @private
   */
  _triggerEvent(eventType, detail = {}) {
    const event = new CustomEvent(eventType, {
      bubbles: true,
      cancelable: eventType === EVENTS$4.SHOW || eventType === EVENTS$4.HIDE,
      detail
    });
    this._element.dispatchEvent(event);
    return event;
  }
  
  /**
   * Trigger event on specific element
   * @param {Element} element 
   * @param {string} eventType 
   * @param {Object} detail 
   * @returns {CustomEvent}
   * @private
   */
  _triggerEventOn(element, eventType, detail = {}) {
    const event = new CustomEvent(eventType, {
      bubbles: true,
      cancelable: eventType === EVENTS$4.SHOW || eventType === EVENTS$4.HIDE,
      detail
    });
    element.dispatchEvent(event);
    return event;
  }
  
  // Static methods
  
  /**
   * Get Tab instance from element
   * @param {Element} element 
   * @returns {Tab|null}
   */
  static getInstance(element) {
    return getInstance(element, DATA_KEY$6);
  }
  
  /**
   * Get or create Tab instance
   * @param {Element} element 
   * @returns {Tab}
   */
  static getOrCreateInstance(element) {
    return Tab.getInstance(element) || new Tab(element);
  }
  
  /**
   * Handle click on tab
   * @param {Event} event
   */
  static handleClick(event) {
    event.preventDefault();
    
    // event.currentTarget is preferred, but may not be available in all cases
    // event.target might be a text node, so check for closest method
    let tab = event.currentTarget;
    if (!tab) {
      const target = event.target;
      tab = target && target.closest ? target.closest(SELECTORS$6.DATA_TOGGLE) : null;
    }
    if (!tab) return;
    
    const instance = Tab.getOrCreateInstance(tab);
    instance.show();
  }
  
  /**
   * Version
   */
  static get VERSION() {
    return '1.0.0';
  }
  
  /**
   * Data key
   */
  static get DATA_KEY() {
    return DATA_KEY$6;
  }
}

/**
 * Sandal Collapse Component
 * Modern vanilla JS implementation with Bootstrap 3 API compatibility
 * Uses Web Animation API for smooth animations
 */


// Constants
const NAME$4 = 'collapse';
const DATA_KEY$5 = 'bs.collapse';
const EVENT_KEY$4 = `.bs.${NAME$4}`;

const DEFAULTS$3 = {
  toggle: true,
  parent: null
};

const EVENTS$3 = {
  SHOW: `show${EVENT_KEY$4}`,
  SHOWN: `shown${EVENT_KEY$4}`,
  HIDE: `hide${EVENT_KEY$4}`,
  HIDDEN: `hidden${EVENT_KEY$4}`
};

const CLASSES$5 = {
  COLLAPSE: 'collapse',
  COLLAPSING: 'collapsing',
  COLLAPSED: 'collapsed',
  IN: 'in',
  SHOW: 'show'
};

const SELECTORS$5 = {
  DATA_TOGGLE: '[data-toggle="collapse"]',
  ACTIVES: '.in, .collapsing'
};

/**
 * Collapse Class
 * Provides collapsible content functionality
 */
class Collapse {
  /**
   * Create a Collapse instance
   * @param {Element} element - The collapsible element
   * @param {Object} options - Configuration options
   */
  constructor(element, options = {}) {
    this._element = typeof element === 'string' ? $(element) : element;
    
    if (!this._element) return;
    
    // Parse options from data attributes
    this._options = {
      ...DEFAULTS$3,
      ...parseDataOptions(this._element, DEFAULTS$3),
      ...options
    };
    
    this._isTransitioning = false;
    this._triggerArray = [];
    
    // Find all triggers for this collapse
    const toggleList = $$$1(SELECTORS$5.DATA_TOGGLE);
    for (const toggle of toggleList) {
      const selector = getAttr(toggle, 'data-target') || getAttr(toggle, 'href');
      if (selector) {
        const filterElement = $$$1(selector).filter(el => el === this._element);
        if (filterElement.length > 0) {
          this._triggerArray.push(toggle);
        }
      }
    }
    
    // Get parent element for accordion behavior
    this._parent = this._getParent();
    
    // Store instance
    setInstance(this._element, DATA_KEY$5, this);
    
    // Set initial ARIA state
    this._addAriaAndCollapsedClass(this._element, this._triggerArray);
    
    // Auto-toggle on init if toggle option is true (Bootstrap 3 behavior)
    if (this._options.toggle) {
      this.toggle();
    }
  }
  
  /**
   * Get collapse element
   * @returns {Element}
   */
  get element() {
    return this._element;
  }
  
  /**
   * Toggle the collapse
   */
  toggle() {
    if (hasClass(this._element, CLASSES$5.IN)) {
      this.hide();
    } else {
      this.show();
    }
  }
  
  /**
   * Show the collapse
   */
  async show() {
    if (this._isTransitioning || hasClass(this._element, CLASSES$5.IN)) {
      return;
    }
    
    let actives = null;
    let activesData = null;
    
    // Accordion behavior - close other panels
    if (this._parent) {
      actives = $$$1(SELECTORS$5.ACTIVES, this._parent).filter(elem => {
        if (this._options.parent) {
          return closest(elem, this._options.parent) === this._parent;
        }
        return hasClass(elem, CLASSES$5.COLLAPSE);
      });
      
      if (actives.length === 0) {
        actives = null;
      }
    }
    
    // Check if target is already transitioning
    if (actives) {
      activesData = actives.map(elem => getInstance(elem, DATA_KEY$5));
      const hasTransitioning = activesData.some(data => data && data._isTransitioning);
      if (hasTransitioning) return;
    }
    
    // Dispatch show event (cancelable)
    const showEvent = this._triggerEvent(EVENTS$3.SHOW);
    if (showEvent.defaultPrevented) return;
    
    // Close other active collapses in accordion
    if (actives) {
      for (const active of actives) {
        if (active !== this._element) {
          const instance = getInstance(active, DATA_KEY$5);
          if (instance) {
            instance.hide();
          } else {
            // No instance, manually remove class
            removeClass(active, CLASSES$5.IN);
          }
        }
      }
    }
    
    this._isTransitioning = true;
    
    // Set up for animation
    removeClass(this._element, CLASSES$5.COLLAPSE);
    addClass(this._element, CLASSES$5.COLLAPSING);
    this._element.style.height = '0';
    this._element.style.overflow = 'hidden';
    
    // Update triggers
    this._setTriggerState(false);
    
    // Force reflow
    reflow(this._element);
    
    // Calculate natural height
    this._element.style.height = 'auto';
    const naturalHeight = this._element.scrollHeight;
    this._element.style.height = '0';
    
    // Animate
    try {
      await this._element.animate([
        { height: '0px' },
        { height: `${naturalHeight}px` }
      ], {
        duration: 350,
        easing: 'ease'
      }).finished;
    } catch (e) {
      // Animation cancelled or failed
    }
    
    // Finish transition
    this._element.style.height = '';
    this._element.style.overflow = '';
    removeClass(this._element, CLASSES$5.COLLAPSING);
    addClass(this._element, CLASSES$5.COLLAPSE);
    addClass(this._element, CLASSES$5.IN);
    
    this._isTransitioning = false;
    
    // Dispatch shown event
    this._triggerEvent(EVENTS$3.SHOWN);
  }
  
  /**
   * Hide the collapse
   */
  async hide() {
    if (this._isTransitioning || !hasClass(this._element, CLASSES$5.IN)) {
      return;
    }
    
    // Dispatch hide event (cancelable)
    const hideEvent = this._triggerEvent(EVENTS$3.HIDE);
    if (hideEvent.defaultPrevented) return;
    
    this._isTransitioning = true;
    
    // Get current height for animation
    const currentHeight = this._element.scrollHeight;
    this._element.style.height = `${currentHeight}px`;
    
    // Force reflow
    reflow(this._element);
    
    // Set up for animation
    removeClass(this._element, CLASSES$5.COLLAPSE);
    removeClass(this._element, CLASSES$5.IN);
    addClass(this._element, CLASSES$5.COLLAPSING);
    this._element.style.overflow = 'hidden';
    
    // Update triggers
    this._setTriggerState(true);
    
    // Animate
    try {
      await this._element.animate([
        { height: `${currentHeight}px` },
        { height: '0px' }
      ], {
        duration: 350,
        easing: 'ease'
      }).finished;
    } catch (e) {
      // Animation cancelled or failed
    }
    
    // Finish transition
    this._element.style.height = '';
    this._element.style.overflow = '';
    removeClass(this._element, CLASSES$5.COLLAPSING);
    addClass(this._element, CLASSES$5.COLLAPSE);
    
    this._isTransitioning = false;
    
    // Dispatch hidden event
    this._triggerEvent(EVENTS$3.HIDDEN);
  }
  
  /**
   * Destroy the collapse instance
   */
  dispose() {
    removeInstance(this._element, DATA_KEY$5);
    this._options = null;
    this._parent = null;
    this._triggerArray = null;
    this._isTransitioning = false;
    this._element = null;
  }
  
  // Private methods
  
  /**
   * Get parent element for accordion behavior
   * @returns {Element|null}
   * @private
   */
  _getParent() {
    const parent = this._options.parent;
    
    if (!parent) return null;
    
    if (typeof parent === 'string') {
      // Check if it's an ID selector
      if (parent.charAt(0) === '#') {
        return $(parent);
      }
      // Try to find parent from element's context
      return closest(this._element, parent);
    }
    
    return parent instanceof Element ? parent : null;
  }
  
  /**
   * Add ARIA and collapsed class to triggers
   * @param {Element} element 
   * @param {Element[]} triggers 
   * @private
   */
  _addAriaAndCollapsedClass(element, triggers) {
    const isOpen = hasClass(element, CLASSES$5.IN);
    
    if (triggers.length) {
      for (const trigger of triggers) {
        if (isOpen) {
          removeClass(trigger, CLASSES$5.COLLAPSED);
        } else {
          addClass(trigger, CLASSES$5.COLLAPSED);
        }
        setAttr(trigger, 'aria-expanded', isOpen.toString());
      }
    }
  }
  
  /**
   * Set trigger collapsed state
   * @param {boolean} collapsed 
   * @private
   */
  _setTriggerState(collapsed) {
    for (const trigger of this._triggerArray) {
      if (collapsed) {
        addClass(trigger, CLASSES$5.COLLAPSED);
      } else {
        removeClass(trigger, CLASSES$5.COLLAPSED);
      }
      setAttr(trigger, 'aria-expanded', (!collapsed).toString());
    }
  }
  
  /**
   * Trigger custom event
   * @param {string} eventType 
   * @returns {CustomEvent}
   * @private
   */
  _triggerEvent(eventType) {
    const event = new CustomEvent(eventType, {
      bubbles: true,
      cancelable: eventType === EVENTS$3.SHOW || eventType === EVENTS$3.HIDE
    });
    this._element.dispatchEvent(event);
    return event;
  }
  
  // Static methods
  
  /**
   * Get Collapse instance from element
   * @param {Element} element 
   * @returns {Collapse|null}
   */
  static getInstance(element) {
    return getInstance(element, DATA_KEY$5);
  }
  
  /**
   * Get or create Collapse instance
   * @param {Element} element 
   * @param {Object} options 
   * @returns {Collapse}
   */
  static getOrCreateInstance(element, options = {}) {
    return Collapse.getInstance(element) || new Collapse(element, options);
  }
  
  /**
   * Handle click on collapse trigger
   * @param {Event} event 
   */
  static handleToggle(event) {
    const trigger = event.currentTarget || event.target.closest(SELECTORS$5.DATA_TOGGLE);
    
    if (!trigger) return;
    
    // Prevent default for links
    if (trigger.tagName === 'A') {
      event.preventDefault();
    }
    
    // Get target(s)
    const selector = getAttr(trigger, 'data-target') || getAttr(trigger, 'href');
    
    if (!selector) return;
    
    const targets = $$$1(selector);
    
    for (const target of targets) {
      const options = {
        toggle: false
      };
      
      // Check for parent (accordion)
      const parentSelector = getAttr(trigger, 'data-parent');
      if (parentSelector) {
        options.parent = parentSelector;
      }
      
      const instance = Collapse.getOrCreateInstance(target, options);
      instance.toggle();
    }
  }
  
  /**
   * Version
   */
  static get VERSION() {
    return '1.0.0';
  }
  
  /**
   * Data key
   */
  static get DATA_KEY() {
    return DATA_KEY$5;
  }
  
  /**
   * Default options
   */
  static get DEFAULTS() {
    return DEFAULTS$3;
  }
}

/**
 * Sandal Alert Component
 * Modern vanilla JS implementation with Bootstrap 3 API compatibility
 */


// Constants
const NAME$3 = 'alert';
const DATA_KEY$4 = 'bs.alert';
const EVENT_KEY$3 = `.bs.${NAME$3}`;

const EVENTS$2 = {
  CLOSE: `close${EVENT_KEY$3}`,
  CLOSED: `closed${EVENT_KEY$3}`
};

const CLASSES$4 = {
  ALERT: 'alert',
  FADE: 'fade',
  IN: 'in'
};

const SELECTORS$4 = {
  DISMISS: '[data-dismiss="alert"]'
};

/**
 * Alert Class
 * Provides dismissible alert functionality
 */
class Alert {
  /**
   * Create an Alert instance
   * @param {Element} element - The alert element
   */
  constructor(element) {
    this._element = typeof element === 'string' ? $(element) : element;
    
    if (!this._element) return;
    
    // Store instance
    setInstance(this._element, DATA_KEY$4, this);
    
    // Bind dismiss button handler
    this._bindDismiss();
  }
  
  /**
   * Get alert element
   * @returns {Element}
   */
  get element() {
    return this._element;
  }
  
  /**
   * Close the alert
   * @param {Element} [alertElement] - Optional specific alert element to close
   */
  close(alertElement) {
    const rootElement = alertElement || this._element;
    
    if (!rootElement) return;
    
    // Dispatch close event (cancelable)
    const closeEvent = this._triggerEvent(EVENTS$2.CLOSE, rootElement);
    
    if (closeEvent.defaultPrevented) return;
    
    this._removeElement(rootElement);
  }
  
  /**
   * Destroy the alert instance
   */
  dispose() {
    this._unbindDismiss();
    removeInstance(this._element, DATA_KEY$4);
    this._element = null;
  }
  
  // Private methods
  
  /**
   * Bind click handler to dismiss buttons
   * @private
   */
  _bindDismiss() {
    on(this._element, 'click', SELECTORS$4.DISMISS, (e) => {
      e.preventDefault();
      this.close();
    });
  }
  
  /**
   * Unbind dismiss handlers
   * @private
   */
  _unbindDismiss() {
    off(this._element, 'click');
  }
  
  /**
   * Remove the alert element with animation
   * @param {Element} element 
   * @private
   */
  async _removeElement(element) {
    removeClass(element, CLASSES$4.IN);
    
    if (hasClass(element, CLASSES$4.FADE)) {
      // Animate out using Web Animation API
      await fadeOut(element, { duration: 150 });
    }
    
    // Dispatch closed event
    this._triggerEvent(EVENTS$2.CLOSED, element);
    
    // Remove from DOM and clean up
    const instance = getInstance(element, DATA_KEY$4);
    if (instance) {
      instance.dispose();
    }
    remove(element);
  }
  
  /**
   * Trigger custom event
   * @param {string} eventType 
   * @param {Element} element 
   * @returns {CustomEvent}
   * @private
   */
  _triggerEvent(eventType, element) {
    const event = new CustomEvent(eventType, {
      bubbles: true,
      cancelable: eventType === EVENTS$2.CLOSE
    });
    element.dispatchEvent(event);
    return event;
  }
  
  // Static methods
  
  /**
   * Get Alert instance from element
   * @param {Element} element 
   * @returns {Alert|null}
   */
  static getInstance(element) {
    return getInstance(element, DATA_KEY$4);
  }
  
  /**
   * Get or create Alert instance
   * @param {Element} element 
   * @returns {Alert}
   */
  static getOrCreateInstance(element) {
    return Alert.getInstance(element) || new Alert(element);
  }
  
  /**
   * Close alert from dismiss button click
   * @param {Event} event 
   */
  static handleDismiss(event) {
    const button = event.currentTarget || event.target;
    const alertElement = closest(button, `.${CLASSES$4.ALERT}`);
    
    if (!alertElement) return;
    
    event.preventDefault();
    
    const instance = Alert.getOrCreateInstance(alertElement);
    instance.close();
  }
  
  /**
   * Version
   */
  static get VERSION() {
    return '1.0.0';
  }
  
  /**
   * Data key
   */
  static get DATA_KEY() {
    return DATA_KEY$4;
  }
}

/**
 * Sandal Button Component
 * Modern vanilla JS implementation with Bootstrap 3 API compatibility
 */

const DATA_KEY$3 = 'bs.button';

const CLASSES$3 = {
  ACTIVE: 'active',
  BUTTON: 'btn',
  DISABLED: 'disabled'
};

const SELECTORS$3 = {
  DATA_TOGGLE: '[data-toggle^="button"]',
  DATA_TOGGLE_BUTTONS: '[data-toggle="buttons"]',
  INPUT: 'input:not([type="hidden"])',
  ACTIVE: '.active',
  BUTTON: '.btn'
};

/**
 * Button Class
 * Provides toggle state and button group functionality
 */
class Button {
  /**
   * Create a Button instance
   * @param {Element} element - The button element
   */
  constructor(element) {
    this._element = typeof element === 'string' ? $(element) : element;
    
    if (!this._element) return;
    
    // Store instance
    setInstance(this._element, DATA_KEY$3, this);
  }
  
  /**
   * Get button element
   * @returns {Element}
   */
  get element() {
    return this._element;
  }
  
  /**
   * Toggle button state
   */
  toggle() {
    let triggerChangeEvent = true;
    let addAriaPressed = true;
    
    // Check if part of button group
    const rootElement = closest(this._element, SELECTORS$3.DATA_TOGGLE_BUTTONS);
    
    if (rootElement) {
      const input = this._element.querySelector(SELECTORS$3.INPUT);
      
      if (input) {
        if (input.type === 'radio') {
          if (input.checked && hasClass(this._element, CLASSES$3.ACTIVE)) {
            triggerChangeEvent = false;
          } else {
            // Deactivate other buttons in group
            const activeElement = rootElement.querySelector(SELECTORS$3.ACTIVE);
            if (activeElement) {
              removeClass(activeElement, CLASSES$3.ACTIVE);
              // Also update input state
              const activeInput = activeElement.querySelector(SELECTORS$3.INPUT);
              if (activeInput) {
                activeInput.checked = false;
              }
            }
          }
        }
        
        if (triggerChangeEvent) {
          if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = !hasClass(this._element, CLASSES$3.ACTIVE);
          }
          // Trigger change event
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        input.focus();
        addAriaPressed = false;
      }
    }
    
    if (addAriaPressed) {
      const pressed = !hasClass(this._element, CLASSES$3.ACTIVE);
      setAttr(this._element, 'aria-pressed', pressed.toString());
    }
    
    if (triggerChangeEvent) {
      toggleClass(this._element, CLASSES$3.ACTIVE);
    }
  }
  
  /**
   * Set loading state
   * @param {string} [state='loading'] - State to set (loading, reset)
   */
  setState(state = 'loading') {
    const data = this._element.dataset;
    const val = state === 'loading' ? data.loadingText : data.resetText;
    
    if (!val) return;
    
    // Store original text
    if (!data.resetText) {
      data.resetText = this._element.textContent;
    }
    
    // Set loading state
    this._element.textContent = val;
    
    // Manage disabled state
    if (state === 'loading') {
      setAttr(this._element, 'disabled', 'disabled');
      addClass(this._element, CLASSES$3.DISABLED);
    } else {
      removeAttr(this._element, 'disabled');
      removeClass(this._element, CLASSES$3.DISABLED);
    }
  }
  
  /**
   * Destroy the button instance
   */
  dispose() {
    removeInstance(this._element, DATA_KEY$3);
    this._element = null;
  }
  
  // Static methods
  
  /**
   * Get Button instance from element
   * @param {Element} element 
   * @returns {Button|null}
   */
  static getInstance(element) {
    return getInstance(element, DATA_KEY$3);
  }
  
  /**
   * Get or create Button instance
   * @param {Element} element 
   * @returns {Button}
   */
  static getOrCreateInstance(element) {
    return Button.getInstance(element) || new Button(element);
  }
  
  /**
   * Handle click on toggle button
   * @param {Event} event 
   */
  static handleToggle(event) {
    let button = event.target;
    
    // Find actual button element
    if (!hasClass(button, CLASSES$3.BUTTON)) {
      button = closest(button, SELECTORS$3.BUTTON);
    }
    
    if (!button) return;
    
    // Check if disabled
    if (hasClass(button, CLASSES$3.DISABLED) || button.disabled) {
      event.preventDefault();
      return;
    }
    
    const instance = Button.getOrCreateInstance(button);
    instance.toggle();
    
    // Don't prevent default for checkbox/radio inputs
    const input = button.querySelector(SELECTORS$3.INPUT);
    if (!input) {
      event.preventDefault();
    }
  }
  
  /**
   * Version
   */
  static get VERSION() {
    return '1.0.0';
  }
  
  /**
   * Data key
   */
  static get DATA_KEY() {
    return DATA_KEY$3;
  }
}

/**
 * Sandal Carousel Component
 * Modern vanilla JS implementation with Bootstrap 3 API compatibility
 * Uses Web Animation API for smooth transitions
 */


// Constants
const NAME$2 = 'carousel';
const DATA_KEY$2 = 'bs.carousel';
const EVENT_KEY$2 = `.bs.${NAME$2}`;

const DEFAULTS$2 = {
  interval: 5000,
  pause: 'hover',
  wrap: true,
  keyboard: true
};

const EVENTS$1 = {
  SLIDE: `slide${EVENT_KEY$2}`,
  SLID: `slid${EVENT_KEY$2}`
};

const CLASSES$2 = {
  CAROUSEL: 'carousel',
  ACTIVE: 'active',
  SLIDE: 'slide',
  RIGHT: 'right',
  LEFT: 'left',
  NEXT: 'next',
  PREV: 'prev',
  ITEM: 'item'
};

const SELECTORS$2 = {
  ACTIVE: '.active',
  ACTIVE_ITEM: '.item.active',
  ITEM: '.item',
  ITEM_IMG: '.item img',
  NEXT_PREV: '.next, .prev',
  INDICATORS: '.carousel-indicators',
  DATA_SLIDE: '[data-slide], [data-slide-to]',
  DATA_RIDE: '[data-ride="carousel"]'
};

const DIRECTION = {
  NEXT: 'next',
  PREV: 'prev',
  LEFT: 'left',
  RIGHT: 'right'
};

const TRANSITION_DURATION = 600;

/**
 * Carousel Class
 * Provides carousel/slideshow functionality
 */
class Carousel {
  /**
   * Create a Carousel instance
   * @param {Element} element - The carousel element
   * @param {Object} options - Configuration options
   */
  constructor(element, options = {}) {
    this._element = typeof element === 'string' ? $(element) : element;
    
    if (!this._element) return;
    
    this._items = null;
    this._interval = null;
    this._activeElement = null;
    this._isPaused = false;
    this._isSliding = false;
    
    // Parse options
    this._options = {
      ...DEFAULTS$2,
      ...parseDataOptions(this._element, DEFAULTS$2),
      ...options
    };
    
    // Get indicators
    this._indicatorsElement = $(SELECTORS$2.INDICATORS, this._element);
    
    // Bind events
    this._bindEvents();
    
    // Store instance
    setInstance(this._element, DATA_KEY$2, this);
    
    // Auto start if data-ride
    if (this._options.interval) {
      this.cycle();
    }
  }
  
  /**
   * Get carousel element
   * @returns {Element}
   */
  get element() {
    return this._element;
  }
  
  /**
   * Move to next slide
   */
  next() {
    if (!this._isSliding) {
      this._slide(DIRECTION.NEXT);
    }
  }
  
  /**
   * Move to previous slide
   */
  prev() {
    if (!this._isSliding) {
      this._slide(DIRECTION.PREV);
    }
  }
  
  /**
   * Pause the carousel
   * @param {Event} [event] 
   */
  pause(event) {
    if (!event) {
      this._isPaused = true;
    }
    
    // Check for next/prev elements
    if ($(SELECTORS$2.NEXT_PREV, this._element)) {
      this._isPaused = true;
    }
    
    this._clearInterval();
  }
  
  /**
   * Start cycling the carousel
   * @param {Event} [event] 
   */
  cycle(event) {
    if (!event) {
      this._isPaused = false;
    }
    
    this._clearInterval();
    
    if (this._options.interval && !this._isPaused) {
      this._interval = setInterval(
        () => this.next(),
        this._options.interval
      );
    }
  }
  
  /**
   * Go to specific slide
   * @param {number} index 
   */
  to(index) {
    const items = this._getItems();
    const activeIndex = this._getItemIndex($(SELECTORS$2.ACTIVE_ITEM, this._element));
    
    if (index > items.length - 1 || index < 0) return;
    
    if (this._isSliding) {
      // Queue up slide after current transition
      on(this._element, EVENTS$1.SLID, () => this.to(index), { once: true });
      return;
    }
    
    if (activeIndex === index) {
      this.pause();
      this.cycle();
      return;
    }
    
    const direction = index > activeIndex ? DIRECTION.NEXT : DIRECTION.PREV;
    this._slide(direction, items[index]);
  }
  
  /**
   * Destroy carousel instance
   */
  dispose() {
    this._clearInterval();
    off(this._element, 'keydown');
    off(this._element, 'mouseenter');
    off(this._element, 'mouseleave');
    off(this._element, 'touchstart');
    off(this._element, 'touchmove');
    off(this._element, 'touchend');
    
    removeInstance(this._element, DATA_KEY$2);
    this._element = null;
    this._items = null;
    this._options = null;
    this._indicatorsElement = null;
  }
  
  // Private methods
  
  /**
   * Bind carousel events
   * @private
   */
  _bindEvents() {
    // Keyboard navigation
    if (this._options.keyboard) {
      on(this._element, 'keydown', (e) => this._keydown(e));
    }
    
    // Pause on hover
    if (this._options.pause === 'hover') {
      on(this._element, 'mouseenter', () => this.pause());
      on(this._element, 'mouseleave', () => this.cycle());
    }
    
    // Touch support
    this._addTouchEventListeners();
  }
  
  /**
   * Add touch event listeners
   * @private
   */
  _addTouchEventListeners() {
    let touchStartX = 0;
    let touchDeltaX = 0;
    
    on(this._element, 'touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    });
    
    on(this._element, 'touchmove', (e) => {
      touchDeltaX = e.touches[0].clientX - touchStartX;
    });
    
    on(this._element, 'touchend', () => {
      const absDeltaX = Math.abs(touchDeltaX);
      
      if (absDeltaX > 40) { // Minimum swipe distance
        if (touchDeltaX > 0) {
          this.prev();
        } else {
          this.next();
        }
      }
      
      touchDeltaX = 0;
    });
  }
  
  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} event 
   * @private
   */
  _keydown(event) {
    if (/input|textarea/i.test(event.target.tagName)) return;
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.prev();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.next();
        break;
    }
  }
  
  /**
   * Get carousel items
   * @returns {Element[]}
   * @private
   */
  _getItems() {
    if (!this._items) {
      this._items = $$$1(SELECTORS$2.ITEM, this._element);
    }
    return this._items;
  }
  
  /**
   * Get item index
   * @param {Element} element 
   * @returns {number}
   * @private
   */
  _getItemIndex(element) {
    return this._getItems().indexOf(element);
  }
  
  /**
   * Get next item
   * @param {string} direction 
   * @param {Element} activeElement 
   * @returns {Element}
   * @private
   */
  _getItemByDirection(direction, activeElement) {
    const isNextDirection = direction === DIRECTION.NEXT;
    const isPrevDirection = direction === DIRECTION.PREV;
    const activeIndex = this._getItemIndex(activeElement);
    const items = this._getItems();
    const lastItemIndex = items.length - 1;
    const isGoingToWrap = (isPrevDirection && activeIndex === 0) ||
                          (isNextDirection && activeIndex === lastItemIndex);
    
    if (isGoingToWrap && !this._options.wrap) {
      return activeElement;
    }
    
    const delta = direction === DIRECTION.PREV ? -1 : 1;
    const itemIndex = (activeIndex + delta) % items.length;
    
    return items[itemIndex === -1 ? items.length - 1 : itemIndex];
  }
  
  /**
   * Perform slide animation
   * @param {string} direction 
   * @param {Element} [element] 
   * @private
   */
  async _slide(direction, element) {
    const activeElement = $(SELECTORS$2.ACTIVE_ITEM, this._element);
    const activeElementIndex = this._getItemIndex(activeElement);
    const nextElement = element || (activeElement && this._getItemByDirection(direction, activeElement));
    const nextElementIndex = this._getItemIndex(nextElement);
    const isCycling = Boolean(this._interval);
    
    // Check if same element
    if (nextElement === activeElement) return;
    
    // Determine directional class names
    const isNext = direction === DIRECTION.NEXT;
    const directionalClassName = isNext ? CLASSES$2.LEFT : CLASSES$2.RIGHT;
    const orderClassName = isNext ? CLASSES$2.NEXT : CLASSES$2.PREV;
    
    // Dispatch slide event (cancelable)
    const slideEvent = this._triggerEvent(EVENTS$1.SLIDE, {
      relatedTarget: nextElement,
      direction: directionalClassName,
      from: activeElementIndex,
      to: nextElementIndex
    });
    
    if (slideEvent.defaultPrevented) return;
    
    if (!activeElement || !nextElement) return;
    
    this._isSliding = true;
    
    if (isCycling) {
      this.pause();
    }
    
    // Update indicators
    this._setActiveIndicator(nextElement);
    
    if (hasClass(this._element, CLASSES$2.SLIDE)) {
      // Animated slide
      
      // Add order class to next element
      addClass(nextElement, orderClassName);
      reflow(nextElement);
      
      // Add directional classes
      addClass(activeElement, directionalClassName);
      addClass(nextElement, directionalClassName);
      
      // Use Web Animation API for smooth transition
      try {
        await Promise.all([
          activeElement.animate([
            { transform: 'translateX(0)' },
            { transform: isNext ? 'translateX(-100%)' : 'translateX(100%)' }
          ], {
            duration: TRANSITION_DURATION,
            easing: 'ease-in-out'
          }).finished,
          nextElement.animate([
            { transform: isNext ? 'translateX(100%)' : 'translateX(-100%)' },
            { transform: 'translateX(0)' }
          ], {
            duration: TRANSITION_DURATION,
            easing: 'ease-in-out'
          }).finished
        ]);
      } catch (e) {
        // Animation cancelled
      }
      
      // Clean up classes
      removeClass(nextElement, orderClassName);
      removeClass(nextElement, directionalClassName);
      addClass(nextElement, CLASSES$2.ACTIVE);
      
      removeClass(activeElement, CLASSES$2.ACTIVE);
      removeClass(activeElement, orderClassName);
      removeClass(activeElement, directionalClassName);
    } else {
      // No animation
      removeClass(activeElement, CLASSES$2.ACTIVE);
      addClass(nextElement, CLASSES$2.ACTIVE);
    }
    
    this._isSliding = false;
    
    // Dispatch slid event
    this._triggerEvent(EVENTS$1.SLID, {
      relatedTarget: nextElement,
      direction: directionalClassName,
      from: activeElementIndex,
      to: nextElementIndex
    });
    
    if (isCycling) {
      this.cycle();
    }
  }
  
  /**
   * Set active indicator
   * @param {Element} element 
   * @private
   */
  _setActiveIndicator(element) {
    if (this._indicatorsElement) {
      const indicators = $$$1(SELECTORS$2.ACTIVE, this._indicatorsElement);
      for (const indicator of indicators) {
        removeClass(indicator, CLASSES$2.ACTIVE);
      }
      
      const nextIndicator = this._indicatorsElement.children[this._getItemIndex(element)];
      if (nextIndicator) {
        addClass(nextIndicator, CLASSES$2.ACTIVE);
      }
    }
  }
  
  /**
   * Clear interval
   * @private
   */
  _clearInterval() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }
  
  /**
   * Trigger custom event
   * @param {string} eventType 
   * @param {Object} detail 
   * @returns {CustomEvent}
   * @private
   */
  _triggerEvent(eventType, detail = {}) {
    const event = new CustomEvent(eventType, {
      bubbles: true,
      cancelable: eventType === EVENTS$1.SLIDE,
      detail
    });
    this._element.dispatchEvent(event);
    return event;
  }
  
  // Static methods
  
  /**
   * Get Carousel instance from element
   * @param {Element} element 
   * @returns {Carousel|null}
   */
  static getInstance(element) {
    return getInstance(element, DATA_KEY$2);
  }
  
  /**
   * Get or create Carousel instance
   * @param {Element} element 
   * @param {Object} options 
   * @returns {Carousel}
   */
  static getOrCreateInstance(element, options = {}) {
    return Carousel.getInstance(element) || new Carousel(element, options);
  }
  
  /**
   * Handle click on carousel controls
   * @param {Event} event 
   */
  static handleClick(event) {
    const target = event.currentTarget || event.target.closest(SELECTORS$2.DATA_SLIDE);
    if (!target) return;
    
    const slideIndex = getAttr(target, 'data-slide-to');
    const targetSelector = getAttr(target, 'data-target') || getAttr(target, 'href');
    
    if (!targetSelector) return;
    
    const carousel = $(targetSelector);
    if (!carousel) return;
    
    event.preventDefault();
    
    const instance = Carousel.getOrCreateInstance(carousel);
    
    if (slideIndex !== null) {
      instance.to(parseInt(slideIndex, 10));
    } else {
      const slideDir = getAttr(target, 'data-slide');
      if (slideDir === 'prev') {
        instance.prev();
      } else if (slideDir === 'next') {
        instance.next();
      }
    }
    
    instance.cycle();
  }
  
  /**
   * Auto-initialize carousels with data-ride
   */
  static autoInit() {
    const carousels = $$$1(SELECTORS$2.DATA_RIDE);
    for (const carousel of carousels) {
      Carousel.getOrCreateInstance(carousel);
    }
  }
  
  /**
   * Version
   */
  static get VERSION() {
    return '1.0.0';
  }
  
  /**
   * Data key
   */
  static get DATA_KEY() {
    return DATA_KEY$2;
  }
  
  /**
   * Default options
   */
  static get DEFAULTS() {
    return DEFAULTS$2;
  }
}

/**
 * Sandal Scrollspy Component
 * Modern vanilla JS implementation with Bootstrap 3 API compatibility
 * Uses Intersection Observer for efficient scroll detection
 */


// Constants
const NAME$1 = 'scrollspy';
const DATA_KEY$1 = 'bs.scrollspy';
const EVENT_KEY$1 = `.bs.${NAME$1}`;

const DEFAULTS$1 = {
  offset: 10,
  method: 'auto',
  target: ''
};

const EVENTS = {
  ACTIVATE: `activate${EVENT_KEY$1}`
};

const CLASSES$1 = {
  ACTIVE: 'active',
  DROPDOWN: 'dropdown',
  DROPDOWN_MENU: 'dropdown-menu',
  DROPDOWN_ITEM: 'dropdown-item',
  NAV_LINK: 'nav-link',
  NAV: 'nav',
  LIST_GROUP: 'list-group'
};

const SELECTORS$1 = {
  DATA_SPY: '[data-spy="scroll"]',
  ACTIVE: '.active',
  NAV_LIST: '.nav, .list-group',
  NAV_LINKS: '.nav-link',
  NAV_ITEMS: '.nav-item',
  LIST_ITEMS: '.list-group-item',
  DROPDOWN: '.dropdown',
  DROPDOWN_TOGGLE: '.dropdown-toggle'
};

/**
 * Scrollspy Class
 * Provides scrollspy functionality using Intersection Observer
 */
class Scrollspy {
  /**
   * Create a Scrollspy instance
   * @param {Element} element - The scrollable element to spy on
   * @param {Object} options - Configuration options
   */
  constructor(element, options = {}) {
    this._element = typeof element === 'string' ? $(element) : element;
    
    if (!this._element) return;
    
    // Parse options
    this._options = {
      ...DEFAULTS$1,
      ...parseDataOptions(this._element, DEFAULTS$1),
      ...options
    };
    
    // Get scroll element (body or specific element)
    this._scrollElement = this._element.tagName === 'BODY' ? window : this._element;
    
    // Get target navigation
    this._selector = this._options.target || '';
    this._offsets = [];
    this._targets = [];
    this._activeTarget = null;
    this._observer = null;
    
    // Store instance
    setInstance(this._element, DATA_KEY$1, this);
    
    // Initialize
    this.refresh();
    this._process();
  }
  
  /**
   * Get scrollspy element
   * @returns {Element}
   */
  get element() {
    return this._element;
  }
  
  /**
   * Refresh scrollspy targets
   */
  refresh() {
    // Clean up existing observer
    if (this._observer) {
      this._observer.disconnect();
    }
    
    const targetSelector = this._selector;
    if (!targetSelector) return;
    
    const nav = $(targetSelector);
    if (!nav) return;
    
    // Get all links in target navigation
    const navLinks = $$$1('a[href]', nav).filter(link => {
      const href = getAttr(link, 'href');
      return href && href.charAt(0) === '#' && href.length > 1;
    });
    
    this._targets = [];
    this._offsets = [];
    
    // Get scroll height
    this._getScrollHeight();
    
    // Build targets list
    for (const link of navLinks) {
      const href = getAttr(link, 'href');
      const target = $(href);
      
      if (target) {
        const targetBCR = target.getBoundingClientRect();
        if (targetBCR.width || targetBCR.height) {
          this._targets.push(href);
          this._offsets.push(this._getOffsetTop(target));
        }
      }
    }
    
    // Sort by offset
    const items = this._targets.map((href, i) => ({ href, offset: this._offsets[i] }));
    items.sort((a, b) => a.offset - b.offset);
    this._targets = items.map(item => item.href);
    this._offsets = items.map(item => item.offset);
    
    // Set up Intersection Observer for modern detection
    this._setupIntersectionObserver();
    
    // Also keep scroll listener as fallback
    this._setupScrollListener();
  }
  
  /**
   * Destroy scrollspy instance
   */
  dispose() {
    // Clean up observer
    if (this._observer) {
      this._observer.disconnect();
    }
    
    // Remove scroll listener
    off(this._scrollElement, 'scroll', this._scrollHandler);
    
    // Clear active state
    this._clear();
    
    removeInstance(this._element, DATA_KEY$1);
    this._element = null;
    this._scrollElement = null;
    this._options = null;
    this._targets = null;
    this._offsets = null;
  }
  
  // Private methods
  
  /**
   * Set up Intersection Observer
   * @private
   */
  _setupIntersectionObserver() {
    // Get all target elements
    const targetElements = this._targets
      .map(href => $(href))
      .filter(Boolean);
    
    if (targetElements.length === 0) return;
    
    const rootMargin = `-${this._options.offset}px 0px -${window.innerHeight - this._options.offset - 1}px 0px`;
    
    this._observer = new IntersectionObserver((entries) => {
      // Find the first intersecting entry
      const intersectingEntries = entries.filter(entry => entry.isIntersecting);
      
      if (intersectingEntries.length > 0) {
        // Get the topmost intersecting element
        const topEntry = intersectingEntries.reduce((prev, current) => {
          return (current.boundingClientRect.top < prev.boundingClientRect.top) ? current : prev;
        });
        
        const targetId = `#${topEntry.target.id}`;
        this._activate(targetId);
      }
    }, {
      root: this._element === document.body ? null : this._element,
      rootMargin,
      threshold: 0
    });
    
    // Observe all targets
    for (const target of targetElements) {
      this._observer.observe(target);
    }
  }
  
  /**
   * Set up scroll listener as fallback
   * @private
   */
  _setupScrollListener() {
    this._scrollHandler = () => {
      requestAnimationFrame(() => this._process());
    };
    
    on(this._scrollElement, 'scroll', this._scrollHandler);
  }
  
  /**
   * Process scroll position
   * @private
   */
  _process() {
    const scrollTop = this._getScrollTop() + this._options.offset;
    const scrollHeight = this._getScrollHeight();
    const maxScroll = this._options.offset + scrollHeight - this._getOffsetHeight();
    
    if (this._offsets.length === 0) return;
    
    // Check if at bottom
    if (scrollTop >= maxScroll) {
      const target = this._targets[this._targets.length - 1];
      if (this._activeTarget !== target) {
        this._activate(target);
      }
      return;
    }
    
    // Check if before first target
    if (this._activeTarget && scrollTop < this._offsets[0] && this._offsets[0] > 0) {
      this._activeTarget = null;
      this._clear();
      return;
    }
    
    // Find active target
    for (let i = this._offsets.length; i--;) {
      const isActiveTarget = this._activeTarget !== this._targets[i] &&
          scrollTop >= this._offsets[i] &&
          (typeof this._offsets[i + 1] === 'undefined' || scrollTop < this._offsets[i + 1]);
      
      if (isActiveTarget) {
        this._activate(this._targets[i]);
      }
    }
  }
  
  /**
   * Activate target
   * @param {string} target - Target selector
   * @private
   */
  _activate(target) {
    this._activeTarget = target;
    
    this._clear();
    
    // Find matching nav links
    const queries = this._selector.split(',')
      .map(sel => `${sel} a[href="${target}"], ${sel} [data-target="${target}"]`);
    
    const links = $$$1(queries.join(','));
    
    for (const link of links) {
      if (hasClass(link, CLASSES$1.DROPDOWN_ITEM)) {
        // Dropdown item
        const dropdown = closest(link, SELECTORS$1.DROPDOWN);
        if (dropdown) {
          const toggle = $(SELECTORS$1.DROPDOWN_TOGGLE, dropdown);
          if (toggle) {
            addClass(toggle, CLASSES$1.ACTIVE);
          }
        }
        addClass(link, CLASSES$1.ACTIVE);
      } else {
        // Regular nav link
        addClass(link, CLASSES$1.ACTIVE);
        
        // Activate parent items
        let parentItem = link.parentElement;
        while (parentItem) {
          if (hasClass(parentItem, CLASSES$1.NAV) || hasClass(parentItem, CLASSES$1.LIST_GROUP)) {
            // Check for parent nav-item
            const prevSibling = parentItem.previousElementSibling;
            if (prevSibling && hasClass(prevSibling, CLASSES$1.ACTIVE)) {
              addClass(prevSibling, CLASSES$1.ACTIVE);
            }
          }
          
          // Handle li elements
          if (parentItem.tagName === 'LI') {
            addClass(parentItem, CLASSES$1.ACTIVE);
          }
          
          // Handle dropdown parents
          if (hasClass(parentItem, CLASSES$1.DROPDOWN)) {
            const toggle = $(SELECTORS$1.DROPDOWN_TOGGLE, parentItem);
            if (toggle) {
              addClass(toggle, CLASSES$1.ACTIVE);
            }
          }
          
          parentItem = parentItem.parentElement;
        }
      }
    }
    
    // Dispatch activate event
    this._triggerEvent(EVENTS.ACTIVATE, { relatedTarget: target });
  }
  
  /**
   * Clear active state
   * @private
   */
  _clear() {
    const nav = $(this._selector);
    if (!nav) return;
    
    const activeLinks = $$$1(SELECTORS$1.ACTIVE, nav);
    for (const link of activeLinks) {
      removeClass(link, CLASSES$1.ACTIVE);
    }
  }
  
  /**
   * Get scroll top
   * @returns {number}
   * @private
   */
  _getScrollTop() {
    return this._scrollElement === window
      ? this._scrollElement.scrollY
      : this._scrollElement.scrollTop;
  }
  
  /**
   * Get scroll height
   * @returns {number}
   * @private
   */
  _getScrollHeight() {
    return this._scrollElement === window
      ? Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
      : this._scrollElement.scrollHeight;
  }
  
  /**
   * Get offset height
   * @returns {number}
   * @private
   */
  _getOffsetHeight() {
    return this._scrollElement === window
      ? window.innerHeight
      : this._scrollElement.getBoundingClientRect().height;
  }
  
  /**
   * Get offset top of element
   * @param {Element} element 
   * @returns {number}
   * @private
   */
  _getOffsetTop(element) {
    if (this._scrollElement === window) {
      return element.getBoundingClientRect().top + window.scrollY;
    }
    return element.offsetTop;
  }
  
  /**
   * Trigger custom event
   * @param {string} eventType 
   * @param {Object} detail 
   * @returns {CustomEvent}
   * @private
   */
  _triggerEvent(eventType, detail = {}) {
    const event = new CustomEvent(eventType, {
      bubbles: true,
      cancelable: false,
      detail
    });
    this._element.dispatchEvent(event);
    return event;
  }
  
  // Static methods
  
  /**
   * Get Scrollspy instance from element
   * @param {Element} element 
   * @returns {Scrollspy|null}
   */
  static getInstance(element) {
    return getInstance(element, DATA_KEY$1);
  }
  
  /**
   * Get or create Scrollspy instance
   * @param {Element} element 
   * @param {Object} options 
   * @returns {Scrollspy}
   */
  static getOrCreateInstance(element, options = {}) {
    return Scrollspy.getInstance(element) || new Scrollspy(element, options);
  }
  
  /**
   * Auto-initialize scrollspy elements
   */
  static autoInit() {
    const spyElements = $$$1(SELECTORS$1.DATA_SPY);
    for (const element of spyElements) {
      Scrollspy.getOrCreateInstance(element);
    }
  }
  
  /**
   * Version
   */
  static get VERSION() {
    return '1.0.0';
  }
  
  /**
   * Data key
   */
  static get DATA_KEY() {
    return DATA_KEY$1;
  }
  
  /**
   * Default options
   */
  static get DEFAULTS() {
    return DEFAULTS$1;
  }
}

/**
 * Sandal Affix Component
 * Modern vanilla JS implementation with Bootstrap 3 API compatibility
 * Uses Intersection Observer for efficient scroll detection
 * Note: Bootstrap 4+ deprecated affix in favor of CSS position:sticky
 */


// Constants
const NAME = 'affix';
const DATA_KEY = 'bs.affix';
const EVENT_KEY = `.bs.${NAME}`;

const DEFAULTS = {
  offset: 0,
  target: window
};

const CLASSES = {
  AFFIX: 'affix',
  AFFIX_TOP: 'affix-top',
  AFFIX_BOTTOM: 'affix-bottom'
};

const SELECTORS = {
  DATA_SPY: '[data-spy="affix"]'
};

/**
 * Affix Class
 * Provides affix (sticky) positioning functionality
 */
class Affix {
  /**
   * Create an Affix instance
   * @param {Element} element - The element to affix
   * @param {Object} options - Configuration options
   */
  constructor(element, options = {}) {
    this._element = typeof element === 'string' ? $(element) : element;
    
    if (!this._element) return;
    
    // Parse options
    this._options = {
      ...DEFAULTS,
      ...this._parseOffsetOption(options),
      ...parseDataOptions(this._element, DEFAULTS)
    };
    
    // Get target scroll element
    this._target = this._getTarget();
    this._affixed = null;
    this._unpin = null;
    this._pinnedOffset = null;
    this._observer = null;
    this._scrollHandler = null;
    
    // Store instance
    setInstance(this._element, DATA_KEY, this);
    
    // Initialize
    this._checkPosition();
    this._setupListeners();
  }
  
  /**
   * Get affix element
   * @returns {Element}
   */
  get element() {
    return this._element;
  }
  
  /**
   * Get affix state
   * @returns {string|null}
   */
  get state() {
    return this._affixed;
  }
  
  /**
   * Check and update position
   */
  checkPosition() {
    this._checkPosition();
  }
  
  /**
   * Check and update position with resize
   */
  checkPositionWithEventLoop() {
    requestAnimationFrame(() => this._checkPosition());
  }
  
  /**
   * Destroy affix instance
   */
  dispose() {
    // Clean up observer
    if (this._observer) {
      this._observer.disconnect();
    }
    
    // Remove scroll listener
    if (this._scrollHandler) {
      off(this._target, 'scroll', this._scrollHandler);
    }
    
    // Remove resize listener
    off(window, 'resize', this._resizeHandler);
    
    // Remove classes
    removeClass(this._element, CLASSES.AFFIX);
    removeClass(this._element, CLASSES.AFFIX_TOP);
    removeClass(this._element, CLASSES.AFFIX_BOTTOM);
    
    removeInstance(this._element, DATA_KEY);
    this._element = null;
    this._options = null;
    this._target = null;
  }
  
  // Private methods
  
  /**
   * Parse offset option
   * @param {Object} options 
   * @returns {Object}
   * @private
   */
  _parseOffsetOption(options) {
    if (options.offset !== undefined) {
      const offset = options.offset;
      
      if (typeof offset === 'number') {
        return {
          offset: {
            top: offset,
            bottom: offset
          }
        };
      }
      
      if (typeof offset === 'object') {
        return { offset };
      }
    }
    
    return {};
  }
  
  /**
   * Get target scroll element
   * @returns {Window|Element}
   * @private
   */
  _getTarget() {
    const target = this._options.target;
    
    if (target === window || !target) return window;
    
    if (typeof target === 'string') {
      return $(target) || window;
    }
    
    return target;
  }
  
  /**
   * Set up scroll and resize listeners
   * @private
   */
  _setupListeners() {
    // Scroll listener
    this._scrollHandler = () => {
      requestAnimationFrame(() => this._checkPosition());
    };
    on(this._target, 'scroll', this._scrollHandler);
    
    // Resize listener
    this._resizeHandler = () => {
      requestAnimationFrame(() => this._checkPosition());
    };
    on(window, 'resize', this._resizeHandler);
    
    // Try to use Intersection Observer for top/bottom detection
    this._setupIntersectionObserver();
  }
  
  /**
   * Set up Intersection Observer for boundary detection
   * @private
   */
  _setupIntersectionObserver() {
    // Create sentinels for top and bottom boundaries
    const offset = this._getOffset();
    
    if (!offset.top && !offset.bottom) return;
    
    // This is a supplementary observer for more efficient detection
    // The main position checking is still done via scroll events for accuracy
  }
  
  /**
   * Get offset values
   * @returns {{top: number, bottom: number}}
   * @private
   */
  _getOffset() {
    const offset = this._options.offset;
    
    if (typeof offset === 'function') {
      return offset.call(this, this._element);
    }
    
    if (typeof offset === 'object') {
      return {
        top: typeof offset.top === 'function' ? offset.top.call(this, this._element) : (offset.top || 0),
        bottom: typeof offset.bottom === 'function' ? offset.bottom.call(this, this._element) : (offset.bottom || 0)
      };
    }
    
    return {
      top: Number(offset) || 0,
      bottom: Number(offset) || 0
    };
  }
  
  /**
   * Get scroll position
   * @returns {number}
   * @private
   */
  _getScrollTop() {
    return this._target === window
      ? window.scrollY || document.documentElement.scrollTop
      : this._target.scrollTop;
  }
  
  /**
   * Get scroll height
   * @returns {number}
   * @private
   */
  _getScrollHeight() {
    return this._target === window
      ? Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
      : this._target.scrollHeight;
  }
  
  /**
   * Check and update position
   * @private
   */
  _checkPosition() {
    if (!this._element || getComputedStyle(this._element).display === 'none') {
      return;
    }
    
    const scrollTop = this._getScrollTop();
    const scrollHeight = this._getScrollHeight();
    const offset = this._getOffset();
    const position = this._element.getBoundingClientRect();
    const targetHeight = this._target === window
      ? window.innerHeight
      : this._target.getBoundingClientRect().height;
    
    let affix = null;
    
    // Check for unpin
    if (this._unpin !== null && scrollTop + this._unpin <= position.top) {
      affix = false;
    }
    // Check for bottom offset
    else if (offset.bottom !== undefined && offset.bottom !== null) {
      const offsetBottom = typeof offset.bottom === 'function'
        ? offset.bottom.call(this, this._element)
        : offset.bottom;
      
      if (scrollTop + targetHeight >= scrollHeight - offsetBottom) {
        affix = 'bottom';
      }
    }
    // Check for top offset
    else if (offset.top !== undefined && offset.top !== null) {
      const offsetTop = typeof offset.top === 'function'
        ? offset.top.call(this, this._element)
        : offset.top;
      
      if (scrollTop <= offsetTop) {
        affix = 'top';
      }
    }
    
    // Determine if we should be affixed
    if (affix === null) {
      const offsetTop = typeof offset.top === 'function'
        ? offset.top.call(this, this._element)
        : (offset.top || 0);
      
      affix = scrollTop >= offsetTop;
    }
    
    // No change needed
    if (this._affixed === affix) return;
    
    // Handle unpin
    if (this._unpin !== null) {
      this._element.style.top = '';
    }
    
    const affixType = affix === 'bottom' ? 'bottom' : (affix === 'top' ? 'top' : '');
    const eventPrefix = affix ? `affix${affixType ? `-${affixType}` : ''}` : 'affix';
    
    // Dispatch affix event (cancelable)
    const affixEvent = this._triggerEvent(`${eventPrefix}${EVENT_KEY}`);
    if (affixEvent.defaultPrevented) return;
    
    this._affixed = affix;
    this._unpin = affix === 'bottom' ? this._getPinnedOffset() : null;
    
    // Update classes
    removeClass(this._element, CLASSES.AFFIX);
    removeClass(this._element, CLASSES.AFFIX_TOP);
    removeClass(this._element, CLASSES.AFFIX_BOTTOM);
    
    if (affix === 'bottom') {
      addClass(this._element, CLASSES.AFFIX_BOTTOM);
    } else if (affix === 'top') {
      addClass(this._element, CLASSES.AFFIX_TOP);
    } else if (affix) {
      addClass(this._element, CLASSES.AFFIX);
    }
    
    // Handle bottom positioning
    if (affix === 'bottom') {
      this._element.style.position = 'absolute';
      this._element.style.top = `${scrollHeight - this._element.offsetHeight - offset.bottom}px`;
    } else {
      this._element.style.position = '';
      this._element.style.top = '';
    }
    
    // Dispatch affixed event
    const affixedEventPrefix = affix ? `affixed${affixType ? `-${affixType}` : ''}` : 'affixed';
    this._triggerEvent(`${affixedEventPrefix}${EVENT_KEY}`);
  }
  
  /**
   * Get pinned offset
   * @returns {number}
   * @private
   */
  _getPinnedOffset() {
    if (this._pinnedOffset) return this._pinnedOffset;
    
    this._element.classList.remove(CLASSES.AFFIX_TOP, CLASSES.AFFIX_BOTTOM);
    this._element.classList.add(CLASSES.AFFIX);
    
    const scrollTop = this._getScrollTop();
    const position = this._element.getBoundingClientRect();
    
    this._pinnedOffset = scrollTop - position.top;
    return this._pinnedOffset;
  }
  
  /**
   * Trigger custom event
   * @param {string} eventType 
   * @returns {CustomEvent}
   * @private
   */
  _triggerEvent(eventType) {
    const event = new CustomEvent(eventType, {
      bubbles: true,
      cancelable: eventType.includes('affix') && !eventType.includes('affixed')
    });
    this._element.dispatchEvent(event);
    return event;
  }
  
  // Static methods
  
  /**
   * Get Affix instance from element
   * @param {Element} element 
   * @returns {Affix|null}
   */
  static getInstance(element) {
    return getInstance(element, DATA_KEY);
  }
  
  /**
   * Get or create Affix instance
   * @param {Element} element 
   * @param {Object} options 
   * @returns {Affix}
   */
  static getOrCreateInstance(element, options = {}) {
    return Affix.getInstance(element) || new Affix(element, options);
  }
  
  /**
   * Auto-initialize affix elements
   */
  static autoInit() {
    const affixElements = $$(SELECTORS.DATA_SPY);
    for (const element of affixElements) {
      Affix.getOrCreateInstance(element);
    }
  }
  
  /**
   * Version
   */
  static get VERSION() {
    return '1.0.0';
  }
  
  /**
   * Data key
   */
  static get DATA_KEY() {
    return DATA_KEY;
  }
  
  /**
   * Default options
   */
  static get DEFAULTS() {
    return DEFAULTS;
  }
}

/**
 * SandalJS - Modern Bootstrap 3 API-compatible library
 * @class
 */
class Sandal {
  constructor() {
    this.version = '1.0.0';
    this._components = new Map();
  }

  /**
   * Initialize a modal component
   * @param {HTMLElement|string} element - Modal element or selector
   * @param {Object} options - Modal options
   * @returns {Modal} Modal instance
   */
  modal(element, options = {}) {
    return new Modal(element, options);
  }

  /**
   * Initialize a dropdown component
   * @param {HTMLElement|string} element - Dropdown element or selector
   * @param {Object} options - Dropdown options
   * @returns {Dropdown} Dropdown instance
   */
  dropdown(element, options = {}) {
    return new Dropdown(element, options);
  }

  /**
   * Initialize a tooltip component
   * @param {HTMLElement|string} element - Tooltip element or selector
   * @param {Object} options - Tooltip options
   * @returns {Tooltip} Tooltip instance
   */
  tooltip(element, options = {}) {
    return new Tooltip(element, options);
  }

  /**
   * Initialize a popover component
   * @param {HTMLElement|string} element - Popover element or selector
   * @param {Object} options - Popover options
   * @returns {Popover} Popover instance
   */
  popover(element, options = {}) {
    return new Popover(element, options);
  }

  /**
   * Initialize a tab component
   * @param {HTMLElement|string} element - Tab element or selector
   * @param {Object} options - Tab options
   * @returns {Tab} Tab instance
   */
  tab(element, options = {}) {
    return new Tab(element, options);
  }

  /**
   * Initialize a collapse component
   * @param {HTMLElement|string} element - Collapse element or selector
   * @param {Object} options - Collapse options
   * @returns {Collapse} Collapse instance
   */
  collapse(element, options = {}) {
    return new Collapse(element, options);
  }

  /**
   * Initialize an alert component
   * @param {HTMLElement|string} element - Alert element or selector
   * @param {Object} options - Alert options
   * @returns {Alert} Alert instance
   */
  alert(element, options = {}) {
    return new Alert(element, options);
  }

  /**
   * Initialize a button component
   * @param {HTMLElement|string} element - Button element or selector
   * @param {Object} options - Button options
   * @returns {Button} Button instance
   */
  button(element, options = {}) {
    return new Button(element, options);
  }

  /**
   * Initialize a carousel component
   * @param {HTMLElement|string} element - Carousel element or selector
   * @param {Object} options - Carousel options
   * @returns {Carousel} Carousel instance
   */
  carousel(element, options = {}) {
    return new Carousel(element, options);
  }

  /**
   * Initialize a scrollspy component
   * @param {HTMLElement|string} element - Scrollspy element or selector
   * @param {Object} options - Scrollspy options
   * @returns {Scrollspy} Scrollspy instance
   */
  scrollspy(element, options = {}) {
    return new Scrollspy(element, options);
  }

  /**
   * Initialize an affix component
   * @param {HTMLElement|string} element - Affix element or selector
   * @param {Object} options - Affix options
   * @returns {Affix} Affix instance
   */
  affix(element, options = {}) {
    return new Affix(element, options);
  }

  /**
   * Initialize component by name (for programmatic use)
   * @param {string} componentName - Name of the component
   * @param {HTMLElement|string} element - Element or selector
   * @param {Object} options - Component options
   * @returns {Object|null} Component instance or null if not found
   */
  static initComponent(componentName, element, options = {}) {
    const ComponentClass = {
      modal: Modal,
      dropdown: Dropdown,
      tooltip: Tooltip,
      popover: Popover,
      tab: Tab,
      collapse: Collapse,
      alert: Alert,
      button: Button,
      carousel: Carousel,
      scrollspy: Scrollspy,
      affix: Affix
    }[componentName];

    if (ComponentClass) {
      return new ComponentClass(element, options);
    }
    return null;
  }

  /**
   * Get all active components
   * @returns {Map} Map of active components
   */
  getComponents() {
    return this._components;
  }

  /**
   * Destroy all components
   */
  destroy() {
    for (const [key, component] of this._components) {
      if (typeof component.destroy === 'function') {
        component.destroy();
      }
    }
    this._components.clear();
  }
}

// jQuery/presideJQuery compatibility layer
// Preside uses presideJQuery instead of jQuery
(function() {
  // Get the jQuery reference - check for presideJQuery first (Preside), then jQuery
  const $ = (typeof window !== 'undefined' && window.presideJQuery) ||
            (typeof window !== 'undefined' && window.jQuery) ||
            (typeof jQuery !== 'undefined' && jQuery);
  
  if (!$) {
    // No jQuery available, skip plugin registration
    if (typeof window !== 'undefined') {
      window.Sandal = Sandal;
    }
    return;
  }

  // Add transition support detection (Bootstrap 3 requirement)
  function transitionEnd() {
    const el = document.createElement('bootstrap');
    const transEndEventNames = {
      'WebkitTransition': 'webkitTransitionEnd',
      'MozTransition': 'transitionend',
      'OTransition': 'oTransitionEnd otransitionend',
      'transition': 'transitionend'
    };

    for (const name in transEndEventNames) {
      if (el.style[name] !== undefined) {
        return { end: transEndEventNames[name] };
      }
    }
    return false;
  }

  // Add $.support.transition
  $(function() {
    $.support.transition = transitionEnd();
  });

  // Add $.fn.emulateTransitionEnd
  $.fn.emulateTransitionEnd = function(duration) {
    let called = false;
    const $el = this;
    $(this).one($.support.transition.end, function() { called = true; });
    const callback = function() { if (!called) $($el).trigger($.support.transition.end); };
    setTimeout(callback, duration);
    return this;
  };

  // Store old plugin references for noConflict
  const old = {
    modal: $.fn.modal,
    dropdown: $.fn.dropdown,
    tooltip: $.fn.tooltip,
    popover: $.fn.popover,
    tab: $.fn.tab,
    collapse: $.fn.collapse,
    alert: $.fn.alert,
    button: $.fn.button,
    carousel: $.fn.carousel,
    scrollspy: $.fn.scrollspy,
    affix: $.fn.affix
  };

  // Modal plugin
  $.fn.modal = function(option, _relatedTarget) {
    return this.each(function() {
      const $this = $(this);
      let data = $this.data('bs.modal');
      const options = $.extend({}, Modal.DEFAULTS || {}, $this.data(), typeof option === 'object' && option);

      if (!data) $this.data('bs.modal', (data = new Modal(this, options)));
      if (typeof option === 'string') data[option](_relatedTarget);
      else if (options.show) data.show(_relatedTarget);
    });
  };
  $.fn.modal.Constructor = Modal;
  $.fn.modal.noConflict = function() { $.fn.modal = old.modal; return this; };

  // Dropdown plugin
  $.fn.dropdown = function(option) {
    return this.each(function() {
      const $this = $(this);
      let data = $this.data('bs.dropdown');

      if (!data) $this.data('bs.dropdown', (data = new Dropdown(this)));
      if (typeof option === 'string') data[option]();
    });
  };
  $.fn.dropdown.Constructor = Dropdown;
  $.fn.dropdown.noConflict = function() { $.fn.dropdown = old.dropdown; return this; };

  // Tooltip plugin
  $.fn.tooltip = function(option) {
    return this.each(function() {
      const $this = $(this);
      let data = $this.data('bs.tooltip');
      const options = typeof option === 'object' && option;

      if (!data) $this.data('bs.tooltip', (data = new Tooltip(this, options)));
      if (typeof option === 'string') data[option]();
    });
  };
  $.fn.tooltip.Constructor = Tooltip;
  $.fn.tooltip.noConflict = function() { $.fn.tooltip = old.tooltip; return this; };

  // Popover plugin
  $.fn.popover = function(option) {
    return this.each(function() {
      const $this = $(this);
      let data = $this.data('bs.popover');
      const options = typeof option === 'object' && option;

      if (!data) {
        $this.data('bs.popover', (data = new Popover(this, options)));
      }
      if (typeof option === 'string') {
        data[option]();
      }
    });
  };
  $.fn.popover.Constructor = Popover;
  $.fn.popover.noConflict = function() { $.fn.popover = old.popover; return this; };

  // Tab plugin
  $.fn.tab = function(option) {
    return this.each(function() {
      const $this = $(this);
      let data = $this.data('bs.tab');

      if (!data) $this.data('bs.tab', (data = new Tab(this)));
      if (typeof option === 'string') data[option]();
    });
  };
  $.fn.tab.Constructor = Tab;
  $.fn.tab.noConflict = function() { $.fn.tab = old.tab; return this; };

  // Collapse plugin
  $.fn.collapse = function(option) {
    return this.each(function() {
      const $this = $(this);
      let data = $this.data('bs.collapse');
      const options = $.extend({}, Collapse.DEFAULTS || {}, $this.data(), typeof option === 'object' && option);

      if (!data) $this.data('bs.collapse', (data = new Collapse(this, options)));
      if (typeof option === 'string') data[option]();
    });
  };
  $.fn.collapse.Constructor = Collapse;
  $.fn.collapse.noConflict = function() { $.fn.collapse = old.collapse; return this; };

  // Alert plugin
  $.fn.alert = function(option) {
    return this.each(function() {
      const $this = $(this);
      let data = $this.data('bs.alert');

      if (!data) $this.data('bs.alert', (data = new Alert(this)));
      if (typeof option === 'string') data[option]();
    });
  };
  $.fn.alert.Constructor = Alert;
  $.fn.alert.noConflict = function() { $.fn.alert = old.alert; return this; };

  // Button plugin
  $.fn.button = function(option) {
    return this.each(function() {
      const $this = $(this);
      let data = $this.data('bs.button');
      const options = typeof option === 'object' && option;

      if (!data) $this.data('bs.button', (data = new Button(this, options)));
      if (option === 'toggle') data.toggle();
      else if (option) data.setState(option);
    });
  };
  $.fn.button.Constructor = Button;
  $.fn.button.noConflict = function() { $.fn.button = old.button; return this; };

  // Carousel plugin
  $.fn.carousel = function(option) {
    return this.each(function() {
      const $this = $(this);
      let data = $this.data('bs.carousel');
      const options = $.extend({}, Carousel.DEFAULTS || {}, $this.data(), typeof option === 'object' && option);
      const action = typeof option === 'string' ? option : options.slide;

      if (!data) $this.data('bs.carousel', (data = new Carousel(this, options)));
      if (typeof option === 'number') data.to(option);
      else if (action) data[action]();
      else if (options.interval) data.pause().cycle();
    });
  };
  $.fn.carousel.Constructor = Carousel;
  $.fn.carousel.noConflict = function() { $.fn.carousel = old.carousel; return this; };

  // Scrollspy plugin
  $.fn.scrollspy = function(option) {
    return this.each(function() {
      const $this = $(this);
      let data = $this.data('bs.scrollspy');
      const options = typeof option === 'object' && option;

      if (!data) $this.data('bs.scrollspy', (data = new Scrollspy(this, options)));
      if (typeof option === 'string') data[option]();
    });
  };
  $.fn.scrollspy.Constructor = Scrollspy;
  $.fn.scrollspy.noConflict = function() { $.fn.scrollspy = old.scrollspy; return this; };

  // Affix plugin
  $.fn.affix = function(option) {
    return this.each(function() {
      const $this = $(this);
      let data = $this.data('bs.affix');
      const options = typeof option === 'object' && option;

      if (!data) $this.data('bs.affix', (data = new Affix(this, options)));
      if (typeof option === 'string') data[option]();
    });
  };
  $.fn.affix.Constructor = Affix;
  $.fn.affix.noConflict = function() { $.fn.affix = old.affix; return this; };

  // ===========================================
  // DATA-API (automatic initialization via data attributes)
  // ===========================================

  // Tab data-api (Preside uses .presidecms namespace and $= ends-with selector)
  $(document).on('click.bs.tab.data-api', '.presidecms [data-toggle$="tab"], .presidecms [data-toggle$="pill"]', function(e) {
    e.preventDefault();
    $(this).tab('show');
  });

  // Modal data-api (Preside uses .presidecms namespace and $= ends-with selector)
  $(document).on('click.bs.modal.data-api', '.presidecms [data-toggle$="modal"]', function(e) {
    const $this = $(this);
    const href = $this.attr('href');
    const $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, '')));
    const option = $target.data('bs.modal') ? 'toggle' : $.extend({ remote: !/#/.test(href) && href }, $target.data(), $this.data());

    if ($this.is('a')) e.preventDefault();

    $target.modal(option, this);
  });

  // Dropdown data-api (Preside uses .presidecms namespace and $= ends-with selector)
  $(document).on('click.bs.dropdown.data-api', '.presidecms [data-toggle$=dropdown]', function(e) {
    e.preventDefault();
    e.stopPropagation();
    $(this).dropdown('toggle');
  });

  // Collapse data-api (Preside uses .presidecms namespace and $= ends-with selector)
  $(document).on('click.bs.collapse.data-api', '.presidecms [data-toggle$=collapse]', function(e) {
    const $this = $(this);
    let href;
    const target = $this.attr('data-target')
      || e.preventDefault()
      || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '');
    const $target = $(target);
    const data = $target.data('bs.collapse');
    const option = data ? 'toggle' : $this.data();

    $target.collapse(option);
  });

  // Alert data-api (Preside uses .presidecms namespace)
  $(document).on('click.bs.alert.data-api', '.presidecms [data-dismiss="alert"]', function(e) {
    $(this).closest('.alert').alert('close');
    e.preventDefault();
  });

  // Button data-api (Preside uses .presidecms namespace)
  $(document).on('click.bs.button.data-api', '.presidecms [data-toggle^=button]', function(e) {
    let $btn = $(e.target);
    if (!$btn.hasClass('btn')) $btn = $btn.closest('.btn');
    $btn.button('toggle');
    e.preventDefault();
  });

  // Global export
  if (typeof window !== 'undefined') {
    window.Sandal = Sandal;
  }
})();

export { Sandal as default };
//# sourceMappingURL=sandal.esm.js.map
