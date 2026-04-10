/**
 * Sandal Button Component
 * Modern vanilla JS implementation with Bootstrap 3 API compatibility
 */

import {
  setInstance, getInstance, removeInstance
} from '../utils/index.js';

import {
  $1 as $, $$, closest, hasClass, addClass, removeClass, toggleClass,
  getAttr, setAttr, removeAttr, getData, setData, trigger
} from './helpers.js';

// Constants
const NAME = 'button';
const DATA_KEY = 'bs.button';
const EVENT_KEY = `.bs.${NAME}`;

const CLASSES = {
  ACTIVE: 'active',
  BUTTON: 'btn',
  DISABLED: 'disabled'
};

const SELECTORS = {
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
    setInstance(this._element, DATA_KEY, this);
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
    const rootElement = closest(this._element, SELECTORS.DATA_TOGGLE_BUTTONS);
    
    if (rootElement) {
      const input = this._element.querySelector(SELECTORS.INPUT);
      
      if (input) {
        if (input.type === 'radio') {
          if (input.checked && hasClass(this._element, CLASSES.ACTIVE)) {
            triggerChangeEvent = false;
          } else {
            // Deactivate other buttons in group
            const activeElement = rootElement.querySelector(SELECTORS.ACTIVE);
            if (activeElement) {
              removeClass(activeElement, CLASSES.ACTIVE);
              // Also update input state
              const activeInput = activeElement.querySelector(SELECTORS.INPUT);
              if (activeInput) {
                activeInput.checked = false;
              }
            }
          }
        }
        
        if (triggerChangeEvent) {
          if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = !hasClass(this._element, CLASSES.ACTIVE);
          }
          // Trigger change event
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        input.focus();
        addAriaPressed = false;
      }
    }
    
    if (addAriaPressed) {
      const pressed = !hasClass(this._element, CLASSES.ACTIVE);
      setAttr(this._element, 'aria-pressed', pressed.toString());
    }
    
    if (triggerChangeEvent) {
      toggleClass(this._element, CLASSES.ACTIVE);
    }
  }
  
  /**
   * Set loading state
   * @param {string} [state='loading'] - State to set (loading, reset)
   */
  setState(state = 'loading') {
    const d        = 'disabled';
    const isInput  = this._element.nodeName.toLowerCase() === 'input';
    const val      = isInput ? 'value' : 'innerHTML';

    // Convert state name to data-attribute key: 'loading' → 'loadingText' → 'data-loading-text'
    const dataKey  = state + 'Text';
    const attrName = 'data-' + dataKey.replace( /([A-Z])/g, '-$1' ).toLowerCase();
    const stateVal = this._element.getAttribute( attrName );

    // Store original content before first change — matches Bootstrap 3 behaviour
    if ( getData( this._element, 'resetText' ) == null ) {
      setData( this._element, 'resetText', this._element[ val ] );
    }

    const resetVal = getData( this._element, 'resetText' );
    const self     = this;

    // Push to event loop so forms can submit before the button is disabled
    // Matches Bootstrap 3's setTimeout( fn, 0 ) pattern exactly
    setTimeout( function() {
      self._element[ val ] = stateVal !== null ? stateVal : resetVal;

      if ( state === 'loading' ) {
        self.isLoading = true;
        addClass( self._element, d );
        setAttr( self._element, d, d );
      } else if ( self.isLoading ) {
        self.isLoading = false;
        removeClass( self._element, d );
        removeAttr( self._element, d );
      }
    }, 0 );
  }
  
  /**
   * Destroy the button instance
   */
  dispose() {
    removeInstance(this._element, DATA_KEY);
    this._element = null;
  }
  
  // Static methods
  
  /**
   * Get Button instance from element
   * @param {Element} element 
   * @returns {Button|null}
   */
  static getInstance(element) {
    return getInstance(element, DATA_KEY);
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
    if (!hasClass(button, CLASSES.BUTTON)) {
      button = closest(button, SELECTORS.BUTTON);
    }
    
    if (!button) return;
    
    // Check if disabled
    if (hasClass(button, CLASSES.DISABLED) || button.disabled) {
      event.preventDefault();
      return;
    }
    
    const instance = Button.getOrCreateInstance(button);
    instance.toggle();
    
    // Don't prevent default for checkbox/radio inputs
    const input = button.querySelector(SELECTORS.INPUT);
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
    return DATA_KEY;
  }
}

export default Button;
export { Button, CLASSES as ButtonClasses, SELECTORS as ButtonSelectors };