/**
 * Sandal - Advanced Animation Utilities
 * Uses Web Animation API for animations not covered by JQNext
 * JQNext provides: fadeIn, fadeOut, slideDown, slideUp, slideToggle, animate
 */

import $ from 'jqnext';

// Re-export JQNext for convenience
export { $ };

/**
 * Default animation options
 */
const DEFAULT_OPTIONS = {
  duration: 300,
  easing: 'ease',
  fill: 'forwards'
};

/**
 * Common easing functions
 */
export const Easing = {
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  // Cubic bezier equivalents
  easeInCubic: 'cubic-bezier(0.32, 0, 0.67, 0)',
  easeOutCubic: 'cubic-bezier(0.33, 1, 0.68, 1)',
  easeInOutCubic: 'cubic-bezier(0.65, 0, 0.35, 1)',
  // Bootstrap 3 default
  bootstrap: 'cubic-bezier(0.25, 0.1, 0.25, 1)'
};

/**
 * Animate element using Web Animation API
 * @param {Element} element 
 * @param {Keyframe[]} keyframes 
 * @param {Object} options 
 * @returns {Promise<Animation>}
 */
export function animate(element, keyframes, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const animation = element.animate(keyframes, opts);
  
  return new Promise((resolve, reject) => {
    animation.onfinish = () => resolve(animation);
    animation.oncancel = () => reject(new Error('Animation cancelled'));
  });
}

/**
 * Scale in element
 * @param {Element} element 
 * @param {Object} options 
 * @returns {Promise<Animation>}
 */
export function scaleIn(element, options = {}) {
  element.style.display = '';
  return animate(element, [
    { transform: 'scale(0.8)', opacity: 0 },
    { transform: 'scale(1)', opacity: 1 }
  ], { duration: 200, easing: Easing.easeOutCubic, ...options });
}

/**
 * Scale out element
 * @param {Element} element 
 * @param {Object} options 
 * @returns {Promise<Animation>}
 */
export async function scaleOut(element, options = {}) {
  await animate(element, [
    { transform: 'scale(1)', opacity: 1 },
    { transform: 'scale(0.8)', opacity: 0 }
  ], { duration: 200, easing: Easing.easeInCubic, ...options });
  
  element.style.display = 'none';
}

/**
 * Slide in from direction
 * @param {Element} element 
 * @param {'top'|'bottom'|'left'|'right'} direction 
 * @param {Object} options 
 * @returns {Promise<Animation>}
 */
export function slideIn(element, direction = 'top', options = {}) {
  element.style.display = '';
  
  const transforms = {
    top: 'translateY(-100%)',
    bottom: 'translateY(100%)',
    left: 'translateX(-100%)',
    right: 'translateX(100%)'
  };
  
  return animate(element, [
    { transform: transforms[direction], opacity: 0 },
    { transform: 'translate(0, 0)', opacity: 1 }
  ], { duration: 300, easing: Easing.easeOutCubic, ...options });
}

/**
 * Slide out to direction
 * @param {Element} element 
 * @param {'top'|'bottom'|'left'|'right'} direction 
 * @param {Object} options 
 * @returns {Promise<Animation>}
 */
export async function slideOut(element, direction = 'top', options = {}) {
  const transforms = {
    top: 'translateY(-100%)',
    bottom: 'translateY(100%)',
    left: 'translateX(-100%)',
    right: 'translateX(100%)'
  };
  
  await animate(element, [
    { transform: 'translate(0, 0)', opacity: 1 },
    { transform: transforms[direction], opacity: 0 }
  ], { duration: 300, easing: Easing.easeInCubic, ...options });
  
  element.style.display = 'none';
}

/**
 * Reflow element (force layout recalculation)
 * @param {Element} element 
 */
export function reflow(element) {
  return element.offsetHeight;
}

/**
 * Wait for next animation frame
 * @returns {Promise<number>}
 */
export function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(resolve));
}

/**
 * Wait for two animation frames (useful for transitions)
 * @returns {Promise<void>}
 */
export async function doubleRaf() {
  await nextFrame();
  await nextFrame();
}

/**
 * Check if prefers-reduced-motion is set
 * @returns {boolean}
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation duration respecting prefers-reduced-motion
 * @param {number} duration 
 * @returns {number}
 */
export function getDuration(duration) {
  return prefersReducedMotion() ? 0 : duration;
}

/**
 * Cancel all animations on element
 * @param {Element} element 
 */
export function cancelAnimations(element) {
  element.getAnimations().forEach(animation => animation.cancel());
}

/**
 * Pause all animations on element
 * @param {Element} element 
 */
export function pauseAnimations(element) {
  element.getAnimations().forEach(animation => animation.pause());
}

/**
 * Resume all animations on element
 * @param {Element} element 
 */
export function playAnimations(element) {
  element.getAnimations().forEach(animation => animation.play());
}

/**
 * Carousel-specific: slide animation
 * @param {Element} element 
 * @param {'left'|'right'} direction 
 * @param {Object} options 
 * @returns {Promise<Animation>}
 */
export function carouselSlide(element, direction, options = {}) {
  const distance = direction === 'left' ? '-100%' : '100%';
  return animate(element, [
    { transform: 'translateX(0)' },
    { transform: `translateX(${distance})` }
  ], { duration: 600, easing: Easing.easeInOut, ...options });
}

/**
 * Carousel-specific: slide in next item
 * @param {Element} element 
 * @param {'left'|'right'} direction 
 * @param {Object} options 
 * @returns {Promise<Animation>}
 */
export function carouselSlideIn(element, direction, options = {}) {
  const startDistance = direction === 'left' ? '100%' : '-100%';
  element.style.display = '';
  return animate(element, [
    { transform: `translateX(${startDistance})` },
    { transform: 'translateX(0)' }
  ], { duration: 600, easing: Easing.easeInOut, ...options });
}

export default {
  $,
  animate,
  scaleIn,
  scaleOut,
  slideIn,
  slideOut,
  reflow,
  nextFrame,
  doubleRaf,
  prefersReducedMotion,
  getDuration,
  cancelAnimations,
  pauseAnimations,
  playAnimations,
  carouselSlide,
  carouselSlideIn,
  Easing
};