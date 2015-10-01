define([
    "pat-registry",
    "raptor",
    "pat-modal",
    "pat-upload",
    "pat-checklist"
], function(registry, Raptor, Modal, Checklist) {
    'use strict';

    var ImagePicker = new Raptor.Button({
      name: 'patternImagePicker',
      action: function() {
        var self = this;

        self.raptor.pause();

        self.modal = $('#pat-raptor-modal');
        if (self.modal.length !== 0) {
          self.modal.remove();
        }

        self.modal = $('<div class="pat-modal large" id="pattern-imagepicker"><div/></div>').hide().appendTo('body');

        if (!self.button.hasClass('pat-inject')) {
            self.button
              .addClass('pat-inject')
              .attr('data-pat-inject',
                      'url:' + this.options.plugins.patternImagePicker.url + ';' +
                      'source:#content;' +
                      'hooks:raptor;' +
                      'target:#pattern-imagepicker');

            registry.scan(self.button);

        }

        self.modal.on('pat-inject-content-loaded-final', function(e) {
            registry.scan(self.modal);

            self.modal.show();
            self.modal.trigger('resize.pat-modal-position');

            // insert button
            $('.buttons button[type=submit]', self.modal).on('click', function(e) {
              e.preventDefault();
              e.stopPropagation();

              self.raptor.actionApply(function() {
                  Raptor.selectionReplace(
                    // TODO: probably we dont want a close of this image
                    // element to be inserted
                    $(this).parents('form').find('.checked > img').first().clone()[0]
                  )
              }.bind(this));

              $(this).parents('.pat-modal').data('pattern-modal').destroy()
            })

        });

        self.button.trigger('click.pat-inject')

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
