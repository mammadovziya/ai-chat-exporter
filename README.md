# AI Chat Exporter

Open-source, privacy-first browser extension for exporting Claude conversations
to PDF, Markdown, Text, JSON, CSV, and PNG.

![AI Chat Exporter overview](docs/visuals/overview.svg)

## Highlights

- Export Claude chats to PDF, Markdown, Text, JSON, CSV, and PNG.
- Select individual messages directly in the chat with right-side selection
  boxes.
- Use quick selection controls for all messages, Claude messages, your
  messages, or none.
- Preserve common advanced outputs including block and inline math,
  syntax-highlighted code blocks, tables, lists, headings, and structured
  Claude formatting.
- Customize filename, document title, PDF paper size, PDF theme, and page
  numbers.
- Mute export alerts when you want silent local downloads.
- Runs locally in Chrome and Firefox with no analytics, tracking, remote
  logging, or server-side PDF generation.

## Privacy Model

AI Chat Exporter reads selected content from the Claude page you are viewing and
generates files locally in your browser.

It does not:

- send conversation content to a server
- store exported conversations
- use analytics or telemetry
- request access to all websites
- require a background service worker

PDF export uses the browser print dialog, so PDF creation remains local.

## Permissions

The extension intentionally keeps permissions narrow:

- `activeTab`: lets the popup talk to the current tab when you click the
  extension.
- `https://claude.ai/*` and `https://*.claude.ai/*`: lets the content script run
  only on Claude pages.

There is no `downloads`, `tabs`, or `<all_urls>` permission.

## Install From Source

Install dependencies are not required. You only need Node.js to build the
browser bundles.

```bash
npm run build
```

### Chrome

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click **Load unpacked**.
4. Select `dist/chrome`.

### Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on**.
3. Select `dist/firefox/manifest.json`.

Temporary Firefox add-ons are removed when Firefox restarts. For persistent
installation, package and sign the extension through Mozilla Add-ons.

## Usage

1. Open a conversation on `https://claude.ai`.
2. Click the native-looking **Export** button next to Claude's share control, or
   open the extension popup and click **Open exporter**.
3. Select messages using the right-side boxes or the quick selection controls.
4. Pick an export format.
5. Click **Export**.

Keyboard shortcuts while the panel is open:

- `Alt+A`: select all
- `Alt+C`: select Claude messages
- `Alt+Y`: select your messages
- `Alt+N` or `Alt+D`: deselect all

## Build, Test, And Package

```bash
npm run icons      # regenerate extension icons
npm run check      # build both targets and run smoke tests
npm run package    # create Chrome ZIP and Firefox XPI artifacts
npm run release    # check and package
```

Release artifacts are written to `web-ext-artifacts/`.

## Project Structure

```text
extension/
  content/          Claude scraper, export panel, and local file exporters
  icons/            Source icon plus generated manifest PNG icons
  shared/           Shared browser utilities
  manifest.*.json   Browser-specific source manifests
scripts/
  build.mjs         Creates dist/chrome and dist/firefox
  generate-icons.mjs
  package.mjs       Creates Chrome ZIP and Firefox XPI packages
  smoke-test.mjs    Static safety and packaging checks
docs/
  visuals/          README visuals
```

## Browser Support

- Chrome and Chromium-based browsers with Manifest V3 support.
- Firefox 121 or newer.

Claude updates its page markup often. The scraper uses multiple selectors and
fallbacks, but please open an issue if a Claude UI change breaks exports.

## Security

Please report security issues privately. See [SECURITY.md](SECURITY.md).

## License

MIT. See [LICENSE](LICENSE).

## Disclaimer

This project is not affiliated with Anthropic or Claude.
