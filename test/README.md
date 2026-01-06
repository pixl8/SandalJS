# SandalJS Test Suite

This test suite allows you to verify that SandalJS maintains API compatibility with Bootstrap 3 by running identical tests against both libraries.

## Overview

The test infrastructure follows the same pattern as JQNext, providing two HTML files that run the same test suite against different JavaScript libraries:

- **test-bootstrap.html** - Tests against official Bootstrap 3.x JavaScript
- **test-sandaljs.html** - Tests against SandalJS

This approach ensures that SandalJS maintains full API compatibility with Bootstrap 3, allowing you to identify any behavioral differences.

## Setup

### Prerequisites

1. Build SandalJS first:
   ```bash
   cd website/sandaljs
   npm install
   npm run build
   ```

2. The test files should be ready to use. The directory structure:
   ```
   test/
   ├── lib/
   │   ├── qunit/          # QUnit testing framework
   │   │   ├── qunit.js
   │   │   ├── qunit.css
   │   │   └── jquery-2.2.5-sec.js  # jQuery 2.2.5 for QUnit
   │   ├── bootstrap.js    # Bootstrap 3.0.0.003 from Preside
   │   ├── jquery.js       # jQuery 2.2.5 for Bootstrap tests
   │   └── jqnext.js       # JQNext for SandalJS tests
   ├── test-bootstrap.html # Test runner for Bootstrap 3
   ├── test-sandaljs.html  # Test runner for SandalJS
   ├── tests.js            # Shared test suite
   └── README.md           # This file
   ```

## Running Tests

### Method 1: Open in Browser (Recommended)

Simply open the test HTML files in a web browser:

1. **Test Bootstrap 3:**
   ```
   Open: website/sandaljs/test/test-bootstrap.html
   ```

2. **Test SandalJS:**
   ```
   Open: website/sandaljs/test/test-sandaljs.html
   ```

The tests will run automatically and display results using QUnit's interface.

### Method 2: Use Live Server

If you have a local web server (e.g., VS Code's Live Server extension):

1. Start the server in the `website/sandaljs/test` directory
2. Navigate to:
   - `http://localhost:5500/test-bootstrap.html`
   - `http://localhost:5500/test-sandaljs.html`

## Test Coverage

The test suite covers all Bootstrap 3 JavaScript components with comprehensive tests for:

### 1. Modal Component
- **Methods:** `show()`, `hide()`, `toggle()`
- **Options:** `backdrop`, `keyboard`, `show`
- **Events:** `show.bs.modal`, `shown.bs.modal`, `hide.bs.modal`, `hidden.bs.modal`
- **Data API:** `data-toggle="modal"`, `data-target`

### 2. Dropdown Component
- **Methods:** `toggle()`
- **Events:** `show.bs.dropdown`, `shown.bs.dropdown`, `hide.bs.dropdown`, `hidden.bs.dropdown`
- **Data API:** `data-toggle="dropdown"`

### 3. Tooltip Component
- **Methods:** `show()`, `hide()`, `toggle()`, `destroy()`
- **Options:** `placement`, `trigger`, `title`, `delay`
- **Events:** `show.bs.tooltip`, `shown.bs.tooltip`, `hide.bs.tooltip`, `hidden.bs.tooltip`
- **Data API:** `data-toggle="tooltip"`, `data-placement`, `title`

### 4. Popover Component
- **Methods:** `show()`, `hide()`, `toggle()`, `destroy()`
- **Options:** `placement`, `trigger`, `title`, `content`
- **Events:** `show.bs.popover`, `shown.bs.popover`, `hide.bs.popover`, `hidden.bs.popover`
- **Data API:** `data-toggle="popover"`, `data-content`

### 5. Tab Component
- **Methods:** `show()`
- **Events:** `show.bs.tab`, `shown.bs.tab`, `hide.bs.tab`, `hidden.bs.tab`
- **Data API:** `data-toggle="tab"`, `href`

### 6. Collapse Component
- **Methods:** `show()`, `hide()`, `toggle()`
- **Options:** `parent`, `toggle`
- **Events:** `show.bs.collapse`, `shown.bs.collapse`, `hide.bs.collapse`, `hidden.bs.collapse`
- **Data API:** `data-toggle="collapse"`, `data-target`

### 7. Alert Component
- **Methods:** `close()`
- **Events:** `close.bs.alert`, `closed.bs.alert`
- **Data API:** `data-dismiss="alert"`

### 8. Button Component
- **Methods:** `toggle()`, `loading()`, `reset()`
- **Options:** `loading-text`
- **Data API:** `data-toggle="button"`, `data-loading-text`

### 9. Carousel Component
- **Methods:** `cycle()`, `pause()`, `next()`, `prev()`, slide number
- **Options:** `interval`, `pause`, `wrap`, `keyboard`
- **Events:** `slide.bs.carousel`, `slid.bs.carousel`
- **Data API:** `data-ride="carousel"`, `data-slide`, `data-slide-to`

### 10. ScrollSpy Component
- **Methods:** `refresh()`
- **Options:** `offset`, `target`
- **Events:** `activate.bs.scrollspy`
- **Data API:** `data-spy="scroll"`, `data-target`, `data-offset`

### 11. Affix Component
- **Methods:** `checkPosition()`
- **Options:** `offset`
- **Events:** `affix.bs.affix`, `affixed.bs.affix`, `affix-top.bs.affix`, `affix-bottom.bs.affix`
- **Data API:** `data-spy="affix"`, `data-offset-top`, `data-offset-bottom`

## Interpreting Results

### Success Indicators
- ✅ All tests pass (green)
- ✅ No JavaScript errors in console
- ✅ Same number of tests pass for both Bootstrap and SandalJS

### Common Issues

1. **Timing Issues**
   - Some tests use `assert.async()` for asynchronous operations
   - If tests timeout, animations may be taking longer than expected
   - Check that SandalJS animations complete properly

2. **Event Firing**
   - Bootstrap fires events at specific times
   - Ensure SandalJS fires events in the correct order
   - Check event namespaces (e.g., `.bs.modal`)

3. **DOM State**
   - Tests clean up after themselves
   - If a test fails, check if previous test cleanup failed
   - Refresh page and re-run if state seems corrupted

4. **CSS Dependencies**
   - Some components require Bootstrap CSS
   - Ensure Bootstrap CSS is loaded from CDN
   - SandalJS may include its own CSS (`sandal.css`)

## Test Development

### Adding New Tests

To add tests for new functionality:

1. Open `tests.js`
2. Add a new `QUnit.module()` for component or feature group
3. Add `QUnit.test()` cases following the pattern:

```javascript
QUnit.module('MyComponent', {
    beforeEach: function() {
        // Setup code
    },
    afterEach: function() {
        // Cleanup code
    }
});

QUnit.test('My test description', function(assert) {
    // For synchronous tests
    assert.ok(condition, 'Description');
});

QUnit.test('My async test', function(assert) {
    // For asynchronous tests
    var done = assert.async();
    
    $('#element').on('event.bs.component', function() {
        assert.ok(true, 'Event fired');
        done();
    });
    
    $('#element').component('method');
});
```

### Best Practices

1. **Test Isolation**
   - Each test should be independent
   - Use `beforeEach` and `afterEach` for setup/cleanup
   - Don't rely on test execution order

2. **Async Handling**
   - Use `assert.async()` for event-based tests
   - Always call `done()` to complete async tests
   - Set reasonable timeouts (QUnit default is 3000ms)

3. **DOM Cleanup**
   - Remove dynamically created elements
   - Reset component states
   - Remove event listeners

4. **Assertions**
   - Make assertions specific and meaningful
   - Test both positive and negative cases
   - Check events, methods, and data-api

## Comparison with Bootstrap

### Expected Differences

SandalJS may differ from Bootstrap 3 in these ways:

1. **Implementation**
   - Uses ES6+ features and modern APIs
   - Uses Web Animations API instead of jQuery animations
   - Uses JQNext instead of jQuery

2. **Performance**
   - Should be faster due to modern browser APIs
   - Smaller bundle size
   - Better tree-shaking support

3. **Feature Additions**
   - Modern animation options
   - Better accessibility
   - Additional configuration options

### What Should Be Identical

API compatibility must be maintained for:

1. **Method Names and Signatures**
   - All public methods work the same
   - Same parameter types accepted
   - Same return values

2. **Events**
   - Same event names
   - Same event namespaces
   - Events fire in same order

3. **Data API**
   - All `data-*` attributes work identically
   - Same initialization behavior
   - Same markup patterns

4. **Options**
   - All Bootstrap 3 options supported
   - Same default values
   - Same option types

## Continuous Integration

To integrate these tests into a CI/CD pipeline:

### Using Puppeteer

```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Test Bootstrap
  await page.goto('file:///path/to/test-bootstrap.html');
  const bootstrapResults = await page.evaluate(() => {
    return QUnit.config.stats;
  });
  
  // Test SandalJS
  await page.goto('file:///path/to/test-sandaljs.html');
  const sandalResults = await page.evaluate(() => {
    return QUnit.config.stats;
  });
  
  console.log('Bootstrap:', bootstrapResults);
  console.log('SandalJS:', sandalResults);
  
  await browser.close();
})();
```

### Using Karma

Add to `karma.conf.js`:

```javascript
files: [
  'test/lib/qunit/qunit.js',
  'test/lib/jqnext.js',
  'dist/sandal.js',
  'test/tests.js'
],
frameworks: ['qunit']
```

## Troubleshooting

### Tests Won't Run

1. Check browser console for errors
2. Verify all files are loaded (Network tab)
3. Ensure SandalJS is built (`npm run build`)
4. Check file paths are correct

### Tests Fail in One Library But Not the Other

1. Compare timing - add delays if needed
2. Check event order and firing
3. Verify option handling
4. Check DOM state before/after

### Slow Tests

1. Reduce animation durations for tests
2. Use `$.fx.off = true` to disable animations
3. Optimize test cleanup
4. Run tests in parallel

## Resources

- [Bootstrap 3 JavaScript Documentation](https://getbootstrap.com/docs/3.3/javascript/)
- [QUnit Documentation](https://qunitjs.com/)
- [W3Schools Bootstrap Tutorial](https://www.w3schools.com/bootstrap/default.asp)
- [SandalJS README](../README.md)

## Contributing

When contributing tests:

1. Follow existing test patterns
2. Test both success and failure cases
3. Ensure tests pass in both environments
4. Add documentation for complex tests
5. Keep tests focused and specific

## License

Same as SandalJS - MIT License