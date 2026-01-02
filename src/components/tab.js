/**
 * Sandal Tab Component
 * Modern vanilla JS implementation with Bootstrap 3 API compatibility
 */

import {
  $, $$, closest, parent, children, siblings, hasClass, addClass, removeClass,
  getAttr, setAttr,
  trigger, on, off,
  fadeIn, fadeOut, reflow,
  setInstance, getInstance, removeInstance
} from '../utils/index.js';

// Constants
const NAME = 'tab';
const DATA_KEY = 'bs.tab';
const EVENT_KEY = `.bs.${NAME}`;

const EVENTS = {
  SHOW: `show${EVENT_KEY}`,
  SHOWN: `shown${EVENT_KEY}`,
  HIDE: `hide${EVENT_KEY}`,
  HIDDEN: `hidden${EVENT_KEY}`
};

const CLASSES = {
  DROPDOWN_MENU: 'dropdown-menu',
  ACTIVE: 'active',
  DISABLED: 'disabled',
  FADE: 'fade',
  IN: 'in'
};

const SELECTORS = {
  DATA_TOGGLE: '[data-toggle="tab"], [data-toggle="pill"]',
  DROPDOWN: '.dropdown',
  NAV_LIST_GROUP: '.nav, .list-group',
  ACTIVE: '.active',
  ACTIVE_UL: '> li > .active',
  ACTIVE_CHILD: '> .active',
  DATA_TOGGLE_CHILD: '> li > [data-toggle="tab"], > li > [data-toggle="pill"], > [data-toggle="tab"], > [data-toggle="pill"]'
};

// Static transitioning state per nav container
const transitioningContainers = new WeakSet();

/**
 * Tab Class
 * Provides tab and pill navigation functionality
 */
class Tab {
  /**
   * Create a Tab instance
   * @param {Element} element - The tab trigger element
   */
  constructor(element) {
    this._element = typeof element === 'string' ? $(element) : element;
    
    if (!this._element) return;
    
    // Store instance
    setInstance(this._element, DATA_KEY, this);
  }
  
  /**
   * Get tab element
   * @returns {Element}
   */
  get element() {
    return this._element;
  }
  
  /**
   * Show the tab
   */
  show() {
    if (!this._element) return;
    
    // Check if already active or disabled
    const listElement = closest(this._element, SELECTORS.NAV_LIST_GROUP);
    const targetSelector = getAttr(this._element, 'data-target') || getAttr(this._element, 'href');
    
    // Prevent concurrent transitions on the same nav container
    if (listElement && transitioningContainers.has(listElement)) {
      return;
    }
    
    // Check if link is inside an active li
    const parentLi = this._element.parentElement;
    if (parentLi && hasClass(parentLi, CLASSES.ACTIVE)) {
      return;
    }
    
    // Check if disabled
    if (hasClass(this._element, CLASSES.DISABLED) ||
        (parentLi && hasClass(parentLi, CLASSES.DISABLED))) {
      return;
    }
    
    // Find currently active element
    let previous = null;
    let previousTab = null;
    
    if (listElement) {
      // Find active child - check both direct children and li > a patterns
      const activeChildren = children(listElement).filter(child => hasClass(child, CLASSES.ACTIVE));
      if (activeChildren.length > 0) {
        previous = activeChildren[0];
        previousTab = $(SELECTORS.DATA_TOGGLE, previous) || previous;
      } else {
        // Check for li > .active pattern
        const activeLi = listElement.querySelector(':scope > li > .active');
        if (activeLi) {
          previousTab = activeLi;
          previous = activeLi.parentElement;
        }
      }
    }
    
    // Dispatch show event (cancelable)
    const showEvent = this._triggerEvent(EVENTS.SHOW, {
      relatedTarget: previousTab
    });
    
    if (showEvent.defaultPrevented) return;
    
    // Dispatch hide event on previous tab
    if (previousTab && previousTab !== this._element) {
      const hideEvent = this._triggerEventOn(previousTab, EVENTS.HIDE, {
        relatedTarget: this._element
      });
      
      if (hideEvent.defaultPrevented) return;
    }
    
    // Lock the container
    if (listElement) {
      transitioningContainers.add(listElement);
    }
    
    // Activate the tab synchronously to avoid race conditions
    this._activate(this._element, listElement, false);
    
    // Activate the pane
    const target = targetSelector ? $(targetSelector) : null;
    if (target) {
      const container = target.parentElement;
      this._activate(target, container, true);
    }
    
    // Unlock after a frame to allow CSS transitions
    requestAnimationFrame(() => {
      if (listElement) {
        transitioningContainers.delete(listElement);
      }
      
      // Dispatch shown event
      this._triggerEvent(EVENTS.SHOWN, {
        relatedTarget: previousTab
      });
      
      // Dispatch hidden event on previous tab
      if (previousTab && previousTab !== this._element) {
        this._triggerEventOn(previousTab, EVENTS.HIDDEN, {
          relatedTarget: this._element
        });
      }
    });
  }
  
  /**
   * Destroy the tab instance
   */
  dispose() {
    removeInstance(this._element, DATA_KEY);
    this._element = null;
  }
  
  // Private methods
  
  /**
   * Activate element within container
   * @param {Element} element - Element to activate
   * @param {Element} container - Container element
   * @param {boolean} [isPane=false] - Whether activating a pane
   * @private
   */
  _activate(element, container, isPane = false) {
    if (!container) return;
    
    if (isPane) {
      // For panes - find active sibling pane and deactivate
      const activePanes = children(container).filter(child => hasClass(child, CLASSES.ACTIVE));
      for (const activePane of activePanes) {
        removeClass(activePane, CLASSES.ACTIVE);
        removeClass(activePane, CLASSES.IN);
      }
      
      // Activate new pane
      addClass(element, CLASSES.ACTIVE);
      
      // Handle fade transition
      if (hasClass(element, CLASSES.FADE)) {
        reflow(element);
        addClass(element, CLASSES.IN);
      }
    } else {
      // For tabs - Bootstrap 3 only sets active on <li>, not on <a>
      // First, remove active from ALL li elements in this nav
      const allLiElements = children(container).filter(child => child.tagName === 'LI');
      for (const li of allLiElements) {
        if (hasClass(li, CLASSES.ACTIVE)) {
          removeClass(li, CLASSES.ACTIVE);
          
          // Also remove from any anchors inside (cleanup from previous bugs)
          const anchorsInLi = li.querySelectorAll('a.active');
          anchorsInLi.forEach(a => removeClass(a, CLASSES.ACTIVE));
          
          // Update aria on the tab link
          const tabLink = li.querySelector('[data-toggle="tab"], [data-toggle="pill"]');
          if (tabLink && tabLink.hasAttribute('aria-selected')) {
            setAttr(tabLink, 'aria-selected', 'false');
          }
        }
      }
      
      // Also handle dropdown menus that might have active items
      const activeDropdownItems = container.querySelectorAll('.dropdown-menu .active');
      activeDropdownItems.forEach(item => removeClass(item, CLASSES.ACTIVE));
      
      // Now activate the new tab's parent li (Bootstrap 3 style)
      const parentLi = element.parentElement;
      if (parentLi && parentLi.tagName === 'LI') {
        addClass(parentLi, CLASSES.ACTIVE);
      }
      
      // Handle dropdown parent - mark the dropdown's li as active too
      const dropdownMenu = closest(element, '.dropdown-menu');
      if (dropdownMenu) {
        const dropdownLi = closest(dropdownMenu, 'li.dropdown');
        if (dropdownLi) {
          addClass(dropdownLi, CLASSES.ACTIVE);
        }
      }
      
      // Update aria on the new tab
      if (element.hasAttribute('aria-selected')) {
        setAttr(element, 'aria-selected', 'true');
      }
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
      cancelable: eventType === EVENTS.SHOW || eventType === EVENTS.HIDE,
      detail
    });
    this._element.dispatchEvent(event);
    return event;
  }
  
  /**
   * Trigger event on specific element
   * @param {Element} element 
   * @param {string} eventType 
   * @param {Object} detail 
   * @returns {CustomEvent}
   * @private
   */
  _triggerEventOn(element, eventType, detail = {}) {
    const event = new CustomEvent(eventType, {
      bubbles: true,
      cancelable: eventType === EVENTS.SHOW || eventType === EVENTS.HIDE,
      detail
    });
    element.dispatchEvent(event);
    return event;
  }
  
  // Static methods
  
  /**
   * Get Tab instance from element
   * @param {Element} element 
   * @returns {Tab|null}
   */
  static getInstance(element) {
    return getInstance(element, DATA_KEY);
  }
  
  /**
   * Get or create Tab instance
   * @param {Element} element 
   * @returns {Tab}
   */
  static getOrCreateInstance(element) {
    return Tab.getInstance(element) || new Tab(element);
  }
  
  /**
   * Handle click on tab
   * @param {Event} event
   */
  static handleClick(event) {
    event.preventDefault();
    
    // event.currentTarget is preferred, but may not be available in all cases
    // event.target might be a text node, so check for closest method
    let tab = event.currentTarget;
    if (!tab) {
      const target = event.target;
      tab = target && target.closest ? target.closest(SELECTORS.DATA_TOGGLE) : null;
    }
    if (!tab) return;
    
    const instance = Tab.getOrCreateInstance(tab);
    instance.show();
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

export default Tab;
export { Tab, EVENTS as TabEvents, CLASSES as TabClasses, SELECTORS as TabSelectors };