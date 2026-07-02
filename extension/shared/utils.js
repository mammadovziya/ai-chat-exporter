(function attachAiChatExporterUtils(globalScope) {
  "use strict";

  const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function decodeHtml(value) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = String(value ?? "");
    return textarea.value;
  }

  function slugify(value, fallback = "claude-chat") {
    const slug = String(value ?? "")
      .trim()
      .replace(INVALID_FILENAME_CHARS, " ")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 120);

    return slug || fallback;
  }

  function extensionForFormat(format) {
    const extensions = {
      csv: "csv",
      json: "json",
      markdown: "md",
      pdf: "pdf",
      png: "png",
      text: "txt"
    };

    return extensions[format] || "txt";
  }

  function withExtension(filename, format) {
    const extension = extensionForFormat(format);
    const safeBase = slugify(filename);
    return safeBase.toLowerCase().endsWith(`.${extension}`) ? safeBase : `${safeBase}.${extension}`;
  }

  function timestampForFilename(date = new Date()) {
    const pad = (number) => String(number).padStart(2, "0");
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate())
    ].join("-") + "-" + [pad(date.getHours()), pad(date.getMinutes())].join("");
  }

  function defaultConversationTitle() {
    const title = document.title
      .replace(/\s*-\s*Claude\s*$/i, "")
      .replace(/\s*\|\s*Claude\s*$/i, "")
      .trim();

    return title || "Claude Conversation";
  }

  function createDefaultFilename() {
    return `claude-chat-${timestampForFilename()}`;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    anchor.style.display = "none";
    document.documentElement.appendChild(anchor);
    anchor.click();

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
      anchor.remove();
    }, 1000);
  }

  function normalizeWhitespace(value) {
    return String(value ?? "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{4,}/g, "\n\n\n")
      .trim();
  }

  globalScope.ACEUtils = {
    createDefaultFilename,
    decodeHtml,
    defaultConversationTitle,
    downloadBlob,
    escapeHtml,
    extensionForFormat,
    normalizeWhitespace,
    slugify,
    timestampForFilename,
    withExtension
  };
})(globalThis);
