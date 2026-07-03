# AI Chat Exporter - Export ChatGPT, Claude, Gemini & Grok Chats

<p align="center">
  <img src="extension/icons/icon128.png" width="96" height="96" alt="AI Chat Exporter browser extension logo for exporting ChatGPT, Claude, Gemini, and Grok chats" />
</p>

<p align="center">
  <strong>Privacy-first Chrome and Firefox extension for exporting AI conversations to PDF, Markdown, TXT, JSON, CSV, and PNG.</strong>
</p>

<p align="center">
  <img alt="Version 1.1.16" src="https://img.shields.io/badge/version-1.1.16-12312d?style=flat-square" />
  <img alt="MIT License" src="https://img.shields.io/badge/license-MIT-2d7468?style=flat-square" />
  <img alt="Chrome Manifest V3" src="https://img.shields.io/badge/Chrome-Manifest%20V3-4285f4?style=flat-square" />
  <img alt="Firefox 121 plus" src="https://img.shields.io/badge/Firefox-121%2B-ff7139?style=flat-square" />
  <img alt="Local first privacy" src="https://img.shields.io/badge/privacy-local--first-6f42c1?style=flat-square" />
</p>

AI Chat Exporter is an open-source browser extension that helps you export
ChatGPT conversations, Claude chats, Gemini responses, and Grok threads without
sending your data to a server. Select the exact messages you want, choose an
export format, and save clean conversation files directly from your browser.

![AI Chat Exporter overview showing native export button, message selection, compact panel, and local privacy labels](docs/visuals/overview.svg)

## Why Use AI Chat Exporter?

- Export AI chats from ChatGPT, Claude, Gemini, and Grok with one extension.
- Save conversations as **PDF, Markdown, TXT, JSON, CSV, or PNG**.
- Select all messages, assistant replies, user messages, or individual turns.
- Preserve headings, lists, tables, code blocks, inline code, and math.
- Generate cleaner developer notes with local syntax highlighting.
- Customize filenames, document titles, PDF theme, paper size, and page numbers.
- Keep export preferences locally for faster repeat exports.
- Avoid broad website access, analytics, remote logging, and server processing.

## Best For

- Backing up important AI conversations.
- Turning ChatGPT, Claude, Gemini, or Grok chats into documentation.
- Saving research, prompts, answers, code samples, and decision records.
- Creating Markdown transcripts for GitHub, Obsidian, Notion, or static docs.
- Exporting structured JSON or CSV for personal archives and analysis.
- Producing printable PDF copies of selected AI chat messages.

## Topics and Keywords

Use these repository topics for GitHub discoverability:

`ai-chat-exporter` `chatgpt-export` `claude-export` `gemini-export`
`grok-export` `ai-chat-backup` `chat-export` `conversation-export`
`browser-extension` `chrome-extension` `firefox-extension` `manifest-v3`
`markdown-export` `pdf-export` `json-export` `csv-export` `png-export`
`privacy-first` `local-first` `open-source`

## Supported AI Chat Apps

AI Chat Exporter is scoped only to supported AI chat domains:

| Provider | Supported domains |
| --- | --- |
| Claude | `claude.ai`, `*.claude.ai` |
| ChatGPT | `chatgpt.com`, `*.chatgpt.com`, `chat.openai.com` |
| Gemini | `gemini.google.com` |
| Grok | `grok.com`, `*.grok.com` |

AI chat interfaces change often. The extension uses provider-specific selectors
and fallbacks, but a major site redesign can still affect scraping. If export
breaks, please open an issue with the provider, browser, extension version, and
a screenshot.

## Export Formats

| Format | Use it for |
| --- | --- |
| PDF | Printable conversation archives through your browser print dialog. |
| Markdown | Clean transcripts for docs, GitHub, Obsidian, and notes. |
| TXT | Plain-text copies with minimal formatting. |
| JSON | Structured exports with metadata and message fields. |
| CSV | Spreadsheet-friendly message rows. |
| PNG | Shareable image captures of selected conversation content. |

## Privacy and Permissions

AI Chat Exporter is local-first by design.

It does not:

- send conversations to a server
- store exported conversations
- analyze your chats
- use analytics, ads, telemetry, or tracking pixels
- request `<all_urls>`
- request the browser `downloads` permission
- run a background service worker

The extension uses narrow browser permissions:

| Permission | Purpose |
| --- | --- |
| `activeTab` | Lets the popup communicate with the current supported chat tab after you click the extension. |
| `scripting` | Lets the popup inject this extension's local scripts into a supported active tab if needed. |
| `storage` | Saves local preferences such as format, PDF theme, paper size, page numbers, and mute setting. |
| Host permissions | Limited to Claude, ChatGPT, Gemini, and Grok domains listed above. |

Conversation content, filenames, and document titles are not stored in extension
storage. PDF export uses the browser print dialog; choose **Save as PDF** when
the print window opens.

For more detail, read [PRIVACY.md](PRIVACY.md).

## Install From Source

Requirements:

- Node.js
- Chrome, Chromium, or Firefox 121+

Build both browser targets:

```bash
npm run build
```

### Chrome or Chromium

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

## How to Export an AI Chat

1. Open a conversation on Claude, ChatGPT, Gemini, or Grok.
2. Click the in-page **Export** button, or open the extension popup and click
   **Open exporter**.
3. Select the messages you want to save.
4. Choose PDF, Markdown, TXT, JSON, CSV, or PNG.
5. Click **Export**.

Keyboard shortcuts while the export panel is open:

| Shortcut | Action |
| --- | --- |
| `Alt+A` | Select all messages |
| `Alt+C` | Select assistant messages |
| `Alt+Y` | Select your messages |
| `Alt+N` or `Alt+D` | Deselect all messages |
| `Escape` | Close the export panel |

## Formatting Support

AI Chat Exporter preserves common AI response structure, including:

- headings
- ordered and unordered lists
- tables
- fenced code blocks
- inline code
- block math and inline math
- structured assistant responses

Code highlighting is done locally. Supported language detection includes
JavaScript, TypeScript, JSX, TSX, Python, Bash, PowerShell, SQL, JSON, YAML,
HTML, XML, CSS, Dockerfile, and several common compiled languages.

## Troubleshooting

If the in-page **Export** button does not appear:

1. Reload the chat tab.
2. Check that the extension has site access for the current chat app.
3. Click the extension icon and press **Open exporter**.
4. In Firefox temporary installs, reload the add-on from
   `dist/firefox/manifest.json` after rebuilding.

If messages are missing:

- Scroll the conversation so older messages load.
- Click **Refresh** in the export panel.
- Try selecting messages directly in the chat.
- Open the extension popup and press **Check** to see whether the content
  script is connected, how many messages were detected, and whether the native
  Export button was placed.
- Open an issue with the provider name, browser, extension version, what failed,
  and a screenshot.

## Development

Useful commands:

```bash
npm run icons      # regenerate extension icons
npm run build      # build dist/chrome and dist/firefox
npm test           # run smoke tests against built targets
npm run check      # build and test
npm run test:browser # run Playwright UI checks against local provider fixtures
npm run package    # create Chrome ZIP and Firefox XPI
npm run release    # check and package
```

Release artifacts are written to `web-ext-artifacts/`.

If `npm run test:browser` cannot find a browser locally, run:

```bash
npx playwright install chromium
```

For store release steps, read [docs/PUBLISHING.md](docs/PUBLISHING.md).
For manual release QA, read [docs/QA_CHECKLIST.md](docs/QA_CHECKLIST.md).
For export fidelity notes, read [docs/EXPORT_QUALITY.md](docs/EXPORT_QUALITY.md).
For the project security review, read [docs/SECURITY_REVIEW.md](docs/SECURITY_REVIEW.md).

## Project Structure

```text
extension/
  content/          Scraper, export panel, and file exporters
  icons/            Extension icon source and generated PNG icons
  shared/           Provider registry and shared utilities
  manifest.*.json   Browser-specific source manifests
scripts/
  build.mjs         Builds dist/chrome and dist/firefox
  browser-ui-test.mjs
  generate-icons.mjs
  package.mjs       Creates Chrome ZIP and Firefox XPI artifacts
  fixture-scraper-test.mjs
  smoke-test.mjs    Static safety and packaging checks
docs/
  visuals/          README and store-supporting visuals
  PUBLISHING.md     Store submission and GitHub release steps
  QA_CHECKLIST.md   Manual release checks
  EXPORT_QUALITY.md Export fidelity notes and limitations
  SECURITY_REVIEW.md Permission and data-flow review
  STORE_LISTING.md  Store listing copy and screenshot checklist
```

## Security

Please report security issues privately. See [SECURITY.md](SECURITY.md) and
[docs/SECURITY_REVIEW.md](docs/SECURITY_REVIEW.md).

## Contributing

Bug reports and pull requests are welcome. Use the GitHub issue templates for
provider breakage, bugs, and feature requests. For provider breakage, include:

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
