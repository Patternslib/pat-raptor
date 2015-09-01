define([
    "pat-registry",
    "raptor",
    "pat-modal"
], function(registry, Raptor, Modal) {
    'use strict';

    var Image = new Raptor.Button({
      name: 'pat-raptor-image',
      action: function() {
        this.raptor.pause();
        this.$modal = $(
          '<div class="pat-modal">' +
          '  <h3>Upload Image<h3>' +
          '  <div>Drop image or something</div>' +
          '</div>'
        ).appendTo('body');
        this.$modal.patModal();
      }
    });

    Raptor.registerUi(Image);

    return Image;

});
