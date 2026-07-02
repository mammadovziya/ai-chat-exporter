(function attachPopup(globalScope) {
  "use strict";

  const api = globalScope.browser || globalScope.chrome;
  const button = document.getElementById("open-exporter");
  const status = document.getElementById("status");

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

  function isClaudeUrl(url) {
    try {
      return /(^|\.)claude\.ai$/i.test(new URL(url).hostname);
    } catch (error) {
      return false;
    }
  }

  async function openExporter() {
    button.disabled = true;
    setStatus("Opening exporter...");

    try {
      const tab = await queryActiveTab();
      if (!tab?.id || !isClaudeUrl(tab.url || "")) {
        setStatus("Open a Claude chat first.");
        return;
      }

      const response = await sendMessage(tab.id, { type: "ACE_OPEN_PANEL" });
      if (response?.ok) {
        setStatus(`Exporter opened. ${response.count || 0} messages found.`);
        window.setTimeout(() => window.close(), 400);
        return;
      }

      setStatus("Reload the Claude tab, then try again.");
    } catch (error) {
      setStatus("Reload the Claude tab, then try again.");
    } finally {
      button.disabled = false;
    }
  }

  button.addEventListener("click", openExporter);
})(globalThis);
