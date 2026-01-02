/**
 * Sandal Alert Component
 * Modern vanilla JS implementation with Bootstrap 3 API compatibility
 */

import { 
  $, closest, hasClass, removeClass, remove as removeElement,
  trigger, on, off,
  fadeOut,
  setInstance, getInstance, removeInstance
} from '../utils/index.js';

// Constants
const NAME = 'alert';
const DATA_KEY = 'bs.alert';
const EVENT_KEY = `.bs.${NAME}`;

const EVENTS = {
  CLOSE: `close${EVENT_KEY}`,
  CLOSED: `closed${EVENT_KEY}`
};

const CLASSES = {
  ALERT: 'alert',
  FADE: 'fade',
  IN: 'in'
};

const SELECTORS = {
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
    setInstance(this._element, DATA_KEY, this);
    
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
    const closeEvent = this._triggerEvent(EVENTS.CLOSE, rootElement);
    
    if (closeEvent.defaultPrevented) return;
    
    this._removeElement(rootElement);
  }
  
  /**
   * Destroy the alert instance
   */
  dispose() {
    this._unbindDismiss();
    removeInstance(this._element, DATA_KEY);
    this._element = null;
  }
  
  // Private methods
  
  /**
   * Bind click handler to dismiss buttons
   * @private
   */
  _bindDismiss() {
    on(this._element, 'click', SELECTORS.DISMISS, (e) => {
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
    removeClass(element, CLASSES.IN);
    
    if (hasClass(element, CLASSES.FADE)) {
      // Animate out using Web Animation API
      await fadeOut(element, { duration: 150 });
    }
    
    // Dispatch closed event
    this._triggerEvent(EVENTS.CLOSED, element);
    
    // Remove from DOM and clean up
    const instance = getInstance(element, DATA_KEY);
    if (instance) {
      instance.dispose();
    }
    removeElement(element);
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
      cancelable: eventType === EVENTS.CLOSE
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
    return getInstance(element, DATA_KEY);
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
    const alertElement = closest(button, `.${CLASSES.ALERT}`);
    
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
    return DATA_KEY;
  }
}

export default Alert;
export { Alert, EVENTS as AlertEvents, CLASSES as AlertClasses, SELECTORS as AlertSelectors };