# Contributing

Thanks for helping improve AI Chat Exporter.

## Development

```bash
npm run build
npm run check
npm run test:browser
```

Load `dist/chrome` in Chrome or `dist/firefox/manifest.json` in Firefox while
developing. Test changes on Claude, ChatGPT, Gemini, and Grok when touching the
scraper or native launcher.

## Pull Request Checklist

- Keep permissions narrow and limited to supported AI chat domains.
- Do not add analytics, telemetry, remote logging, or server-side processing for
  conversation content.
- Preserve local-only exports.
- Run `npm run check` before opening a pull request.
- Run `npm run test:browser` when changing scraping, export UI, launcher
  placement, or keyboard behavior.
- Update README or privacy notes when behavior changes.

## Scraper Changes

AI chat app markup can change frequently. Prefer provider-aware, specific
selectors and fallbacks over broad page scraping. Treat all page content as
untrusted and keep export HTML sanitized.

## Documentation

- Use `docs/EXPORT_QUALITY.md` for export limitations and fixture guidance.
- Use `docs/QA_CHECKLIST.md` before release.
- Use `docs/STORE_LISTING.md` for extension store copy and screenshots.
- Use `docs/SECURITY_REVIEW.md` when changing permissions, sanitization, or data
  handling.
