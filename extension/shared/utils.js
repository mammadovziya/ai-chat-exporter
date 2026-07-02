(function attachAiChatExporterUtils(globalScope) {
  "use strict";

  const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;
  const CODE_LANGUAGE_ALIASES = {
    "c#": "csharp",
    "c++": "cpp",
    "js": "javascript",
    "md": "markdown",
    "ps": "powershell",
    "ps1": "powershell",
    "py": "python",
    "rb": "ruby",
    "rs": "rust",
    "shell": "bash",
    "sh": "bash",
    "ts": "typescript",
    "yml": "yaml"
  };
  const CODE_LANGUAGE_LABELS = {
    bash: "Bash",
    c: "C",
    cpp: "C++",
    csharp: "C#",
    css: "CSS",
    go: "Go",
    html: "HTML",
    java: "Java",
    javascript: "JavaScript",
    json: "JSON",
    jsx: "JSX",
    markdown: "Markdown",
    php: "PHP",
    powershell: "PowerShell",
    python: "Python",
    ruby: "Ruby",
    rust: "Rust",
    sql: "SQL",
    tsx: "TSX",
    typescript: "TypeScript",
    xml: "XML",
    yaml: "YAML"
  };
  const CODE_KEYWORDS = {
    bash: ["case", "do", "done", "elif", "else", "esac", "fi", "for", "function", "if", "in", "select", "then", "until", "while"],
    c: ["break", "case", "const", "continue", "default", "do", "else", "enum", "for", "if", "include", "int", "long", "return", "sizeof", "static", "struct", "switch", "typedef", "void", "while"],
    cpp: ["auto", "break", "case", "class", "const", "continue", "default", "delete", "do", "else", "enum", "for", "if", "include", "namespace", "new", "private", "protected", "public", "return", "static", "struct", "switch", "template", "typename", "using", "virtual", "void", "while"],
    csharp: ["async", "await", "break", "case", "class", "const", "continue", "default", "else", "for", "if", "interface", "namespace", "new", "private", "protected", "public", "return", "static", "string", "switch", "using", "var", "void", "while"],
    css: ["align-items", "background", "border", "color", "display", "flex", "font", "gap", "grid", "height", "margin", "padding", "position", "width"],
    go: ["break", "case", "chan", "const", "continue", "defer", "else", "for", "func", "go", "if", "import", "interface", "map", "package", "range", "return", "select", "struct", "switch", "type", "var"],
    java: ["abstract", "break", "case", "catch", "class", "const", "continue", "else", "extends", "final", "finally", "for", "if", "implements", "import", "interface", "new", "private", "protected", "public", "return", "static", "switch", "this", "throw", "try", "void", "while"],
    javascript: ["async", "await", "break", "case", "catch", "class", "const", "continue", "default", "else", "export", "extends", "finally", "for", "from", "function", "if", "import", "let", "new", "return", "switch", "this", "throw", "try", "var", "while", "yield"],
    json: ["false", "null", "true"],
    php: ["abstract", "array", "catch", "class", "echo", "else", "extends", "final", "foreach", "function", "if", "namespace", "new", "private", "protected", "public", "return", "static", "throw", "try", "use"],
    powershell: ["begin", "break", "catch", "class", "continue", "data", "do", "dynamicparam", "else", "elseif", "end", "filter", "finally", "for", "foreach", "from", "function", "if", "in", "param", "process", "return", "switch", "throw", "trap", "try", "until", "while"],
    python: ["and", "as", "assert", "async", "await", "break", "class", "continue", "def", "elif", "else", "except", "finally", "for", "from", "if", "import", "in", "is", "lambda", "not", "or", "pass", "raise", "return", "try", "while", "with", "yield"],
    ruby: ["begin", "break", "case", "class", "def", "do", "else", "elsif", "end", "ensure", "for", "if", "in", "module", "next", "rescue", "return", "then", "unless", "until", "when", "while", "yield"],
    rust: ["as", "async", "await", "break", "const", "continue", "crate", "else", "enum", "extern", "false", "fn", "for", "if", "impl", "in", "let", "loop", "match", "mod", "move", "mut", "pub", "ref", "return", "self", "static", "struct", "trait", "true", "type", "unsafe", "use", "where", "while"],
    sql: ["alter", "and", "as", "by", "case", "create", "delete", "desc", "distinct", "drop", "else", "from", "group", "having", "insert", "into", "join", "left", "limit", "not", "null", "on", "or", "order", "right", "select", "set", "table", "then", "union", "update", "values", "when", "where"],
    typescript: ["abstract", "as", "async", "await", "break", "case", "catch", "class", "const", "continue", "default", "else", "enum", "export", "extends", "finally", "for", "from", "function", "if", "implements", "import", "interface", "let", "new", "private", "protected", "public", "readonly", "return", "switch", "this", "throw", "try", "type", "var", "while", "yield"],
    yaml: ["false", "null", "true"]
  };

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
    const providers = globalScope.ACEProviders;
    const title = (providers?.removeTitleBrand(document.title) || document.title
      .replace(/\s*-\s*Claude\s*$/i, "")
      .replace(/\s*\|\s*Claude\s*$/i, "")
      .trim());

    return title || `${providers?.current()?.name || "AI"} Conversation`;
  }

  function createDefaultFilename() {
    const prefix = globalScope.ACEProviders?.current()?.filenamePrefix || "ai-chat";
    return `${prefix}-${timestampForFilename()}`;
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

  function normalizeCodeLanguage(value) {
    const raw = String(value ?? "")
      .replace(/^language-/i, "")
      .replace(/^lang-/i, "")
      .trim()
      .toLowerCase();
    const safe = raw.replace(/[^\w#+.-]/g, "");
    return CODE_LANGUAGE_ALIASES[safe] || safe;
  }

  function codeLanguageLabel(value) {
    const language = normalizeCodeLanguage(value);
    return CODE_LANGUAGE_LABELS[language] || (language ? language.toUpperCase() : "");
  }

  function detectCodeLanguage(value) {
    const code = String(value ?? "").trim();
    if (!code) {
      return "";
    }

    if (/^\s*[{[][\s\S]*[}\]]\s*$/.test(code)) {
      try {
        JSON.parse(code);
        return "json";
      } catch (error) {
        // Keep checking other signatures.
      }
    }

    if (/^\s*<(!doctype|html|[a-z][\w:-]*(\s|>|\/>))/i.test(code)) {
      return "html";
    }
    if (/\b(select|insert|update|delete|create|alter|drop)\b[\s\S]+\b(from|into|table|where|values)\b/i.test(code)) {
      return "sql";
    }
    if (/\b(def|import|from|print|elif|async def)\b/.test(code) && /:\s*(#.*)?$/m.test(code)) {
      return "python";
    }
    if (/\b(function|const|let|var|import|export|async|await)\b/.test(code) || /=>/.test(code)) {
      return /\binterface\b|:\s*(string|number|boolean)\b/.test(code) ? "typescript" : "javascript";
    }
    if (/\b(Get-|Set-|New-|Remove-|Write-|Param\s*\(|foreach\s*\()/i.test(code)) {
      return "powershell";
    }
    if (/^\s*(\$|sudo|cd|ls|grep|cat|npm|pnpm|yarn|git|docker|kubectl|winget)\b/m.test(code)) {
      return "bash";
    }
    if (/^\s*[\w.-]+:\s*.+$/m.test(code) && /\n\s+[\w.-]+:\s*/.test(code)) {
      return "yaml";
    }
    if (/^[\s\S]*\{[\s\S]*:[\s\S]*;[\s\S]*\}\s*$/.test(code) && /[#.]?[\w-]+\s*\{/.test(code)) {
      return "css";
    }

    return "";
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function spanToken(type, value) {
    return `<span class="ace-token-${type}">${escapeHtml(value)}</span>`;
  }

  function highlightMarkupCode(code) {
    const pattern = /(<!--[\s\S]*?-->)|(<\/?)([A-Za-z][\w:-]*)([^>]*)(>)/g;
    let output = "";
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(code))) {
      output += escapeHtml(code.slice(lastIndex, match.index));
      if (match[1]) {
        output += spanToken("comment", match[1]);
      } else {
        output += spanToken("punctuation", match[2]);
        output += spanToken("tag", match[3]);
        output += highlightMarkupAttributes(match[4]);
        output += spanToken("punctuation", match[5]);
      }
      lastIndex = pattern.lastIndex;
    }

    return output + escapeHtml(code.slice(lastIndex));
  }

  function highlightMarkupAttributes(value) {
    const escaped = escapeHtml(value);
    return escaped.replace(/([A-Za-z_:][\w:.-]*)(=)(&quot;.*?&quot;|&#039;.*?&#039;)/g, (_, name, equals, quoted) => {
      return `<span class="ace-token-attr">${name}</span><span class="ace-token-punctuation">${equals}</span><span class="ace-token-string">${quoted}</span>`;
    });
  }

  function commentPatternForLanguage(language) {
    if (["bash", "powershell", "python", "ruby", "yaml"].includes(language)) {
      return "#[^\\n]*";
    }
    if (language === "sql") {
      return "--[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/";
    }
    if (language === "json") {
      return "(?!)";
    }
    return "\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/";
  }

  function highlightCode(value, languageHint = "") {
    const code = String(value ?? "");
    const language = normalizeCodeLanguage(languageHint) || detectCodeLanguage(code);
    if (["html", "xml"].includes(language)) {
      return highlightMarkupCode(code);
    }

    const keywords = CODE_KEYWORDS[language] || [];
    const keywordPattern = keywords.length ? `\\b(?:${keywords.map(escapeRegExp).join("|")})\\b` : "(?!)";
    const tokenPattern = new RegExp([
      commentPatternForLanguage(language),
      "`(?:\\\\[\\s\\S]|[^`\\\\])*`",
      "\"(?:\\\\.|[^\"\\\\])*\"",
      "'(?:\\\\.|[^'\\\\])*'",
      "\\b(?:0x[\\da-f]+|\\d+(?:\\.\\d+)?)\\b",
      keywordPattern
    ].join("|"), "gi");
    let output = "";
    let lastIndex = 0;
    let match;

    while ((match = tokenPattern.exec(code))) {
      const token = match[0];
      output += escapeHtml(code.slice(lastIndex, match.index));

      if (/^(?:\/\/|\/\*|#|--)/.test(token)) {
        output += spanToken("comment", token);
      } else if (/^(?:"|'|`)/.test(token)) {
        output += spanToken("string", token);
      } else if (/^(?:0x[\da-f]+|\d)/i.test(token)) {
        output += spanToken("number", token);
      } else {
        output += spanToken("keyword", token);
      }

      lastIndex = tokenPattern.lastIndex;
    }

    return output + escapeHtml(code.slice(lastIndex));
  }

  globalScope.ACEUtils = {
    codeLanguageLabel,
    createDefaultFilename,
    decodeHtml,
    detectCodeLanguage,
    defaultConversationTitle,
    downloadBlob,
    escapeHtml,
    extensionForFormat,
    highlightCode,
    normalizeCodeLanguage,
    normalizeWhitespace,
    slugify,
    timestampForFilename,
    withExtension
  };
})(globalThis);
