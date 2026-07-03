# Publishing

AI Chat Exporter ships as separate Chrome and Firefox builds from the same
source tree.

## Release Checklist

1. Update `package.json`, `extension/manifest.chrome.json`, and
   `extension/manifest.firefox.json` to the same version.
2. Update `CHANGELOG.md`.
3. Run:

   ```bash
   npm run check
   npm run test:browser
   npm run package
   ```

4. Inspect `web-ext-artifacts/`.
5. Create and push a matching tag:

   ```bash
   git tag v1.2.0
   git push origin v1.2.0
   ```

The `Release` workflow verifies the tag version, runs checks, runs browser UI
tests, packages both extension targets, and creates a GitHub release with the
artifacts attached.

## Artifacts

The package command writes:

- `web-ext-artifacts/ai-chat-exporter-chrome-<version>.zip`
- `web-ext-artifacts/ai-chat-exporter-firefox-<version>.xpi`

Use the Chrome ZIP for the Chrome Web Store. Use the Firefox XPI for Mozilla
Add-ons submission/signing.

## Chrome Web Store

Official guide: <https://developer.chrome.com/docs/webstore/publish>

1. Open the Chrome Developer Dashboard.
2. Upload the Chrome ZIP artifact.
3. Fill store listing details, screenshots, permissions justification, and
   privacy practices.
4. Submit for review.

Suggested privacy disclosure:

- The extension does not collect, sell, transfer, or remotely process user
  data.
- Conversation content is processed locally in the browser.
- Export preferences are stored locally with the browser extension storage API.
- The extension uses host permissions only for Claude, ChatGPT, Gemini, and
  Grok pages.

## Firefox Add-ons

Official submission guide:
<https://extensionworkshop.com/documentation/publish/submitting-an-add-on/>

Official signing overview:
<https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/>

Firefox release and beta installs require Mozilla signing. Submit the Firefox
XPI through AMO for listed distribution, or submit it for unlisted signing if
the extension will be distributed outside AMO.

Use the same privacy disclosure as Chrome, adjusted for the AMO form fields.

## Manual Review Before Store Submission

- Confirm `npm run check` passes.
- Confirm `npm run test:browser` passes.
- Load `dist/chrome` in Chrome and open one supported provider.
- Load `dist/firefox/manifest.json` temporarily in Firefox and open one
  supported provider.
- Open the popup and press **Check**.
- Confirm the in-page Export button appears in the expected native area.
- Export one Markdown file and one PDF.
- Confirm no broad permissions such as `<all_urls>`, `tabs`, or `downloads`
  were added.

## Notes

The GitHub release workflow publishes unsigned build artifacts. Store signing,
review, and listing metadata still happen in the Chrome Web Store and Mozilla
Add-ons dashboards because those steps require account-specific credentials and
review decisions.
