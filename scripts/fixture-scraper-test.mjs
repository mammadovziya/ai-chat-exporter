import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureDir = path.join(rootDir, "tests", "fixtures", "scraper");

const extensionScripts = [
  "extension/shared/utils.js",
  "extension/shared/providers.js",
  "extension/content/scraper.js"
];

const cases = [
  {
    provider: "claude",
    url: "https://claude.ai/chat/fixture-claude",
    fixture: "claude.html",
    title: "Security Testing Fixture",
    messages: [
      { role: "user", text: "older scan scope" },
      { role: "assistant", text: "scanme.nmap.org", markdown: "```bash", html: "ace-math-inline" },
      { role: "user", text: "Show me a table" },
      { role: "assistant", text: "def audit_target", markdown: "| Item | Value |", html: "language-python" },
      { role: "user", text: "simple flowchart diagram" },
      { role: "assistant", text: "Plan Build Ship", markdown: "[Diagram:", html: "ace-export-diagram" }
    ],
    absentText: ["New chat", "Projects", "Upgrade", "show_widget"]
  },
  {
    provider: "chatgpt",
    url: "https://chatgpt.com/c/fixture-chatgpt",
    fixture: "chatgpt.html",
    title: "Short Python Code",
    messages: [
      { role: "user", text: "short python code" },
      { role: "assistant", text: "Here is a compact example", markdown: "```python", html: "language-python" },
      { role: "user", text: "make it return JSON" },
      { role: "assistant", text: "returns a dictionary", markdown: "| Key | Meaning |" }
    ],
    absentText: ["Library", "Scheduled", "Pinned"]
  },
  {
    provider: "gemini",
    url: "https://gemini.google.com/app/fixture-gemini",
    fixture: "gemini.html",
    title: "Python Code Snippets For Common Tasks",
    messages: [
      { role: "user", text: "give me short python code" },
      { role: "assistant", text: "List Comprehension", markdown: "```python", html: "language-python" },
      { role: "user", text: "also show a formula" },
      { role: "assistant", text: "Quadratic Formula", markdown: "x = \\frac" }
    ],
    absentText: ["Search chats", "New notebook", "Upgrade"]
  },
  {
    provider: "grok",
    url: "https://grok.com/chat/fixture-grok",
    fixture: "grok.html",
    title: "Grok Export Fixture",
    messages: [
      { role: "user", text: "summarize this repo" },
      { role: "assistant", text: "privacy-first browser extension", markdown: "| Area | Status |" },
      { role: "user", text: "show install command" },
      { role: "assistant", text: "npm run build", markdown: "```bash", html: "language-bash" }
    ],
    absentText: ["Private Chat", "Explore", "Sign in"]
  }
];

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rectangle(left, top, width, height) {
  return {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON() {
      return { x: this.x, y: this.y, left: this.left, top: this.top, width: this.width, height: this.height, right: this.right, bottom: this.bottom };
    }
  };
}

function installLayoutStubs(window) {
  const innerTextDescriptor = Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, "innerText");
  if (!innerTextDescriptor?.get) {
    Object.defineProperty(window.HTMLElement.prototype, "innerText", {
      configurable: true,
      get() {
        return this.textContent;
      },
      set(value) {
        this.textContent = value;
      }
    });
  }

  window.Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
    if (this === window.document.documentElement || this === window.document.body) {
      return rectangle(0, 0, 1440, 1200);
    }

    const tag = this.tagName?.toLowerCase() || "";
    const text = String(this.textContent || "").trim();

    if (tag === "main") {
      return rectangle(320, 0, 1000, 1100);
    }

    if (["aside", "nav", "form"].includes(tag)) {
      return rectangle(0, 0, 280, 900);
    }

    const roleSignature = [
      this.getAttribute("data-message-author-role"),
      this.getAttribute("data-role"),
      this.getAttribute("data-author"),
      this.getAttribute("data-testid"),
      this.getAttribute("class"),
      tag
    ].join(" ").toLowerCase();
    const isUser = /\b(user|human|user-query|font-user-message)\b/.test(roleSignature);
    const textWidth = Math.max(180, Math.min(840, text.length * 7));
    const width = Number(this.getAttribute("data-fixture-width")) || textWidth;
    const height = Number(this.getAttribute("data-fixture-height")) || Math.max(28, Math.ceil(text.length / 70) * 24);
    const left = Number(this.getAttribute("data-fixture-left")) || (isUser ? 760 : 420);
    const top = Number(this.getAttribute("data-fixture-top")) || 80;

    return rectangle(left, top, width, height);
  };
}

async function loadExtension(window) {
  for (const scriptPath of extensionScripts) {
    const absolutePath = path.join(rootDir, scriptPath);
    const source = await readFile(absolutePath, "utf8");
    window.eval(`${source}\n//# sourceURL=${scriptPath.replace(/\\/g, "/")}`);
  }
}

async function runCase(testCase) {
  const html = await readFile(path.join(fixtureDir, testCase.fixture), "utf8");
  const dom = new JSDOM(html, {
    pretendToBeVisual: true,
    runScripts: "outside-only",
    url: testCase.url
  });

  installLayoutStubs(dom.window);
  await loadExtension(dom.window);

  const result = dom.window.ACEChatScraper.scrape();
  const messages = result.messages;
  const details = messages.map((message) => `${message.index}:${message.role}:${message.text.slice(0, 60)}`).join("\n");

  assert.equal(result.provider?.id, testCase.provider, `${testCase.provider}: provider detection failed`);
  assert.equal(result.title, testCase.title, `${testCase.provider}: title should strip product branding`);
  assert.equal(messages.length, testCase.messages.length, `${testCase.provider}: message count mismatch\n${details}`);

  testCase.messages.forEach((expected, index) => {
    const message = messages[index];
    assert.equal(message.role, expected.role, `${testCase.provider}: message ${index + 1} role mismatch\n${details}`);
    assert.match(message.text, new RegExp(escapeRegExp(expected.text), "i"), `${testCase.provider}: message ${index + 1} missing text "${expected.text}"\n${details}`);

    if (expected.markdown) {
      assert.match(message.markdown, new RegExp(escapeRegExp(expected.markdown), "i"), `${testCase.provider}: message ${index + 1} missing markdown "${expected.markdown}"`);
    }

    if (expected.html) {
      assert.match(message.html, new RegExp(escapeRegExp(expected.html), "i"), `${testCase.provider}: message ${index + 1} missing html "${expected.html}"`);
    }
  });

  const allText = messages.map((message) => message.text).join("\n");
  for (const absent of testCase.absentText || []) {
    assert.doesNotMatch(allText, new RegExp(escapeRegExp(absent), "i"), `${testCase.provider}: exported app chrome text "${absent}"`);
  }
}

for (const testCase of cases) {
  await runCase(testCase);
}

console.log("Fixture scraper tests passed");
