import $ from 'jqnext';
import Modal from './components/modal.js';
import Dropdown from './components/dropdown.js';
import Tooltip from './components/tooltip.js';
import Popover from './components/popover.js';
import Tab from './components/tab.js';
import Collapse from './components/collapse.js';
import Alert from './components/alert.js';
import Button from './components/button.js';
import Carousel from './components/carousel.js';
import Scrollspy from './components/scrollspy.js';
import Affix from './components/affix.js';

/**
 * SandalJS - Modern Bootstrap 3 API-compatible library
 * @class
 */
class Sandal {
  static VERSION = '1.3.0';
  
  constructor() {
    this.version = '1.3.0';
    this._components = new Map();
  }

  /**
   * Initialize a modal component
   * @param {HTMLElement|string} element - Modal element or selector
   * @param {Object} options - Modal options
   * @returns {Modal} Modal instance
   */
  modal(element, options = {}) {
    return new Modal(element, options);
  }

  /**
   * Initialize a dropdown component
   * @param {HTMLElement|string} element - Dropdown element or selector
   * @param {Object} options - Dropdown options
   * @returns {Dropdown} Dropdown instance
   */
  dropdown(element, options = {}) {
    return new Dropdown(element, options);
  }

  /**
   * Initialize a tooltip component
   * @param {HTMLElement|string} element - Tooltip element or selector
   * @param {Object} options - Tooltip options
   * @returns {Tooltip} Tooltip instance
   */
  tooltip(element, options = {}) {
    return new Tooltip(element, options);
  }

  /**
   * Initialize a popover component
   * @param {HTMLElement|string} element - Popover element or selector
   * @param {Object} options - Popover options
   * @returns {Popover} Popover instance
   */
  popover(element, options = {}) {
    return new Popover(element, options);
  }

  /**
   * Initialize a tab component
   * @param {HTMLElement|string} element - Tab element or selector
   * @param {Object} options - Tab options
   * @returns {Tab} Tab instance
   */
  tab(element, options = {}) {
    return new Tab(element, options);
  }

  /**
   * Initialize a collapse component
   * @param {HTMLElement|string} element - Collapse element or selector
   * @param {Object} options - Collapse options
   * @returns {Collapse} Collapse instance
   */
  collapse(element, options = {}) {
    return new Collapse(element, options);
  }

  /**
   * Initialize an alert component
   * @param {HTMLElement|string} element - Alert element or selector
   * @param {Object} options - Alert options
   * @returns {Alert} Alert instance
   */
  alert(element, options = {}) {
    return new Alert(element, options);
  }

  /**
   * Initialize a button component
   * @param {HTMLElement|string} element - Button element or selector
   * @param {Object} options - Button options
   * @returns {Button} Button instance
   */
  button(element, options = {}) {
    return new Button(element, options);
  }

  /**
   * Initialize a carousel component
   * @param {HTMLElement|string} element - Carousel element or selector
   * @param {Object} options - Carousel options
   * @returns {Carousel} Carousel instance
   */
  carousel(element, options = {}) {
    return new Carousel(element, options);
  }

  /**
   * Initialize a scrollspy component
   * @param {HTMLElement|string} element - Scrollspy element or selector
   * @param {Object} options - Scrollspy options
   * @returns {Scrollspy} Scrollspy instance
   */
  scrollspy(element, options = {}) {
    return new Scrollspy(element, options);
  }

  /**
   * Initialize an affix component
   * @param {HTMLElement|string} element - Affix element or selector
   * @param {Object} options - Affix options
   * @returns {Affix} Affix instance
   */
  affix(element, options = {}) {
    return new Affix(element, options);
  }

  /**
   * Initialize component by name (for programmatic use)
   * @param {string} componentName - Name of the component
   * @param {HTMLElement|string} element - Element or selector
   * @param {Object} options - Component options
   * @returns {Object|null} Component instance or null if not found
   */
  static initComponent(componentName, element, options = {}) {
    const ComponentClass = {
      modal: Modal,
      dropdown: Dropdown,
      tooltip: Tooltip,
      popover: Popover,
      tab: Tab,
      collapse: Collapse,
      alert: Alert,
      button: Button,
      carousel: Carousel,
      scrollspy: Scrollspy,
      affix: Affix
    }[componentName];

    if (ComponentClass) {
      return new ComponentClass(element, options);
    }
    return null;
  }

  /**
   * Get all active components
   * @returns {Map} Map of active components
   */
  getComponents() {
    return this._components;
  }

  /**
   * Destroy all components
   */
  destroy() {
    for (const [key, component] of this._components) {
      if (typeof component.destroy === 'function') {
        component.destroy();
      }
    }
    this._components.clear();
  }
}

// jQuery/presideJQuery compatibility layer using JQNext
// JQNext provides full jQuery 2.x compatibility and sets window.presideJQuery
(function() {
  // JQNext is already imported and sets window.jQuery, window.$, and window.presideJQuery
  // We use the imported $ which is JQNext

  // Add transition support detection (Bootstrap 3 requirement)
  function transitionEnd() {
    const el = document.createElement('bootstrap');
    const transEndEventNames = {
      'WebkitTransition': 'webkitTransitionEnd',
      'MozTransition': 'transitionend',
      'OTransition': 'oTransitionEnd otransitionend',
      'transition': 'transitionend'
    };

    for (const name in transEndEventNames) {
      if (el.style[name] !== undefined) {
        return { end: transEndEventNames[name] };
      }
    }
    return false;
  }

  // Add $.support.transition
  $(function() {
    $.support.transition = transitionEnd();
  });

  // Add $.fn.emulateTransitionEnd
  $.fn.emulateTransitionEnd = function(duration) {
    let called = false;
    const $el = this;
    $(this).one($.support.transition.end, function() { called = true; });
    const callback = function() { if (!called) $($el).trigger($.support.transition.end); };
    setTimeout(callback, duration);
    return this;
  };

  // Store old plugin references for noConflict
  const old = {
    modal: $.fn.modal,
    dropdown: $.fn.dropdown,
    tooltip: $.fn.tooltip,
    popover: $.fn.popover,
    tab: $.fn.tab,
    collapse: $.fn.collapse,
    alert: $.fn.alert,
    button: $.fn.button,
    carousel: $.fn.carousel,
    scrollspy: $.fn.scrollspy,
    affix: $.fn.affix
  };

  // Modal plugin
  $.fn.modal = function(option, _relatedTarget) {
    return this.each(function() {
      const $this = $(this);
      let data = Modal.getInstance(this);
      const options = $.extend({}, Modal.DEFAULTS || {}, $this.data(), typeof option === 'object' && option);

      if (!data && option !== 'dispose') {
        data = new Modal(this, options);
      }
      if (typeof option === 'string' && data) {
        data[option](_relatedTarget);
      } else if (data && options.show) {
        data.show(_relatedTarget);
      }
    });
  };
  $.fn.modal.Constructor = Modal;
  $.fn.modal.noConflict = function() { $.fn.modal = old.modal; return this; };

  // Dropdown plugin
  $.fn.dropdown = function(option) {
    return this.each(function() {
      const $this = $(this);
      let data = Dropdown.getInstance(this);

      if (!data && option !== 'dispose') {
        data = new Dropdown(this);
      }
      if (typeof option === 'string' && data) {
        data[option]();
      }
    });
  };
  $.fn.dropdown.Constructor = Dropdown;
  $.fn.dropdown.noConflict = function() { $.fn.dropdown = old.dropdown; return this; };

  // Tooltip plugin
  $.fn.tooltip = function(option) {
    return this.each(function() {
      const $this = $(this);
      let data = Tooltip.getInstance(this);
      const options = typeof option === 'object' && option;

      if (!data && option !== 'dispose') {
        data = new Tooltip(this, options);
      }
      if (typeof option === 'string' && data) {
        data[option]();
      }
    });
  };
  $.fn.tooltip.Constructor = Tooltip;
  $.fn.tooltip.noConflict = function() { $.fn.tooltip = old.tooltip; return this; };

  // Popover plugin
  $.fn.popover = function(option) {
    return this.each(function() {
      const $this = $(this);
      let data = Popover.getInstance(this);
      const options = typeof option === 'object' && option;

      if (!data && option !== 'dispose') {
        data = new Popover(this, options);
      }
      if (typeof option === 'string' && data) {
        data[option]();
      }
    });
  };
  $.fn.popover.Constructor = Popover;
  $.fn.popover.noConflict = function() { $.fn.popover = old.popover; return this; };

  // Tab plugin
  $.fn.tab = function(option) {
    return this.each(function() {
      const $this = $(this);
      let data = Tab.getInstance(this);

      if (!data && option !== 'dispose') {
        data = new Tab(this);
      }
      if (typeof option === 'string' && data) {
        data[option]();
      }
    });
  };
  $.fn.tab.Constructor = Tab;
  $.fn.tab.noConflict = function() { $.fn.tab = old.tab; return this; };

  // Collapse plugin
  $.fn.collapse = function(option) {
    return this.each(function() {
      const $this = $(this);
      let data = Collapse.getInstance(this);
      const options = $.extend({}, Collapse.DEFAULTS || {}, $this.data(), typeof option === 'object' && option);

      if (!data && option !== 'dispose') {
        data = new Collapse(this, options);
      }
      if (typeof option === 'string' && data) {
        data[option]();
      }
    });
  };
  $.fn.collapse.Constructor = Collapse;
  $.fn.collapse.noConflict = function() { $.fn.collapse = old.collapse; return this; };

  // Alert plugin
  $.fn.alert = function(option) {
    return this.each(function() {
      const $this = $(this);
      let data = Alert.getInstance(this);

      if (!data && option !== 'dispose') {
        data = new Alert(this);
      }
      if (typeof option === 'string' && data) {
        data[option]();
      }
    });
  };
  $.fn.alert.Constructor = Alert;
  $.fn.alert.noConflict = function() { $.fn.alert = old.alert; return this; };

  // Button plugin
  $.fn.button = function(option) {
    return this.each(function() {
      const $this = $(this);
      let data = Button.getInstance(this);
      const options = typeof option === 'object' && option;

      if (!data && option !== 'dispose') {
        data = new Button(this, options);
      }
      if (option === 'toggle' && data) {
        data.toggle();
      } else if (option && data) {
        data.setState(option);
      }
    });
  };
  $.fn.button.Constructor = Button;
  $.fn.button.noConflict = function() { $.fn.button = old.button; return this; };

  // Carousel plugin
  $.fn.carousel = function(option) {
    return this.each(function() {
      const $this = $(this);
      let data = Carousel.getInstance(this);
      const options = $.extend({}, Carousel.DEFAULTS || {}, $this.data(), typeof option === 'object' && option);
      const action = typeof option === 'string' ? option : options.slide;

      if (!data && option !== 'dispose') {
        data = new Carousel(this, options);
      }
      if (typeof option === 'number' && data) {
        data.to(option);
      } else if (action && data) {
        data[action]();
      } else if (data && options.interval) {
        data.pause().cycle();
      }
    });
  };
  $.fn.carousel.Constructor = Carousel;
  $.fn.carousel.noConflict = function() { $.fn.carousel = old.carousel; return this; };

  // Scrollspy plugin
  $.fn.scrollspy = function(option) {
    return this.each(function() {
      const $this = $(this);
      let data = Scrollspy.getInstance(this);
      const options = typeof option === 'object' && option;

      if (!data && option !== 'dispose') {
        data = new Scrollspy(this, options);
      }
      if (typeof option === 'string' && data) {
        data[option]();
      }
    });
  };
  $.fn.scrollspy.Constructor = Scrollspy;
  $.fn.scrollspy.noConflict = function() { $.fn.scrollspy = old.scrollspy; return this; };

  // Affix plugin
  $.fn.affix = function(option) {
    return this.each(function() {
      const $this = $(this);
      let data = Affix.getInstance(this);
      const options = typeof option === 'object' && option;

      if (!data && option !== 'dispose') {
        data = new Affix(this, options);
      }
      if (typeof option === 'string' && data) {
        data[option]();
      }
    });
  };
  $.fn.affix.Constructor = Affix;
  $.fn.affix.noConflict = function() { $.fn.affix = old.affix; return this; };

  // ===========================================
  // DATA-API (automatic initialization via data attributes)
  // ===========================================

  // Tab data-api - supports both Preside (.presidecms) and generic usage
  $(document).on('click.bs.tab.data-api', '[data-toggle$="tab"], [data-toggle$="pill"]', function(e) {
    e.preventDefault();
    $(this).tab('show');
  });

  // Modal data-api - supports both Preside (.presidecms) and generic usage
  $(document).on('click.bs.modal.data-api', '[data-toggle$="modal"]', function(e) {
    const $this = $(this);
    const href = $this.attr('href');
    const $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, '')));
    const option = $target.data('bs.modal') ? 'toggle' : $.extend({ remote: !/#/.test(href) && href }, $target.data(), $this.data());

    if ($this.is('a')) e.preventDefault();

    $target.modal(option, this);
  });

  // Dropdown data-api - supports both Preside (.presidecms) and generic usage
  $(document).on('click.bs.dropdown.data-api', '[data-toggle$=dropdown]', function(e) {
    e.preventDefault();
    e.stopPropagation();
    $(this).dropdown('toggle');
  });

  // Collapse data-api - supports both Preside (.presidecms) and generic usage
  $(document).on('click.bs.collapse.data-api', '[data-toggle$=collapse]', function(e) {
    const $this = $(this);
    let href;
    const target = $this.attr('data-target')
      || e.preventDefault()
      || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '');
    const $target = $(target);
    const data = $target.data('bs.collapse');
    const option = data ? 'toggle' : $this.data();

    $target.collapse(option);
  });

  // Alert data-api - supports both Preside (.presidecms) and generic usage
  $(document).on('click.bs.alert.data-api', '[data-dismiss="alert"]', function(e) {
    $(this).closest('.alert').alert('close');
    e.preventDefault();
  });

  // Button data-api - supports both Preside (.presidecms) and generic usage
  $(document).on('click.bs.button.data-api', '[data-toggle^=button]', function(e) {
    let $btn = $(e.target);
    if (!$btn.hasClass('btn')) $btn = $btn.closest('.btn');
    $btn.button('toggle');
    e.preventDefault();
  });

  // Global export
  if (typeof window !== 'undefined') {
    window.Sandal = Sandal;
  }
})();

export default Sandal;