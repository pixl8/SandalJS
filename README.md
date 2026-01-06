# SandalJS

A modern, lightweight JavaScript library providing **Bootstrap 3 API compatibility** powered by JQNext. Designed as a drop-in replacement for Bootstrap 3's JavaScript components with full jQuery 2.x compatibility.

## Features

- **Bootstrap 3 API Compatible** - Same jQuery plugin interface (`$.fn.modal`, `$.fn.dropdown`, etc.)
- **Powered by JQNext** - Built on JQNext for full jQuery 2.x API compatibility
- **Modern JavaScript Internals** - Uses ES6+ classes, async/await, modern DOM APIs
- **jQuery UI Compatible** - Works seamlessly with jQuery UI 1.11.x
- **Smaller Bundle Size** - Leverages modern browser capabilities
- **Modern Browser APIs**:
  - **Web Animation API** - Smooth, performant animations (for advanced effects)
  - **Intersection Observer** - Efficient scroll-based features
  - **ES Modules** - Tree-shakeable imports
  - **CSS Custom Properties** - Themeable styles

## Components

| Component | Modern APIs Used | Description |
|-----------|-----------------|-------------|
| **Modal** | Web Animation API | Dialog boxes with backdrop |
| **Dropdown** | Event delegation | Toggle menus |
| **Tooltip** | Positioning utilities | Hover hints |
| **Popover** | Extends Tooltip | Rich content tooltips |
| **Tab** | CSS transitions | Tabbed interfaces |
| **Collapse** | Web Animation API | Collapsible content |
| **Alert** | Web Animation API | Dismissible alerts |
| **Button** | State management | Toggle/loading states |
| **Carousel** | Web Animation API | Slideshows |
| **Scrollspy** | Intersection Observer | Scroll position tracking |
| **Affix** | Intersection Observer | Sticky positioning |

## Modern JavaScript Patterns

### Architecture

SandalJS is built on top of **JQNext**, a modern jQuery 2.x compatible library. This provides:
- Full DOM manipulation via jQuery API
- Event handling with proper namespacing
- jQuery UI 1.11.x compatibility
- Smaller footprint than legacy jQuery

### Utility Modules

```
src/utils/
├── dom.js        # Unique DOM helpers (viewport, focus, data attributes)
├── events.js     # Unique event utilities (debounce, throttle, CSS transitions)
├── animation.js  # Advanced Web Animation API wrappers
├── position.js   # Element positioning calculations
└── index.js      # Unified exports
```

**Note:** Most DOM/event operations now use JQNext directly. Utilities provide only unique functionality not available in JQNext.

### Advanced Animation Utilities (`utils/animation.js`)
- `scaleIn()`, `scaleOut()` - Scale animations
- `slideIn()`, `slideOut()` - Directional slide animations
- `carouselSlide()` - Carousel-specific animations
- `reflow()` - Force layout recalculation
- Uses **Web Animation API** for 60fps animations

### Unique Event Utilities (`utils/events.js`)
- `debounce()`, `throttle()` - Function rate limiting
- `onTransitionEnd()`, `onAnimationEnd()` - CSS animation helpers
- `isKey()`, `Keys` - Keyboard navigation helpers

### Positioning Utilities (`utils/position.js`)
- `computePosition()` - Calculate element positions (Floating UI integration)
- `applyPosition()` - Apply positioning styles
- `autoUpdate()` - Responsive position updates

## jQuery Compatibility

SandalJS uses **JQNext** for jQuery 2.x compatibility, providing:

```javascript
// All Bootstrap 3 patterns work with JQNext:
$('#myModal').modal('show');
$('[data-toggle="dropdown"]').dropdown();
$('.tooltip').tooltip({ placement: 'top' });
$('#collapse').collapse('toggle');

// Full jQuery 2.x API available:
$('.element').fadeIn().addClass('active');
$('.parent').find('.child').on('click', handler);
```

### Supported Features
- **Full jQuery 2.x API** - DOM, events, effects, AJAX, utilities
- **jQuery UI 1.11.x Compatible** - Widget factory and all UI components work
- `$.fn.<plugin>` - All Bootstrap jQuery plugin methods
- `$.fn.<plugin>.Constructor` - Access to component class
- `$.fn.<plugin>.noConflict()` - Restore previous plugin
- `$.support.transition` - Transition detection
- `$.fn.emulateTransitionEnd()` - Transition timeout helper

### Data API
Automatic initialization via data attributes:
- `data-toggle="modal"`, `data-toggle="dropdown"`, etc.
- `data-dismiss="alert"`, `data-dismiss="modal"`
- `data-spy="scroll"`, `data-spy="affix"`
- `data-ride="carousel"`

## Preside CMS Integration

SandalJS and JQNext are designed for [Preside CMS](https://www.preside.org/):
- JQNext automatically sets `window.presideJQuery` for compatibility
- `.presidecms` namespace prefix for data-api selectors
- `$=` (ends-with) attribute selectors for flexible data attributes

## Installation

```bash
# Install dependencies (includes JQNext)
npm install

# Build the library
npm run build
```

SandalJS requires **JQNext** as a dependency, which provides full jQuery 2.x compatibility.

## Build Output

```
dist/
├── sandal.js       # UMD bundle (development)
├── sandal.min.js   # UMD bundle (production)
└── sandal.esm.js   # ES module bundle
```

## Usage

### As jQuery Plugin (Bootstrap 3 Compatible)
```html
<!-- JQNext provides jQuery compatibility -->
<script src="jqnext.min.js"></script>
<script src="sandal.min.js"></script>
<link href="sandal.css" rel="stylesheet">
```

### As ES Module
```javascript
// JQNext is automatically imported as a dependency
import Sandal from 'sandaljs';
import $ from 'jqnext'; // jQuery-compatible API

// Use Bootstrap components
const modal = new Sandal.Modal(element, options);

// Or use jQuery plugin API
$('#myModal').modal('show');
```

## Browser Support

Modern browsers (ES6+):
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

Requires (via JQNext):
- ES6 Classes, Promises, WeakMap/Set
- Fetch API (for AJAX)
- Web Animation API (for effects)

Additional (optional):
- Intersection Observer API (for Scrollspy/Affix)
- Floating UI (for enhanced tooltip/popover positioning)

## API Reference

### Modal
```javascript
$('#modal').modal(options);
$('#modal').modal('show');
$('#modal').modal('hide');
$('#modal').modal('toggle');
```

### Dropdown
```javascript
$('.dropdown-toggle').dropdown();
$('.dropdown-toggle').dropdown('toggle');
```

### Tooltip
```javascript
$('[data-toggle="tooltip"]').tooltip({
  placement: 'top',    // top, bottom, left, right
  trigger: 'hover',    // hover, focus, click, manual
  title: 'Tooltip text'
});
```

### Popover
```javascript
$('[data-toggle="popover"]').popover({
  placement: 'right',
  trigger: 'click',
  title: 'Title',
  content: 'Content'
});
```

### Collapse
```javascript
$('#collapse').collapse('show');
$('#collapse').collapse('hide');
$('#collapse').collapse('toggle');
```

### Tab
```javascript
$('a[data-toggle="tab"]').tab('show');
```

### Alert
```javascript
$('.alert').alert('close');
```

### Button
```javascript
$('.btn').button('toggle');
$('.btn').button('loading');
$('.btn').button('reset');
```

### Carousel
```javascript
$('.carousel').carousel({
  interval: 5000,
  pause: 'hover',
  wrap: true
});
$('.carousel').carousel('next');
$('.carousel').carousel('prev');
$('.carousel').carousel(2); // Go to slide
```

### Scrollspy
```javascript
$('body').scrollspy({ target: '#navbar' });
$('body').scrollspy('refresh');
```

### Affix
```javascript
$('#sidebar').affix({
  offset: { top: 100, bottom: 200 }
});
```

## Events

All components emit Bootstrap 3 compatible events:

```javascript
$('#modal').on('show.bs.modal', function(e) {
  // Before show
});

$('#modal').on('shown.bs.modal', function(e) {
  // After shown
});

$('#modal').on('hide.bs.modal', function(e) {
  // Before hide
});

$('#modal').on('hidden.bs.modal', function(e) {
  // After hidden
});
```

## CSS Variables

Sandal uses CSS custom properties for easy theming:

```css
:root {
  --sandal-modal-backdrop-bg: rgba(0, 0, 0, 0.5);
  --sandal-modal-z-index: 1050;
  --sandal-tooltip-bg: #000;
  --sandal-tooltip-color: #fff;
  --sandal-dropdown-z-index: 1000;
  --sandal-transition-fast: all 0.15s ease-out;
  --sandal-transition-normal: all 0.3s ease-out;
}
```

## Dependencies

- **[JQNext](../jqnext/)** - Modern jQuery 2.x compatible library
- **[@floating-ui/dom](https://floating-ui.com/)** (optional) - Enhanced positioning for tooltips/popovers

## License

MIT

## Credits

- Built on [JQNext](../jqnext/) for jQuery 2.x compatibility
- Inspired by Bootstrap 3 by Twitter
- Modern implementation for Preside CMS
- Produced by Ready Intelligence