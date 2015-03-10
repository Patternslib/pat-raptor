require.config({
    baseUrl: "src",
    paths: {
        "jquery":                       "bower_components/jquery/dist/jquery",
        "jquery-hotkeys":               "bower_components/jquery.hotkeys/jquery.hotkeys",
        "jqueryui":                     "bower_components/jqueryui/jquery-ui",
        "rangy":                        "bower_components/rangy/rangy-core",
        "rangy-serializer":             "bower_components/rangy/rangy-serializer",
        "rangy-cssclassapplier":        "bower_components/rangy/rangy-cssclassapplier",
        "rangy-selectionsaverestore":   "bower_components/rangy/rangy-selectionsaverestore",
        "raptor":                       "../3rdparty/raptor",
        "logging":                      "bower_components/logging/src/logging",
        "pat-base":                     "bower_components/patternslib/src/core/base",
        "pat-compat":                   "bower_components/patternslib/src/core/compat",
        "pat-jquery-ext":               "bower_components/patternslib/src/core/jquery-ext",
        "pat-logger":                   "bower_components/patternslib/src/core/logger",
        "pat-parser":                   "bower_components/patternslib/src/core/parser",
        "pat-registry":                 "bower_components/patternslib/src/core/registry",
        "pat-utils":                    "bower_components/patternslib/src/core/utils",
        "patterns":                     "bower_components/patternslib/bundle",
        "underscore":                   "bower_components/underscore/underscore",
    },
    "shim": {
        "logging": { "exports": "logging" },
        "rangy-serializer": { "deps": ["rangy"] },
        "rangy-cssclassapplier": { "deps": ["rangy"] },
        "rangy-selectionsaverestore": { "deps": ["rangy"] },
        "rangy": { "exports": "rangy" },
        "raptor": {
            "deps": [
                "jquery",
                "jqueryui",
                "jquery-hotkeys",
                "rangy-cssclassapplier",
                "rangy-selectionsaverestore",
                "rangy-serializer"
            ]
        }
    }
});

require(["pat-registry", "pat-raptor"], function(registry, editor) {
    window.patterns = registry;
    registry.init();
});
