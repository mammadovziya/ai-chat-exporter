# Privacy Policy

AI Chat Exporter is designed as a local-first extension.

- Conversation content is read only from the active supported AI chat page.
- Export files are generated locally in your browser.
- The extension does not send conversation content to any server.
- The extension does not use analytics, telemetry, tracking pixels, or ads.
- The extension does not request broad access to all websites.
- The extension does not store exported conversations.

The only site access requested by the extension is for supported AI chat pages:
Claude, ChatGPT, Gemini, and Grok. This lets the export panel inspect the
currently visible conversation and build files from the selected messages.

The `scripting` permission is used only after you click the extension popup on a
supported chat tab. It injects this extension's local content scripts and CSS
into that active tab when the browser did not load them automatically.

PDF export uses your browser print dialog. Choose "Save as PDF" or the
equivalent option in Chrome or Firefox.

Silent export mode only mutes in-page success and info alerts. It does not send
or store any additional data.
