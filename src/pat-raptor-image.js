define([
    "pat-registry",
    "raptor",
    "pat-modal",
    "pat-upload",
    "pat-checklist"
], function(registry, Raptor, Modal, Checklist) {
    'use strict';

    var ImageModal = new Raptor.Button({
      name: 'pat-raptor-image',
      action: function() {
        this.raptor.pause();
        this.$modal = $(
          '<div class="pat-modal">' +
          ' <h3>Upload or Select Image<h3>' +
          ' <div>' +

          '  <div class="pat-upload" data-pat-upload="url: https://example.org/upload; label: Drop files here to upload or click to browse.; trigger: button" />' +

          '  <form action="/" class="wizard-box " >' +
          '   <div class="panel-body">' +
          '    <fieldset class="filter-bar">' +
          '      <select name="source">' +
          '        <option>This workspace</option>' +
          '        <optgroup label="Image bank">' +
          '          <option>Folder so and so</option>' +
          '          <option>Folder so and so</option>' +
          '          <option>Folder so and so</option>' +
          '        </optgroup>' +
          '      </select>' +
          '    </fieldset>' +

          '    <fieldset class="pat-checklist radio image-selector">' +
          '      <label class="item">' +
          '        <input type="radio" name="image" />' +
          '        <img src="/media/corporate.png" alt="Description of image." title="Title of image — Description of image" />' +
          '      </label>' +
          '      <label class="item">' +
          '        <input type="radio" name="image" />' +
          '        <img src="/media/klm-tulips.jpg" alt="Description of image." title="Title of image — Description of image" />' +
          '      </label>' +
          '      <label class="item">' +
          '        <input type="radio" name="image" />' +
          '        <img src="/media/lufthansa-winter.jpg" alt="Description of image." title="Title of image — Description of image" />' +
          '      </label>' +
          '      <label class="item">' +
          '        <input type="radio" name="image" />' +
          '        <img src="/media/new-delhi-skyline.jpg" alt="Description of image." title="Title of image — Description of image" />' +
          '      </label>' +
          '      <label class="item">' +
          '        <input type="radio" name="image" />' +
          '        <img src="/media/cms/leitsätze.jpg" alt="Description of image." title="Title of image — Description of image" />' +
          '      </label>' +
          '      <label class="item">' +
          '        <input type="radio" name="image" />' +
          '        <img src="/media/vision-to-product.png" alt="Description of image." title="Title of image — Description of image" />' +
          '      </label>' +
          '      <label class="item">' +
          '        <input type="radio" name="image" />' +
          '        <img src="/media/book-and-fly.jpg" alt="Description of image." title="Title of image — Description of image" />' +
          '      </label>' +
          '      <label class="item">' +
          '        <input type="radio" name="image" />' +
          '        <img src="/media/budget-proposal.png" alt="Description of image." title="Title of image — Description of image" />' +
          '      </label>' +
          '      <label class="item">' +
          '        <input type="radio" name="image" />' +
          '        <img src="/media/cms/seelsorgerat.jpeg" alt="Description of image." title="Title of image — Description of image" />' +
          '      </label>' +
          '      <label class="item">' +
          '        <input type="radio" name="image" />' +
          '        <img src="/media/cms/walk.jpg" alt="Description of image." title="Title of image — Description of image" />' +
          '      </label>' +
          '      <label class="item">' +
          '        <input type="radio" name="image" />' +
          '        <img src="/media/avatar-alexander-pilz.jpg" alt="Description of image." title="Title of image — Description of image" />' +
          '      </label>' +
          '    </fieldset>' +
          '   </div>' +
          '   <div class="buttons panel-footer">' +
          '    <button type="submit" class="close-panel icon-ok-circle">' +
          '     Insert selected image' +
          '    </button>' +
          '    <button type="button" class="close-panel icon-cancel-circle">' +
          '     Cancel' +
          '    </button>' +
          '   </div>' +
          '  </form>' +

          ' </div>' +
          '</div>'
        ).appendTo('body');

        registry.scan(this.$modal);

        var raptor = this.raptor;
        $('.pat-upload', this.$modal)
            .data('pattern-upload')
            .dropzone.on('complete', function(file) {
                // TODO: act on completion of uploaded image
                $(this.element).parents('.pat-modal').data('pattern-modal').destroy()
            });

        $('.buttons button').first()  // insert button
            .on('click', function(e) {
              e.preventDefault();
              e.stopPropagation();

              raptor.actionApply(function() {
                  Raptor.selectionReplace(
                    $(this).parents('form').find('.checked > img').first().clone()[0]
                  )
              }.bind(this));

              $(this).parents('.pat-modal').data('pattern-modal').destroy()
            })

        $('.buttons button').last()  // cancel button
            .on('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              $(this).parents('.pat-modal').data('pattern-modal').destroy()
            })
      }
    });

    Raptor.registerUi(ImageModal);

    return ImageModal;

});
