/**
 * Sandal Scrollspy Component
 * Modern vanilla JS implementation with Bootstrap 3 API compatibility
 * Uses Intersection Observer for efficient scroll detection
 */

import {
  $, $$, closest, hasClass, addClass, removeClass,
  getAttr, setAttr, parent,
  on, off, trigger,
  setInstance, getInstance, removeInstance,
  parseDataOptions
} from '../utils/index.js';

// Constants
const NAME = 'scrollspy';
const DATA_KEY = 'bs.scrollspy';
const EVENT_KEY = `.bs.${NAME}`;

const DEFAULTS = {
  offset: 10,
  method: 'auto',
  target: ''
};

const EVENTS = {
  ACTIVATE: `activate${EVENT_KEY}`
};

const CLASSES = {
  ACTIVE: 'active',
  DROPDOWN: 'dropdown',
  DROPDOWN_MENU: 'dropdown-menu',
  DROPDOWN_ITEM: 'dropdown-item',
  NAV_LINK: 'nav-link',
  NAV: 'nav',
  LIST_GROUP: 'list-group'
};

const SELECTORS = {
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
      ...DEFAULTS,
      ...parseDataOptions(this._element, DEFAULTS),
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
    setInstance(this._element, DATA_KEY, this);
    
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
    const navLinks = $$('a[href]', nav).filter(link => {
      const href = getAttr(link, 'href');
      return href && href.charAt(0) === '#' && href.length > 1;
    });
    
    this._targets = [];
    this._offsets = [];
    
    // Get scroll height
    const scrollHeight = this._getScrollHeight();
    
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
    
    removeInstance(this._element, DATA_KEY);
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
    
    const links = $$(queries.join(','));
    
    for (const link of links) {
      if (hasClass(link, CLASSES.DROPDOWN_ITEM)) {
        // Dropdown item
        const dropdown = closest(link, SELECTORS.DROPDOWN);
        if (dropdown) {
          const toggle = $(SELECTORS.DROPDOWN_TOGGLE, dropdown);
          if (toggle) {
            addClass(toggle, CLASSES.ACTIVE);
          }
        }
        addClass(link, CLASSES.ACTIVE);
      } else {
        // Regular nav link
        addClass(link, CLASSES.ACTIVE);
        
        // Activate parent items
        let parentItem = link.parentElement;
        while (parentItem) {
          if (hasClass(parentItem, CLASSES.NAV) || hasClass(parentItem, CLASSES.LIST_GROUP)) {
            // Check for parent nav-item
            const prevSibling = parentItem.previousElementSibling;
            if (prevSibling && hasClass(prevSibling, CLASSES.ACTIVE)) {
              addClass(prevSibling, CLASSES.ACTIVE);
            }
          }
          
          // Handle li elements
          if (parentItem.tagName === 'LI') {
            addClass(parentItem, CLASSES.ACTIVE);
          }
          
          // Handle dropdown parents
          if (hasClass(parentItem, CLASSES.DROPDOWN)) {
            const toggle = $(SELECTORS.DROPDOWN_TOGGLE, parentItem);
            if (toggle) {
              addClass(toggle, CLASSES.ACTIVE);
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
    
    const activeLinks = $$(SELECTORS.ACTIVE, nav);
    for (const link of activeLinks) {
      removeClass(link, CLASSES.ACTIVE);
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
    return getInstance(element, DATA_KEY);
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
    const spyElements = $$(SELECTORS.DATA_SPY);
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
    return DATA_KEY;
  }
  
  /**
   * Default options
   */
  static get DEFAULTS() {
    return DEFAULTS;
  }
}

export default Scrollspy;
export { Scrollspy, EVENTS as ScrollspyEvents, CLASSES as ScrollspyClasses, SELECTORS as ScrollspySelectors };