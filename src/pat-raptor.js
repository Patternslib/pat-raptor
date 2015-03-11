(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([
            "jquery",
            "underscore",
            "pat-base",
            "pat-registry",
            "pat-parser",
            "jqueryui",
            "jquery-hotkeys",
            "rangy",
            "rangy-serializer",
            "raptor"
        ], function() {
            return factory.apply(this, arguments);
        });
    } else {
        factory($, _, Base, root.patterns, root.patterns.Parser);
    }
}(this, function($, _, Base, registry, Parser) {
    'use strict';
    var parser = new Parser('raptor');
    // Allows the user to directly configure Raptor via JSON
    parser.add_argument('config', {});
    parser.add_argument('toolbar-type', 'standard', ['standard', 'fixed', 'floating']);
    parser.add_argument('toolbar-external');
    parser.add_argument('toolbar-loading', 'auto', ['auto', 'click']);
    parser.add_argument('buttons',
            [ 'alignCenter', 'alignJustify', 'alignLeft', 'alignRight',
              'historyRedo', 'historyUndo', 'hrCreate', 'linkCreate',
              'linkRemove', 'listOrdered', 'listUnordered', 'tableCreate',
              'textBold', 'textItalic', 'textStrike', 'textUnderline'
            ], [
            'alignCenter', 'alignJustify', 'alignLeft', 'alignRight',
            'cancel', 'classMenu', 'cleanBlock', 'clearFormatting',
            'colorMenuBasic', 'dockToElement', 'dockToScreen', 'embed',
            'floatLeft', 'floatNone', 'floatRight', 'fontFamilyMenu',
            'guides', 'historyRedo', 'historyUndo', 'hrCreate',
            'insertFile', 'languageMenu', 'linkCreate', 'linkRemove',
            'listOrdered', 'listUnordered', 'logo', 'save',
            'snippetMenu', 'specialCharacters', 'statistics', 'tableCreate',
            'tableDeleteColumn', 'tableDeleteRow', 'tableInsertColumn', 'tableInsertRow',
            'tagMenu', 'textBlockQuote', 'textBold', 'textItalic',
            'textSizeDecrease', 'textSizeIncrease', 'textStrike', 'textSub',
            'textSuper', 'textUnderline', 'viewSource'
            ],
        true);

    return Base.extend({
        name: 'raptor',
        trigger: ".pat-raptor",

        init: function patRaptorInit() {
            var config = {
                layouts: { toolbar: {} },
                plugins: { dock: {} }
            };
            this.options = parser.parse(this.$el);
            config.autoEnable = (this.options.toolbar.loading === "auto") ? true : false;

            switch (this.options.toolbar.type) {
                case "floating":
                    config.plugins.dock.dockToElement = false;
                    config.plugins.dock.docked = false;
                    break;
                case "fixed":
                    config.plugins.dock.dockToElement = false;
                    config.plugins.dock.docked = true;
                    break;
                case "standard":
                    config.plugins.dock.dockToElement = true;
                    config.plugins.dock.docked = true;
                    break;
            }
            config.plugins.dock.dockTo = this.options.toolbar.external;

            $.extend(true, config, this.options.config);
            if (this.options.buttons instanceof Array && this.options.buttons.length) {
                config.layouts.toolbar.uiOrder = [this.options.buttons];
            }
            this.$el.raptor(config);
        }
    });
}));


