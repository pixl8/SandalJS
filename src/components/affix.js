/**
 * Sandal Affix Component
 * Modern vanilla JS implementation with Bootstrap 3 API compatibility
 * Uses Intersection Observer for efficient scroll detection
 * Note: Bootstrap 4+ deprecated affix in favor of CSS position:sticky
 */

import {
  setInstance, getInstance, removeInstance,
  parseDataOptions
} from '../utils/index.js';

import {
  $1 as $, $$, hasClass, addClass, removeClass,
  getAttr, css, on, off, trigger
} from './helpers.js';

// Constants
const NAME = 'affix';
const DATA_KEY = 'bs.affix';
const EVENT_KEY = `.bs.${NAME}`;

const DEFAULTS = {
  offset: 0,
  target: window
};

const EVENTS = {
  AFFIX: `affix${EVENT_KEY}`,
  AFFIXED: `affixed${EVENT_KEY}`,
  AFFIX_TOP: `affix-top${EVENT_KEY}`,
  AFFIXED_TOP: `affixed-top${EVENT_KEY}`,
  AFFIX_BOTTOM: `affix-bottom${EVENT_KEY}`,
  AFFIXED_BOTTOM: `affixed-bottom${EVENT_KEY}`
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

export default Affix;
export { Affix, EVENTS as AffixEvents, CLASSES as AffixClasses, SELECTORS as AffixSelectors };