# QA Checklist

Use this before publishing a release or after changing provider selectors,
exports, permissions, or UI placement.

## Automated

```bash
npm run check
npm run test:browser
npm run package
```

## Browser Matrix

| Browser | Build | Check |
| --- | --- | --- |
| Chrome or Chromium | `dist/chrome` | Load unpacked extension and test one provider. |
| Firefox | `dist/firefox/manifest.json` | Load temporary add-on and test one provider. |

## Provider Matrix

For Claude, ChatGPT, Gemini, and Grok:

- in-page Export button appears in a native-feeling location
- popup **Check** reports connected script and message count
- right-side selection boxes appear for visible messages
- `All`, assistant, `You`, and `None` shortcuts work
- `Alt+A`, `Alt+C`, `Alt+Y`, and `Alt+N` work
- `Escape` closes the panel and returns focus
- Markdown export preserves headings, code blocks, tables, and math
- PDF export opens the print dialog
- JSON and CSV include the selected message count

## Privacy Checks

- no network requests are added for conversation export
- no conversation content is stored in extension storage
- no new host permissions are added without documentation
- popup diagnostics do not show full message text

## Release Checks

- `package.json` and both manifests have the same version
- `CHANGELOG.md` includes the release
- `docs/PUBLISHING.md` still matches the artifact names
- GitHub release artifacts are attached after the `v*` tag workflow completes
