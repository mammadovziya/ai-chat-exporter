# Contributing

Thanks for helping improve AI Chat Exporter.

## Development

```bash
npm run build
npm run check
```

Load `dist/chrome` in Chrome or `dist/firefox/manifest.json` in Firefox while
developing.

## Pull Request Checklist

- Keep permissions narrow and Claude-scoped.
- Do not add analytics, telemetry, remote logging, or server-side processing for
  conversation content.
- Preserve local-only exports.
- Run `npm run check` before opening a pull request.
- Update README or privacy notes when behavior changes.

## Scraper Changes

Claude markup can change frequently. Prefer resilient, specific selectors and
fallbacks over broad page scraping. Treat all page content as untrusted and keep
export HTML sanitized.
