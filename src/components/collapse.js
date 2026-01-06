/**
 * Sandal Collapse Component
 * Modern vanilla JS implementation with Bootstrap 3 API compatibility
 * Uses Web Animation API for smooth animations
 */

import $ from 'jqnext';
import {
  setInstance, getInstance, removeInstance,
  parseDataOptions
} from '../utils/index.js';

import {
  $1 as $1Helper, $$, closest, hasClass, addClass, removeClass,
  getAttr, setAttr, data as getData, trigger, reflow
} from './helpers.js';

// Constants
const NAME = 'collapse';
const DATA_KEY = 'bs.collapse';
const EVENT_KEY = `.bs.${NAME}`;

const DEFAULTS = {
  toggle: true,
  parent: null
};

const EVENTS = {
  SHOW: `show${EVENT_KEY}`,
  SHOWN: `shown${EVENT_KEY}`,
  HIDE: `hide${EVENT_KEY}`,
  HIDDEN: `hidden${EVENT_KEY}`
};

const CLASSES = {
  COLLAPSE: 'collapse',
  COLLAPSING: 'collapsing',
  COLLAPSED: 'collapsed',
  IN: 'in',
  SHOW: 'show'
};

const SELECTORS = {
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
    this.$element = $(element);
    this._element = this.$element[0];
    
    if (!this._element) return;
    
    // Parse options from data attributes
    this._options = {
      ...DEFAULTS,
      ...parseDataOptions(this._element, DEFAULTS),
      ...options
    };
    
    this._isTransitioning = false;
    this._triggerArray = [];
    
    // Find all triggers for this collapse
    const toggleList = $$(SELECTORS.DATA_TOGGLE);
    for (const toggle of toggleList) {
      const selector = getAttr(toggle, 'data-target') || getAttr(toggle, 'href');
      if (selector) {
        const filterElement = $$(selector).filter(el => el === this._element);
        if (filterElement.length > 0) {
          this._triggerArray.push(toggle);
        }
      }
    }
    
    // Get parent element for accordion behavior
    this._parent = this._getParent();
    
    // Store instance
    setInstance(this._element, DATA_KEY, this);
    
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
    if (hasClass(this._element, CLASSES.IN)) {
      this.hide();
    } else {
      this.show();
    }
  }
  
  /**
   * Show the collapse
   */
  async show() {
    if (this._isTransitioning || hasClass(this._element, CLASSES.IN)) {
      return;
    }
    
    let actives = null;
    let activesData = null;
    
    // Accordion behavior - close other panels
    if (this._parent) {
      actives = $$(SELECTORS.ACTIVES, this._parent).filter(elem => {
        if (this._options.parent) {
          return closest(elem, this._options.parent) === this._parent;
        }
        return hasClass(elem, CLASSES.COLLAPSE);
      });
      
      if (actives.length === 0) {
        actives = null;
      }
    }
    
    // Check if target is already transitioning
    if (actives) {
      activesData = actives.map(elem => getInstance(elem, DATA_KEY));
      const hasTransitioning = activesData.some(data => data && data._isTransitioning);
      if (hasTransitioning) return;
    }
    
    // Dispatch show event (cancelable)
    const showEvent = this._triggerEvent(EVENTS.SHOW);
    if (showEvent.defaultPrevented) return;
    
    // Close other active collapses in accordion
    if (actives) {
      for (const active of actives) {
        if (active !== this._element) {
          const instance = getInstance(active, DATA_KEY);
          if (instance) {
            instance.hide();
          } else {
            // No instance, manually remove class
            removeClass(active, CLASSES.IN);
          }
        }
      }
    }
    
    this._isTransitioning = true;
    
    // Set up for animation
    removeClass(this._element, CLASSES.COLLAPSE);
    addClass(this._element, CLASSES.COLLAPSING);
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
    removeClass(this._element, CLASSES.COLLAPSING);
    addClass(this._element, CLASSES.COLLAPSE);
    addClass(this._element, CLASSES.IN);
    
    this._isTransitioning = false;
    
    // Dispatch shown event
    this._triggerEvent(EVENTS.SHOWN);
  }
  
  /**
   * Hide the collapse
   */
  async hide() {
    if (this._isTransitioning || !hasClass(this._element, CLASSES.IN)) {
      return;
    }
    
    // Dispatch hide event (cancelable)
    const hideEvent = this._triggerEvent(EVENTS.HIDE);
    if (hideEvent.defaultPrevented) return;
    
    this._isTransitioning = true;
    
    // Get current height for animation
    const currentHeight = this._element.scrollHeight;
    this._element.style.height = `${currentHeight}px`;
    
    // Force reflow
    reflow(this._element);
    
    // Set up for animation
    removeClass(this._element, CLASSES.COLLAPSE);
    removeClass(this._element, CLASSES.IN);
    addClass(this._element, CLASSES.COLLAPSING);
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
    removeClass(this._element, CLASSES.COLLAPSING);
    addClass(this._element, CLASSES.COLLAPSE);
    
    this._isTransitioning = false;
    
    // Dispatch hidden event
    this._triggerEvent(EVENTS.HIDDEN);
  }
  
  /**
   * Destroy the collapse instance
   */
  dispose() {
    removeInstance(this._element, DATA_KEY);
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
        return $1Helper(parent);
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
    const isOpen = hasClass(element, CLASSES.IN);
    
    if (triggers.length) {
      for (const trigger of triggers) {
        if (isOpen) {
          removeClass(trigger, CLASSES.COLLAPSED);
        } else {
          addClass(trigger, CLASSES.COLLAPSED);
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
        addClass(trigger, CLASSES.COLLAPSED);
      } else {
        removeClass(trigger, CLASSES.COLLAPSED);
      }
      setAttr(trigger, 'aria-expanded', (!collapsed).toString());
    }
  }
  
  /**
   * Trigger custom event
   * @param {string} eventType
   * @returns {Event}
   * @private
   */
  _triggerEvent(eventType) {
    // Use JQNext trigger for proper namespace handling
    const event = $.Event(eventType);
    this.$element.trigger(event);
    return event;
  }
  
  // Static methods
  
  /**
   * Get Collapse instance from element
   * @param {Element} element 
   * @returns {Collapse|null}
   */
  static getInstance(element) {
    return getInstance(element, DATA_KEY);
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
    const trigger = event.currentTarget || event.target.closest(SELECTORS.DATA_TOGGLE);
    
    if (!trigger) return;
    
    // Prevent default for links
    if (trigger.tagName === 'A') {
      event.preventDefault();
    }
    
    // Get target(s)
    const selector = getAttr(trigger, 'data-target') || getAttr(trigger, 'href');
    
    if (!selector) return;
    
    const targets = $$(selector);
    
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
    return DATA_KEY;
  }
  
  /**
   * Default options
   */
  static get DEFAULTS() {
    return DEFAULTS;
  }
}

export default Collapse;
export { Collapse, EVENTS as CollapseEvents, CLASSES as CollapseClasses, SELECTORS as CollapseSelectors };