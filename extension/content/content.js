(function attachAiChatExporterContent(globalScope) {
  "use strict";

  const utils = globalScope.ACEUtils;
  const providers = globalScope.ACEProviders;
  const scraper = globalScope.ACEChatScraper || globalScope.ACEClaudeScraper;
  const exporters = globalScope.ACEExporters;

  const state = {
    messages: [],
    settingsOpen: false,
    selectionMode: false,
    selectedIds: new Set(),
    options: {
      filename: utils.createDefaultFilename(),
      format: "markdown",
      muteExport: false,
      pageNumbers: true,
      paperSize: "a4",
      providerId: providers?.current?.()?.id || "ai",
      providerName: providers?.current?.()?.name || "AI Chat",
      assistantLabel: providers?.current?.()?.assistantLabel || "Assistant",
      theme: "light",
      title: utils.defaultConversationTitle()
    }
  };

  let panel;
  let launcher;
  let launcherObserver;
  let routeCheckTimer;
  let toastTimer;
  let selectionRail;
  let selectionRailFrame = 0;
  const messageClickHandlers = new WeakMap();

  let lastRouteKey = currentRouteKey();

  function cleanupInlineSelectors() {
    window.removeEventListener("scroll", requestSelectionRailPosition, true);
    window.removeEventListener("resize", requestSelectionRailPosition);
    if (selectionRailFrame) {
      window.cancelAnimationFrame(selectionRailFrame);
      selectionRailFrame = 0;
    }
    if (selectionRail) {
      selectionRail.remove();
      selectionRail = undefined;
    }
    document.querySelectorAll(".ace-chat-select-button").forEach((button) => button.remove());
    document.querySelectorAll(".ace-chat-selectable").forEach((element) => {
      const handler = messageClickHandlers.get(element);
      if (handler) {
        element.removeEventListener("click", handler, true);
        messageClickHandlers.delete(element);
      }
      element.classList.remove("ace-chat-selectable", "ace-chat-selected");
      if (element.dataset.acePreviousPosition !== undefined) {
        if (element.dataset.acePreviousPosition) {
          element.style.position = element.dataset.acePreviousPosition;
        } else {
          element.style.removeProperty("position");
        }
        delete element.dataset.acePreviousPosition;
      }
    });
  }

  function currentProvider() {
    return providers?.current?.() || {
      assistantLabel: "Assistant",
      id: "ai",
      name: "AI Chat"
    };
  }

  function assistantLabel() {
    return currentProvider().assistantLabel || currentProvider().name || "Assistant";
  }

  function isSupportedPage() {
    return Boolean(currentProvider().id !== "ai");
  }

  function currentRouteKey() {
    return `${window.location.pathname}${window.location.search}${window.location.hash}`;
  }

  function resetConversationState() {
    cleanupInlineSelectors();
    state.messages = [];
    state.selectedIds.clear();
    state.settingsOpen = false;
    state.selectionMode = false;
    state.options.filename = utils.createDefaultFilename();
    state.options.title = "";
    state.options.providerId = currentProvider().id;
    state.options.providerName = currentProvider().name;
    state.options.assistantLabel = assistantLabel();

    if (panel) {
      panel.hidden = true;
      renderPanel();
    }

    if (launcher) {
      launcher.hidden = false;
    }

    applyNativeTheme();
    window.setTimeout(() => placeLauncher(), 0);
  }

  function handleRouteChange() {
    const nextRouteKey = currentRouteKey();
    if (nextRouteKey === lastRouteKey) {
      return;
    }

    lastRouteKey = nextRouteKey;
    resetConversationState();
  }

  function scheduleRouteCheck() {
    window.clearTimeout(routeCheckTimer);
    routeCheckTimer = window.setTimeout(handleRouteChange, 120);
  }

  function installRouteChangeWatcher() {
    if (globalScope.__ACE_ROUTE_WATCHER_INSTALLED__) {
      return;
    }

    globalScope.__ACE_ROUTE_WATCHER_INSTALLED__ = true;

    for (const method of ["pushState", "replaceState"]) {
      const original = history[method];
      history[method] = function patchedHistoryMethod(...args) {
        const result = original.apply(this, args);
        scheduleRouteCheck();
        return result;
      };
    }

    window.addEventListener("popstate", scheduleRouteCheck);
    window.addEventListener("hashchange", scheduleRouteCheck);
  }

  function showToast(message, tone = "info") {
    if (state.options.muteExport && (tone === "info" || tone === "success")) {
      return;
    }

    let toast = document.querySelector(".ace-exporter-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "ace-exporter-toast";
      document.documentElement.appendChild(toast);
    }

    toast.textContent = message;
    toast.dataset.tone = tone;
    toast.dataset.theme = detectClaudeTheme();
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, 3200);
  }

  function colorLuminance(value) {
    const parts = String(value || "").match(/\d+(\.\d+)?/g);
    if (!parts || parts.length < 3) {
      return 1;
    }

    const [red, green, blue] = parts.slice(0, 3).map((part) => Number(part) / 255);
    return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
  }

  function detectClaudeTheme() {
    const rootClasses = `${document.documentElement.className} ${document.body.className}`.toLowerCase();
    if (/\bdark\b/.test(rootClasses)) {
      return "dark";
    }

    if (/\blight\b/.test(rootClasses)) {
      return "light";
    }

    return colorLuminance(window.getComputedStyle(document.body).backgroundColor) < 0.45 ? "dark" : "light";
  }

  function applyNativeTheme() {
    const theme = detectClaudeTheme();
    if (panel) {
      panel.dataset.theme = theme;
    }
    if (launcher) {
      launcher.dataset.theme = theme;
    }
    if (selectionRail) {
      selectionRail.dataset.theme = theme;
      selectionRail.querySelectorAll(".ace-chat-select-button").forEach((button) => {
        button.dataset.theme = theme;
      });
    }
  }

  function isVisibleElement(element) {
    if (!(element instanceof Element)) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  }

  function refreshMessages({ keepSelection = true } = {}) {
    const previous = new Set(state.selectedIds);
    const result = scraper.scrape();
    const provider = result.provider || currentProvider();
    applyNativeTheme();
    state.messages = result.messages;
    state.options.title = state.options.title || result.title;
    state.options.providerId = provider.id;
    state.options.providerName = provider.name;
    state.options.assistantLabel = provider.assistantLabel || provider.name || "Assistant";

    state.selectedIds = new Set();
    for (const message of state.messages) {
      if (!keepSelection || previous.size === 0 || previous.has(message.id)) {
        state.selectedIds.add(message.id);
      }
    }

    renderPanel();
    renderInlineSelectors();
    return state.messages.length;
  }

  function selectedMessages() {
    return state.messages.filter((message) => state.selectedIds.has(message.id));
  }

  function selectedCountText() {
    const count = state.selectedIds.size;
    const total = state.messages.length;
    return `${count} of ${total} selected`;
  }

  function setSelection(predicate) {
    state.selectedIds = new Set(state.messages.filter(predicate).map((message) => message.id));
    renderPanel();
    updateInlineSelectionState();
  }

  function updateSelectionCount() {
    panel?.querySelector("[data-selection-count]")?.replaceChildren(document.createTextNode(selectedCountText()));
  }

  function updateInlineSelectionState() {
    for (const message of state.messages) {
      const selected = state.selectedIds.has(message.id);
      const element = message.element;
      const button = selectionRail?.querySelector(`.ace-chat-select-button[data-message-id="${CSS.escape(message.id)}"]`);

      if (element) {
        element.classList.toggle("ace-chat-selected", selected);
      }

      if (button) {
        button.setAttribute("aria-pressed", String(selected));
        button.setAttribute("aria-label", `${selected ? "Deselect" : "Select"} ${message.role === "assistant" ? assistantLabel() : "your"} message`);
        button.dataset.selected = String(selected);
        button.textContent = selected ? "\u2713" : "";
      }
    }

    updateSelectionCount();
    requestSelectionRailPosition();
  }

  function isInteractiveTarget(target) {
    return Boolean(target instanceof Element && target.closest([
      ".ace-chat-select-button",
      "a",
      "button",
      "input",
      "select",
      "textarea",
      "[role='button']",
      "[contenteditable='true']"
    ].join(",")));
  }

  function toggleMessageSelection(messageId) {
    if (state.selectedIds.has(messageId)) {
      state.selectedIds.delete(messageId);
    } else {
      state.selectedIds.add(messageId);
    }

    renderPanel();
    updateInlineSelectionState();
  }

  function ensureSelectionRail() {
    if (!selectionRail) {
      selectionRail = document.createElement("div");
      selectionRail.className = "ace-selection-rail";
      selectionRail.dataset.theme = detectClaudeTheme();
      document.documentElement.appendChild(selectionRail);
    }

    return selectionRail;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function leftAppChromeEdge() {
    const candidates = Array.from(document.querySelectorAll("aside, nav, [data-testid*='sidebar' i], [aria-label*='sidebar' i]"));
    const edges = candidates
      .map((element) => element.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0 && rect.left < window.innerWidth * 0.5 && rect.right < window.innerWidth * 0.8)
      .map((rect) => rect.right);

    return edges.length ? Math.max(...edges) : 0;
  }

  function rightOverlayEdge() {
    const panelRect = panel && !panel.hidden ? panel.getBoundingClientRect() : undefined;
    if (panelRect && panelRect.width > 0 && panelRect.height > 0) {
      return Math.max(12, panelRect.left - 12);
    }

    return window.innerWidth - 12;
  }

  function selectionRailX() {
    const rects = state.messages
      .map((message) => message.element?.getBoundingClientRect())
      .filter((rect) => rect && rect.width > 0 && rect.height > 0);

    if (!rects.length) {
      return 12;
    }

    const buttonSize = 26;
    const sideGap = 10;
    const chatLeft = Math.min(...rects.map((rect) => rect.left));
    const chatRight = Math.max(...rects.map((rect) => rect.right));
    const minLeft = Math.max(12, leftAppChromeEdge() + 8);
    const maxLeft = Math.max(minLeft, rightOverlayEdge() - buttonSize);
    const outsideChat = chatRight + sideGap;

    if (outsideChat <= maxLeft) {
      return clamp(outsideChat, minLeft, maxLeft);
    }

    return clamp(chatRight - buttonSize - sideGap, Math.max(minLeft, chatLeft + sideGap), maxLeft);
  }

  function positionSelectionRail() {
    selectionRailFrame = 0;

    if (!selectionRail || !state.selectionMode) {
      return;
    }

    const left = selectionRailX();
    const topGuard = 62;
    const bottomGuard = Math.max(topGuard + 40, window.innerHeight - 92);

    for (const message of state.messages) {
      const button = selectionRail.querySelector(`.ace-chat-select-button[data-message-id="${CSS.escape(message.id)}"]`);
      const rect = message.element?.getBoundingClientRect();
      const visible = Boolean(button && rect && rect.bottom > topGuard && rect.top < bottomGuard);

      if (!button) {
        continue;
      }

      button.hidden = !visible;
      if (!visible) {
        continue;
      }

      const visibleTop = Math.max(rect.top, topGuard);
      const visibleBottom = Math.min(rect.bottom, bottomGuard);
      const top = clamp(visibleTop + 6, topGuard, Math.max(topGuard, visibleBottom - 28));

      button.style.left = `${left}px`;
      button.style.top = `${top}px`;
    }
  }

  function requestSelectionRailPosition() {
    if (selectionRailFrame || !selectionRail) {
      return;
    }

    selectionRailFrame = window.requestAnimationFrame(positionSelectionRail);
  }

  function renderInlineSelectors() {
    cleanupInlineSelectors();

    if (!state.selectionMode) {
      return;
    }

    const rail = ensureSelectionRail();
    window.addEventListener("scroll", requestSelectionRailPosition, true);
    window.addEventListener("resize", requestSelectionRailPosition);

    for (const message of state.messages) {
      if (!message.element || !document.documentElement.contains(message.element)) {
        continue;
      }

      message.element.classList.add("ace-chat-selectable");
      const messageClickHandler = (event) => {
        if (isInteractiveTarget(event.target) || window.getSelection()?.toString()) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        toggleMessageSelection(message.id);
      };
      message.element.addEventListener("click", messageClickHandler, true);
      messageClickHandlers.set(message.element, messageClickHandler);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "ace-chat-select-button";
      button.dataset.messageId = message.id;
      button.dataset.role = message.role;
      button.dataset.theme = detectClaudeTheme();
      button.setAttribute("aria-label", `${state.selectedIds.has(message.id) ? "Deselect" : "Select"} ${message.role === "assistant" ? assistantLabel() : "your"} message`);
      button.setAttribute("aria-pressed", String(state.selectedIds.has(message.id)));
      button.title = message.role === "assistant" ? `${assistantLabel()} message` : "Your message";
      button.textContent = state.selectedIds.has(message.id) ? "\u2713" : "";
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleMessageSelection(message.id);
      });

      rail.appendChild(button);
    }

    updateInlineSelectionState();
    requestSelectionRailPosition();
  }

  function optionValue(name) {
    const input = panel?.querySelector(`[data-option="${name}"]`);
    if (!input) {
      return state.options[name];
    }

    if (input.type === "checkbox") {
      return input.checked;
    }

    return input.value;
  }

  function syncOptionsFromPanel() {
    if (!panel) {
      return;
    }

    state.options = {
      filename: optionValue("filename") || utils.createDefaultFilename(),
      format: optionValue("format") || "markdown",
      muteExport: Boolean(optionValue("muteExport")),
      pageNumbers: Boolean(optionValue("pageNumbers")),
      paperSize: optionValue("paperSize") || "a4",
      providerId: currentProvider().id,
      providerName: currentProvider().name,
      assistantLabel: assistantLabel(),
      theme: optionValue("theme") || "light",
      title: optionValue("title") || utils.defaultConversationTitle()
    };
  }

  function iconSvg(name) {
    const paths = {
      bellOff: '<path d="M8.7 3.1a6 6 0 0 1 9.3 5v3.4l1.5 2.5M4.5 4.5l17 17M5 18h10.8M10 21h4M6 14l1.2-2V8.8a6 6 0 0 1 .6-2.7"/>',
      bot: '<path d="M12 8V4M8 4h8M7 10h10a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3z"/><path d="M9 15h.01M15 15h.01"/>',
      checkAll: '<path d="m3 12 3 3 5-6M11 15l2 2 8-10"/>',
      download: '<path d="M12 3v11M7 10l5 5 5-5M5 21h14"/>',
      refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v6h-6"/>',
      settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/><path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1 1.6V21a2 2 0 0 1-4 0v-.2a1.8 1.8 0 0 0-1-1.6 1.8 1.8 0 0 0-2 .4l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.6-1H3a2 2 0 0 1 0-4h.2a1.8 1.8 0 0 0 1.6-1 1.8 1.8 0 0 0-.4-2l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.8 1.8 0 0 0 2 .4 1.8 1.8 0 0 0 1-1.6V3a2 2 0 0 1 4 0v.2a1.8 1.8 0 0 0 1 1.6 1.8 1.8 0 0 0 2-.4l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.6 1h.2a2 2 0 0 1 0 4h-.2a1.8 1.8 0 0 0-1.8 1z"/>',
      user: '<path d="M20 21a8 8 0 0 0-16 0"/><path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>',
      x: '<path d="M18 6 6 18M6 6l12 12"/>',
      xSquare: '<path d="M8 8l8 8M16 8l-8 8"/><rect x="4" y="4" width="16" height="16" rx="4"/>'
    };

    return `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">${paths[name] || ""}</svg>`;
  }

  function formatOptions() {
    return [
      { format: "markdown", label: "Markdown" },
      { format: "pdf", label: "PDF" },
      { format: "text", label: "Text" },
      { format: "json", label: "JSON" },
      { format: "csv", label: "CSV" },
      { format: "png", label: "PNG Image" }
    ].map((item) => {
      const selected = state.options.format === item.format ? " selected" : "";
      return `<option value="${item.format}"${selected}>${item.label}</option>`;
    }).join("");
  }

  function messageRows() {
    if (!state.messages.length) {
      return `
        <div class="ace-empty-state">
          <strong>No messages found</strong>
          <span>Open a supported AI chat, then refresh.</span>
        </div>
      `;
    }

    return state.messages.map((message) => {
      const checked = state.selectedIds.has(message.id) ? " checked" : "";
      return `
        <label class="ace-message-row">
          <input type="checkbox" data-message-id="${utils.escapeHtml(message.id)}"${checked}>
          <span class="ace-message-index">${message.index + 1}</span>
          <span class="ace-role-badge" data-role="${utils.escapeHtml(message.role)}">${message.role === "assistant" ? utils.escapeHtml(assistantLabel()) : "You"}</span>
          <span class="ace-message-preview">${utils.escapeHtml(message.preview || "(empty message)")}</span>
        </label>
      `;
    }).join("");
  }

  function renderPanel() {
    if (!panel) {
      return;
    }

    panel.innerHTML = `
      <div class="ace-panel-shell" role="dialog" aria-label="AI Chat Exporter">
        <header class="ace-panel-header">
          <div>
            <strong>Export chat</strong>
            <span data-selection-count>${utils.escapeHtml(selectedCountText())}</span>
          </div>
          <button type="button" class="ace-icon-button" data-action="close" aria-label="Close">${iconSvg("x")}</button>
        </header>

        <section class="ace-quick-export">
          <label>
            <span>Format</span>
            <select data-option="format">${formatOptions()}</select>
          </label>
          <button type="button" class="ace-toggle-button" data-action="toggle-mute" data-active="${state.options.muteExport}" aria-pressed="${state.options.muteExport}" title="Mute export alerts">
            <span class="ace-button-content">${iconSvg("bellOff")}<span>Mute</span></span>
          </button>
          <button type="button" data-action="settings" aria-expanded="${state.settingsOpen}">
            <span class="ace-button-content">${iconSvg("settings")}<span>Settings</span></span>
          </button>
          <button type="button" class="ace-primary-button" data-action="export">
            <span class="ace-button-content">${iconSvg("download")}<span>Export</span></span>
          </button>
        </section>

        <section class="ace-selection-toolbar">
          <button type="button" data-action="refresh" title="Refresh detected messages"><span class="ace-button-content">${iconSvg("refresh")}<span>Refresh</span></span></button>
          <button type="button" data-action="select-all" title="Alt+A"><span class="ace-button-content">${iconSvg("checkAll")}<span>All</span></span></button>
          <button type="button" data-action="select-assistant" title="Alt+C"><span class="ace-button-content">${iconSvg("bot")}<span>${utils.escapeHtml(assistantLabel())}</span></span></button>
          <button type="button" data-action="select-user" title="Alt+Y"><span class="ace-button-content">${iconSvg("user")}<span>You</span></span></button>
          <button type="button" data-action="clear" title="Alt+N"><span class="ace-button-content">${iconSvg("xSquare")}<span>None</span></span></button>
        </section>

        <section class="ace-panel-section" ${state.settingsOpen ? "" : "hidden"}>
          <label>
            <span>Filename</span>
            <input data-option="filename" type="text" value="${utils.escapeHtml(state.options.filename)}">
          </label>
          <label>
            <span>Title</span>
            <input data-option="title" type="text" value="${utils.escapeHtml(state.options.title)}">
          </label>
          <div class="ace-grid-two">
            <label>
              <span>PDF theme</span>
              <select data-option="theme">
                <option value="light"${state.options.theme === "light" ? " selected" : ""}>Light</option>
                <option value="dark"${state.options.theme === "dark" ? " selected" : ""}>Dark</option>
              </select>
            </label>
            <label>
              <span>Paper</span>
              <select data-option="paperSize">
                <option value="a4"${state.options.paperSize === "a4" ? " selected" : ""}>A4</option>
                <option value="letter"${state.options.paperSize === "letter" ? " selected" : ""}>Letter</option>
              </select>
            </label>
          </div>
          <label class="ace-checkbox-row">
            <input data-option="pageNumbers" type="checkbox"${state.options.pageNumbers ? " checked" : ""}>
            <span>Print page numbers when supported</span>
          </label>
          <label class="ace-checkbox-row">
            <input data-option="muteExport" type="checkbox"${state.options.muteExport ? " checked" : ""}>
            <span>Mute export alerts</span>
          </label>
        </section>
      </div>
    `;
  }

  function ensurePanel() {
    if (panel) {
      return panel;
    }

    panel = document.createElement("aside");
    panel.id = "ace-exporter-panel";
    panel.hidden = true;
    document.documentElement.appendChild(panel);

    panel.addEventListener("input", (event) => {
      if (event.target.matches("[data-option]")) {
        syncOptionsFromPanel();
      }
    });

    panel.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-message-id]");
      if (checkbox) {
        if (checkbox.checked) {
          state.selectedIds.add(checkbox.dataset.messageId);
        } else {
          state.selectedIds.delete(checkbox.dataset.messageId);
        }
        syncOptionsFromPanel();
        renderPanel();
        updateInlineSelectionState();
        return;
      }

      if (event.target.matches("[data-option]")) {
        syncOptionsFromPanel();
        renderPanel();
      }
    });

    panel.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) {
        return;
      }

      syncOptionsFromPanel();
      const action = button.dataset.action;

      if (action === "close") {
        panel.hidden = true;
        state.settingsOpen = false;
        state.selectionMode = false;
        cleanupInlineSelectors();
        if (launcher) {
          launcher.hidden = false;
        }
        return;
      }

      if (action === "refresh") {
        const count = refreshMessages({ keepSelection: true });
        renderInlineSelectors();
        showToast(`Found ${count} messages`);
        return;
      }

      if (action === "settings") {
        state.settingsOpen = !state.settingsOpen;
        renderPanel();
        updateInlineSelectionState();
        return;
      }

      if (action === "toggle-mute") {
        state.options.muteExport = !state.options.muteExport;
        renderPanel();
        updateInlineSelectionState();
        return;
      }

      if (action === "select-all") {
        setSelection(() => true);
        return;
      }

      if (action === "select-assistant") {
        setSelection((message) => message.role === "assistant");
        return;
      }

      if (action === "select-user") {
        setSelection((message) => message.role === "user");
        return;
      }

      if (action === "clear") {
        state.selectedIds.clear();
        renderPanel();
        updateInlineSelectionState();
        return;
      }

      if (action === "export") {
        await exportSelected();
      }
    });

    return panel;
  }

  async function exportSelected() {
    syncOptionsFromPanel();
    const messages = selectedMessages();

    if (!messages.length) {
      showToast("Select at least one message to export.", "warning");
      return;
    }

    try {
      if (state.options.format === "png") {
        await exporters.exportPng(messages, state.options);
      } else {
        exporters.download(state.options.format, messages, state.options);
      }

      const label = exporters.FORMAT_LABELS[state.options.format] || state.options.format.toUpperCase();
      showToast(`${label} export ready`, "success");
    } catch (error) {
      showToast(error.message || "Export failed", "error");
    }
  }

  function openPanel() {
    ensurePanel();
    applyNativeTheme();
    state.selectionMode = true;
    state.options.title = "";
    refreshMessages({ keepSelection: true });
    panel.hidden = false;
    renderInlineSelectors();
    if (launcher) {
      launcher.hidden = true;
    }
  }

  function buttonLabel(element) {
    return [
      element.getAttribute("aria-label"),
      element.getAttribute("title"),
      element.textContent
    ].join(" ").replace(/\s+/g, " ").trim();
  }

  function nativeAnchorPattern() {
    const labels = currentProvider().nativeAnchorLabels || ["share"];
    const escaped = labels
      .slice()
      .sort((left, right) => right.length - left.length)
      .map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    return new RegExp(`\\b(${escaped.join("|")})\\b`, "i");
  }

  function nativeAnchorRank(element) {
    const label = buttonLabel(element).toLowerCase();
    const labels = currentProvider().nativeAnchorLabels || ["share"];
    const index = labels.findIndex((item) => new RegExp(`\\b${item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(label));
    return index === -1 ? labels.length : index;
  }

  function isInTopAppControls(element) {
    return Boolean(element.closest("header, [role='banner'], [data-testid*='header' i], [class*='header' i], [class*='topbar' i], [class*='toolbar' i], [class*='conversation-header' i]"));
  }

  function isNativeShareAnchor(element) {
    if (!(element instanceof HTMLElement) || element.id === "ace-exporter-launcher") {
      return false;
    }

    if (element.closest("#ace-exporter-panel, .ace-selection-rail, .ace-chat-select-button, .ace-exporter-toast")) {
      return false;
    }

    const label = buttonLabel(element);
    if (/\b(send|stop|voice|microphone|attach|upload|new chat|settings|profile|sign in|log in)\b/i.test(label)) {
      return false;
    }

    return nativeAnchorPattern().test(label) && isVisibleElement(element);
  }

  function findShareButton() {
    const candidates = Array.from(document.querySelectorAll("button, a[role='button'], [role='button']"))
      .filter(isNativeShareAnchor)
      .sort((left, right) => nativeAnchorRank(left) - nativeAnchorRank(right));

    return candidates.find((button) => isInTopAppControls(button)) || candidates[0] || null;
  }

  function replaceTextNodes(root, searchPattern, replacement) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let didReplace = false;
    let node = walker.nextNode();

    while (node) {
      if (searchPattern.test(node.nodeValue)) {
        node.nodeValue = node.nodeValue.replace(searchPattern, replacement);
        didReplace = true;
      }
      node = walker.nextNode();
    }

    return didReplace;
  }

  function nativeIconElement(name) {
    const template = document.createElement("template");
    template.innerHTML = iconSvg(name).trim();
    const svg = template.content.firstElementChild;
    if (svg) {
      svg.setAttribute("fill", "none");
      svg.setAttribute("height", "16");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-linecap", "round");
      svg.setAttribute("stroke-linejoin", "round");
      svg.setAttribute("stroke-width", "2");
      svg.setAttribute("width", "16");
    }

    return svg;
  }

  function makeNativeLauncher(shareButton) {
    const button = shareButton.cloneNode(true);
    const shareButtonHadVisibleText = Boolean((shareButton.textContent || "").replace(/\s+/g, " ").trim());
    button.id = "ace-exporter-launcher";
    button.type = "button";
    button.dataset.aceNativeLauncher = "true";
    button.dataset.theme = detectClaudeTheme();
    button.setAttribute("aria-label", "Export chat");
    button.setAttribute("title", "Export chat");
    button.removeAttribute("aria-expanded");
    button.removeAttribute("aria-controls");
    button.removeAttribute("data-state");
    button.removeAttribute("data-testid");
    button.removeAttribute("href");
    button.setAttribute("role", "button");

    if (!replaceTextNodes(button, nativeAnchorPattern(), "Export")) {
      const icon = shareButtonHadVisibleText ? null : nativeIconElement("download");
      if (icon) {
        button.replaceChildren(icon);
        button.dataset.aceIconOnlyLauncher = "true";
      } else {
        button.textContent = "Export";
      }
    }

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openPanel();
    });

    return button;
  }

  function makeFallbackLauncher() {
    const button = document.createElement("button");
    button.id = "ace-exporter-launcher";
    button.type = "button";
    button.textContent = "Export";
    button.dataset.theme = detectClaudeTheme();
    button.dataset.aceFallbackLauncher = "true";
    button.addEventListener("click", openPanel);
    return button;
  }

  function placeLauncher() {
    if (!isSupportedPage()) {
      return;
    }

    const shareButton = findShareButton();
    const existing = document.getElementById("ace-exporter-launcher");

    if (shareButton) {
      if (existing?.dataset.aceNativeLauncher === "true" && existing.previousElementSibling === shareButton) {
        return;
      }

      existing?.remove();
      launcher = makeNativeLauncher(shareButton);
      shareButton.insertAdjacentElement("afterend", launcher);
      return;
    }

    if (existing) {
      launcher = existing;
      return;
    }

    launcher = makeFallbackLauncher();
    document.documentElement.appendChild(launcher);
  }

  function handleKeyboardShortcuts(event) {
    if (!state.selectionMode || panel?.hidden) {
      return;
    }

    const target = event.target;
    if (target instanceof HTMLElement && target.matches("input, textarea, select, [contenteditable='true']")) {
      return;
    }

    if (!event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    const key = event.key.toLowerCase();
    if (key === "a") {
      event.preventDefault();
      setSelection(() => true);
    } else if (key === "n" || key === "d") {
      event.preventDefault();
      state.selectedIds.clear();
      renderPanel();
      updateInlineSelectionState();
    } else if (key === "c") {
      event.preventDefault();
      setSelection((message) => message.role === "assistant");
    } else if (key === "y") {
      event.preventDefault();
      setSelection((message) => message.role === "user");
    }
  }

  function ensureLauncher() {
    if (!isSupportedPage()) {
      return;
    }

    placeLauncher();

    if (!launcherObserver) {
      launcherObserver = new MutationObserver(() => {
        scheduleRouteCheck();
        placeLauncher();
      });
      launcherObserver.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  }

  function handleRuntimeMessage(message, sender, sendResponse) {
    if (!message || message.type !== "ACE_OPEN_PANEL") {
      return false;
    }

    openPanel();
    sendResponse({ ok: true, count: state.messages.length });
    return true;
  }

  function attachRuntimeListener() {
    const runtime = globalScope.browser?.runtime || globalScope.chrome?.runtime;
    if (runtime?.onMessage) {
      runtime.onMessage.addListener(handleRuntimeMessage);
    }
  }

  if (isSupportedPage()) {
    installRouteChangeWatcher();
    ensureLauncher();
    attachRuntimeListener();
    document.addEventListener("keydown", handleKeyboardShortcuts);
  }
})(globalThis);
