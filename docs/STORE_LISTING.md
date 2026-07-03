# Store Listing

Use this as the source copy for Chrome Web Store and Mozilla Add-ons listings.

## Short Description

Privacy-first AI chat exporter for Claude, ChatGPT, Gemini, and Grok. Save
selected chats as PDF, Markdown, TXT, JSON, CSV, or PNG.

## Full Description

AI Chat Exporter helps you save useful AI conversations without sending your
chat data to a server. Open a supported chat, click Export, choose the messages
you need, and save a clean local file.

Supported providers:

- Claude
- ChatGPT
- Gemini
- Grok

Export formats:

- PDF through your browser print dialog
- Markdown for docs, GitHub, Obsidian, and notes
- TXT for plain-text archives
- JSON for structured backups
- CSV for spreadsheets
- PNG for shareable snapshots

Privacy:

- no analytics
- no telemetry
- no remote logging
- no server-side conversation processing
- no `<all_urls>` permission
- no `downloads` permission
- preferences only are stored locally

Formatting support includes headings, lists, tables, code blocks, inline code,
math, and supported SVG diagrams.

## Permission Justification

| Permission | Store explanation |
| --- | --- |
| `activeTab` | Opens the exporter on the supported chat tab after the user clicks the extension. |
| `scripting` | Restores the local content script on a supported chat tab if the browser did not inject it automatically. |
| `storage` | Saves local preferences such as export format and PDF settings. |
| Host permissions | Runs only on supported AI chat domains: Claude, ChatGPT, Gemini, and Grok. |

## Screenshot Checklist

Capture screenshots with private chat content replaced by safe examples:

- popup diagnostics showing a supported provider
- native Export button beside provider controls
- compact export panel
- message selection boxes on the right side of chat messages
- Markdown or PDF output preserving code/table/math formatting

## Review Notes

The extension is local-first. Conversation content is read from the active chat
page only to generate the requested file in the browser. The project does not
operate backend services for export processing.
