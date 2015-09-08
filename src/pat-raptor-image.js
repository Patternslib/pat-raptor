define([
    "pat-registry",
    "raptor",
    "pat-modal",
    "pat-upload"
], function(registry, Raptor, Modal) {
    'use strict';

    var ImageModal = new Raptor.Button({
      name: 'pat-raptor-image',
      action: function() {
        this.raptor.pause();
        this.$modal = $(
          '<div class="pat-modal">' +
          '  <h3>Upload Image<h3>' +
          '  <div class="pat-upload" data-pat-upload="url: https://example.org/upload; label: Drop files here to upload or click to browse.; trigger: button" />' +
          '</div>'
        ).appendTo('body');

        registry.scan(this.$modal);

        var raptor = this.raptor;
        $('.pat-upload', this.$modal)
            .data('pattern-upload')
            .dropzone.on('complete', function(file) {
                var image = $('img', file.previewElement).first().attr('src');
                raptor.actionApply(function() {
                    Raptor.selectionReplace($('<img src="' + image + '"/>')[0])
                }.bind(this));
                $(this.element).parents('.pat-modal').data('pattern-modal').destroy()
            });

      }
    });

    Raptor.registerUi(ImageModal);

    return ImageModal;

});
