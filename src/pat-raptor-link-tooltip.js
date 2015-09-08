define([
    "pat-registry",
    "raptor",
    "pat-tooltip"
], function(registry, Raptor, Tooltip) {
    'use strict';

  var initializeToolkit = function() {
    $('a', this.target).each(function(i, item) {
      var tooltip = $(item).data('patterns.tooltip')
      if (tooltip === undefined) {
        var url = $(item).attr('href')
        $(item).patternTooltip({
          closing: 'sticky',
          source: 'content_html',
          content: $('<a/>').attr({target: '_blank', href: url}).text(url),
          trigger: 'hover'
        })
      }
    });
  };

  function LinkTooltip(name, overrides) {
    Raptor.RaptorPlugin.call(this, name || 'linkTooltip', overrides);
  }

  LinkTooltip.prototype = Object.create(Raptor.RaptorPlugin.prototype);

  LinkTooltip.prototype.init = function() {
    this.raptor.bind('change', initializeToolkit)
    this.raptor.bind('layoutShow', initializeToolkit)
  };

  var linktooltip = new LinkTooltip();

  Raptor.registerPlugin(linktooltip);

  return linktooltip;
});
