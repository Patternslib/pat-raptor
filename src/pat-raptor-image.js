define([
    "pat-registry",
    "raptor",
    "pat-modal",
    "pat-upload"
], function(registry, Raptor, Modal) {
    'use strict';

    var Image = new Raptor.Button({
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
      }
    });

    Raptor.registerUi(Image);

    return Image;

});
