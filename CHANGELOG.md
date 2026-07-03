# Changelog

## 1.1.15

- Moved selected-message highlighting into a measured selection-frame overlay
  so Gemini and other providers do not draw outlines underneath the export
  panel.
- Clipped selection frames to the same safe right edge used by selection
  checkboxes when the panel overlaps a message vertically.
- Kept provider theme colors on selection frames as the page theme changes.

## 1.1.14

- Improved local syntax highlighting with functions, properties, variables,
  operators, punctuation, JSON/YAML/CSS keys, and Dockerfile detection.
- Added JSX/TSX language detection and keyword fallback highlighting.
- Rewrote the README from the beginning with clearer install, privacy, usage,
  troubleshooting, and development sections.

## 1.1.13

- Strengthened Gemini scraping by preferring `user-query`,
  `model-response`, query content, and response content selector groups.
- Made provider scraping accept short visible prompts/responses instead of
  rejecting them with the generic wide-message heuristic.
- Anchored Gemini selection controls to visible query and response content.

## 1.1.12

- Added popup-based content script wake-up for Firefox when supported chat
  pages do not auto-inject the exporter.
- Added the scoped `scripting` permission so the popup can recover on the
  active Claude, ChatGPT, Gemini, or Grok tab without broader site access.
- Strengthened Grok selectors, launcher labels, and fallback styling for
  `grok.com`.

## 1.1.11

- Fixed ChatGPT selection targets attaching to broad conversation wrappers.
- Made ChatGPT scraping prefer real conversation turns and author-role nodes
  before broad message-list containers.
- Moved selected outlines and click handlers onto role-aware message anchors
  so selectors stay beside the visible message content.

## 1.1.10

- Changed ChatGPT/OpenAI and Gemini launcher buttons to always show a download
  icon plus a readable Export label.
- Added provider-specific compact launcher styling: a quiet OpenAI-style pill
  for ChatGPT and a Gemini-blue top-bar pill for Gemini.
- Kept the native clone behavior while making fallback launchers look
  intentional on both platforms.

## 1.1.9

- Made automatic Export launcher placement self-healing on late-loading apps
  like Grok, ChatGPT, and Gemini.
- Attached fallback launchers to the page body when available and kept them
  visible when the export panel is closed.
- Added provider-specific fallback launcher positioning near the top-right app
  controls.

## 1.1.8

- Added provider-specific scrape fallbacks for ChatGPT, Gemini, and Grok.
- Added support for Gemini custom message elements and ChatGPT conversation
  turns.
- Prevented cloned native Export buttons from inheriting disabled Share button
  state.
- Filtered app shell/navigation text from provider fallback exports.

## 1.1.7

- Anchored selection controls to the visible right edge of each message or user
  bubble instead of the broader message wrapper.
- Avoided the export panel only for messages it actually overlaps vertically.
- Refreshed selection mode as users scroll or Claude loads older messages.

## 1.1.6

- Added automatic launcher placement retries for late-loading supported chat
  headers, including ChatGPT.
- Remembered local export preferences such as the last selected format, PDF
  theme, paper size, page-number setting, and mute setting.
- Kept persisted preferences limited to settings only; filenames, titles, and
  conversation content are never stored.

## 1.1.5

- Anchored selection checkboxes to the right edge of each message instead of
  placing them outside the message rail.
- Made the selection control smaller and more checkbox-like.

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
