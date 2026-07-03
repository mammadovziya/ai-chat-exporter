# AI Chat Exporter

Privacy-first browser extension for exporting chats from Claude, ChatGPT,
Gemini, and Grok.

AI Chat Exporter runs in your browser, lets you select exactly which messages to
save, and exports them to PDF, Markdown, Text, JSON, CSV, or PNG. It is built as
an open-source local tool: no analytics, no remote processing, no server-side
PDF generation, and no broad website access.

![AI Chat Exporter overview](docs/visuals/overview.svg)

## Features

- Export from Claude, ChatGPT, Gemini, and Grok in one extension.
- Save chats as PDF, Markdown, TXT, JSON, CSV, or PNG.
- Select individual messages directly inside the chat.
- Use quick actions for all messages, assistant messages, your messages, or
  none.
- Preserve headings, lists, tables, code blocks, inline code, block math, inline
  math, and structured responses.
- Generate cleaner exports with local syntax highlighting for common languages.
- Customize filename, document title, PDF theme, paper size, and page numbers.
- Remember local export preferences such as the last selected format.
- Mute success alerts for quieter repeated exports.

## Supported Sites

The extension is scoped to these chat apps:

- Claude: `claude.ai`
- ChatGPT: `chatgpt.com` and `chat.openai.com`
- Gemini: `gemini.google.com`
- Grok: `grok.com`

AI chat apps change their markup often. The scraper uses provider-specific
selectors and fallbacks, but a site redesign can still break extraction. Please
open an issue with the provider, browser, and a screenshot when that happens.

## Privacy

AI Chat Exporter is local-first.

It does not:

- send conversations to a server
- store exported conversations
- analyze your chats
- use analytics or tracking
- request `<all_urls>`
- request the browser `downloads` permission
- run a background service worker

PDF export uses your browser print dialog. Choose **Save as PDF** when the print
window opens.

## Permissions

The extension uses narrow permissions:

- `activeTab`: lets the popup communicate with the current supported chat tab
  after you click the extension.
- `scripting`: lets the popup inject this extension's own local scripts into the
  active supported tab if the browser did not auto-load the content script.
- `storage`: saves local preferences only, such as format, PDF theme, paper
  size, page-number setting, and mute setting.
- Host permissions are limited to Claude, ChatGPT, Gemini, and Grok.

Conversation content, filenames, and titles are not stored in extension storage.

## Install From Source

Requirements:

- Node.js
- Chrome, Chromium, or Firefox 121+

Build both browser targets:

```bash
npm run build
```

### Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select `dist/chrome`.

### Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on**.
3. Select `dist/firefox/manifest.json`.

Temporary Firefox add-ons are removed when Firefox restarts. For a permanent
public install, package and sign the extension through Mozilla Add-ons.

## Usage

1. Open a conversation on Claude, ChatGPT, Gemini, or Grok.
2. Click the in-page **Export** button, or open the extension popup and click
   **Open exporter**.
3. Select the messages you want.
4. Choose the export format.
5. Click **Export**.

Keyboard shortcuts while the export panel is open:

- `Alt+A`: select all messages
- `Alt+C`: select assistant messages
- `Alt+Y`: select your messages
- `Alt+N` or `Alt+D`: deselect all

## Export Formats

- **PDF**: opens a printable local HTML document.
- **Markdown**: keeps headings, lists, tables, code fences, and text structure.
- **Text**: simple plain-text transcript.
- **JSON**: structured export with metadata and message fields.
- **CSV**: spreadsheet-friendly rows.
- **PNG**: image render of the selected conversation.

## Syntax Highlighting

Code highlighting is done locally. The exporter detects or preserves common
language labels and highlights:

- comments
- strings
- numbers
- keywords
- functions
- properties
- variables
- operators
- punctuation
- HTML/XML tags and attributes
- JSON/YAML/CSS keys

Supported language detection includes JavaScript, TypeScript, JSX, TSX, Python,
Bash, PowerShell, SQL, JSON, YAML, HTML, XML, CSS, Dockerfile, and several
common compiled languages.

## Troubleshooting

If the in-page Export button does not appear:

1. Reload the chat tab.
2. Check that the extension has site access for the current chat app.
3. Click the extension icon and press **Open exporter**.
4. In Firefox temporary installs, reload the add-on from
   `dist/firefox/manifest.json` after rebuilding.

If messages are missing:

- Scroll the conversation so older messages load.
- Click **Refresh** in the export panel.
- Try selecting messages directly in the chat.
- Open an issue with the provider name, browser, extension version, and a
  screenshot.

## Development

Useful commands:

```bash
npm run icons      # regenerate extension icons
npm run build      # build dist/chrome and dist/firefox
npm test           # run smoke tests against built targets
npm run check      # build and test
npm run package    # create Chrome ZIP and Firefox XPI
npm run release    # check and package
```

Release artifacts are written to `web-ext-artifacts/`.

## Project Layout

```text
extension/
  content/          Scraper, export panel, and file exporters
  icons/            Extension icon source and generated PNG icons
  shared/           Provider registry and shared utilities
  manifest.*.json   Browser-specific source manifests
scripts/
  build.mjs         Builds dist/chrome and dist/firefox
  generate-icons.mjs
  package.mjs       Creates Chrome ZIP and Firefox XPI artifacts
  smoke-test.mjs    Static safety and packaging checks
docs/
  visuals/          README visuals
```

## Security

Please report security issues privately. See [SECURITY.md](SECURITY.md).

## Contributing

Bug reports and pull requests are welcome. For provider breakage, include:

- provider name
- browser
- extension version
- what failed
- screenshot if possible

Keep changes local-first and avoid adding remote services, analytics, or broad
permissions.

## License

MIT. See [LICENSE](LICENSE).

## Disclaimer

This project is not affiliated with Anthropic, OpenAI, Google, xAI, Claude,
ChatGPT, Gemini, or Grok.
