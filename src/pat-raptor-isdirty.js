define([
    "pat-registry",
    "raptor"
], function(registry, Raptor) {
    'use strict';

    function IsDirty(name, overrides) {
        Raptor.RaptorPlugin.call(this, name || 'isDirty', overrides);
    }

    IsDirty.prototype = Object.create(Raptor.RaptorPlugin.prototype);

    IsDirty.prototype.enable = function(raptor) {
        this.raptor.bind('dirty', this.mark.bind(this));
        this.raptor.bind('cleaned', this.unmark.bind(this));
        $(this.raptor.element).parents(this.options.target || 'body')
            .on('patterns-injected', this.unmark.bind(this));
    };

    IsDirty.prototype.mark = function() {
        $(this.raptor.element).parents(this.options.target || 'body').addClass('is-dirty');
    };

    IsDirty.prototype.unmark = function() {
        $(this.raptor.element).parents(this.options.target || 'body').removeClass('is-dirty');
    };

    Raptor.registerPlugin(new IsDirty());

    return IsDirty;

})
