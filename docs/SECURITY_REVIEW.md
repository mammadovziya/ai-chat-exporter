# Security Review

AI Chat Exporter is designed to keep conversation data inside the browser.

## Trust Boundaries

- Supported chat pages are untrusted input.
- Exported HTML is generated from sanitized copies of page content.
- Extension storage is used only for preferences.
- Browser print and download APIs are local browser behavior.
- GitHub, Chrome Web Store, and Mozilla Add-ons receive release artifacts, not
  user conversations.

## Permissions

| Permission | Reason |
| --- | --- |
| `activeTab` | Lets the popup communicate with the currently active supported chat tab after user action. |
| `scripting` | Lets the popup inject local extension scripts/CSS into a supported active tab if the content script did not auto-load. |
| `storage` | Stores local preferences such as format, theme, paper size, page numbers, and mute setting. |
| Host permissions | Limited to Claude, ChatGPT, Gemini, and Grok domains so content scripts only run on supported chat pages. |

The extension must not request `<all_urls>`, `tabs`, `downloads`, analytics,
remote logging, or server-side conversation processing without a major privacy
review and documentation update.

## Sanitization

The scraper treats page markup as hostile:

- scripts, event handlers, form controls, app chrome, and hidden nodes are
  removed from exports
- links are limited to safe URL schemes
- code blocks are escaped before local highlighting
- math and tables are serialized through allowed markup
- SVG diagrams are serialized through an allowlist of tags, attributes, local
  references, and safe style properties
- unsupported media is represented by an omitted-media placeholder

## Data Handling

The extension does not intentionally:

- send conversation content to servers
- persist conversation content in extension storage
- collect analytics or telemetry
- use remote fonts, scripts, images, or trackers

Filenames and titles are generated in memory for the export operation and are
not stored as preferences.

## Security Test Checklist

- `npm run check`
- `npm run test:browser`
- inspect generated manifests for scoped host permissions
- export Markdown, JSON, PDF, and PNG from a fixture containing code, table,
  math, and SVG diagram content
- verify exported HTML contains no script tags or event-handler attributes
- verify popup diagnostics do not expose full conversation content

## Known Residual Risk

AI chat providers frequently change their DOM. A provider redesign can cause
missed messages or poor role detection. This should fail locally and visibly:
the popup diagnostics and issue templates are designed to capture enough
provider/version context without asking users to share private chats.
