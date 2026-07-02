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
      app: "AI Chat Exporter"
    };
  }

  function baseFilename(options, format) {
    return utils.withExtension(options.filename || utils.createDefaultFilename(), format);
  }

  function roleLabel(role) {
    return role === "assistant" ? "Claude" : "User";
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
      parts.push(`## ${message.index + 1}. ${roleLabel(message.role)}`, "", message.markdown || message.text, "");
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
      parts.push(`[${message.index + 1}] ${roleLabel(message.role)}`, message.text, "");
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
        roleLabel(message.role),
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
        label: roleLabel(message.role),
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
        overflow: auto;
        padding: 12px;
        white-space: pre-wrap;
      }

      :not(pre) > code {
        background: var(--ace-code-bg);
        border-radius: 4px;
        padding: 1px 4px;
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
    const messageHtml = messages.map((message) => `
      <article class="ace-export-message">
        <header class="ace-export-message-header">
          <span>${utils.escapeHtml(roleLabel(message.role))}</span>
          <span>#${message.index + 1}</span>
        </header>
        <div class="ace-export-message-body">
          ${message.html || `<p>${utils.escapeHtml(message.text)}</p>`}
        </div>
      </article>
    `).join("");

    return `
      <div class="ace-export-document">
        <header class="ace-export-header">
          <h1>${utils.escapeHtml(metadata.title)}</h1>
          <div class="ace-export-meta">
            <span>Source: ${utils.escapeHtml(metadata.source)}</span>
            <span>Exported: ${utils.escapeHtml(metadata.exportedAt)}</span>
            <span>Messages: ${metadata.messageCount}</span>
          </div>
        </header>
        ${messageHtml}
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
          <title>${utils.escapeHtml(options.title || "Claude Export")}</title>
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
      throw new Error("The print window was blocked. Allow pop-ups for Claude and try again.");
    }

    window.setTimeout(() => URL.revokeObjectURL(htmlUrl), 60000);
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
    const imageMarkup = `
      <div xmlns="http://www.w3.org/1999/xhtml" class="ace-image-export-root">
        <style>${exportCss(options)}</style>
        ${buildHtmlDocument(messages, options)}
      </div>
    `;
    stage.innerHTML = imageMarkup;
    document.documentElement.appendChild(stage);

    const width = 1100;
    const measuredHeight = Math.max(stage.scrollHeight, 600);
    const maxHeight = 16000;
    const scale = measuredHeight > maxHeight ? maxHeight / measuredHeight : 1;
    const height = Math.ceil(measuredHeight * scale);
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${measuredHeight}">
        <foreignObject x="0" y="0" width="${width}" height="${measuredHeight}">
          ${imageMarkup}
        </foreignObject>
      </svg>
    `;

    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    try {
      const image = await loadImage(svgUrl);
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(width * scale);
      canvas.height = height;

      const context = canvas.getContext("2d");
      context.fillStyle = options.theme === "dark" ? "#101114" : "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const pngBlob = await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not create PNG blob.")), "image/png");
      });

      utils.downloadBlob(pngBlob, baseFilename(options, "png"));
    } finally {
      URL.revokeObjectURL(svgUrl);
      stage.remove();
    }
  }

  function download(format, messages, options) {
    if (format === "pdf") {
      printPdf(messages, options);
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
    printPdf,
    toCsv,
    toJson,
    toMarkdown,
    toText
  };
})(globalThis);
