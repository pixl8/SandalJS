# SandalJS

A modern, lightweight JavaScript library providing **Bootstrap 3 API compatibility** while using modern browser APIs internally. Designed as a drop-in replacement for Bootstrap 3's JavaScript components.

## Features

- **Bootstrap 3 API Compatible** - Same jQuery plugin interface (`$.fn.modal`, `$.fn.dropdown`, etc.)
- **Modern JavaScript Internals** - Uses ES6+ classes, async/await, modern DOM APIs
- **Zero jQuery Dependencies** - Pure vanilla JS implementation (jQuery wrapper for compatibility)
- **Smaller Bundle Size** - No legacy polyfills or deprecated patterns
- **Modern Browser APIs**:
  - **Web Animation API** - Smooth, performant animations
  - **Intersection Observer** - Efficient scroll-based features
  - **WeakMap** - Memory-efficient instance storage
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

### Utility Modules

```
src/utils/
├── dom.js        # DOM selection, manipulation, attributes
├── events.js     # Event handling with delegation
├── animation.js  # Web Animation API wrappers
├── position.js   # Element positioning calculations
└── index.js      # Unified exports
```

### DOM Utilities (`utils/dom.js`)
- `$()` / `$$()` - querySelector/querySelectorAll wrappers
- `closest()`, `children()`, `siblings()` - DOM traversal
- `addClass()`, `removeClass()`, `hasClass()` - Class manipulation
- `setAttr()`, `getAttr()`, `removeAttr()` - Attribute handling
- `setInstance()`, `getInstance()` - WeakMap-based instance storage

### Animation Utilities (`utils/animation.js`)
- `slideDown()`, `slideUp()` - Animated height transitions
- `fadeIn()`, `fadeOut()` - Opacity transitions
- `reflow()` - Force layout recalculation
- Uses **Web Animation API** for smooth 60fps animations

### Event Utilities (`utils/events.js`)
- `on()`, `off()` - Event binding with delegation
- `trigger()` - Custom event dispatching
- `once()` - One-time event handlers

### Positioning Utilities (`utils/position.js`)
- `computePosition()` - Calculate element positions
- `applyPosition()` - Apply positioning styles
- `autoUpdate()` - Responsive position updates

## jQuery Compatibility Layer

Sandal provides full Bootstrap 3 jQuery plugin compatibility:

```javascript
// All Bootstrap 3 patterns work:
$('#myModal').modal('show');
$('[data-toggle="dropdown"]').dropdown();
$('.tooltip').tooltip({ placement: 'top' });
$('#collapse').collapse('toggle');
```

### Supported Features
- `$.fn.<plugin>` - All jQuery plugin methods
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

Sandal is designed for [Preside CMS](https://www.preside.org/) which uses:
- `window.presideJQuery` instead of `jQuery`
- `.presidecms` namespace prefix for data-api selectors
- `$=` (ends-with) attribute selectors

## Installation

```bash
npm install
npm run build
```

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
<script src="jquery.js"></script>
<script src="sandal.min.js"></script>
<link href="sandal.css" rel="stylesheet">
```

### As ES Module
```javascript
import Sandal from 'sandaljs';

const modal = new Sandal.Modal(element, options);
```

## Browser Support

Modern browsers (ES6+):
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

Requires:
- Web Animation API
- Intersection Observer API
- ES6 Classes
- WeakMap/Set

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

## License

MIT

## Credits

- Inspired by Bootstrap 3 by Twitter
- Modern implementation for Preside CMS