/**
 * Sandal Carousel Component
 * Modern vanilla JS implementation with Bootstrap 3 API compatibility
 * Uses Web Animation API for smooth transitions
 */

import {
  $, $$, closest, hasClass, addClass, removeClass, toggleClass,
  getAttr, setAttr, data as getData, children, find,
  on, off, trigger,
  reflow,
  setInstance, getInstance, removeInstance,
  parseDataOptions
} from '../utils/index.js';

// Constants
const NAME = 'carousel';
const DATA_KEY = 'bs.carousel';
const EVENT_KEY = `.bs.${NAME}`;

const DEFAULTS = {
  interval: 5000,
  pause: 'hover',
  wrap: true,
  keyboard: true
};

const EVENTS = {
  SLIDE: `slide${EVENT_KEY}`,
  SLID: `slid${EVENT_KEY}`
};

const CLASSES = {
  CAROUSEL: 'carousel',
  ACTIVE: 'active',
  SLIDE: 'slide',
  RIGHT: 'right',
  LEFT: 'left',
  NEXT: 'next',
  PREV: 'prev',
  ITEM: 'item'
};

const SELECTORS = {
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
      ...DEFAULTS,
      ...parseDataOptions(this._element, DEFAULTS),
      ...options
    };
    
    // Get indicators
    this._indicatorsElement = $(SELECTORS.INDICATORS, this._element);
    
    // Bind events
    this._bindEvents();
    
    // Store instance
    setInstance(this._element, DATA_KEY, this);
    
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
    if ($(SELECTORS.NEXT_PREV, this._element)) {
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
    const activeIndex = this._getItemIndex($(SELECTORS.ACTIVE_ITEM, this._element));
    
    if (index > items.length - 1 || index < 0) return;
    
    if (this._isSliding) {
      // Queue up slide after current transition
      on(this._element, EVENTS.SLID, () => this.to(index), { once: true });
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
    
    removeInstance(this._element, DATA_KEY);
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
      this._items = $$(SELECTORS.ITEM, this._element);
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
    const activeElement = $(SELECTORS.ACTIVE_ITEM, this._element);
    const activeElementIndex = this._getItemIndex(activeElement);
    const nextElement = element || (activeElement && this._getItemByDirection(direction, activeElement));
    const nextElementIndex = this._getItemIndex(nextElement);
    const isCycling = Boolean(this._interval);
    
    // Check if same element
    if (nextElement === activeElement) return;
    
    // Determine directional class names
    const isNext = direction === DIRECTION.NEXT;
    const directionalClassName = isNext ? CLASSES.LEFT : CLASSES.RIGHT;
    const orderClassName = isNext ? CLASSES.NEXT : CLASSES.PREV;
    
    // Dispatch slide event (cancelable)
    const slideEvent = this._triggerEvent(EVENTS.SLIDE, {
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
    
    if (hasClass(this._element, CLASSES.SLIDE)) {
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
      addClass(nextElement, CLASSES.ACTIVE);
      
      removeClass(activeElement, CLASSES.ACTIVE);
      removeClass(activeElement, orderClassName);
      removeClass(activeElement, directionalClassName);
    } else {
      // No animation
      removeClass(activeElement, CLASSES.ACTIVE);
      addClass(nextElement, CLASSES.ACTIVE);
    }
    
    this._isSliding = false;
    
    // Dispatch slid event
    this._triggerEvent(EVENTS.SLID, {
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
      const indicators = $$(SELECTORS.ACTIVE, this._indicatorsElement);
      for (const indicator of indicators) {
        removeClass(indicator, CLASSES.ACTIVE);
      }
      
      const nextIndicator = this._indicatorsElement.children[this._getItemIndex(element)];
      if (nextIndicator) {
        addClass(nextIndicator, CLASSES.ACTIVE);
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
      cancelable: eventType === EVENTS.SLIDE,
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
    return getInstance(element, DATA_KEY);
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
    const target = event.currentTarget || event.target.closest(SELECTORS.DATA_SLIDE);
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
    const carousels = $$(SELECTORS.DATA_RIDE);
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
    return DATA_KEY;
  }
  
  /**
   * Default options
   */
  static get DEFAULTS() {
    return DEFAULTS;
  }
}

export default Carousel;
export { Carousel, EVENTS as CarouselEvents, CLASSES as CarouselClasses, SELECTORS as CarouselSelectors };