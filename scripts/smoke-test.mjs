import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extensionDir = path.join(rootDir, "extension");
const distDir = path.join(rootDir, "dist");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function walkFiles(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

for (const browserName of ["chrome", "firefox"]) {
  const manifestPath = path.join(distDir, browserName, "manifest.json");
  const manifest = await readJson(manifestPath);

  assert(manifest.manifest_version === 3, `${browserName} manifest must use MV3`);
  assert(manifest.name === "AI Chat Exporter", `${browserName} manifest name mismatch`);
  assert(!manifest.background, `${browserName} manifest should not need background permissions`);
  assert(!manifest.permissions?.includes("downloads"), `${browserName} should not request downloads permission`);
  assert(!manifest.permissions?.includes("tabs"), `${browserName} should not request tabs permission`);
  assert(!manifest.host_permissions?.includes("<all_urls>"), `${browserName} should not request all URLs`);
  assert(manifest.host_permissions?.every((item) => /(claude\.ai|chatgpt\.com|chat\.openai\.com|gemini\.google\.com|grok\.com)/.test(item)), `${browserName} host permissions must stay supported-site scoped`);
  assert(manifest.icons?.["128"] === "icons/icon128.png", `${browserName} manifest should include production icons`);
  assert(manifest.action?.default_icon?.["32"] === "icons/icon32.png", `${browserName} action should include toolbar icons`);

  const contentScript = manifest.content_scripts?.[0];
  assert(contentScript, `${browserName} missing content script`);
  assert(contentScript.matches.every((item) => /(claude\.ai|chatgpt\.com|chat\.openai\.com|gemini\.google\.com|grok\.com)/.test(item)), `${browserName} content script must stay supported-site scoped`);
  assert(contentScript.js.indexOf("shared/providers.js") > contentScript.js.indexOf("shared/utils.js"), `${browserName} provider registry should load after utils`);
  assert(contentScript.js.indexOf("shared/providers.js") < contentScript.js.indexOf("content/scraper.js"), `${browserName} provider registry should load before scraper`);
  for (const host of ["claude.ai", "chatgpt.com", "chat.openai.com", "gemini.google.com", "grok.com"]) {
    assert(manifest.host_permissions?.some((item) => item.includes(host)), `${browserName} host permissions should include ${host}`);
    assert(contentScript.matches.some((item) => item.includes(host)), `${browserName} content script should include ${host}`);
  }

  for (const jsFile of contentScript.js) {
    const generatedFile = path.join(distDir, browserName, jsFile);
    assert((await stat(generatedFile)).isFile(), `${browserName} missing content script ${jsFile}`);
  }

  assert((await stat(path.join(distDir, browserName, "icons", "icon128.png"))).isFile(), `${browserName} missing generated icon`);
  assert((await stat(path.join(distDir, browserName, "popup.html"))).isFile(), `${browserName} missing popup`);
}

const sourceFiles = await walkFiles(extensionDir);
const sourceText = (await Promise.all(sourceFiles.map((file) => readFile(file, "utf8")))).join("\n");

assert(!/\bfetch\s*\(/.test(sourceText), "Source should not use fetch");
assert(!/\bXMLHttpRequest\b/.test(sourceText), "Source should not use XMLHttpRequest");
assert(!/analytics|telemetry|tracking/i.test(sourceText), "Source should not include analytics or tracking code");
assert(/format:\s*"markdown"/.test(sourceText), "Exporter should include Markdown support");
assert(/format:\s*"pdf"/.test(sourceText), "Exporter should include PDF support");
assert(/format:\s*"png"/.test(sourceText), "Exporter should include PNG support");
assert(/font-user-message/.test(sourceText), "Scraper should include Claude user-message selectors");
assert(/font-claude-message/.test(sourceText), "Scraper should include Claude assistant-message selectors");
assert(/chatgpt\.com/.test(sourceText) && /gemini\.google\.com/.test(sourceText) && /grok\.com/.test(sourceText), "Extension should support ChatGPT, Gemini, and Grok hosts");
assert(/ACEProviders/.test(sourceText), "Extension should use provider adapters");
assert(/model-response/.test(sourceText) && /user-query/.test(sourceText), "Scraper should include Gemini/Grok-style message selectors");
assert(/You said/.test(sourceText) && /Claude responded/.test(sourceText), "Scraper should include transcript marker fallback");
assert(/aside/.test(sourceText) && /sidebar/.test(sourceText), "Scraper should remove Claude app sidebar chrome");
assert(/autoPrint/.test(sourceText), "PDF export should open a self-printing document");
assert(!/printWindow\.document/.test(sourceText), "PDF export should not access a new tab document");
assert(/annotation\[encoding\*='tex' i\]/.test(sourceText), "Scraper should preserve TeX annotations for math");
assert(/ace-math-inline/.test(sourceText), "HTML export should preserve inline math");
assert(/ace-math-block/.test(sourceText), "HTML export should preserve block math");
assert(/highlightCode/.test(sourceText), "Exporter should syntax-highlight code blocks locally");
assert(/ace-token-keyword/.test(sourceText), "Export CSS should include syntax highlighting token styles");
assert(/detectCodeLanguage/.test(sourceText), "Exporter should infer common code block languages");
assert(/Message actions/.test(sourceText), "Scraper should use Claude message action bars as a role fallback");
assert(/Give positive feedback/.test(sourceText), "Scraper should distinguish Claude responses from feedback controls");
assert(/collectActionGroupEntries/.test(sourceText), "Scraper should use message action groups as fallback entries");
assert(/collectContentEntries/.test(sourceText), "Scraper should prefer native Claude content nodes");
assert(/DATE_ONLY_PATTERN/.test(sourceText), "Scraper should reject date separators as messages");
assert(/stripLeadingTranscriptMarker/.test(sourceText), "Scraper should strip You said and Claude responded labels from content");
assert(!/font-user-message\|user-message\|you said\|human\|user/.test(sourceText), "Role matching should not treat every bare user class as a user message");
assert(/detectClaudeTheme/.test(sourceText), "Content UI should detect native light and dark themes");
assert(/Export chat/.test(sourceText), "Panel copy should feel like a native chat action");
assert(/data-theme/.test(sourceText), "Panel styles should be theme-aware");
assert(/flex-direction:\s*column/.test(sourceText), "Panel should use a flex column layout");
assert(/top:\s*72px/.test(sourceText), "Launcher should avoid Claude's bottom composer area");
assert(/ace-chat-select-button/.test(sourceText), "Messages should be selectable directly in the Claude chat");
assert(/handleKeyboardShortcuts/.test(sourceText), "Selection mode should include keyboard shortcuts");
assert(/Alt\+A/.test(sourceText) && /Alt\+N/.test(sourceText), "Selection shortcuts should expose all and none actions");
assert(/findShareButton/.test(sourceText), "Launcher should find native share/export buttons");
assert(/makeNativeLauncher/.test(sourceText), "Launcher should clone native button style");
assert(/insertAdjacentElement\("afterend", launcher\)/.test(sourceText), "Launcher should sit next to Share");
assert(/data-ace-native-launcher/.test(sourceText), "Native launcher should avoid floating fallback styles");
assert(/width:\s*min\(340px/.test(sourceText), "Panel should stay compact so chat messages remain selectable");
assert(/max-height:\s*min\(460px/.test(sourceText), "Panel should use compact height instead of full viewport height");
assert(/ace-quick-export/.test(sourceText), "Panel should prioritize quick export over large settings");
assert(/state\.settingsOpen/.test(sourceText), "Detailed settings should be collapsible");
assert(/messageClickHandler/.test(sourceText), "Clicking the message itself should toggle selection");
assert(/muteExport/.test(sourceText), "Exporter should include muted export alerts");
assert(/iconSvg/.test(sourceText), "Exporter UI should use inline icons without remote assets");
assert(/ace-selection-rail/.test(sourceText), "Message selection boxes should live in a single side rail");
assert(/selectionRailX/.test(sourceText), "Selection rail should use one shared side position");
assert(/chatRight/.test(sourceText) && /rightOverlayEdge/.test(sourceText), "Selection rail should sit on the right side without hiding under the panel");
assert(/positionSelectionRail/.test(sourceText), "Selection boxes should stay aligned while scrolling");
assert(/installRouteChangeWatcher/.test(sourceText), "Claude SPA route changes should be watched");
assert(/pushState/.test(sourceText) && /replaceState/.test(sourceText), "History route changes should reset exporter state");
assert(/popstate/.test(sourceText) && /hashchange/.test(sourceText), "Browser navigation should reset exporter state");
assert(/resetConversationState/.test(sourceText), "Switching chats should clear stale selection state");

console.log("Smoke tests passed");
