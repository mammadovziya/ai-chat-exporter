# Export Quality

AI Chat Exporter aims to preserve useful conversation structure while keeping
the export path local and safe.

## Supported Structure

- headings
- ordered and unordered lists
- tables
- fenced code blocks
- inline code
- block and inline math
- safe SVG diagrams
- omitted-media placeholders for unsupported media

## Format Notes

| Format | Notes |
| --- | --- |
| Markdown | Best for durable notes and repositories. Tables, code fences, math text, and diagram labels are preserved when available. |
| PDF | Uses browser print. Long tables and code blocks depend on browser pagination behavior. |
| TXT | Preserves readable text, not layout. |
| JSON | Includes metadata plus message text, Markdown, and sanitized HTML. |
| CSV | Includes one row per message for spreadsheet review. |
| PNG | Renders selected messages to one or more PNG files when the capture is too tall for a single safe canvas. |

## Current Limitations

- Provider-side lazy loading can hide older messages until the user scrolls.
- Cross-origin iframes, remote media, and protected attachments are not
  embedded.
- Browser print engines differ in page-break handling.
- Syntax highlighting is intentionally local and lightweight, not a full
  language parser.
- Provider redesigns can require selector updates.

## Regression Fixtures

Fixture tests cover:

- Claude content with code, math, tables, and SVG diagrams
- ChatGPT conversation turns
- Gemini `user-query` and `model-response` elements
- Grok message bubbles

Run:

```bash
npm run check
npm run test:browser
```

## Adding New Export Cases

When fixing export fidelity:

1. Add or update a local fixture under `tests/fixtures/scraper/`.
2. Add assertions to `scripts/fixture-scraper-test.mjs`.
3. Add browser UI coverage when panel, launcher, or selection behavior changes.
4. Keep unsupported content represented honestly instead of silently dropping it.
