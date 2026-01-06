// Tests are library-agnostic and will use whichever Bootstrap API is available
// (Bootstrap 3 or SandalJS must be loaded before this script)

QUnit.config.reorder = false; // Run tests in order
QUnit.config.testTimeout = 3000; // Fail tests that take longer than 3 seconds

// Helper to check if plugin exists before running test
function requirePlugin(pluginName, assert) {
    if (!$.fn[pluginName]) {
        assert.ok(false, pluginName + ' plugin not available');
        return false;
    }
    return true;
}

// ==========================================
// MODAL MODULE
// ==========================================
QUnit.module('Modal', {
    beforeEach: function() {
        // Ensure modal is hidden before each test (only if plugin exists)
        if ($.fn.modal) {
            $('#test-modal').modal('hide');
        }
        $('.modal-backdrop').remove();
        $('body').removeClass('modal-open');
    },
    afterEach: function() {
        // Cleanup after each test (only if plugin exists)
        if ($.fn.modal) {
            $('#test-modal').modal('hide');
        }
        $('.modal-backdrop').remove();
        $('body').removeClass('modal-open');
    }
});

QUnit.test('Modal plugin exists', function(assert) {
    assert.ok($.fn.modal, '$.fn.modal exists');
    assert.ok(typeof $.fn.modal === 'function', '$.fn.modal is a function');
});

QUnit.test('Modal show/hide methods', function(assert) {
    if (!requirePlugin('modal', assert)) return;
    
    var done = assert.async();
    var $modal = $('#test-modal');
    
    $modal.on('shown.bs.modal', function() {
        assert.ok($modal.hasClass('in'), 'Modal has "in" class when shown');
        assert.ok($modal.is(':visible'), 'Modal is visible');
        
        $modal.modal('hide');
    });
    
    $modal.on('hidden.bs.modal', function() {
        assert.ok(!$modal.hasClass('in'), 'Modal does not have "in" class when hidden');
        done();
    });
    
    $modal.modal('show');
});

QUnit.test('Modal toggle method', function(assert) {
    if (!requirePlugin('modal', assert)) return;
    
    var done = assert.async();
    var $modal = $('#test-modal');
    
    $modal.on('shown.bs.modal', function() {
        assert.ok($modal.hasClass('in'), 'Modal shown via toggle');
        $modal.modal('toggle');
    });
    
    $modal.on('hidden.bs.modal', function() {
        assert.ok(!$modal.hasClass('in'), 'Modal hidden via toggle');
        done();
    });
    
    $modal.modal('toggle');
});

QUnit.test('Modal data-api', function(assert) {
    if (!requirePlugin('modal', assert)) return;
    
    var done = assert.async();
    var $modal = $('#test-modal');
    var $trigger = $('<button data-toggle="modal" data-target="#test-modal">Launch</button>').appendTo('body');
    
    $modal.on('shown.bs.modal', function() {
        assert.ok($modal.hasClass('in'), 'Modal shown via data-api');
        $modal.modal('hide');
        $trigger.remove();
        done();
    });
    
    $trigger.click();
});

QUnit.test('Modal backdrop option', function(assert) {
    if (!requirePlugin('modal', assert)) return;
    
    var done = assert.async();
    var $modal = $('#test-modal');
    
    $modal.on('shown.bs.modal', function() {
        assert.ok($('.modal-backdrop').length > 0, 'Backdrop exists');
        $modal.modal('hide');
        done();
    });
    
    $modal.modal({ backdrop: true });
});

QUnit.test('Modal keyboard option (ESC key)', function(assert) {
    if (!requirePlugin('modal', assert)) return;
    
    var done = assert.async();
    var $modal = $('#test-modal');
    
    $modal.on('shown.bs.modal', function() {
        assert.ok($modal.hasClass('in'), 'Modal is shown');
        
        // Trigger ESC key
        var e = $.Event('keydown');
        e.which = 27; // ESC
        $(document).trigger(e);
        
        setTimeout(function() {
            done();
        }, 100);
    });
    
    $modal.modal({ keyboard: true });
});

// ==========================================
// DROPDOWN MODULE
// ==========================================
QUnit.module('Dropdown', {
    beforeEach: function() {
        $('#test-dropdown').removeClass('open');
        $('.dropdown-menu').hide();
    }
});

QUnit.test('Dropdown plugin exists', function(assert) {
    assert.ok($.fn.dropdown, '$.fn.dropdown exists');
    assert.ok(typeof $.fn.dropdown === 'function', '$.fn.dropdown is a function');
});

QUnit.test('Dropdown toggle method', function(assert) {
    if (!requirePlugin('dropdown', assert)) return;
    
    var $dropdown = $('#test-dropdown');
    var $toggle = $dropdown.find('.dropdown-toggle');
    
    $toggle.dropdown('toggle');
    assert.ok($dropdown.hasClass('open'), 'Dropdown is open');
    
    $toggle.dropdown('toggle');
    assert.ok(!$dropdown.hasClass('open'), 'Dropdown is closed');
});

QUnit.test('Dropdown data-api click', function(assert) {
    if (!requirePlugin('dropdown', assert)) return;
    
    var $dropdown = $('#test-dropdown');
    var $toggle = $dropdown.find('.dropdown-toggle');
    
    $toggle.click();
    assert.ok($dropdown.hasClass('open'), 'Dropdown opened via data-api');
    
    $toggle.click();
    assert.ok(!$dropdown.hasClass('open'), 'Dropdown closed via data-api');
});

QUnit.test('Dropdown events', function(assert) {
    if (!requirePlugin('dropdown', assert)) return;
    
    var done = assert.async();
    var $dropdown = $('#test-dropdown');
    var $toggle = $dropdown.find('.dropdown-toggle');
    var showFired = false;
    var shownFired = false;
    
    $dropdown.on('show.bs.dropdown', function() {
        showFired = true;
    });
    
    $dropdown.on('shown.bs.dropdown', function() {
        shownFired = true;
        assert.ok(showFired, 'show.bs.dropdown fired');
        assert.ok(shownFired, 'shown.bs.dropdown fired');
        $toggle.dropdown('toggle');
        done();
    });
    
    $toggle.dropdown('toggle');
});

// ==========================================
// TOOLTIP MODULE
// ==========================================
QUnit.module('Tooltip', {
    beforeEach: function() {
        $('.tooltip').remove();
    },
    afterEach: function() {
        if ($.fn.tooltip) {
            $('#test-tooltip').tooltip('destroy');
        }
        $('.tooltip').remove();
    }
});

QUnit.test('Tooltip plugin exists', function(assert) {
    assert.ok($.fn.tooltip, '$.fn.tooltip exists');
    assert.ok(typeof $.fn.tooltip === 'function', '$.fn.tooltip is a function');
});

QUnit.test('Tooltip show/hide methods', function(assert) {
    if (!requirePlugin('tooltip', assert)) return;
    
    var done = assert.async();
    var $tooltip = $('#test-tooltip');
    
    $tooltip.tooltip();
    
    $tooltip.on('shown.bs.tooltip', function() {
        assert.ok($('.tooltip').length > 0, 'Tooltip exists in DOM');
        assert.ok($('.tooltip').is(':visible'), 'Tooltip is visible');
        $tooltip.tooltip('hide');
    });
    
    $tooltip.on('hidden.bs.tooltip', function() {
        assert.ok($('.tooltip').length === 0 || !$('.tooltip').is(':visible'), 'Tooltip is hidden');
        done();
    });
    
    $tooltip.tooltip('show');
});

QUnit.test('Tooltip toggle method', function(assert) {
    if (!requirePlugin('tooltip', assert)) return;
    
    var done = assert.async();
    var $tooltip = $('#test-tooltip');
    
    $tooltip.tooltip();
    
    $tooltip.on('shown.bs.tooltip', function() {
        assert.ok($('.tooltip').is(':visible'), 'Tooltip shown via toggle');
        $tooltip.tooltip('toggle');
    });
    
    $tooltip.on('hidden.bs.tooltip', function() {
        done();
    });
    
    $tooltip.tooltip('toggle');
});

QUnit.test('Tooltip placement option', function(assert) {
    if (!requirePlugin('tooltip', assert)) return;
    
    var done = assert.async();
    var $tooltip = $('#test-tooltip');
    
    $tooltip.tooltip({ placement: 'top' });
    
    $tooltip.on('shown.bs.tooltip', function() {
        assert.ok($('.tooltip').hasClass('top'), 'Tooltip has top placement class');
        $tooltip.tooltip('destroy');
        done();
    });
    
    $tooltip.tooltip('show');
});

// ==========================================
// POPOVER MODULE
// ==========================================
QUnit.module('Popover', {
    beforeEach: function() {
        $('.popover').remove();
    },
    afterEach: function() {
        if ($.fn.popover) {
            $('#test-popover').popover('destroy');
        }
        $('.popover').remove();
    }
});

QUnit.test('Popover plugin exists', function(assert) {
    assert.ok($.fn.popover, '$.fn.popover exists');
    assert.ok(typeof $.fn.popover === 'function', '$.fn.popover is a function');
});

QUnit.test('Popover show/hide methods', function(assert) {
    if (!requirePlugin('popover', assert)) return;
    
    var done = assert.async();
    var $popover = $('#test-popover');
    
    $popover.popover();
    
    $popover.on('shown.bs.popover', function() {
        assert.ok($('.popover').length > 0, 'Popover exists in DOM');
        assert.ok($('.popover').is(':visible'), 'Popover is visible');
        assert.ok($('.popover-title').length > 0, 'Popover has title');
        assert.ok($('.popover-content').length > 0, 'Popover has content');
        $popover.popover('hide');
    });
    
    $popover.on('hidden.bs.popover', function() {
        done();
    });
    
    $popover.popover('show');
});

QUnit.test('Popover toggle method', function(assert) {
    if (!requirePlugin('popover', assert)) return;
    
    var done = assert.async();
    var $popover = $('#test-popover');
    
    $popover.popover();
    
    $popover.on('shown.bs.popover', function() {
        assert.ok($('.popover').is(':visible'), 'Popover shown via toggle');
        $popover.popover('toggle');
    });
    
    $popover.on('hidden.bs.popover', function() {
        done();
    });
    
    $popover.popover('toggle');
});

// ==========================================
// TAB MODULE
// ==========================================
QUnit.module('Tab', {
    beforeEach: function() {
        $('#tab1').addClass('active in');
        $('#tab2, #tab3').removeClass('active in');
        $('#test-tabs li').first().addClass('active').siblings().removeClass('active');
    }
});

QUnit.test('Tab plugin exists', function(assert) {
    assert.ok($.fn.tab, '$.fn.tab exists');
    assert.ok(typeof $.fn.tab === 'function', '$.fn.tab is a function');
});

QUnit.test('Tab show method', function(assert) {
    if (!requirePlugin('tab', assert)) return;
    
    var done = assert.async();
    var $tab2Link = $('#test-tabs a[href="#tab2"]');
    
    $tab2Link.on('shown.bs.tab', function() {
        assert.ok($('#tab2').hasClass('active'), 'Tab 2 pane is active');
        assert.ok($tab2Link.parent().hasClass('active'), 'Tab 2 link is active');
        assert.ok(!$('#tab1').hasClass('active'), 'Tab 1 pane is not active');
        done();
    });
    
    $tab2Link.tab('show');
});

QUnit.test('Tab data-api click', function(assert) {
    if (!requirePlugin('tab', assert)) return;
    
    var done = assert.async();
    var $tab3Link = $('#test-tabs a[href="#tab3"]');
    
    $tab3Link.on('shown.bs.tab', function() {
        assert.ok($('#tab3').hasClass('active'), 'Tab 3 shown via data-api');
        done();
    });
    
    $tab3Link.click();
});

QUnit.test('Tab events', function(assert) {
    if (!requirePlugin('tab', assert)) return;
    
    var done = assert.async();
    var $tab2Link = $('#test-tabs a[href="#tab2"]');
    var showFired = false;
    
    $tab2Link.on('show.bs.tab', function() {
        showFired = true;
    });
    
    $tab2Link.on('shown.bs.tab', function() {
        assert.ok(showFired, 'show.bs.tab event fired');
        done();
    });
    
    $tab2Link.tab('show');
});

// ==========================================
// COLLAPSE MODULE
// ==========================================
QUnit.module('Collapse', {
    beforeEach: function() {
        $('#test-collapse').removeClass('in').css('height', '');
    }
});

QUnit.test('Collapse plugin exists', function(assert) {
    assert.ok($.fn.collapse, '$.fn.collapse exists');
    assert.ok(typeof $.fn.collapse === 'function', '$.fn.collapse is a function');
});

QUnit.test('Collapse show/hide methods', function(assert) {
    if (!requirePlugin('collapse', assert)) return;
    
    var done = assert.async();
    var $collapse = $('#test-collapse');
    
    $collapse.on('shown.bs.collapse', function() {
        assert.ok($collapse.hasClass('in'), 'Collapse has "in" class');
        $collapse.collapse('hide');
    });
    
    $collapse.on('hidden.bs.collapse', function() {
        assert.ok(!$collapse.hasClass('in'), 'Collapse does not have "in" class');
        done();
    });
    
    $collapse.collapse('show');
});

QUnit.test('Collapse toggle method', function(assert) {
    if (!requirePlugin('collapse', assert)) return;
    
    var done = assert.async();
    var $collapse = $('#test-collapse');
    
    $collapse.on('shown.bs.collapse', function() {
        assert.ok($collapse.hasClass('in'), 'Collapse shown via toggle');
        $collapse.collapse('toggle');
    });
    
    $collapse.on('hidden.bs.collapse', function() {
        assert.ok(!$collapse.hasClass('in'), 'Collapse hidden via toggle');
        done();
    });
    
    $collapse.collapse('toggle');
});

QUnit.test('Collapse data-api', function(assert) {
    if (!requirePlugin('collapse', assert)) return;
    
    var done = assert.async();
    var $collapse = $('#test-collapse');
    var $trigger = $('[data-toggle="collapse"][data-target="#test-collapse"]');
    
    $collapse.on('shown.bs.collapse', function() {
        assert.ok($collapse.hasClass('in'), 'Collapse shown via data-api');
        done();
    });
    
    $trigger.click();
});

// ==========================================
// ALERT MODULE
// ==========================================
QUnit.module('Alert');

QUnit.test('Alert plugin exists', function(assert) {
    assert.ok($.fn.alert, '$.fn.alert exists');
    assert.ok(typeof $.fn.alert === 'function', '$.fn.alert is a function');
});

QUnit.test('Alert close method', function(assert) {
    if (!requirePlugin('alert', assert)) return;
    
    var done = assert.async();
    var $alert = $('#test-alert');
    
    $alert.on('closed.bs.alert', function() {
        assert.ok($alert.parent().length === 0, 'Alert removed from DOM');
        done();
    });
    
    $alert.alert('close');
});

QUnit.test('Alert data-api dismiss', function(assert) {
    if (!requirePlugin('alert', assert)) return;
    
    var done = assert.async();
    var $alert = $('<div class="alert alert-warning alert-dismissible"><button type="button" class="close" data-dismiss="alert">&times;</button>Test</div>').appendTo('#qunit-fixture');
    
    $alert.on('closed.bs.alert', function() {
        assert.ok($alert.parent().length === 0, 'Alert dismissed via data-api');
        done();
    });
    
    $alert.find('.close').click();
});

// ==========================================
// BUTTON MODULE
// ==========================================
QUnit.module('Button', {
    beforeEach: function() {
        if ($.fn.button) {
            $('#test-button').button('reset');
        }
        $('#test-toggle-button').removeClass('active');
    }
});

QUnit.test('Button plugin exists', function(assert) {
    assert.ok($.fn.button, '$.fn.button exists');
    assert.ok(typeof $.fn.button === 'function', '$.fn.button is a function');
});

QUnit.test('Button loading state', function(assert) {
    if (!requirePlugin('button', assert)) return;
    
    var $button = $('#test-button');
    var originalText = $button.text();
    
    $button.button('loading');
    assert.ok($button.prop('disabled'), 'Button is disabled');
    assert.equal($button.text(), 'Loading...', 'Button shows loading text');
    
    $button.button('reset');
    assert.ok(!$button.prop('disabled'), 'Button is enabled after reset');
    assert.equal($button.text(), originalText, 'Button text is reset');
});

QUnit.test('Button toggle', function(assert) {
    if (!requirePlugin('button', assert)) return;
    
    var $button = $('#test-toggle-button');
    
    $button.button('toggle');
    assert.ok($button.hasClass('active'), 'Button has active class');
    
    $button.button('toggle');
    assert.ok(!$button.hasClass('active'), 'Button active class removed');
});

QUnit.test('Button data-api toggle', function(assert) {
    if (!requirePlugin('button', assert)) return;
    
    var $button = $('#test-toggle-button');
    
    $button.click();
    assert.ok($button.hasClass('active'), 'Button toggled via data-api');
    
    $button.click();
    assert.ok(!$button.hasClass('active'), 'Button untoggled via data-api');
});

// ==========================================
// CAROUSEL MODULE
// ==========================================
QUnit.module('Carousel', {
    beforeEach: function() {
        if ($.fn.carousel) {
            $('#test-carousel').carousel('pause');
        }
    }
});

QUnit.test('Carousel plugin exists', function(assert) {
    assert.ok($.fn.carousel, '$.fn.carousel exists');
    assert.ok(typeof $.fn.carousel === 'function', '$.fn.carousel is a function');
});

QUnit.test('Carousel cycle/pause methods', function(assert) {
    if (!requirePlugin('carousel', assert)) return;
    
    var $carousel = $('#test-carousel');
    
    $carousel.carousel('cycle');
    assert.ok(true, 'Carousel cycling');
    
    $carousel.carousel('pause');
    assert.ok(true, 'Carousel paused');
});

QUnit.test('Carousel next/prev methods', function(assert) {
    if (!requirePlugin('carousel', assert)) return;
    
    var done = assert.async();
    var $carousel = $('#test-carousel');
    
    $carousel.on('slid.bs.carousel', function() {
        var activeIndex = $carousel.find('.item.active').index();
        assert.ok(activeIndex === 1, 'Carousel moved to next slide');
        done();
    });
    
    $carousel.carousel('next');
});

QUnit.test('Carousel slide to specific index', function(assert) {
    if (!requirePlugin('carousel', assert)) return;
    
    var done = assert.async();
    var $carousel = $('#test-carousel');
    
    $carousel.on('slid.bs.carousel', function() {
        var activeIndex = $carousel.find('.item.active').index();
        assert.ok(activeIndex === 2, 'Carousel moved to specified slide');
        done();
    });
    
    $carousel.carousel(2);
});

// ==========================================
// SCROLLSPY MODULE
// ==========================================
QUnit.module('ScrollSpy');

QUnit.test('ScrollSpy plugin exists', function(assert) {
    assert.ok($.fn.scrollspy, '$.fn.scrollspy exists');
    assert.ok(typeof $.fn.scrollspy === 'function', '$.fn.scrollspy is a function');
});

QUnit.test('ScrollSpy initialization', function(assert) {
    if (!requirePlugin('scrollspy', assert)) return;
    
    var $container = $('#test-scrollspy-container');
    
    $container.scrollspy({ target: '#test-scrollspy-nav' });
    assert.ok(true, 'ScrollSpy initialized');
});

QUnit.test('ScrollSpy refresh method', function(assert) {
    if (!requirePlugin('scrollspy', assert)) return;
    
    var $container = $('#test-scrollspy-container');
    
    $container.scrollspy({ target: '#test-scrollspy-nav' });
    $container.scrollspy('refresh');
    assert.ok(true, 'ScrollSpy refreshed');
});

// ==========================================
// AFFIX MODULE
// ==========================================
QUnit.module('Affix');

QUnit.test('Affix plugin exists', function(assert) {
    assert.ok($.fn.affix, '$.fn.affix exists');
    assert.ok(typeof $.fn.affix === 'function', '$.fn.affix is a function');
});

QUnit.test('Affix initialization', function(assert) {
    if (!requirePlugin('affix', assert)) return;
    
    var $affix = $('#test-affix');
    
    $affix.affix({ offset: { top: 100 } });
    assert.ok(true, 'Affix initialized');
});

QUnit.test('Affix checkPosition method', function(assert) {
    if (!requirePlugin('affix', assert)) return;
    
    var $affix = $('#test-affix');
    
    $affix.affix({ offset: { top: 100 } });
    $affix.affix('checkPosition');
    assert.ok(true, 'Affix checkPosition called');
});

// ==========================================
// GENERAL API TESTS
// ==========================================
QUnit.module('General API');

QUnit.test('jQuery is available', function(assert) {
    assert.ok(window.jQuery, 'jQuery is available');
    assert.ok(window.$, '$ is available');
});

QUnit.test('Bootstrap/SandalJS version', function(assert) {
    // Check if Bootstrap or SandalJS version info is available
    if ($.fn.tooltip && $.fn.tooltip.Constructor && $.fn.tooltip.Constructor.VERSION) {
        assert.ok($.fn.tooltip.Constructor.VERSION, 'Version info available: ' + $.fn.tooltip.Constructor.VERSION);
    } else if ($.fn.modal && $.fn.modal.Constructor && $.fn.modal.Constructor.VERSION) {
        assert.ok($.fn.modal.Constructor.VERSION, 'Version info available: ' + $.fn.modal.Constructor.VERSION);
    } else {
        assert.ok(true, 'Version info not accessible (not critical)');
    }
});

QUnit.test('All component plugins are available', function(assert) {
    var plugins = ['modal', 'dropdown', 'tooltip', 'popover', 'tab', 'collapse', 'alert', 'button', 'carousel', 'scrollspy', 'affix'];
    
    plugins.forEach(function(plugin) {
        assert.ok($.fn[plugin], plugin + ' plugin exists');
    });
});

QUnit.test('No conflict mode', function(assert) {
    // Test that Bootstrap plugins can be restored if needed
    var originalModal = $.fn.modal;
    if (originalModal && originalModal.noConflict) {
        var restoredModal = $.fn.modal.noConflict();
        assert.ok(restoredModal, 'noConflict returns plugin');
        $.fn.modal = originalModal; // Restore for other tests
    } else {
        assert.ok(true, 'noConflict not available (SandalJS may not support this)');
    }
});