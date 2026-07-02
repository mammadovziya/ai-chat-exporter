(function attachPopup(globalScope) {
  "use strict";

  const api = globalScope.browser || globalScope.chrome;
  const providers = globalScope.ACEProviders;
  const button = document.getElementById("open-exporter");
  const status = document.getElementById("status");
  const CONTENT_CSS_FILES = ["content/content.css"];
  const CONTENT_SCRIPT_FILES = [
    "shared/utils.js",
    "shared/providers.js",
    "content/scraper.js",
    "content/exporters.js",
    "content/content.js"
  ];

  function setStatus(message) {
    status.textContent = message;
  }

  function queryActiveTab() {
    const result = api.tabs.query({ active: true, currentWindow: true });
    if (result && typeof result.then === "function") {
      return result.then((tabs) => tabs[0]);
    }

    return new Promise((resolve, reject) => {
      api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const error = api.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }
        resolve(tabs[0]);
      });
    });
  }

  function sendMessage(tabId, message) {
    const result = api.tabs.sendMessage(tabId, message);
    if (result && typeof result.then === "function") {
      return result;
    }

    return new Promise((resolve, reject) => {
      api.tabs.sendMessage(tabId, message, (response) => {
        const error = api.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }
        resolve(response);
      });
    });
  }

  function executeScript(tabId, file) {
    if (!api.scripting?.executeScript) {
      return Promise.reject(new Error("Script injection is not available."));
    }

    const details = {
      target: { tabId },
      files: [file]
    };

    if (globalScope.browser?.scripting?.executeScript) {
      return globalScope.browser.scripting.executeScript(details);
    }

    return new Promise((resolve, reject) => {
      api.scripting.executeScript(details, (result) => {
        const error = api.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }
        resolve(result);
      });
    });
  }

  function insertCss(tabId, file) {
    if (!api.scripting?.insertCSS) {
      return Promise.resolve();
    }

    const details = {
      target: { tabId },
      files: [file]
    };

    if (globalScope.browser?.scripting?.insertCSS) {
      return globalScope.browser.scripting.insertCSS(details).catch(() => undefined);
    }

    return new Promise((resolve) => {
      api.scripting.insertCSS(details, () => resolve());
    });
  }

  async function wakeContentScript(tabId) {
    await Promise.all(CONTENT_CSS_FILES.map((file) => insertCss(tabId, file)));

    for (const file of CONTENT_SCRIPT_FILES) {
      await executeScript(tabId, file);
    }
  }

  async function openPanelInTab(tabId) {
    try {
      return await sendMessage(tabId, { type: "ACE_OPEN_PANEL" });
    } catch (error) {
      setStatus("Waking exporter on this tab...");
      await wakeContentScript(tabId);
      return sendMessage(tabId, { type: "ACE_OPEN_PANEL" });
    }
  }

  async function openExporter() {
    button.disabled = true;
    setStatus("Opening exporter...");

    try {
      const tab = await queryActiveTab();
      if (!tab?.id || !providers?.isSupportedUrl(tab.url || "")) {
        setStatus("Open Claude, ChatGPT, Gemini, or Grok first.");
        return;
      }

      const response = await openPanelInTab(tab.id);
      if (response?.ok) {
        setStatus(`Exporter opened. ${response.count || 0} messages found.`);
        window.setTimeout(() => window.close(), 400);
        return;
      }

      setStatus("Reload the chat tab, then try again.");
    } catch (error) {
      setStatus("Allow site access for this chat, reload, then try again.");
    } finally {
      button.disabled = false;
    }
  }

  button.addEventListener("click", openExporter);
})(globalThis);
