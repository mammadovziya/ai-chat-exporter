import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureDir = path.join(rootDir, "tests", "fixtures", "scraper");
const screenshotDir = path.join(rootDir, "test-results", "browser-ui");

const contentFiles = [
  "extension/shared/utils.js",
  "extension/shared/providers.js",
  "extension/content/scraper.js",
  "extension/content/exporters.js",
  "extension/content/content.js"
];

const cases = [
  {
    provider: "claude",
    url: "https://claude.ai/chat/browser-ui-fixture",
    fixture: "claude.html",
    assistantLabel: "Claude",
    expectedMessages: 6,
    expectedUserMessages: 3
  },
  {
    provider: "chatgpt",
    url: "https://chatgpt.com/c/browser-ui-fixture",
    fixture: "chatgpt.html",
    assistantLabel: "GPT",
    expectedMessages: 4,
    expectedUserMessages: 2
  },
  {
    provider: "gemini",
    url: "https://gemini.google.com/app/browser-ui-fixture",
    fixture: "gemini.html",
    assistantLabel: "Gemini",
    expectedMessages: 4,
    expectedUserMessages: 2
  },
  {
    provider: "grok",
    url: "https://grok.com/chat/browser-ui-fixture",
    fixture: "grok.html",
    assistantLabel: "Grok",
    expectedMessages: 4,
    expectedUserMessages: 2
  }
];

function rectsOverlap(left, right) {
  return !(left.right <= right.left || left.left >= right.right || left.bottom <= right.top || left.top >= right.bottom);
}

async function launchBrowser() {
  const attempts = [
    { name: "bundled Chromium", options: {} },
    { name: "Chrome", options: { channel: "chrome" } },
    { name: "Microsoft Edge", options: { channel: "msedge" } }
  ];
  const errors = [];

  for (const attempt of attempts) {
    try {
      return await chromium.launch({
        ...attempt.options,
        headless: true
      });
    } catch (error) {
      errors.push(`${attempt.name}: ${error.message}`);
    }
  }

  throw new Error([
    "Unable to launch a Chromium browser for UI tests.",
    "Run `npx playwright install chromium` and try again.",
    ...errors
  ].join("\n\n"));
}

async function injectExtension(page) {
  await page.addStyleTag({ path: path.join(rootDir, "extension", "content", "content.css") });

  for (const file of contentFiles) {
    await page.addScriptTag({ path: path.join(rootDir, file) });
  }
}

async function pageText(locator) {
  return (await locator.textContent() || "").replace(/\s+/g, " ").trim();
}

async function runCase(browser, testCase) {
  const html = await readFile(path.join(fixtureDir, testCase.fixture), "utf8");
  const expectedHost = new URL(testCase.url).hostname;
  const context = await browser.newContext({
    colorScheme: "dark",
    viewport: { width: 1366, height: 900 }
  });
  const page = await context.newPage();

  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === expectedHost) {
      await route.fulfill({
        body: html,
        contentType: "text/html; charset=utf-8",
        status: 200
      });
      return;
    }

    await route.abort();
  });

  await page.goto(testCase.url, { waitUntil: "domcontentloaded" });
  await injectExtension(page);

  const launcher = page.locator("#ace-exporter-launcher");
  await launcher.waitFor({ state: "visible", timeout: 5000 });

  assert.equal(await launcher.getAttribute("data-provider"), testCase.provider, `${testCase.provider}: launcher provider mismatch`);
  assert.equal(await launcher.getAttribute("data-ace-native-launcher"), "true", `${testCase.provider}: launcher should clone a native top-bar control`);
  assert.match(await pageText(launcher), /Export/i, `${testCase.provider}: launcher should show Export`);

  await launcher.click();

  const panel = page.locator("#ace-exporter-panel");
  await panel.waitFor({ state: "visible", timeout: 5000 });
  assert.equal(await page.locator(".ace-panel-shell").getAttribute("aria-modal"), "true", `${testCase.provider}: panel dialog should be modal for keyboard users`);
  await page.waitForFunction(() => document.activeElement?.matches?.('[data-option="format"]'));
  await page.waitForFunction((expectedMessages) => {
    return document.querySelectorAll(".ace-chat-select-button:not([hidden])").length === expectedMessages;
  }, testCase.expectedMessages);

  const panelData = await page.evaluate(({ expectedMessages, assistantLabel }) => {
    const panelElement = document.querySelector("#ace-exporter-panel");
    const panelRect = panelElement.getBoundingClientRect();
    const shell = panelElement.querySelector(".ace-panel-shell");
    const selectionButtons = Array.from(document.querySelectorAll(".ace-chat-select-button:not([hidden])"));
    const selectionRects = selectionButtons.map((button) => {
      const rect = button.getBoundingClientRect();
      return {
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        top: rect.top
      };
    });
    const labelSpans = Array.from(panelElement.querySelectorAll(".ace-button-content > span"));
    const clippedLabels = labelSpans
      .filter((span) => span.scrollWidth > span.clientWidth + 1)
      .map((span) => span.textContent.trim());
    const toolbarLabels = Array.from(panelElement.querySelectorAll(".ace-selection-toolbar button"))
      .map((button) => button.textContent.replace(/\s+/g, " ").trim());

    return {
      clippedLabels,
      panelProvider: panelElement.dataset.provider,
      panelWidth: Math.round(panelRect.width),
      selectionButtonCount: selectionButtons.length,
      selectionButtonsOverlapPanel: selectionRects.some((rect) => {
        return !(rect.right <= panelRect.left || rect.left >= panelRect.right || rect.bottom <= panelRect.top || rect.top >= panelRect.bottom);
      }),
      selectionCountText: panelElement.querySelector("[data-selection-count]")?.textContent.trim(),
      shellScrollsHorizontally: shell.scrollWidth > shell.clientWidth + 1,
      toolbarLabels,
      toolbarHasAssistant: toolbarLabels.some((label) => label.includes(assistantLabel)),
      visibleText: panelElement.textContent.replace(/\s+/g, " ").trim()
    };
  }, {
    assistantLabel: testCase.assistantLabel,
    expectedMessages: testCase.expectedMessages
  });

  assert.equal(panelData.panelProvider, testCase.provider, `${testCase.provider}: panel provider mismatch`);
  assert(panelData.panelWidth <= 230, `${testCase.provider}: panel should stay narrow, got ${panelData.panelWidth}px`);
  assert(panelData.panelWidth >= 210, `${testCase.provider}: panel became too narrow, got ${panelData.panelWidth}px`);
  assert.equal(panelData.selectionButtonCount, testCase.expectedMessages, `${testCase.provider}: selection buttons should match messages`);
  assert.equal(panelData.selectionCountText, `${testCase.expectedMessages} of ${testCase.expectedMessages} selected`, `${testCase.provider}: initial selection count mismatch`);
  assert.equal(panelData.selectionButtonsOverlapPanel, false, `${testCase.provider}: selection buttons should not sit under the export panel`);
  assert.equal(panelData.shellScrollsHorizontally, false, `${testCase.provider}: panel should not have horizontal overflow`);
  assert.deepEqual(panelData.clippedLabels, [], `${testCase.provider}: panel labels should not be clipped`);
  assert(panelData.toolbarLabels.includes("Refresh"), `${testCase.provider}: Refresh shortcut missing`);
  assert(panelData.toolbarLabels.includes("All"), `${testCase.provider}: All shortcut missing`);
  assert(panelData.toolbarHasAssistant, `${testCase.provider}: assistant shortcut missing`);
  assert(panelData.toolbarLabels.includes("You"), `${testCase.provider}: You shortcut missing`);
  assert(panelData.toolbarLabels.includes("None"), `${testCase.provider}: None shortcut missing`);
  for (const label of ["Markdown", "Export", "Mute", "Settings"]) {
    assert.match(panelData.visibleText, new RegExp(label), `${testCase.provider}: ${label} action should stay readable`);
  }

  await page.locator('[data-action="close"]').focus();
  await page.keyboard.press("Shift+Tab");
  assert.equal(await page.evaluate(() => document.activeElement?.dataset?.action), "clear", `${testCase.provider}: Shift+Tab should wrap to the last panel control`);
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement?.dataset?.action), "close", `${testCase.provider}: Tab should wrap back to the first panel control`);

  await page.locator('[data-action="clear"]').click();
  assert.match(await pageText(page.locator("[data-selection-count]")), new RegExp(`^0 of ${testCase.expectedMessages} selected$`), `${testCase.provider}: clear should deselect all`);

  await page.locator('[data-action="select-user"]').click();
  assert.match(await pageText(page.locator("[data-selection-count]")), new RegExp(`^${testCase.expectedUserMessages} of ${testCase.expectedMessages} selected$`), `${testCase.provider}: user shortcut should select user messages`);

  await page.keyboard.press("Alt+A");
  assert.match(await pageText(page.locator("[data-selection-count]")), new RegExp(`^${testCase.expectedMessages} of ${testCase.expectedMessages} selected$`), `${testCase.provider}: Alt+A should select all`);

  await page.keyboard.press("Escape");
  await panel.waitFor({ state: "hidden", timeout: 5000 });
  await launcher.waitFor({ state: "visible", timeout: 5000 });
  await page.waitForFunction(() => document.activeElement?.id === "ace-exporter-launcher");

  if (process.env.ACE_BROWSER_TEST_SCREENSHOTS === "1") {
    await mkdir(screenshotDir, { recursive: true });
    await page.screenshot({
      fullPage: false,
      path: path.join(screenshotDir, `${testCase.provider}.png`)
    });
  }

  await context.close();
}

const browser = await launchBrowser();
try {
  for (const testCase of cases) {
    await runCase(browser, testCase);
  }
} finally {
  await browser.close();
}

console.log("Browser UI tests passed");
