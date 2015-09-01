define([
    "raptor"
], function(Raptor) {
    'use strict';

    var Image = new Raptor.Button({
      name: 'ploneintranet-image',
      action: function() {
        alert('Works!');
      }
    });

    Raptor.registerUi(Image);

    return Image;

});
