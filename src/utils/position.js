/**
 * Sandal - Modern Positioning Utilities
 * Uses Floating UI for tooltip/popover positioning
 * Falls back to basic positioning if Floating UI is not available
 */

// Floating UI will be bundled or loaded externally
let floatingUI = null;

/**
 * Initialize with Floating UI reference
 * @param {Object} floatingUIInstance 
 */
export function setFloatingUI(instance) {
  floatingUI = instance;
}

/**
 * Check if Floating UI is available
 * @returns {boolean}
 */
export function hasFloatingUI() {
  return floatingUI !== null || (typeof window !== 'undefined' && window.FloatingUIDOM);
}

/**
 * Get Floating UI instance
 * @returns {Object|null}
 */
function getFloatingUI() {
  return floatingUI || (typeof window !== 'undefined' && window.FloatingUIDOM);
}

/**
 * Bootstrap placement to Floating UI placement mapping
 */
const PLACEMENT_MAP = {
  top: 'top',
  bottom: 'bottom',
  left: 'left',
  right: 'right',
  auto: 'top' // Default for auto
};

/**
 * Calculate position using Floating UI
 * @param {Element} reference - Reference element (trigger)
 * @param {Element} floating - Floating element (tooltip/popover)
 * @param {Object} options 
 * @returns {Promise<{x: number, y: number, placement: string}>}
 */
export async function computePosition(reference, floating, options = {}) {
  const {
    placement = 'top',
    offset: offsetValue = 0,
    flip = true,
    shift = true,
    arrow = null,
    container = null
  } = options;

  const fui = getFloatingUI();
  
  if (fui && fui.computePosition) {
    // Use Floating UI
    const middleware = [];
    
    if (offsetValue) {
      middleware.push(fui.offset(offsetValue));
    }
    
    if (flip) {
      middleware.push(fui.flip());
    }
    
    if (shift) {
      middleware.push(fui.shift({ padding: 5 }));
    }
    
    if (arrow) {
      middleware.push(fui.arrow({ element: arrow }));
    }
    
    const result = await fui.computePosition(reference, floating, {
      placement: PLACEMENT_MAP[placement] || placement,
      middleware
    });
    
    return {
      x: result.x,
      y: result.y,
      placement: result.placement,
      middlewareData: result.middlewareData
    };
  }
  
  // Fallback: basic positioning without Floating UI
  return computePositionFallback(reference, floating, options);
}

/**
 * Fallback positioning without Floating UI
 * @param {Element} reference 
 * @param {Element} floating 
 * @param {Object} options 
 * @returns {{x: number, y: number, placement: string}}
 */
function computePositionFallback(reference, floating, options = {}) {
  const { placement = 'top', offset: offsetValue = 10 } = options;
  
  const refRect = reference.getBoundingClientRect();
  const floatRect = floating.getBoundingClientRect();
  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  const scrollY = window.scrollY || document.documentElement.scrollTop;
  
  let x, y;
  let finalPlacement = placement;
  
  // Calculate base position
  switch (placement) {
    case 'top':
      x = refRect.left + (refRect.width - floatRect.width) / 2;
      y = refRect.top - floatRect.height - offsetValue;
      break;
    case 'bottom':
      x = refRect.left + (refRect.width - floatRect.width) / 2;
      y = refRect.bottom + offsetValue;
      break;
    case 'left':
      x = refRect.left - floatRect.width - offsetValue;
      y = refRect.top + (refRect.height - floatRect.height) / 2;
      break;
    case 'right':
      x = refRect.right + offsetValue;
      y = refRect.top + (refRect.height - floatRect.height) / 2;
      break;
    case 'auto':
    default:
      // Auto: try top first, then bottom
      x = refRect.left + (refRect.width - floatRect.width) / 2;
      y = refRect.top - floatRect.height - offsetValue;
      
      // Check if it would go above viewport
      if (y < 0) {
        y = refRect.bottom + offsetValue;
        finalPlacement = 'bottom';
      } else {
        finalPlacement = 'top';
      }
      break;
  }
  
  // Simple flip: check if it goes off-screen
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  
  // Flip vertical
  if ((finalPlacement === 'top' && y < 0) || 
      (finalPlacement === 'bottom' && y + floatRect.height > viewport.height)) {
    if (finalPlacement === 'top') {
      y = refRect.bottom + offsetValue;
      finalPlacement = 'bottom';
    } else {
      y = refRect.top - floatRect.height - offsetValue;
      finalPlacement = 'top';
    }
  }
  
  // Flip horizontal
  if ((finalPlacement === 'left' && x < 0) || 
      (finalPlacement === 'right' && x + floatRect.width > viewport.width)) {
    if (finalPlacement === 'left') {
      x = refRect.right + offsetValue;
      finalPlacement = 'right';
    } else {
      x = refRect.left - floatRect.width - offsetValue;
      finalPlacement = 'left';
    }
  }
  
  // Shift: keep within viewport bounds
  x = Math.max(5, Math.min(x, viewport.width - floatRect.width - 5));
  y = Math.max(5, Math.min(y, viewport.height - floatRect.height - 5));
  
  // Add scroll offset for absolute positioning
  return {
    x: x + scrollX,
    y: y + scrollY,
    placement: finalPlacement
  };
}

/**
 * Apply position to floating element
 * @param {Element} floating 
 * @param {{x: number, y: number}} position 
 */
export function applyPosition(floating, { x, y }) {
  Object.assign(floating.style, {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    margin: '0'
  });
}

/**
 * Position arrow element
 * @param {Element} arrow 
 * @param {Object} middlewareData 
 * @param {string} placement 
 */
export function positionArrow(arrow, middlewareData, placement) {
  if (!arrow || !middlewareData?.arrow) return;
  
  const { x, y } = middlewareData.arrow;
  
  const staticSide = {
    top: 'bottom',
    right: 'left',
    bottom: 'top',
    left: 'right'
  }[placement.split('-')[0]];
  
  Object.assign(arrow.style, {
    left: x != null ? `${x}px` : '',
    top: y != null ? `${y}px` : '',
    right: '',
    bottom: '',
    [staticSide]: '-4px'
  });
}

/**
 * Auto-update position on scroll/resize (using Floating UI autoUpdate)
 * @param {Element} reference 
 * @param {Element} floating 
 * @param {Function} update - Update callback
 * @returns {Function} - Cleanup function
 */
export function autoUpdate(reference, floating, update) {
  const fui = getFloatingUI();
  
  if (fui && fui.autoUpdate) {
    return fui.autoUpdate(reference, floating, update);
  }
  
  // Fallback: basic scroll/resize listeners
  const events = ['scroll', 'resize'];
  const parents = getScrollParents(reference);
  
  const handleUpdate = () => requestAnimationFrame(update);
  
  events.forEach(event => {
    window.addEventListener(event, handleUpdate, true);
  });
  
  parents.forEach(parent => {
    parent.addEventListener('scroll', handleUpdate, true);
  });
  
  // Initial position
  update();
  
  // Return cleanup function
  return () => {
    events.forEach(event => {
      window.removeEventListener(event, handleUpdate, true);
    });
    parents.forEach(parent => {
      parent.removeEventListener('scroll', handleUpdate, true);
    });
  };
}

/**
 * Get scroll parent elements
 * @param {Element} element 
 * @returns {Element[]}
 */
function getScrollParents(element) {
  const parents = [];
  let current = element.parentElement;
  
  while (current) {
    const style = getComputedStyle(current);
    const overflow = style.overflow + style.overflowX + style.overflowY;
    
    if (/auto|scroll|overlay/.test(overflow)) {
      parents.push(current);
    }
    
    current = current.parentElement;
  }
  
  return parents;
}

/**
 * Get container element for positioning
 * @param {string|Element|boolean} container 
 * @param {Element} defaultContainer 
 * @returns {Element}
 */
export function getContainer(container, defaultContainer = document.body) {
  if (container === false) return defaultContainer;
  if (container === 'body') return document.body;
  if (typeof container === 'string') return document.querySelector(container) || defaultContainer;
  if (container instanceof Element) return container;
  return defaultContainer;
}

/**
 * Get viewport boundaries
 * @returns {{top: number, right: number, bottom: number, left: number, width: number, height: number}}
 */
export function getViewportRect() {
  return {
    top: 0,
    right: window.innerWidth,
    bottom: window.innerHeight,
    left: 0,
    width: window.innerWidth,
    height: window.innerHeight
  };
}

/**
 * Check if element is within viewport
 * @param {Element} element 
 * @returns {boolean}
 */
export function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
}

export default {
  setFloatingUI,
  hasFloatingUI,
  computePosition,
  applyPosition,
  positionArrow,
  autoUpdate,
  getContainer,
  getViewportRect,
  isInViewport
};