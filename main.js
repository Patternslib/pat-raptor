require.config({
    baseUrl: "src",
    paths: {
        "jquery":                       "bower_components/jquery/dist/jquery",
        "jquery-hotkeys":               "bower_components/raptor-dependencies/jquery-hotkeys",
        "jquery.form":                  "bower_components/jquery-form/jquery.form",
        "jqueryui":                     "bower_components/raptor-dependencies/jquery-ui",
        "logging":                      "bower_components/logging/src/logging",
        "pat-base":                     "bower_components/patternslib/src/core/base",
        "pat-compat":                   "bower_components/patternslib/src/core/compat",
        "pat-jquery-ext":               "bower_components/patternslib/src/core/jquery-ext",
        "pat-logger":                   "bower_components/patternslib/src/core/logger",
        "pat-parser":                   "bower_components/patternslib/src/core/parser",
        "pat-registry":                 "bower_components/patternslib/src/core/registry",
        "pat-utils":                    "bower_components/patternslib/src/core/utils",
        "pat-ajax":                     "bower_components/patternslib/src/pat/ajax/ajax",
        "pat-htmlparser":               "bower_components/patternslib/src/lib/htmlparser",
        "pat-inject":                   "bower_components/patternslib/src/pat/inject/inject",
        "pat-modal":                    "bower_components/patternslib/src/pat/modal/modal",
        "rangy-applier":                "bower_components/raptor-dependencies/rangy/rangy-applier",
        "rangy-core":                   "../lib/rangy-core",
        "rangy-cssclassapplier":        "bower_components/raptor-dependencies/rangy/rangy-cssclassapplier",
        "rangy-selectionsaverestore":   "bower_components/raptor-dependencies/rangy/rangy-selectionsaverestore",
        "rangy-serializer":             "bower_components/raptor-dependencies/rangy/rangy-serializer",
        "rangy-textrange":              "bower_components/raptor-dependencies/rangy/rangy-textrange",
        "raptor":                       "../lib/raptor",
        "underscore":                   "bower_components/underscore/underscore",
    },
    "shim": {
        "logging": { "exports": "logging" },
        "jqueryui": { "deps": ["jquery"] },
        "jquery-hotkeys": { "deps": ["jquery"] },
        "rangy-core": { "exports": "rangy" },
        "rangy-applier": { "deps": ["rangy-core"] },
        "rangy-cssclassapplier": { "deps": ["rangy-core"] },
        "rangy-selectionsaverestore": { "deps": ["rangy-core"] },
        "rangy-serializer": { "deps": ["rangy-core"] },
        "rangy-textrange": { "deps": ["rangy-core"] },
        "raptor": { "exports": "$.fn.raptor.Raptor", "deps": [
            "jquery",
            "jqueryui",
            "jquery-hotkeys",
            "rangy-applier",
            "rangy-cssclassapplier",
            "rangy-selectionsaverestore",
            "rangy-serializer",
            "rangy-textrange",
        ]}
    }
});

require(["jquery", "pat-registry", "pat-raptor"], function($, registry) {
    $(document).ready(function() {
      registry.init();
    });
});
