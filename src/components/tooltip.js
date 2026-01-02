/**
 * Sandal Tooltip Component
 * Modern vanilla JS implementation with Bootstrap 3 API compatibility
 * Uses modern positioning (Floating UI compatible)
 */

import {
  $, $$, closest, hasClass, addClass, removeClass,
  getAttr, setAttr, removeAttr, data as getData, css,
  show as showEl, hide as hideEl, remove as removeEl,
  createFromHTML, dimensions, offset,
  on, off, trigger,
  fadeIn, fadeOut, reflow,
  computePosition, applyPosition, autoUpdate, getContainer,
  setInstance, getInstance, removeInstance,
  parseDataOptions, getUID, sanitizeHTML
} from '../utils/index.js';

// Constants
const NAME = 'tooltip';
const DATA_KEY = 'bs.tooltip';
const EVENT_KEY = `.bs.${NAME}`;

const DEFAULTS = {
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

const EVENTS = {
  SHOW: `show${EVENT_KEY}`,
  SHOWN: `shown${EVENT_KEY}`,
  HIDE: `hide${EVENT_KEY}`,
  HIDDEN: `hidden${EVENT_KEY}`,
  INSERTED: `inserted${EVENT_KEY}`
};

const CLASSES = {
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

const SELECTORS = {
  TOOLTIP_INNER: '.tooltip-inner',
  TOOLTIP_ARROW: '.tooltip-arrow'
};

const TRANSITION_DURATION = 150;

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
    setInstance(this._element, DATA_KEY, this);
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
      const context = this._getDelegateConfig();
      
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
      if (hasClass(this.tip, CLASSES.IN)) {
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
    const showEvent = this._triggerEvent(EVENTS.SHOW);
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
    removeClass(tip, CLASSES.IN);
    removeClass(tip, CLASSES.TOP);
    removeClass(tip, CLASSES.BOTTOM);
    removeClass(tip, CLASSES.LEFT);
    removeClass(tip, CLASSES.RIGHT);
    
    // Set ID for accessibility
    const tipId = getUID(this.constructor.NAME || NAME);
    setAttr(tip, 'id', tipId);
    setAttr(this._element, 'aria-describedby', tipId);
    
    // Add fade class if animated
    if (this._options.animation) {
      addClass(tip, CLASSES.FADE);
    }
    
    // Get container and append tip
    const container = getContainer(this._options.container, this._element.ownerDocument.body);
    container.appendChild(tip);
    
    // Dispatch inserted event
    this._triggerEvent(EVENTS.INSERTED);
    
    // Position the tooltip
    await this._updatePosition();
    
    // Show with animation
    reflow(tip);
    addClass(tip, CLASSES.IN);
    
    // Force visibility in case CSS isn't loaded or has specificity issues
    tip.style.opacity = '1';
    tip.style.display = 'block';
    
    if (this._options.animation) {
      await this._waitForTransition(tip, TRANSITION_DURATION);
    }
    
    // Set up auto-update for repositioning
    this._cleanupAutoUpdate = autoUpdate(this._element, tip, () => {
      this._updatePosition();
    });
    
    this._hoverState = '';
    
    // Dispatch shown event
    this._triggerEvent(EVENTS.SHOWN);
  }
  
  /**
   * Hide tooltip
   */
  async hide() {
    const tip = this.tip;
    
    // Dispatch hide event (cancelable)
    const hideEvent = this._triggerEvent(EVENTS.HIDE);
    if (hideEvent.defaultPrevented) return;
    
    // Clean up auto-update
    if (this._cleanupAutoUpdate) {
      this._cleanupAutoUpdate();
      this._cleanupAutoUpdate = null;
    }
    
    // Hide with animation
    removeClass(tip, CLASSES.IN);
    
    if (this._options.animation && hasClass(tip, CLASSES.FADE)) {
      await this._waitForTransition(tip, TRANSITION_DURATION);
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
    this._triggerEvent(EVENTS.HIDDEN);
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
      removeEl(this._tip);
    }
    
    // Clean up instance
    removeInstance(this._element, DATA_KEY);
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
    const defaults = this.constructor.DEFAULTS || DEFAULTS;
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
    const inner = $(SELECTORS.TOOLTIP_INNER, tip);
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
    removeClass(tip, CLASSES.TOP);
    removeClass(tip, CLASSES.RIGHT);
    removeClass(tip, CLASSES.BOTTOM);
    removeClass(tip, CLASSES.LEFT);
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
    if (this._options.selector) {
      // Delegated tooltips - handled differently
    }
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
        if (DEFAULTS[key] !== this._options[key]) {
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
      cancelable: eventType === EVENTS.SHOW || eventType === EVENTS.HIDE
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
    return getInstance(element, DATA_KEY);
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
    return NAME;
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

export default Tooltip;
export { Tooltip, EVENTS as TooltipEvents, CLASSES as TooltipClasses };