/**
 * Sandal Modal Component
 * Modern implementation using JQNext for DOM operations
 * Uses Web Animation API for smooth animations
 */

import $ from 'jqnext';
import {
  setInstance, getInstance, removeInstance,
  parseDataOptions, getUID, trapFocus, reflow
} from '../utils/index.js';

// Constants
const NAME = 'modal';
const DATA_KEY = 'bs.modal';
const EVENT_KEY = `.bs.${NAME}`;

const DEFAULTS = {
  backdrop: true,
  keyboard: true,
  show: true,
  focus: true
};

const EVENTS = {
  SHOW: `show${EVENT_KEY}`,
  SHOWN: `shown${EVENT_KEY}`,
  HIDE: `hide${EVENT_KEY}`,
  HIDDEN: `hidden${EVENT_KEY}`,
  LOADED: `loaded${EVENT_KEY}`
};

const CLASSES = {
  SCROLLBAR_MEASURER: 'modal-scrollbar-measure',
  BACKDROP: 'modal-backdrop',
  OPEN: 'modal-open',
  FADE: 'fade',
  IN: 'in',
  SHOW: 'show'
};

const SELECTORS = {
  DIALOG: '.modal-dialog',
  MODAL_BODY: '.modal-body',
  DATA_TOGGLE: '[data-toggle="modal"]',
  DATA_DISMISS: '.presidecms [data-dismiss="modal"]',
  FIXED_CONTENT: '.navbar-fixed-top, .navbar-fixed-bottom'
};

const TRANSITION_DURATION = 300;
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
    // Use JQNext for element selection
    this.$element = $(element);
    this._element = this.$element[0];
    
    if (!this._element) return;
    
    this.$dialog = this.$element.find(SELECTORS.DIALOG);
    this._dialog = this.$dialog[0];
    this._backdrop = null;
    this._isShown = false;
    this._isTransitioning = false;
    this._scrollbarWidth = 0;
    this._focusTrap = null;
    
    // Parse options
    this._options = {
      ...DEFAULTS,
      ...parseDataOptions(this._element, DEFAULTS),
      ...options
    };
    
    // Bind events
    this._bindEvents();
    
    // Store instance
    setInstance(this._element, DATA_KEY, this);
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
    const showEvent = this._triggerEvent(EVENTS.SHOW, { relatedTarget });
    if (showEvent.defaultPrevented) return;
    
    this._isShown = true;
    this._isTransitioning = true;
    
    // Check scrollbar and add padding
    this._checkScrollbar();
    this._setScrollbar();
    
    // Add modal-open class to body using JQNext
    $('body').addClass(CLASSES.OPEN);
    
    // Set up modal
    this._escape();
    this._resize();
    
    // Dismiss button handler using JQNext event delegation
    this.$element.on('click', SELECTORS.DATA_DISMISS, () => this.hide());
    
    // Backdrop click handler
    this.$dialog.on('mousedown', () => {
      this.$element.one('mouseup', (e) => {
        if (e.target === this._element) {
          this._ignoreBackdropClick = true;
        }
      });
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
    this._triggerEvent(EVENTS.SHOWN, { relatedTarget });
  }
  
  /**
   * Hide modal
   */
  async hide() {
    if (!this._isShown || this._isTransitioning) return;
    
    // Dispatch hide event (cancelable)
    const hideEvent = this._triggerEvent(EVENTS.HIDE);
    if (hideEvent.defaultPrevented) return;
    
    this._isShown = false;
    this._isTransitioning = true;
    
    // Clean up focus trap
    if (this._focusTrap) {
      this._focusTrap();
      this._focusTrap = null;
    }
    
    // Remove escape handler
    $(document).off('keydown', this._escapeHandler);
    
    // Remove resize handler
    $(window).off('resize', this._resizeHandler);
    
    // Hide modal then backdrop using JQNext
    this.$element.removeClass(CLASSES.IN);
    
    if (this.$element.hasClass(CLASSES.FADE)) {
      await this._waitForTransition(this._element, TRANSITION_DURATION);
    }
    
    await this._hideModal();
    
    this._isTransitioning = false;
    
    // Dispatch hidden event
    this._triggerEvent(EVENTS.HIDDEN);
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
    // Remove event listeners using JQNext
    this.$element.off('click');
    this.$dialog.off('mousedown');
    $(document).off('keydown', this._escapeHandler);
    $(window).off('resize', this._resizeHandler);
    
    // Remove focus trap
    if (this._focusTrap) {
      this._focusTrap();
    }
    
    // Remove backdrop
    if (this._backdrop) {
      this._backdrop.remove();
    }
    
    // Clean up instance
    removeInstance(this._element, DATA_KEY);
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
    this.$element.on('click', (e) => {
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
      // Create backdrop using JQNext
      this.$backdrop = $('<div>').addClass(CLASSES.BACKDROP);
      this._backdrop = this.$backdrop[0];
      
      if (this.$element.hasClass(CLASSES.FADE)) {
        this.$backdrop.addClass(CLASSES.FADE);
      }
      
      this.$backdrop.appendTo('body');
      
      // Click handler for backdrop
      this.$backdrop.on('click', () => {
        if (this._options.backdrop !== 'static') {
          this.hide();
        }
      });
      
      // Animate in
      reflow(this._backdrop);
      this.$backdrop.addClass(CLASSES.IN);
      
      if (this.$backdrop.hasClass(CLASSES.FADE)) {
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
    // Show modal using JQNext
    this.$element.css('display', 'block')
      .removeAttr('aria-hidden')
      .attr({
        'aria-modal': 'true',
        'role': 'dialog'
      })
      .scrollTop(0);
    
    if (this.$dialog.length) {
      this.$dialog.scrollTop(0);
    }
    
    this._adjustDialog();
    
    reflow(this._element);
    this.$element.addClass(CLASSES.IN);
    
    if (this.$element.hasClass(CLASSES.FADE)) {
      await this._waitForTransition(this._dialog || this._element, TRANSITION_DURATION);
    }
  }
  
  /**
   * Hide modal element
   * @returns {Promise}
   * @private
   */
  async _hideModal() {
    // Hide modal using JQNext
    this.$element.css('display', 'none')
      .attr('aria-hidden', 'true')
      .removeAttr('aria-modal')
      .removeAttr('role');
    
    // Reset scrollbar
    this._resetScrollbar();
    $('body').removeClass(CLASSES.OPEN);
    
    // Remove backdrop
    if (this.$backdrop) {
      this.$backdrop.removeClass(CLASSES.IN);
      
      if (this.$backdrop.hasClass(CLASSES.FADE)) {
        await this._waitForTransition(this._backdrop, BACKDROP_DURATION);
      }
      
      this.$backdrop.remove();
      this.$backdrop = null;
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
      $(document).on('keydown', this._escapeHandler);
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
    $(window).on('resize', this._resizeHandler);
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
    scrollDiv.className = CLASSES.SCROLLBAR_MEASURER;
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
      
      // Fixed elements using JQNext
      $(SELECTORS.FIXED_CONTENT).each(function() {
        const element = this;
        const actualPadding = element.style.paddingRight;
        const calculatedPadding = parseFloat(getComputedStyle(element).paddingRight);
        element.dataset.paddingRight = actualPadding;
        element.style.paddingRight = `${calculatedPadding + this._scrollbarWidth}px`;
      });
    }
  }
  
  /**
   * Reset scrollbar padding
   * @private
   */
  _resetScrollbar() {
    document.body.style.paddingRight = this._originalPadding || '';
    
    $(SELECTORS.FIXED_CONTENT).each(function() {
      const element = this;
      const padding = element.dataset.paddingRight;
      if (padding !== undefined) {
        element.style.paddingRight = padding;
        delete element.dataset.paddingRight;
      }
    });
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
    // Use JQNext trigger for proper namespace handling
    // and compatibility with jQuery event handlers (like those in preside.iframe.modal.js)
    const event = $.Event(eventType, detail);
    this.$element.trigger(event);
    return event;
    
    /* Fallback no longer needed - JQNext is always available
    // Parse event type and namespace (e.g., "hide.bs.modal" -> type: "hide", namespace: "bs.modal")
    */
  }
  
  // Static methods
  
  /**
   * Get Modal instance from element
   * @param {Element} element 
   * @returns {Modal|null}
   */
  static getInstance(element) {
    return getInstance(element, DATA_KEY);
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
    const trigger = event.currentTarget || event.target.closest(SELECTORS.DATA_TOGGLE);
    if (!trigger) return;
    
    // Get target using JQNext
    const $trigger = $(trigger);
    let target = $trigger.attr('data-target');
    if (!target) {
      const href = $trigger.attr('href');
      if (href) {
        target = href.replace(/.*(?=#[^\s]+$)/, ''); // Strip for IE7
      }
    }
    
    const $modalElement = $(target);
    if (!$modalElement.length) return;
    
    event.preventDefault();
    
    // Get options from trigger using JQNext
    const options = {};
    const backdrop = $trigger.attr('data-backdrop');
    if (backdrop !== undefined) {
      options.backdrop = backdrop === 'static' ? 'static' : backdrop !== 'false';
    }
    const keyboard = $trigger.attr('data-keyboard');
    if (keyboard !== undefined) {
      options.keyboard = keyboard !== 'false';
    }
    
    const instance = Modal.getOrCreateInstance($modalElement[0], options);
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
    return DATA_KEY;
  }
  
  /**
   * Default options
   */
  static get DEFAULTS() {
    return DEFAULTS;
  }
}

export default Modal;
export { Modal, EVENTS as ModalEvents, CLASSES as ModalClasses, SELECTORS as ModalSelectors };