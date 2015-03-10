(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([
            "jquery",
            "jquery.browser",
            "underscore",
            "pat-base",
            "pat-registry",
            "pat-parser",
            "raptor-jquery"
        ], function() {
            return factory.apply(this, arguments);
        });
    } else {
        factory($, null, _, Base, root.patterns, root.patterns.Parser);
    }
}(this, function($, dummy, _, Base, registry, Parser) {
    'use strict';
    var parser = new Parser('raptor');
    parser.add_argument('toolbar', {}); // Allows the user to directly configure the CKEditor toolbar via JSON
    parser.add_argument('buttons',
        [ 'Source', 'Format', 'Bold', 'Italic', 'NumberedList', 'BulletedList', 'Outdent', 'Indent', 'Image', 'Link', 'HorizontalRule', 'Table', '-', 'Undo', 'Redo' ],
        [ '-', 'About', 'Anchor', 'BGColor', 'BidiLtr', 'BidiRtl', 'Blockquote',
          'Bold', 'BulletedList', 'Button', 'Checkbox', 'Copy', 'CreateDiv',
          'Cut', 'Find', 'Flash', 'Font', 'FontSize', 'Form', 'Format',
          'HiddenField', 'HorizontalRule', 'Iframe', 'Image', 'ImageButton',
          'Indent', 'Italic', 'JustifyBlock', 'JustifyCenter', 'JustifyLeft',
          'JustifyRight', 'Language', 'Link', 'Maximize', 'NewPage', 'NumberedList',
          'Outdent', 'PageBreak', 'Paste', 'PasteFromWord', 'PasteText', 'Preview',
          'Print', 'Radio', 'Redo', 'Replace', 'Save', 'Scayt', 'Select', 'SelectAll',
          'ShowBlocks', 'Smiley', 'Source', 'SpecialChar', 'Styles', 'Table',
          'Templates', 'TextColor', 'TextField', 'Textarea', 'Undo', 'Unlink'],
        true);

    return Base.extend({
        name: 'raptor',
        trigger: ".pat-raptor",

        init: function patCKEditor() {  
            this.options = parser.parse(this.$el);
            var config = { toolbar: [] };
            $.extend(true, config.toolbar, this.options.toolbar);
            if (this.options.buttons instanceof Array) {
                config.toolbar.push(this.options.buttons);
            }
            this.$el.raptor(config);
        }
    });
}));


