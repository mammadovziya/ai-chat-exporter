(function attachPopup(globalScope) {
  "use strict";

  const api = globalScope.browser || globalScope.chrome;
  const providers = globalScope.ACEProviders;
  const button = document.getElementById("open-exporter");
  const status = document.getElementById("status");
  const activeProvider = document.getElementById("active-provider");
  const activeHost = document.getElementById("active-host");
  const actionLabel = button?.querySelector("[data-action-label]");
  const diagnosticsButton = document.getElementById("run-diagnostics");
  const diagnostics = {
    launcher: document.querySelector('[data-diagnostic="launcher"]'),
    messages: document.querySelector('[data-diagnostic="messages"]'),
    script: document.querySelector('[data-diagnostic="script"]'),
    site: document.querySelector('[data-diagnostic="site"]')
  };
  const linkButtons = Array.from(document.querySelectorAll("[data-open-url]"));
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

  function setActionLabel(message) {
    if (actionLabel) {
      actionLabel.textContent = message;
    }
  }

  function setDiagnostic(name, value) {
    if (diagnostics[name]) {
      diagnostics[name].textContent = value;
      diagnostics[name].title = value;
    }
  }

  function setDiagnostics(values) {
    Object.entries(values).forEach(([name, value]) => setDiagnostic(name, value));
  }

  function readableHost(url) {
    try {
      const parsed = new URL(url || "");
      if (!/^https?:$/.test(parsed.protocol)) {
        return "Browser page";
      }

      return parsed.hostname.replace(/^www\./, "") || "Current page";
    } catch (error) {
      return "Current page";
    }
  }

  function tabDetails(tab) {
    try {
      const parsed = new URL(tab?.url || "");
      const provider = providers?.providerForHostname?.(parsed.hostname) || null;
      return {
        host: readableHost(tab?.url),
        provider,
        supported: Boolean(provider)
      };
    } catch (error) {
      return {
        host: readableHost(tab?.url),
        provider: null,
        supported: false
      };
    }
  }

  function renderActiveTab(tab) {
    const details = tabDetails(tab);

    document.body.dataset.support = details.supported ? "supported" : "unsupported";
    activeProvider.textContent = details.supported ? `${details.provider.name} chat` : "Not a supported chat";
    activeHost.textContent = details.host;
    button.disabled = !details.supported;
    diagnosticsButton.disabled = !details.supported;
    setActionLabel("Open exporter");
    setStatus(details.supported
      ? `Ready on ${details.provider.name}.`
      : "Switch to Claude, ChatGPT, Gemini, or Grok.");
    setDiagnostics({
      launcher: details.supported ? "Not checked" : "-",
      messages: "-",
      script: details.supported ? "Not checked" : "-",
      site: details.supported ? details.provider.name : "Unsupported"
    });

    return details;
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

  function createTab(url) {
    if (globalScope.browser?.tabs?.create) {
      return globalScope.browser.tabs.create({ url });
    }

    return new Promise((resolve, reject) => {
      api.tabs.create({ url }, (tab) => {
        const error = api.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }
        resolve(tab);
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

  function renderDiagnostics(details, response) {
    if (!details.supported) {
      setDiagnostics({
        launcher: "-",
        messages: "-",
        script: "-",
        site: "Unsupported"
      });
      return;
    }

    if (!response?.contentScript) {
      setDiagnostics({
        launcher: "Unknown",
        messages: "-",
        script: "Not connected",
        site: details.provider.name
      });
      return;
    }

    const launcherLabel = response.launcherVisible
      ? `${response.launcherType === "native" ? "Native" : "Fallback"} visible`
      : `${response.launcherType || "Missing"} hidden`;

    setDiagnostics({
      launcher: launcherLabel,
      messages: response.scrapeError
        ? "Scan error"
        : `${response.messageCount || 0} total, ${response.userMessages || 0} you, ${response.assistantMessages || 0} AI`,
      script: response.ok ? "Connected" : "Needs refresh",
      site: response.provider?.name || details.provider.name
    });

    if (response.scrapeError) {
      setStatus(response.scrapeError);
    }
  }

  async function getDiagnostics(tabId, { wake = false } = {}) {
    try {
      return await sendMessage(tabId, { type: "ACE_GET_STATUS" });
    } catch (error) {
      if (!wake) {
        return { ok: false, contentScript: false };
      }

      setStatus("Checking page access...");
      await wakeContentScript(tabId);
      return sendMessage(tabId, { type: "ACE_GET_STATUS" });
    }
  }

  async function runDiagnostics({ wake = false } = {}) {
    diagnosticsButton.disabled = true;
    setDiagnostics({
      launcher: "Checking...",
      messages: "Checking...",
      script: "Checking...",
      site: "Checking..."
    });

    try {
      const tab = await queryActiveTab();
      const details = renderActiveTab(tab);
      if (!tab?.id || !details.supported) {
        return;
      }

      const response = await getDiagnostics(tab.id, { wake });
      renderDiagnostics(details, response);

      if (!response?.contentScript) {
        setStatus("Content script not connected yet. Press Check to wake it.");
      } else if (response.ok) {
        setStatus(`${response.messageCount || 0} messages detected on ${details.provider.name}.`);
      }
    } catch (error) {
      setDiagnostics({
        launcher: "Unknown",
        messages: "-",
        script: "Permission needed",
        site: "Supported"
      });
      setStatus("Allow site access for this chat, reload, then try again.");
    } finally {
      diagnosticsButton.disabled = document.body.dataset.support !== "supported";
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
    setActionLabel("Opening...");
    setStatus("Opening exporter...");

    try {
      const tab = await queryActiveTab();
      const details = tabDetails(tab);
      if (!tab?.id || !details.supported) {
        renderActiveTab(tab);
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
      setActionLabel("Open exporter");
      button.disabled = document.body.dataset.support !== "supported";
    }
  }

  async function openExternalLink(event) {
    const linkButton = event.currentTarget;
    const url = linkButton.dataset.openUrl;

    linkButton.disabled = true;
    setStatus(`Opening ${linkButton.textContent.trim()}...`);

    try {
      await createTab(url);
      window.close();
    } catch (error) {
      linkButton.disabled = false;
      setStatus("Could not open that link from the popup.");
    }
  }

  async function initializePopup() {
    document.body.dataset.support = "checking";

    try {
      const tab = await queryActiveTab();
      renderActiveTab(tab);
      runDiagnostics({ wake: false });
    } catch (error) {
      document.body.dataset.support = "unsupported";
      activeProvider.textContent = "Active tab unavailable";
      activeHost.textContent = "Current window";
      button.disabled = true;
      diagnosticsButton.disabled = true;
      setDiagnostics({
        launcher: "-",
        messages: "-",
        script: "-",
        site: "Unavailable"
      });
      setStatus("Open a supported chat tab, then try again.");
    }
  }

  button.addEventListener("click", openExporter);
  diagnosticsButton.addEventListener("click", () => runDiagnostics({ wake: true }));
  linkButtons.forEach((linkButton) => {
    linkButton.addEventListener("click", openExternalLink);
  });
  initializePopup();
})(globalThis);
