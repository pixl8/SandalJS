/**
 * Sandal Popover Component
 * Modern vanilla JS implementation with Bootstrap 3 API compatibility
 * Extends Tooltip functionality
 */

import $ from 'jqnext';
import {
  createFromHTML,
  setInstance, getInstance, removeInstance,
  parseDataOptions, getUID
} from '../utils/index.js';

import {
  $1 as $1Helper, hasClass, addClass, removeClass,
  getAttr, setAttr, removeAttr, sanitizeHTML
} from './helpers.js';

import Tooltip from './tooltip.js';

// Constants
const NAME = 'popover';
const DATA_KEY = 'bs.popover';
const EVENT_KEY = `.bs.${NAME}`;

const DEFAULTS = {
  ...Tooltip.DEFAULTS,
  placement: 'right',
  trigger: 'click',
  content: '',
  template: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
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

const SELECTORS = {
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
    
    // Store jQuery reference
    this.$element = $(this._element);
    
    // Re-store with popover data key
    removeInstance(this._element, Tooltip.DATA_KEY);
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
    removeInstance(this._element, DATA_KEY);
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
    const defaults = this.constructor.DEFAULTS || DEFAULTS;
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
    const titleEl = $1Helper(SELECTORS.TITLE, tip);
    const contentEl = $1Helper(SELECTORS.CONTENT, tip);
    
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
   * @returns {Event}
   * @private
   */
  _triggerEvent(eventType) {
    // Map tooltip events to popover events
    const popoverEventType = eventType.replace('.bs.tooltip', EVENT_KEY);
    
    // Use JQNext trigger for proper namespace handling
    const event = $.Event(popoverEventType);
    this.$element.trigger(event);
    return event;
  }
  
  // Static methods
  
  /**
   * Get Popover instance from element
   * @param {Element} element 
   * @returns {Popover|null}
   */
  static getInstance(element) {
    return getInstance(element, DATA_KEY);
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

export default Popover;
export { Popover, EVENTS as PopoverEvents, CLASSES as PopoverClasses };