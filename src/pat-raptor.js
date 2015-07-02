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
    
    // Note, these relate to the File Manager plugin which is a premium plugin and not included in with this pattern.
    parser.add_argument('image-browse-url');
    parser.add_argument('image-upload-url');
    parser.add_argument('image-pick-icon');

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
            'textSuper', 'textUnderline', 'viewSource', 'fileManager'
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
            this.registerEventHandlers();

            var $form = this.$el.closest('form');
            var autosubmit = $form.hasClass('pat-autosubmit');
            var autoload = this.options.toolbar.loading === "auto";
            _.extend(config, {
                'bind': {
                    'enabled': function() {
                        if (autosubmit && autoload) {
                            // Raptor editor registers a handler for the submit event on
                            // this form. That handler fires a change event which is caught
                            // by patterns and causes an endless loop in which the form is
                            // continuously submitted. We nip that in the bud here.
                            $form.off("submit.raptor");
                        }
                    }
                },
            });
            _.extend(config.plugins, {
                'fileManager': {
                    'uriPublic': this.options.image['browse-url'],
                    'uriAction': this.options.image['upload-url'],
                    'uriIcon': this.options.image['pick-icon']
                }
            });
            config.autoEnable = (autoload) ? true : false;
            this.$el.raptor(config);
        },

        registerEventHandlers: function () {
            $(document).on("pat-inject-hook-raptor", function (ev) {
                $.each(Raptor.instances, function (idx, instance) {
                    if (instance.element[0] == this.$el[0]) {
                        Raptor.instances[0].dirty = false;
                    }
                }.bind(this));
            }.bind(this));
        }

    });
}));


