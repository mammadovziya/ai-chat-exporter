# Changelog

## 1.1.4

- Restored readable labels for compact panel actions and selection shortcuts.
- Added Claude right-aligned user bubble detection so user messages can be
  selected and exported.
- Positioned selection controls beside each message while avoiding the open
  export panel.

## 1.1.3

- Reworked the export panel into a smaller native-feeling command popover.
- Added provider-specific accent styles for Claude, ChatGPT, Gemini, and Grok.
- Switched secondary actions to compact icon buttons so Gemini and other narrow
  top bars do not clip the export controls.

## 1.1.2

- Anchored Gemini's Export button next to the native Upgrade pill.
- Preserved text-pill styling when cloning native text buttons.
- Made provider anchor priority explicit so each app gets the intended native
  placement.

## 1.1.1

- Restored strict native placement beside provider share/export controls.
- Added provider-specific native anchor labels for Claude, ChatGPT, Gemini, and
  Grok.
- Removed broad "more/options" anchoring so the export button does not drift away
  from the real share area.

## 1.1.0

- Added one-extension support for Claude, ChatGPT, Gemini, and Grok.
- Added provider-aware host permissions, popup routing, export labels,
  filenames, and metadata.
- Added provider-aware native button placement and message selectors.
- Kept site access limited to supported AI chat domains.

## 1.0.1

- Added local syntax highlighting for exported code blocks in PDF and PNG
  outputs.
- Preserved and inferred common code block languages for Markdown fences and
  export labels.
- Updated feature copy for advanced Claude formatting support.

## 1.0.0

- Added Chrome and Firefox Manifest V3 builds.
- Added local exports for PDF, Markdown, Text, JSON, CSV, and PNG.
- Added right-side in-chat message selection.
- Added quick selection controls and keyboard shortcuts.
- Added silent export mode for muted success/info alerts.
- Added production extension icons, popup visuals, README visual, CI, and release
  packaging.
- Added privacy and security documentation.
