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
    parser.add_argument('config', {}); // Allows the user to directly configure Raptor via JSON
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
            this.options = parser.parse(this.$el);
            /*
            var cfg = {
                layouts: {
                    toolbar: {
                        uiOrder: [
                            ['textBold', 'textItalic', 'textUnderline', 'textStrike',
                              'listOrdered', 'listUnordered', 'linkCreate', 'linkRemove',
                              'alignLeft', 'alignCenter', 'alignJustify', 'alignRight',
                              'hrCreate', 'tableCreate', 'historyUndo', 'historyRedo'
                            ]
                        ]
                    },
                    hoverPanel: { uiOrder: [ ['clickButtonToEdit'] ] },
                    elementHoverPanel: {
                        elements: 'img',
                        uiOrder: [
                            ['imageResize', 'imageSwap', 'close']
                        ]
                    },
                },
                // Load the toolbar by default
                autoEnable: true,
                // Make sure the toolbar is docked
                plugins: {
                    dock: {
                        docked: true,
                        dockToElement: true
                    }
                }
            };
            */
            $.extend(true, config, this.options.config);
            if (this.options.buttons instanceof Array) {
                config.layouts.toolbar.uiOrder = this.options.buttons;
            }
            this.$el.raptor(cfg);
        }
    });
}));


