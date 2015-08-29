require.config({
    baseUrl: "src",
    paths: {
        "jquery":                       "bower_components/jquery/dist/jquery",
        "jquery-hotkeys":               "bower_components/raptor-dependencies/jquery-hotkeys",
        "jqueryui":                     "bower_components/raptor-dependencies/jquery-ui",
        "logging":                      "bower_components/logging/src/logging",
        "pat-base":                     "bower_components/patternslib/src/core/base",
        "pat-compat":                   "bower_components/patternslib/src/core/compat",
        "pat-jquery-ext":               "bower_components/patternslib/src/core/jquery-ext",
        "pat-logger":                   "bower_components/patternslib/src/core/logger",
        "pat-parser":                   "bower_components/patternslib/src/core/parser",
        "pat-registry":                 "bower_components/patternslib/src/core/registry",
        "pat-utils":                    "bower_components/patternslib/src/core/utils",
        "rangy-applier":                "bower_components/raptor-dependencies/rangy/rangy-applier",
        "rangy-core":                   "bower_components/raptor-dependencies/rangy/rangy-core",
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
        "rangy-core": { "exports": "rangy-core" },
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

require(["pat-registry", "pat-raptor"], function(registry) {
    window.patterns = registry;
    registry.init();
});
