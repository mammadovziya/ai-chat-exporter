(function attachAiChatExporters(globalScope) {
  "use strict";

  const utils = globalScope.ACEUtils;

  const FORMAT_LABELS = {
    csv: "CSV",
    json: "JSON",
    markdown: "Markdown",
    pdf: "PDF",
    png: "PNG Image",
    text: "Text"
  };

  function exportMetadata(messages, options) {
    return {
      title: options.title || utils.defaultConversationTitle(),
      source: window.location.href,
      exportedAt: new Date().toISOString(),
      messageCount: messages.length,
      app: "AI Chat Exporter",
      provider: options.providerName || globalScope.ACEProviders?.current?.()?.name || "AI Chat"
    };
  }

  function baseFilename(options, format) {
    return utils.withExtension(options.filename || utils.createDefaultFilename(), format);
  }

  function roleLabel(role, options = {}) {
    return role === "assistant" ? (options.assistantLabel || "Assistant") : "User";
  }

  function languageFromClassList(element) {
    const languageClass = element ? Array.from(element.classList).find((item) => /^language-[\w-]+$/.test(item)) : "";
    return utils.normalizeCodeLanguage(languageClass);
  }

  function highlightedCodeElement(codeText, language) {
    const code = document.createElement("code");
    const normalizedLanguage = utils.normalizeCodeLanguage(language) || utils.detectCodeLanguage(codeText);
    code.className = ["ace-highlighted-code", normalizedLanguage ? `language-${normalizedLanguage}` : ""].filter(Boolean).join(" ");
    code.innerHTML = utils.highlightCode(codeText, normalizedLanguage);
    return { code, language: normalizedLanguage };
  }

  function enhanceCodeBlocks(html) {
    const template = document.createElement("template");
    template.innerHTML = html || "";

    template.content.querySelectorAll("pre").forEach((pre) => {
      const originalCode = pre.querySelector("code");
      const codeText = (originalCode || pre).textContent || "";
      if (!codeText.trim()) {
        return;
      }

      const language = languageFromClassList(originalCode) || languageFromClassList(pre) || utils.detectCodeLanguage(codeText);
      const highlighted = highlightedCodeElement(codeText.replace(/\n+$/g, ""), language);
      pre.classList.add("ace-code-block");
      if (highlighted.language) {
        pre.dataset.language = utils.codeLanguageLabel(highlighted.language);
      }
      pre.replaceChildren(highlighted.code);
    });

    template.content.querySelectorAll(":not(pre) > code").forEach((code) => {
      const text = code.textContent || "";
      code.innerHTML = utils.escapeHtml(text);
    });

    return template.innerHTML;
  }

  function messageHtml(message) {
    return enhanceCodeBlocks(message.html || `<p>${utils.escapeHtml(message.text)}</p>`);
  }

  function toMarkdown(messages, options) {
    const metadata = exportMetadata(messages, options);
    const parts = [
      `# ${metadata.title}`,
      "",
      `Source: ${metadata.source}`,
      `Exported: ${metadata.exportedAt}`,
      `Messages: ${metadata.messageCount}`,
      ""
    ];

    for (const message of messages) {
      parts.push(`## ${message.index + 1}. ${roleLabel(message.role, options)}`, "", message.markdown || message.text, "");
    }

    return parts.join("\n").replace(/\n{4,}/g, "\n\n\n").trim() + "\n";
  }

  function toText(messages, options) {
    const metadata = exportMetadata(messages, options);
    const parts = [
      metadata.title,
      `Source: ${metadata.source}`,
      `Exported: ${metadata.exportedAt}`,
      `Messages: ${metadata.messageCount}`,
      ""
    ];

    for (const message of messages) {
      parts.push(`[${message.index + 1}] ${roleLabel(message.role, options)}`, message.text, "");
    }

    return parts.join("\n").replace(/\n{4,}/g, "\n\n\n").trim() + "\n";
  }

  function csvEscape(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }

  function toCsv(messages, options) {
    const metadata = exportMetadata(messages, options);
    const rows = [
      ["export_title", "source", "exported_at", "message_index", "role", "text"],
      ...messages.map((message) => [
        metadata.title,
        metadata.source,
        metadata.exportedAt,
        message.index + 1,
        roleLabel(message.role, options),
        message.text
      ])
    ];

    return rows.map((row) => row.map(csvEscape).join(",")).join("\n") + "\n";
  }

  function toJson(messages, options) {
    return JSON.stringify({
      ...exportMetadata(messages, options),
      messages: messages.map((message) => ({
        index: message.index + 1,
        role: message.role,
        label: roleLabel(message.role, options),
        text: message.text,
        markdown: message.markdown,
        html: message.html
      }))
    }, null, 2) + "\n";
  }

  function exportCss(options = {}) {
    const theme = options.theme === "dark" ? "dark" : "light";
    const pageSize = options.paperSize === "letter" ? "Letter" : "A4";
    const isDark = theme === "dark";

    return `
      :root,
      .ace-image-export-root {
        color-scheme: ${theme};
        --ace-bg: ${isDark ? "#101114" : "#ffffff"};
        --ace-surface: ${isDark ? "#17191f" : "#f7f7f4"};
        --ace-text: ${isDark ? "#f4f2ec" : "#1f2328"};
        --ace-muted: ${isDark ? "#b7b2a7" : "#626a73"};
        --ace-border: ${isDark ? "#343842" : "#d9d7cf"};
        --ace-accent: ${isDark ? "#7cc7b2" : "#0f766e"};
        --ace-code-bg: ${isDark ? "#0b0c0f" : "#efeee8"};
        --ace-token-attr: ${isDark ? "#d8b4fe" : "#7c3aed"};
        --ace-token-comment: ${isDark ? "#8a9387" : "#6a737d"};
        --ace-token-function: ${isDark ? "#82d8ff" : "#0369a1"};
        --ace-token-keyword: ${isDark ? "#ff9c8a" : "#c2410c"};
        --ace-token-number: ${isDark ? "#f7c873" : "#a16207"};
        --ace-token-operator: ${isDark ? "#f0a6ca" : "#be185d"};
        --ace-token-property: ${isDark ? "#c4b5fd" : "#6d28d9"};
        --ace-token-punctuation: ${isDark ? "#aab2bf" : "#586069"};
        --ace-token-string: ${isDark ? "#a7d88d" : "#047857"};
        --ace-token-tag: ${isDark ? "#7cc7f2" : "#0369a1"};
        --ace-token-variable: ${isDark ? "#f8d66d" : "#b45309"};
      }

      * {
        box-sizing: border-box;
      }

      body,
      .ace-image-export-root {
        margin: 0;
        background: var(--ace-bg);
        color: var(--ace-text);
        font: 14px/1.58 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        letter-spacing: 0;
      }

      .ace-image-export-root {
        min-height: 100%;
        width: 1100px;
      }

      .ace-export-document {
        width: min(100%, 900px);
        margin: 0 auto;
        padding: 40px 28px;
      }

      .ace-export-header {
        border-bottom: 1px solid var(--ace-border);
        margin-bottom: 24px;
        padding-bottom: 18px;
      }

      .ace-export-header h1 {
        font-size: 28px;
        line-height: 1.18;
        margin: 0 0 12px;
      }

      .ace-export-meta {
        color: var(--ace-muted);
        display: grid;
        gap: 4px;
        font-size: 12px;
      }

      .ace-export-message {
        break-inside: avoid;
        border: 1px solid var(--ace-border);
        border-radius: 8px;
        margin: 0 0 16px;
        overflow: hidden;
      }

      .ace-export-message-header {
        align-items: center;
        background: var(--ace-surface);
        border-bottom: 1px solid var(--ace-border);
        color: var(--ace-muted);
        display: flex;
        font-size: 12px;
        font-weight: 700;
        justify-content: space-between;
        padding: 8px 12px;
        text-transform: uppercase;
      }

      .ace-export-message-body {
        padding: 16px;
      }

      .ace-export-message-body > *:first-child {
        margin-top: 0;
      }

      .ace-export-message-body > *:last-child {
        margin-bottom: 0;
      }

      pre,
      code {
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
      }

      pre {
        background: var(--ace-code-bg);
        border: 1px solid var(--ace-border);
        border-radius: 8px;
        color: var(--ace-text);
        line-height: 1.55;
        margin: 12px 0;
        overflow: auto;
        padding: 12px;
        position: relative;
        tab-size: 2;
        white-space: pre-wrap;
      }

      pre[data-language] {
        padding-top: 34px;
      }

      pre[data-language]::before {
        background: var(--ace-surface);
        border-bottom: 1px solid var(--ace-border);
        border-left: 1px solid var(--ace-border);
        border-bottom-left-radius: 7px;
        color: var(--ace-muted);
        content: attr(data-language);
        font: 700 10px/1 Inter, ui-sans-serif, system-ui, sans-serif;
        letter-spacing: 0.04em;
        padding: 6px 8px;
        position: absolute;
        right: 0;
        text-transform: uppercase;
        top: 0;
      }

      :not(pre) > code {
        background: var(--ace-code-bg);
        border-radius: 4px;
        padding: 1px 4px;
      }

      .ace-token-attr {
        color: var(--ace-token-attr);
      }

      .ace-token-comment {
        color: var(--ace-token-comment);
        font-style: italic;
      }

      .ace-token-function {
        color: var(--ace-token-function);
      }

      .ace-token-keyword {
        color: var(--ace-token-keyword);
        font-weight: 700;
      }

      .ace-token-number {
        color: var(--ace-token-number);
      }

      .ace-token-operator {
        color: var(--ace-token-operator);
      }

      .ace-token-property {
        color: var(--ace-token-property);
      }

      .ace-token-punctuation {
        color: var(--ace-token-punctuation);
      }

      .ace-token-string {
        color: var(--ace-token-string);
      }

      .ace-token-tag {
        color: var(--ace-token-tag);
        font-weight: 700;
      }

      .ace-token-variable {
        color: var(--ace-token-variable);
      }

      table {
        border-collapse: collapse;
        margin: 12px 0;
        width: 100%;
      }

      th,
      td {
        border: 1px solid var(--ace-border);
        padding: 8px;
        text-align: left;
        vertical-align: top;
      }

      blockquote {
        border-left: 3px solid var(--ace-accent);
        color: var(--ace-muted);
        margin-left: 0;
        padding-left: 12px;
      }

      a {
        color: var(--ace-accent);
      }

      .ace-export-diagram {
        display: block;
        height: auto;
        margin: 14px auto;
        max-width: 100%;
        overflow: visible;
      }

      .ace-math-inline,
      .ace-math-block,
      math {
        font-family: "Cambria Math", "STIX Two Math", "Times New Roman", serif;
      }

      .ace-math-inline {
        white-space: nowrap;
      }

      .ace-math-block {
        display: block;
        margin: 14px 0;
        overflow-x: auto;
        padding: 6px 0;
        text-align: center;
      }

      .ace-export-omitted-media {
        border: 1px dashed var(--ace-border);
        border-radius: 8px;
        color: var(--ace-muted);
        margin: 12px 0;
        padding: 10px;
      }

      @media print {
        @page {
          size: ${pageSize};
          margin: 16mm 14mm;
          ${options.pageNumbers ? " @bottom-center { content: counter(page) \" / \" counter(pages); font-size: 9pt; color: #777; }" : ""}
        }

        body {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        .ace-export-document {
          padding: 0;
          width: 100%;
        }
      }
    `;
  }

  function buildHtmlDocument(messages, options) {
    const metadata = exportMetadata(messages, options);
    const messageArticles = messages.map((message) => `
      <article class="ace-export-message">
        <header class="ace-export-message-header">
          <span>${utils.escapeHtml(roleLabel(message.role, options))}</span>
          <span>#${message.index + 1}</span>
        </header>
        <div class="ace-export-message-body">
          ${messageHtml(message)}
        </div>
      </article>
    `).join("");

    return `
      <div class="ace-export-document">
        <header class="ace-export-header">
          <h1>${utils.escapeHtml(metadata.title)}</h1>
          <div class="ace-export-meta">
            <span>Source: ${utils.escapeHtml(metadata.source)}</span>
            <span>Provider: ${utils.escapeHtml(metadata.provider)}</span>
            <span>Exported: ${utils.escapeHtml(metadata.exportedAt)}</span>
            <span>Messages: ${metadata.messageCount}</span>
          </div>
        </header>
        ${messageArticles}
      </div>
    `;
  }

  function autoPrintScript() {
    return `
      <script>
        window.addEventListener("load", function () {
          window.setTimeout(function () {
            window.focus();
            window.print();
          }, 350);
        });
      </script>
    `;
  }

  function fullHtmlPage(messages, options, pageOptions = {}) {
    return `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${utils.escapeHtml(options.title || "AI Chat Export")}</title>
          <style>${exportCss(options)}</style>
        </head>
        <body>
          ${buildHtmlDocument(messages, options)}
          ${pageOptions.autoPrint ? autoPrintScript() : ""}
        </body>
      </html>`;
  }

  function printPdf(messages, options) {
    const htmlBlob = new Blob([fullHtmlPage(messages, options, { autoPrint: true })], {
      type: "text/html;charset=utf-8"
    });
    const htmlUrl = URL.createObjectURL(htmlBlob);
    const printWindow = window.open(htmlUrl, "_blank", "width=980,height=1200");

    if (!printWindow) {
      URL.revokeObjectURL(htmlUrl);
      throw new Error("The print window was blocked. Allow pop-ups for this chat app and try again.");
    }

    window.setTimeout(() => URL.revokeObjectURL(htmlUrl), 60000);
  }

  function livePdfCss(options = {}) {
    const pageSize = options.paperSize === "letter" ? "Letter" : "A4";
    const isDark = options.theme === "dark";

    return `
      @page {
        size: ${pageSize};
        margin: 16mm 14mm;
        ${options.pageNumbers ? " @bottom-center { content: counter(page) \" / \" counter(pages); font-size: 9pt; color: #777; }" : ""}
      }

      @media screen {
        #ace-live-print-root {
          background: ${isDark ? "#101114" : "#ffffff"};
          left: -12000px;
          position: fixed;
          top: 0;
          width: 900px;
          z-index: -1;
        }
      }

      @media print {
        html.ace-live-printing,
        html.ace-live-printing body {
          background: ${isDark ? "#101114" : "#ffffff"} !important;
          margin: 0 !important;
          min-height: 0 !important;
        }

        html.ace-live-printing [data-ace-live-print-hidden="true"] {
          display: none !important;
        }

        html.ace-live-printing [data-ace-live-print-ancestor="true"] {
          display: contents !important;
        }

        #ace-live-print-root {
          background: ${isDark ? "#101114" : "#ffffff"} !important;
          color: ${isDark ? "#f4f2ec" : "#1f2328"} !important;
          display: block !important;
          font: 14px/1.58 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
          margin: 0 !important;
          position: static !important;
          width: 100% !important;
        }

        #ace-live-print-root,
        #ace-live-print-root *,
        html.ace-live-printing [data-ace-live-print-message="true"],
        html.ace-live-printing [data-ace-live-print-message="true"] * {
          box-sizing: border-box !important;
          print-color-adjust: exact !important;
          -webkit-print-color-adjust: exact !important;
        }

        #ace-live-print-root .ace-live-print-header {
          border-bottom: 1px solid ${isDark ? "#343842" : "#d9d7cf"} !important;
          margin-bottom: 24px !important;
          padding-bottom: 18px !important;
        }

        #ace-live-print-root h1 {
          color: ${isDark ? "#f4f2ec" : "#1f2328"} !important;
          font-size: 28px !important;
          line-height: 1.18 !important;
          margin: 0 0 12px !important;
        }

        #ace-live-print-root .ace-live-print-meta {
          color: ${isDark ? "#b7b2a7" : "#626a73"} !important;
          display: grid !important;
          font-size: 12px !important;
          gap: 4px !important;
        }

        #ace-live-print-root .ace-live-print-message {
          break-inside: avoid !important;
          border: 1px solid ${isDark ? "#343842" : "#d9d7cf"} !important;
          border-radius: 8px !important;
          margin: 0 0 16px !important;
          overflow: visible !important;
        }

        #ace-live-print-root .ace-live-print-message-header {
          align-items: center !important;
          background: ${isDark ? "#17191f" : "#f7f7f4"} !important;
          border-bottom: 1px solid ${isDark ? "#343842" : "#d9d7cf"} !important;
          color: ${isDark ? "#b7b2a7" : "#626a73"} !important;
          display: flex !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          justify-content: space-between !important;
          padding: 8px 12px !important;
          text-transform: uppercase !important;
        }

        #ace-live-print-root .ace-live-print-body,
        html.ace-live-printing [data-ace-live-print-message="true"] {
          background: ${isDark ? "#101114" : "#ffffff"} !important;
          color: ${isDark ? "#f4f2ec" : "#1f2328"} !important;
        }

        html.ace-live-printing [data-ace-live-print-message="true"] {
          break-inside: avoid !important;
          border: 1px solid ${isDark ? "#343842" : "#d9d7cf"} !important;
          border-radius: 8px !important;
          box-shadow: none !important;
          display: block !important;
          margin: 0 0 16px !important;
          max-height: none !important;
          max-width: 100% !important;
          min-height: 0 !important;
          outline: none !important;
          overflow: visible !important;
          padding: 42px 16px 16px !important;
          position: relative !important;
          transform: none !important;
          width: 100% !important;
        }

        html.ace-live-printing [data-ace-live-print-message="true"]::before {
          align-items: center !important;
          background: ${isDark ? "#17191f" : "#f7f7f4"} !important;
          border-bottom: 1px solid ${isDark ? "#343842" : "#d9d7cf"} !important;
          color: ${isDark ? "#b7b2a7" : "#626a73"} !important;
          content: attr(data-ace-live-print-label) " #" attr(data-ace-live-print-index) !important;
          display: flex !important;
          font: 700 12px/1 Inter, ui-sans-serif, system-ui, sans-serif !important;
          height: 34px !important;
          left: 0 !important;
          padding: 0 12px !important;
          position: absolute !important;
          right: 0 !important;
          text-transform: uppercase !important;
          top: 0 !important;
        }

        #ace-live-print-root .ace-live-print-body {
          overflow: visible !important;
          padding: 16px !important;
        }

        html.ace-live-printing [data-ace-live-print-message="true"] :is(article, div, figure, main, section) {
          clip: auto !important;
          clip-path: none !important;
          contain: none !important;
          max-height: none !important;
          overflow: visible !important;
          overflow-x: visible !important;
          overflow-y: visible !important;
        }

        #ace-live-print-root .ace-chat-select-button,
        #ace-live-print-root .ace-chat-selection-frame,
        #ace-live-print-root .ace-selection-rail,
        #ace-live-print-root [aria-label*="Copy" i],
        #ace-live-print-root [aria-label*="Retry" i],
        #ace-live-print-root [aria-label*="Like" i],
        #ace-live-print-root [aria-label*="Dislike" i],
        #ace-live-print-root [aria-label*="Share" i],
        #ace-live-print-root [data-testid*="copy" i],
        #ace-live-print-root [data-testid*="feedback" i],
        #ace-exporter-panel,
        #ace-exporter-launcher,
        .ace-chat-select-button,
        .ace-chat-selection-frame,
        .ace-selection-rail,
        .ace-exporter-toast {
          display: none !important;
        }

        #ace-live-print-root .ace-chat-selectable,
        #ace-live-print-root .ace-chat-selected {
          box-shadow: none !important;
          outline: none !important;
        }

        #ace-live-print-root svg,
        #ace-live-print-root canvas,
        #ace-live-print-root img,
        #ace-live-print-root iframe,
        html.ace-live-printing [data-ace-live-print-message="true"] svg,
        html.ace-live-printing [data-ace-live-print-message="true"] canvas,
        html.ace-live-printing [data-ace-live-print-message="true"] img,
        html.ace-live-printing [data-ace-live-print-message="true"] iframe {
          display: block !important;
          height: auto !important;
          max-width: 100% !important;
        }

        #ace-live-print-root iframe,
        html.ace-live-printing [data-ace-live-print-message="true"] iframe {
          border: 0 !important;
          min-height: 760px !important;
          width: 100% !important;
        }
      }
    `;
  }

  function liveVisualSelector() {
    return [
      "canvas",
      "iframe",
      "img",
      "object",
      "svg",
      "video",
      "[data-testid*='artifact' i]",
      "[data-testid*='visual' i]",
      "[data-testid*='widget' i]",
      "[class*='artifact' i]",
      "[class*='visual' i]",
      "[class*='widget' i]",
      "[class*='interactive' i]"
    ].join(",");
  }

  function hasLiveElement(message) {
    return message?.element instanceof Element && document.documentElement.contains(message.element);
  }

  function hasLiveVisual(message) {
    if (!hasLiveElement(message)) {
      return false;
    }

    const signature = [
      message.text,
      message.markdown,
      message.html,
      message.element.textContent
    ].join(" ");

    return Boolean(message.element.matches(liveVisualSelector()) || message.element.querySelector(liveVisualSelector())) ||
      /\bvisualize\b|\bshow_widget\b/i.test(signature);
  }

  function shouldPrintLivePdf(messages, options) {
    return options.providerId === "claude" && messages.some(hasLiveVisual);
  }

  function createLivePrintHeader(metadata) {
    return `
      <header class="ace-live-print-header">
        <h1>${utils.escapeHtml(metadata.title)}</h1>
        <div class="ace-live-print-meta">
          <span>Source: ${utils.escapeHtml(metadata.source)}</span>
          <span>Provider: ${utils.escapeHtml(metadata.provider)}</span>
          <span>Exported: ${utils.escapeHtml(metadata.exportedAt)}</span>
          <span>Messages: ${metadata.messageCount}</span>
        </div>
      </header>
    `;
  }

  function createLivePrintMessage(message, options) {
    const article = document.createElement("article");
    article.className = "ace-live-print-message";
    article.dataset.aceLivePrintMessage = "true";
    article.dataset.aceLivePrintIndex = String(message.index + 1);
    article.dataset.aceLivePrintLabel = roleLabel(message.role, options);
    article.innerHTML = `
      <div class="ace-live-print-body"></div>
    `;
    return article;
  }

  function elementPathToBody(element) {
    const path = [];
    let current = element.parentElement;

    while (current && current !== document.body && current !== document.documentElement) {
      path.push(current);
      current = current.parentElement;
    }

    return path;
  }

  function elementIsInAny(elements, candidate) {
    return elements.some((element) => element === candidate || element.contains(candidate));
  }

  function rememberStyle(touchedStyles, element, property) {
    touchedStyles.push({
      element,
      priority: element.style.getPropertyPriority(property),
      property,
      value: element.style.getPropertyValue(property)
    });
  }

  function setPrintStyle(touchedStyles, element, property, value) {
    rememberStyle(touchedStyles, element, property);
    element.style.setProperty(property, value, "important");
  }

  function restorePrintStyles(touchedStyles) {
    for (const item of touchedStyles.reverse()) {
      if (item.value) {
        item.element.style.setProperty(item.property, item.value, item.priority);
      } else {
        item.element.style.removeProperty(item.property);
      }
    }
  }

  function expandClippedPrintElement(touchedStyles, element) {
    if (!(element instanceof HTMLElement)) {
      return;
    }

    const computed = window.getComputedStyle(element);
    const overflowText = `${computed.overflow} ${computed.overflowX} ${computed.overflowY}`;
    const clips = /\b(auto|clip|hidden|scroll)\b/.test(overflowText);
    const clientHeight = element.clientHeight || Math.ceil(element.getBoundingClientRect().height);
    const clientWidth = element.clientWidth || Math.ceil(element.getBoundingClientRect().width);
    const needsHeight = element.scrollHeight > clientHeight + 2;
    const needsWidth = element.scrollWidth > clientWidth + 2;

    if (!clips && !needsHeight && !needsWidth && computed.maxHeight === "none" && computed.clipPath === "none" && computed.contain === "none") {
      return;
    }

    for (const property of ["clip", "clip-path", "contain", "max-height", "overflow", "overflow-x", "overflow-y"]) {
      setPrintStyle(touchedStyles, element, property, property === "max-height" ? "none" : property === "contain" ? "none" : property === "clip-path" ? "none" : property === "clip" ? "auto" : "visible");
    }

    if (needsHeight) {
      setPrintStyle(touchedStyles, element, "height", `${element.scrollHeight}px`);
    }

    if (needsWidth && element.scrollWidth < 1600) {
      setPrintStyle(touchedStyles, element, "width", `${element.scrollWidth}px`);
    }
  }

  function expandLivePrintClipping(liveElements) {
    const touchedStyles = [];
    for (const liveElement of liveElements) {
      [liveElement, ...Array.from(liveElement.querySelectorAll("*"))].forEach((element) => {
        expandClippedPrintElement(touchedStyles, element);
      });
    }
    return () => restorePrintStyles(touchedStyles);
  }

  function prepareInPlaceLivePrint(root, liveMessages, options) {
    const liveElements = liveMessages.map((message) => message.element).filter((element) => element instanceof Element);
    const ancestorSet = new Set(liveElements.flatMap(elementPathToBody));
    const touched = [];

    for (const message of liveMessages) {
      const element = message.element;
      element.dataset.aceLivePrintMessage = "true";
      element.dataset.aceLivePrintIndex = String(message.index + 1);
      element.dataset.aceLivePrintLabel = roleLabel(message.role, options);
      touched.push(element);
    }

    for (const ancestor of ancestorSet) {
      ancestor.dataset.aceLivePrintAncestor = "true";
      touched.push(ancestor);
    }

    Array.from(document.body.querySelectorAll("*")).forEach((element) => {
      if (
        element === root ||
        root.contains(element) ||
        liveElements.includes(element) ||
        ancestorSet.has(element) ||
        elementIsInAny(liveElements, element)
      ) {
        return;
      }

      element.dataset.aceLivePrintHidden = "true";
      touched.push(element);
    });

    return () => {
      for (const element of touched) {
        delete element.dataset.aceLivePrintMessage;
        delete element.dataset.aceLivePrintIndex;
        delete element.dataset.aceLivePrintLabel;
        delete element.dataset.aceLivePrintAncestor;
        delete element.dataset.aceLivePrintHidden;
      }
    };
  }

  function printLivePdf(messages, options) {
    const metadata = exportMetadata(messages, options);
    const root = document.createElement("section");
    const style = document.createElement("style");
    const liveMessages = messages.filter(hasLiveElement);
    const staticMessages = messages.filter((message) => !hasLiveElement(message));
    let cleanupPrintMarkers = () => {};
    let cleanupClipping = () => {};
    let cleaned = false;

    root.id = "ace-live-print-root";
    root.innerHTML = createLivePrintHeader(metadata);
    style.textContent = livePdfCss(options);
    document.head.appendChild(style);
    document.body.insertBefore(root, document.body.firstChild);

    for (const message of staticMessages) {
      const article = createLivePrintMessage(message, options);
      const body = article.querySelector(".ace-live-print-body");
      root.appendChild(article);
      body.innerHTML = messageHtml(message);
    }

    cleanupPrintMarkers = prepareInPlaceLivePrint(root, liveMessages, options);
    cleanupClipping = expandLivePrintClipping(liveMessages.map((message) => message.element));
    document.documentElement.classList.add("ace-live-printing");

    const cleanup = () => {
      if (cleaned) {
        return;
      }

      cleaned = true;
      cleanupClipping();
      cleanupPrintMarkers();
      document.documentElement.classList.remove("ace-live-printing");
      root.remove();
      style.remove();
    };

    window.addEventListener("afterprint", cleanup, { once: true });
    window.setTimeout(cleanup, 300000);
    window.setTimeout(() => {
      window.focus();
      window.print();
    }, 100);
  }

  function blobForFormat(format, messages, options) {
    const serializers = {
      csv: () => toCsv(messages, options),
      json: () => toJson(messages, options),
      markdown: () => toMarkdown(messages, options),
      text: () => toText(messages, options)
    };

    const mimeTypes = {
      csv: "text/csv;charset=utf-8",
      json: "application/json;charset=utf-8",
      markdown: "text/markdown;charset=utf-8",
      text: "text/plain;charset=utf-8"
    };

    if (!serializers[format]) {
      throw new Error(`Unsupported export format: ${format}`);
    }

    return {
      blob: new Blob([serializers[format]()], { type: mimeTypes[format] }),
      filename: baseFilename(options, format)
    };
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Could not render image export."));
      image.src = url;
    });
  }

  function liveImageMessageHtml(message) {
    if (!hasLiveElement(message)) {
      return "";
    }

    try {
      return cloneLiveElementForImageExport(message.element).outerHTML;
    } catch (error) {
      return "";
    }
  }

  function imageMessageHtml(message) {
    return liveImageMessageHtml(message) || messageHtml(message);
  }

  function buildImageHtmlDocument(messages, options) {
    const metadata = exportMetadata(messages, options);
    const messageArticles = messages.map((message) => `
      <article class="ace-export-message">
        <header class="ace-export-message-header">
          <span>${utils.escapeHtml(roleLabel(message.role, options))}</span>
          <span>#${message.index + 1}</span>
        </header>
        <div class="ace-export-message-body">
          ${imageMessageHtml(message)}
        </div>
      </article>
    `).join("");

    return `
      <div class="ace-export-document">
        <header class="ace-export-header">
          <h1>${utils.escapeHtml(metadata.title)}</h1>
          <div class="ace-export-meta">
            <span>Source: ${utils.escapeHtml(metadata.source)}</span>
            <span>Provider: ${utils.escapeHtml(metadata.provider)}</span>
            <span>Exported: ${utils.escapeHtml(metadata.exportedAt)}</span>
            <span>Messages: ${metadata.messageCount}</span>
          </div>
        </header>
        ${messageArticles}
      </div>
    `;
  }

  function imageExportMarkup(messages, options) {
    return `
      <div xmlns="http://www.w3.org/1999/xhtml" class="ace-image-export-root">
        <style>${exportCss(options)}</style>
        ${buildImageHtmlDocument(messages, options)}
      </div>
    `;
  }

  function removeCloneExportChrome(clone) {
    clone.querySelectorAll([
      "#ace-exporter-launcher",
      "#ace-exporter-panel",
      ".ace-selection-rail",
      ".ace-chat-select-button",
      ".ace-chat-selection-frame",
      ".ace-exporter-toast",
      "[aria-label*='Copy' i]",
      "[aria-label*='Retry' i]",
      "[aria-label*='Like' i]",
      "[aria-label*='Dislike' i]",
      "[aria-label*='Share' i]",
      "[data-testid*='copy' i]",
      "[data-testid*='feedback' i]",
      "script",
      "noscript"
    ].join(",")).forEach((node) => node.remove());
  }

  function replaceCanvasClones(source, clone) {
    const sourceCanvases = Array.from(source.querySelectorAll("canvas"));
    const cloneCanvases = Array.from(clone.querySelectorAll("canvas"));

    sourceCanvases.forEach((canvas, index) => {
      const cloneCanvas = cloneCanvases[index];
      if (!cloneCanvas) {
        return;
      }

      try {
        const image = document.createElement("img");
        image.src = canvas.toDataURL("image/png");
        image.width = canvas.width;
        image.height = canvas.height;
        image.style.cssText = cloneCanvas.getAttribute("style") || "";
        cloneCanvas.replaceWith(image);
      } catch (error) {
        // Cross-origin canvas content cannot be copied. Keep the clone as a fallback.
      }
    });
  }

  function inlineComputedStyles(source, clone, view = source.ownerDocument?.defaultView || window) {
    const sourceElements = [source, ...Array.from(source.querySelectorAll("*"))];
    const cloneElements = [clone, ...Array.from(clone.querySelectorAll("*"))];

    sourceElements.forEach((sourceElement, index) => {
      const cloneElement = cloneElements[index];
      if (!(sourceElement instanceof Element) || !(cloneElement instanceof HTMLElement || cloneElement instanceof SVGElement)) {
        return;
      }

      const computed = view.getComputedStyle(sourceElement);
      for (let propertyIndex = 0; propertyIndex < computed.length; propertyIndex += 1) {
        const property = computed[propertyIndex];
        cloneElement.style.setProperty(property, computed.getPropertyValue(property), computed.getPropertyPriority(property));
      }

      if (sourceElement instanceof HTMLElement) {
        const clientHeight = sourceElement.clientHeight || Math.ceil(sourceElement.getBoundingClientRect().height);
        const clientWidth = sourceElement.clientWidth || Math.ceil(sourceElement.getBoundingClientRect().width);
        if (sourceElement.scrollHeight > clientHeight + 2) {
          cloneElement.style.setProperty("height", `${sourceElement.scrollHeight}px`, "important");
        }
        if (sourceElement.scrollWidth > clientWidth + 2 && sourceElement.scrollWidth < 1600) {
          cloneElement.style.setProperty("width", `${sourceElement.scrollWidth}px`, "important");
        }
      }

      for (const property of ["clip", "clip-path", "contain", "max-height", "overflow", "overflow-x", "overflow-y"]) {
        cloneElement.style.setProperty(property, property === "clip" ? "auto" : property === "overflow" || property.startsWith("overflow") ? "visible" : "none", "important");
      }
    });
  }

  function replaceIframeClones(source, clone) {
    const sourceIframes = Array.from(source.querySelectorAll("iframe"));
    const cloneIframes = Array.from(clone.querySelectorAll("iframe"));

    sourceIframes.forEach((iframe, index) => {
      const cloneIframe = cloneIframes[index];
      if (!cloneIframe) {
        return;
      }

      try {
        const frameDocument = iframe.contentDocument;
        const frameView = iframe.contentWindow || frameDocument?.defaultView;
        if (!frameDocument?.body || !frameView) {
          return;
        }

        const frameClone = frameDocument.body.cloneNode(true);
        removeCloneExportChrome(frameClone);
        replaceCanvasClones(frameDocument.body, frameClone);
        inlineComputedStyles(frameDocument.body, frameClone, frameView);

        const wrapper = document.createElement("div");
        const frameRect = iframe.getBoundingClientRect();
        const frameHeight = Math.max(
          Math.ceil(frameRect.height),
          frameDocument.documentElement?.scrollHeight || 0,
          frameDocument.body.scrollHeight || 0,
          420
        );
        wrapper.className = "ace-export-iframe-snapshot";
        wrapper.style.cssText = [
          "display:block",
          `height:${frameHeight}px`,
          "max-height:none",
          "overflow:visible",
          "width:100%"
        ].join(";");
        wrapper.appendChild(frameClone);
        cloneIframe.replaceWith(wrapper);
      } catch (error) {
        // Cross-origin iframes cannot be flattened from a content script.
      }
    });
  }

  function cloneLiveElementForImageExport(element) {
    const clone = element.cloneNode(true);
    removeCloneExportChrome(clone);
    replaceCanvasClones(element, clone);
    replaceIframeClones(element, clone);
    inlineComputedStyles(element, clone);
    clone.classList.remove("ace-chat-selectable", "ace-chat-selected");
    clone.style.setProperty("box-shadow", "none", "important");
    clone.style.setProperty("outline", "none", "important");
    clone.style.setProperty("max-width", "100%", "important");
    clone.style.setProperty("overflow", "visible", "important");
    return clone;
  }

  function svgSliceMarkup(imageMarkup, width, measuredHeight, sliceTop, sliceHeight) {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${sliceHeight}" viewBox="0 0 ${width} ${sliceHeight}">
        <foreignObject x="0" y="0" width="${width}" height="${sliceHeight}">
          <div xmlns="http://www.w3.org/1999/xhtml" style="height:${measuredHeight}px; transform:translateY(${-sliceTop}px); width:${width}px;">
            ${imageMarkup}
          </div>
        </foreignObject>
      </svg>
    `;
  }

  async function renderSvgSlice(imageMarkup, width, measuredHeight, sliceTop, sliceHeight) {
    const svgBlob = new Blob([svgSliceMarkup(imageMarkup, width, measuredHeight, sliceTop, sliceHeight)], {
      type: "image/svg+xml;charset=utf-8"
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    try {
      return await loadImage(svgUrl);
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not create PNG blob.")), "image/png");
    });
  }

  async function exportPng(messages, options) {
    const stage = document.createElement("div");
    stage.className = "ace-image-export-stage";
    stage.style.cssText = [
      "position: fixed",
      "left: -12000px",
      "top: 0",
      "width: 1100px",
      "background: transparent",
      "z-index: -1"
    ].join(";");
    const imageMarkup = imageExportMarkup(messages, options);
    stage.innerHTML = imageMarkup;
    document.documentElement.appendChild(stage);

    const width = 1100;
    const measuredHeight = Math.max(stage.scrollHeight, 600);
    const maxHeight = 30000;
    const sliceHeight = 4096;
    const scale = measuredHeight > maxHeight ? maxHeight / measuredHeight : 1;
    const height = Math.ceil(measuredHeight * scale);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(width * scale);
      canvas.height = height;

      const context = canvas.getContext("2d");
      context.fillStyle = options.theme === "dark" ? "#101114" : "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);

      for (let sliceTop = 0; sliceTop < measuredHeight; sliceTop += sliceHeight) {
        const currentSliceHeight = Math.min(sliceHeight, measuredHeight - sliceTop);
        const image = await renderSvgSlice(imageMarkup, width, measuredHeight, sliceTop, currentSliceHeight);
        context.drawImage(
          image,
          0,
          Math.floor(sliceTop * scale),
          canvas.width,
          Math.ceil(currentSliceHeight * scale)
        );
      }

      const pngBlob = await canvasToBlob(canvas);

      utils.downloadBlob(pngBlob, baseFilename(options, "png"));
    } finally {
      stage.remove();
    }
  }

  function download(format, messages, options) {
    if (format === "pdf") {
      if (shouldPrintLivePdf(messages, options)) {
        printLivePdf(messages, options);
      } else {
        printPdf(messages, options);
      }
      return;
    }

    const result = blobForFormat(format, messages, options);
    utils.downloadBlob(result.blob, result.filename);
  }

  globalScope.ACEExporters = {
    FORMAT_LABELS,
    blobForFormat,
    download,
    exportPng,
    fullHtmlPage,
    printLivePdf,
    printPdf,
    toCsv,
    toJson,
    toMarkdown,
    toText
  };
})(globalThis);
