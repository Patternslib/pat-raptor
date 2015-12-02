define([
    "pat-registry",
    "raptor",
    "pat-tooltip"
], function(registry, Raptor, Tooltip) {
    'use strict';

  var initializeToolkit = function(eventName) {
    var raptor = this.raptor;
    $('a', raptor.target).each(function(i, item) {
      var tooltip = $(item).data('patterns.tooltip');
      var url = $(item).attr('href');
      var content = $(
        '<p>' +
        ' <a target="_blank" href="' + url + '">' + 
        '  Visit <strong>' + url + '</strong>.' +
        ' </a>' +
        '</p>' +
        '<p>' +
        ' <a href="' + url + '" class="pat-button small">Edit link</a>' +
        '</p>');

      if (tooltip !== undefined && eventName === 'change') {
        $(item).trigger('destroy');
        $(item).off(".tooltip");
        tooltip = undefined
      }

      if (tooltip === undefined) {
        $(item).patternTooltip({
          source: 'content-html',
          content: content,
          trigger: 'hover',
          'mark-inactive': false
        });

        $('a', content).last().on('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          $(item).trigger('click.tooltip');

          var range = rangy.createRange();
          range.setStart(item.childNodes[0], 0);
          range.collapse(true);
          var sel = rangy.getSelection();
          sel.setSingleRange(range);

          raptor.getUi('linkCreate').action();
        });
      }
    });
  };


  function LinkTooltip(name, overrides) {
    Raptor.RaptorPlugin.call(this, name || 'linkTooltip', overrides);
  }

  LinkTooltip.prototype = Object.create(Raptor.RaptorPlugin.prototype);

  LinkTooltip.prototype.init = function() {
    this.raptor.bind('change', initializeToolkit.bind(this, 'change'))
    this.raptor.bind('layoutShow', initializeToolkit.bind(this, 'layoutShow'))
  };

  var linktooltip = new LinkTooltip();

  Raptor.registerPlugin(linktooltip);

  return linktooltip;
});
