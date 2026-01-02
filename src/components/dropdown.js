/**
 * Sandal Dropdown Component
 * Modern vanilla JS implementation with Bootstrap 3 API compatibility
 */

import {
  $, $$, closest, parent, hasClass, addClass, removeClass, toggleClass,
  getAttr, setAttr,
  on, off, trigger,
  setInstance, getInstance, removeInstance,
  parseDataOptions, isDisabled
} from '../utils/index.js';

// Constants
const NAME = 'dropdown';
const DATA_KEY = 'bs.dropdown';
const EVENT_KEY = `.bs.${NAME}`;

const DEFAULTS = {
  offset: 0,
  flip: true,
  boundary: 'scrollParent',
  reference: 'toggle',
  display: 'dynamic'
};

const EVENTS = {
  SHOW: `show${EVENT_KEY}`,
  SHOWN: `shown${EVENT_KEY}`,
  HIDE: `hide${EVENT_KEY}`,
  HIDDEN: `hidden${EVENT_KEY}`
};

const CLASSES = {
  DISABLED: 'disabled',
  SHOW: 'show',
  OPEN: 'open',
  DROPUP: 'dropup',
  DROPDOWN_MENU: 'dropdown-menu',
  DROPDOWN_MENU_RIGHT: 'dropdown-menu-right'
};

const SELECTORS = {
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
    const showEvent = this._triggerEvent(EVENTS.SHOW, { relatedTarget: this._element });
    if (showEvent.defaultPrevented) return;
    
    // Add open class to parent
    addClass(this._parent, CLASSES.OPEN);
    
    // Update ARIA
    setAttr(this._element, 'aria-expanded', 'true');
    
    // Add document click listener to close
    this._addDocumentListener();
    
    // Focus first item or toggle
    this._element.focus();
    
    // Dispatch shown event
    this._triggerEvent(EVENTS.SHOWN, { relatedTarget: this._element });
  }
  
  /**
   * Hide dropdown
   */
  hide() {
    if (!this._isShown()) return;
    
    // Dispatch hide event (cancelable)
    const hideEvent = this._triggerEvent(EVENTS.HIDE, { relatedTarget: this._element });
    if (hideEvent.defaultPrevented) return;
    
    // Remove open class
    removeClass(this._parent, CLASSES.OPEN);
    
    // Update ARIA
    setAttr(this._element, 'aria-expanded', 'false');
    
    // Remove document listener
    this._removeDocumentListener();
    
    // Dispatch hidden event
    this._triggerEvent(EVENTS.HIDDEN, { relatedTarget: this._element });
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
    removeInstance(this._element, DATA_KEY);
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
        const isMenuItem = closest(e.target, SELECTORS.VISIBLE_ITEMS);
        const isInForm = closest(e.target, SELECTORS.FORM_CHILD);
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
    
    const items = $$(SELECTORS.VISIBLE_ITEMS, this._menu);
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
    return hasClass(this._parent, CLASSES.OPEN);
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
      return $(SELECTORS.DROPDOWN_MENU, this._parent);
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
      cancelable: eventType === EVENTS.SHOW || eventType === EVENTS.HIDE,
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
    return getInstance(element, DATA_KEY);
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
    const openDropdowns = $$(`.${CLASSES.OPEN}`);
    for (const dropdown of openDropdowns) {
      const toggle = $(SELECTORS.DATA_TOGGLE, dropdown);
      if (toggle) {
        const instance = Dropdown.getInstance(toggle);
        if (instance) {
          instance.hide();
        } else {
          removeClass(dropdown, CLASSES.OPEN);
        }
      } else {
        removeClass(dropdown, CLASSES.OPEN);
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
    
    const toggle = event.currentTarget || event.target.closest(SELECTORS.DATA_TOGGLE);
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
    
    const toggle = event.target.closest(SELECTORS.DATA_TOGGLE);
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
    return DATA_KEY;
  }
  
  /**
   * Default options
   */
  static get DEFAULTS() {
    return DEFAULTS;
  }
}

export default Dropdown;
export { Dropdown, EVENTS as DropdownEvents, CLASSES as DropdownClasses, SELECTORS as DropdownSelectors };