# Changelog

## 0.0.4 - Unreleased

- Integration with pat-modal and pat-inject, for customzed image uploading.

## 0.0.3 - September 28, 2015

- Add support for the fileManager premium plugin.
- Bugfix. Prevent endless loop form submission.

## 0.0.2 - May 11, 2015

- Add support for pat-inject "hook". When submitting a form containing pat-raptor via pat-inject, then Raptor needs to be made aware of it so that the "Unsaved changes" popup is not shown. We do this by adding `data-pat-inject="hooks: raptor"` to the form which gets submitted.

## 0.0.1 - April 30, 2015

- Initial version of the Raptor wysiwyg editor as a Patternslib pattern.
