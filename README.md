# pat-raptor
A Patternslib pattern for [Raptor Editor](http://raptor-editor.com)

## The image picker

This pat-raptor-imagepicker.js file registers an image picker plugin for
Raptor.

This plugin uses the inject and modal patterns to render a image picker
panel/modal, from which you can choose images to insert into the editor.

For an example of what the HTMl of this modal should look like, look at
`./examples/panel-image-picker.html`.

## Documentation

Property | Values | Default | Type | Description
---------|-------|---------|------|------------
toolbar-type | `standard`, `fixed`, `floating` | `standard` | Mutually exclusive | Toolbars may either float, be position statically above the editable content field (standard) or snap to the top of the viewport.
toolbar-external | CSS selector | - | CSS selector | CSS selector of the element to which the toolbar should be docked. The element will get wrapped in a `<div>` and the toolbar will be prepended inside that div.
buttons |  alignCenter, alignJustify, alignLeft, alignRight, cancel, classMenu, cleanBlock, clearFormatting, colorMenuBasic, dockToElement, dockToScreen, embed, floatLeft, floatNone, floatRight, fontFamilyMenu, guides, historyRedo, historyUndo, hrCreate, insertFile, languageMenu, linkCreate, linkRemove, listOrdered, listUnordered, logo, save, snippetMenu, specialCharacters, statistics, tableCreate, tableDeleteColumn, tableDeleteRow, tableInsertColumn, tableInsertRow, tagMenu, textBlockQuote, textBold, textItalic, textSizeDecrease, textSizeIncrease, textStrike, textSub, textSuper, textUnderline, viewSource |alignCenter, alignJustify, alignLeft, alignRight, historyRedo, historyUndo, hrCreate, linkCreate, linkRemove, listOrdered, listUnordered, tableCreate, textBold, textItalic, textStrike, textUnderline | Comma separated multi value
config | | `{}` | `JSON` | You can directly configure Raptor by passing in a JSON object here. These values will be passed directly to Raptor. |
