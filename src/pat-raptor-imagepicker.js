define([
    "pat-registry",
    "underscore",
    "raptor",
    "pat-upload",
    "pat-checklist"
], function(registry, _, Raptor, Checklist) {
    'use strict';

    var ImagePicker = new Raptor.Button({
      name: 'patternImagePicker',
      action: function() {
        var self = this;

        this.raptor.pause();
        var modal = $('#raptor-image-picker');
        if (modal.length !== 0) {
            modal.remove();
        }
        modal = $('<div class="pat-modal"><div id="raptor-image-picker"></div></div>');
        modal.appendTo('body');
        registry.scan(modal);

        if (!this.button.hasClass('pat-inject')) {
            this.button
              .addClass('pat-inject')
              .attr('data-pat-inject',
                      'url:' + this.options.plugins.patternImagePicker.url + ';' +
                      'source:#raptor-image-picker; hooks:raptor; target:#raptor-image-picker &&'+
                      'url:' + this.options.plugins.patternImagePicker.url + ';' +
                      'source:.header; target:.header; loading-class: ;');

            registry.scan(this.button);
        }

        modal.on('patterns-injected', _.debounce(function(e) {
            registry.scan(modal.children());
            modal.trigger('resize.pat-modal-position');

            // insert button
            $('.buttons button[type=submit]', modal).on('click', function(e) {
              e.preventDefault();
              e.stopPropagation();

              self.raptor.actionApply(function() {
                  Raptor.selectionReplace(
                      $('<img>').attr('src', $(this).parents('form').find('.checked input[type="radio"]').val())[0]
                  );
              }.bind(this));

              $(this).parents('.pat-modal').data('pattern-modal').destroy();
            });
        }, 100));

        this.button.trigger('click.pat-inject');

        // TODO: integrate pat-upload at some point
        //$('.pat-upload', this.$modal)
        //    .data('pattern-upload')
        //    .dropzone.on('complete', function(file) {
        //        // TODO: act on completion of uploaded image
        //        $(this.element).parents('.pat-modal').data('pattern-modal').destroy()
        //    });
      }
    });
    Raptor.registerUi(ImagePicker);
    return ImagePicker;
});
