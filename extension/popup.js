(function attachPopup(globalScope) {
  "use strict";

  const api = globalScope.browser || globalScope.chrome;
  const providers = globalScope.ACEProviders;
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

  async function openExporter() {
    button.disabled = true;
    setStatus("Opening exporter...");

    try {
      const tab = await queryActiveTab();
      if (!tab?.id || !providers?.isSupportedUrl(tab.url || "")) {
        setStatus("Open Claude, ChatGPT, Gemini, or Grok first.");
        return;
      }

      const response = await sendMessage(tab.id, { type: "ACE_OPEN_PANEL" });
      if (response?.ok) {
        setStatus(`Exporter opened. ${response.count || 0} messages found.`);
        window.setTimeout(() => window.close(), 400);
        return;
      }

      setStatus("Reload the chat tab, then try again.");
    } catch (error) {
      setStatus("Reload the chat tab, then try again.");
    } finally {
      button.disabled = false;
    }
  }

  button.addEventListener("click", openExporter);
})(globalThis);
