(function attachAiChatScraper(globalScope) {
  "use strict";

  const utils = globalScope.ACEUtils;
  const providers = globalScope.ACEProviders;

  const ACTION_GROUP_SELECTOR = [
    '[role="group"][aria-label="Message actions"]',
    '[role="group"][aria-label*="message" i]',
    '[aria-label="Message actions"]',
    '[aria-label*="message actions" i]',
    '[data-testid*="message-actions" i]',
    '[data-testid*="copy-turn-action" i]',
    '[data-testid*="response-actions" i]'
  ].join(",");

  const PROVIDER_MESSAGE_SELECTORS = {
    chatgpt: [
      "[data-testid^='conversation-turn-']",
      "[data-testid*='conversation-turn' i]",
      "[data-message-author-role]",
      "[data-testid*='chat-message' i]",
      "[data-testid*='message' i]",
      "article"
    ].join(","),
    gemini: [
      "user-query",
      "user-query .query-text",
      "user-query .query-content",
      "model-response",
      "message-content",
      "response-container",
      "[data-test-id*='query' i]",
      "[data-test-id*='user-query' i]",
      "[data-testid*='user-query' i]",
      "[data-test-id*='model-response' i]",
      "[data-testid*='model-response' i]",
      "[class*='user-query' i]",
      "[class*='query-content' i]",
      "[class*='query-text' i]",
      "[class*='query-container' i]",
      "[class*='response-content' i]",
      "[class*='model-response' i]",
      "[class*='response-container' i]"
    ].join(","),
    grok: [
      "[data-testid*='user-message' i]",
      "[data-testid*='assistant-message' i]",
      "[data-testid*='message-bubble' i]",
      "[data-testid*='chat-message' i]",
      "[data-testid*='conversation-turn' i]",
      "[data-testid*='response' i]",
      "[data-testid*='message' i]",
      "[data-message-author-role]",
      "[data-author]",
      "[data-role='user']",
      "[data-role='assistant']",
      "[data-role='model']",
      "[class*='message-bubble' i]",
      "[class*='message-content' i]",
      "[class*='response-content' i]",
      "[class*='chat-message' i]",
      "[class*='prose' i]",
      "[class*='whitespace-pre-wrap' i]",
      "article"
    ].join(",")
  };

  const PROVIDER_MESSAGE_SELECTOR_GROUPS = {
    chatgpt: [
      [
        "[data-testid^='conversation-turn-']",
        "[data-testid*='conversation-turn' i]",
        "[data-message-author-role]"
      ].join(","),
      [
        "article"
      ].join(","),
      [
        "[data-testid*='chat-message' i]",
        "[data-testid*='message' i]"
      ].join(",")
    ],
    gemini: [
      [
        "user-query",
        "model-response",
        "[data-test-id*='user-query' i]",
        "[data-testid*='user-query' i]",
        "[data-test-id*='model-response' i]",
        "[data-testid*='model-response' i]"
      ].join(","),
      [
        "user-query .query-text",
        "user-query .query-content",
        "model-response message-content",
        "message-content",
        "response-container",
        "[class*='query-content' i]",
        "[class*='query-text' i]",
        "[class*='query-container' i]",
        "[class*='response-content' i]",
        "[class*='response-container' i]",
        "[class*='model-response' i]"
      ].join(","),
      [
        "[data-test-id*='query' i]",
        "[data-testid*='message' i]",
        "[data-testid*='response' i]",
        "article"
      ].join(",")
    ],
    grok: [
      [
        "[data-message-author-role]",
        "[data-author]",
        "[data-role='user']",
        "[data-role='assistant']",
        "[data-role='model']",
        "[data-testid*='user-message' i]",
        "[data-testid*='assistant-message' i]",
        "[data-testid*='message-bubble' i]",
        "[data-testid*='chat-message' i]",
        "[data-testid*='conversation-turn' i]"
      ].join(","),
      [
        "[class*='message-bubble' i]",
        "[class*='message-content' i]",
        "[class*='response-content' i]",
        "[class*='chat-message' i]",
        "[class*='prose' i]",
        "[class*='whitespace-pre-wrap' i]"
      ].join(","),
      [
        "[data-testid*='response' i]",
        "[data-testid*='message' i]",
        "article"
      ].join(",")
    ]
  };

  const ASSISTANT_FEEDBACK_SELECTOR = [
    'button[aria-label*="Give positive feedback" i]',
    'button[aria-label*="positive feedback" i]',
    'button[aria-label*="thumbs up" i]',
    'button[aria-label*="good response" i]',
    'button[aria-label*="like" i]',
    'button[aria-label*="regenerate" i]',
    'button[aria-label*="read aloud" i]',
    '[data-testid*="feedback" i]'
  ].join(",");

  const USER_CONTENT_SELECTOR = [
    ".font-user-message",
    "user-query",
    "user-query .query-text",
    "user-query .query-content",
    "[class*='font-user-message']",
    "[class*='query-content' i]",
    "[class*='query-text' i]",
    "[class*='query-container' i]",
    "[data-testid='user-message']",
    "[data-testid*='user-message' i]",
    "[data-message-author-role='user']",
    "[data-author='user']",
    "[data-role='user']",
    "[data-testid*='user-query' i]",
    "[data-test-id*='user-query' i]",
    "[class*='user-query' i]",
    "[aria-label*='You said' i]"
  ].join(",");

  const ASSISTANT_CONTENT_SELECTOR = [
    ".font-claude-message",
    ".markdown",
    ".prose",
    "model-response",
    "model-response message-content",
    "message-content",
    "response-container",
    ".model-response-text",
    "[class*='font-claude-message']",
    "[class*='prose' i]",
    "[class*='message-content' i]",
    "[class*='response-content' i]",
    "[class*='response-container' i]",
    "[class*='model-response' i]",
    "[class*='assistant-message' i]",
    "[aria-label*='Grok response' i]",
    "[aria-label*='Grok said' i]",
    "[data-testid='assistant-message']",
    "[data-testid*='assistant-message' i]",
    "[data-testid*='bot-message' i]",
    "[data-testid*='model-response' i]",
    "[data-test-id*='model-response' i]",
    "[data-test-id*='response' i]",
    "[data-message-author-role='assistant']",
    "[data-author='assistant']",
    "[data-role='assistant']",
    "[data-role='model']"
  ].join(",");

  const ROLE_CONTENT_SELECTOR = `${USER_CONTENT_SELECTOR},${ASSISTANT_CONTENT_SELECTOR}`;

  const USER_BUBBLE_HINT_SELECTOR = [
    USER_CONTENT_SELECTOR,
    "[class*='user-message' i]",
    "[class*='human-message' i]",
    "[class*='user-query' i]",
    "[class*='self-end' i]",
    "[class*='items-end' i]",
    "[class*='justify-end' i]",
    "[class*='ml-auto' i]",
    "[class*='text-right' i]"
  ].join(",");

  const CANDIDATE_GROUPS = [
    {
      min: 1,
      selector: [
        ".font-user-message",
        ".font-claude-message",
        "[class*='font-user-message']",
        "[class*='font-claude-message']",
        "[data-testid='user-message']",
        "[data-testid='assistant-message']",
        "[data-testid*='user-message' i]",
        "[data-testid*='assistant-message' i]",
        "[data-testid*='user-query' i]",
        "[data-testid*='model-response' i]",
        "[data-testid*='conversation-turn' i]",
        "[data-testid*='response' i]",
        "[data-test-id*='user-query' i]",
        "[data-test-id*='model-response' i]",
        "[data-message-author-role='user']",
        "[data-message-author-role='assistant']",
        "[data-author='user']",
        "[data-author='assistant']",
        "[data-role='user']",
        "[data-role='assistant']",
        "[data-role='model']",
        "user-query",
        "model-response",
        "message-content",
        "response-container",
        ".prose",
        ".model-response-text"
      ].join(",")
    },
    {
      min: 2,
      selector: [
        '[data-testid*="conversation-turn" i]',
        '[data-testid*="chat-turn" i]',
        '[data-testid*="chat-message" i]',
        '[data-testid*="message-row" i]',
        '[data-testid*="message-bubble" i]',
        '[data-testid*="message" i]',
        '[data-testid*="response" i]',
        '[data-test-id*="conversation" i]',
        '[data-test-id*="chat" i]',
        '[data-test-id*="message" i]',
        '[data-turn]',
        '[data-message-id]',
        ".conversation-turn",
        ".chat-message",
        ".message-bubble",
        ".message-content",
        ".response-content",
        "article"
      ].join(",")
    }
  ];

  const REMOVE_SELECTORS = [
    "#ace-exporter-launcher",
    "#ace-exporter-panel",
    ".ace-selection-rail",
    ".ace-chat-select-button",
    ".ace-exporter-toast",
    "aside",
    "footer",
    "form",
    "header",
    "nav",
    "script",
    "style",
    "noscript",
    "button",
    "input",
    "select",
    "textarea",
    "svg",
    "[role='button']",
    "[aria-label*='Copy' i]",
    "[aria-label*='Retry' i]",
    "[aria-label*='Like' i]",
    "[aria-label*='Dislike' i]",
    "[aria-label*='Share' i]",
    "[data-testid*='copy' i]",
    "[data-testid*='feedback' i]",
    "[data-testid*='sidebar' i]",
    "[data-testid*='disclaimer' i]",
    "[class*='sidebar' i]",
    "[class*='conversation-starter' i]",
    "[class*='disclaimer' i]",
    "[href*='support.anthropic.com']",
    "[href*='support.google.com']",
    "[href*='help.openai.com']"
  ];

  const TRANSCRIPT_MARKER_PATTERN = providers?.transcriptMarkerPattern("^\\s*") ||
    /^\s*(you said|claude responded|claude said|assistant responded|assistant said)\s*:\s*/i;
  const MARKDOWN_TRANSCRIPT_MARKER_PATTERN = providers?.transcriptMarkerPattern("^\\s*(?:#{1,6}\\s*)?") ||
    /^\s*(?:#{1,6}\s*)?(you said|claude responded|claude said|assistant responded|assistant said)\s*:\s*/i;
  const AI_FOOTER_PATTERN = /\n*\[?(Claude|ChatGPT|Gemini|Grok|AI|Google Gemini) (is|can be) (AI|an AI)?[^.\n]*can make mistakes[\s\S]*$/i;
  const DATE_ONLY_PATTERN = /^(today|yesterday|mon(day)?|tue(sday)?|wed(nesday)?|thu(rsday)?|fri(day)?|sat(urday)?|sun(day)?|jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|jun(e)?|jul(y)?|aug(ust)?|sep(tember)?|oct(ober)?|nov(ember)?|dec(ember)?)\.?\s+\d{1,2}(,\s*\d{4})?$/i;
  const MATH_TAGS = new Set([
    "annotation",
    "math",
    "menclose",
    "mfenced",
    "mfrac",
    "mi",
    "mn",
    "mo",
    "mover",
    "mpadded",
    "mphantom",
    "mrow",
    "ms",
    "mspace",
    "msqrt",
    "mstyle",
    "msub",
    "msubsup",
    "msup",
    "mtable",
    "mtd",
    "mtext",
    "mtr",
    "munder",
    "munderover",
    "semantics"
  ]);

  const ALLOWED_TAGS = new Set([
    "a",
    "article",
    "b",
    "blockquote",
    "br",
    "code",
    "dd",
    "details",
    "div",
    "dl",
    "dt",
    "em",
    "figcaption",
    "figure",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "i",
    "kbd",
    "li",
    "annotation",
    "math",
    "menclose",
    "mfenced",
    "mfrac",
    "mi",
    "mn",
    "mo",
    "mover",
    "mpadded",
    "mphantom",
    "mrow",
    "ms",
    "mspace",
    "msqrt",
    "mstyle",
    "msub",
    "msubsup",
    "msup",
    "mtable",
    "mtd",
    "mtext",
    "mtr",
    "munder",
    "munderover",
    "ol",
    "p",
    "pre",
    "section",
    "semantics",
    "span",
    "strong",
    "sub",
    "summary",
    "sup",
    "table",
    "tbody",
    "td",
    "tfoot",
    "th",
    "thead",
    "tr",
    "ul"
  ]);

  function isVisible(element) {
    if (!(element instanceof Element)) {
      return true;
    }

    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
      return false;
    }

    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function classText(element) {
    return typeof element.className === "string" ? element.className : element.getAttribute("class") || "";
  }

  function isInsideChrome(element) {
    return Boolean(element.closest("nav, aside, form, #ace-exporter-panel, #ace-exporter-launcher"));
  }

  function getConversationRoot() {
    if (["chatgpt", "gemini", "grok"].includes(currentProviderId())) {
      return document.querySelector("main") || document.body;
    }

    return (
      document.querySelector("main [data-testid*='conversation' i]") ||
      document.querySelector("main [data-testid*='chat' i]") ||
      document.querySelector("main [class*='conversation' i]") ||
      document.querySelector("main [class*='chat' i]") ||
      document.querySelector("main [data-test-id*='conversation' i]") ||
      document.querySelector("main [data-test-id*='chat' i]") ||
      document.querySelector("main") ||
      document.body
    );
  }

  function currentProviderId() {
    return providers?.current?.()?.id || "";
  }

  function nodeText(element) {
    return utils.normalizeWhitespace(element.innerText || element.textContent || "");
  }

  function cleanNodeText(element) {
    const clone = cleanClone(element);
    return stripLeadingTranscriptMarker(utils.normalizeWhitespace(clone.innerText || clone.textContent || ""));
  }

  function isDateOnlyText(value) {
    return DATE_ONLY_PATTERN.test(utils.normalizeWhitespace(value));
  }

  function stripLeadingTranscriptMarker(value) {
    return utils.normalizeWhitespace(String(value ?? "").replace(MARKDOWN_TRANSCRIPT_MARKER_PATTERN, ""));
  }

  function isCandidate(element) {
    if (!(element instanceof Element) || isInsideChrome(element) || !isVisible(element)) {
      return false;
    }

    const text = nodeText(element);
    if (text.length < 2) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    return rect.width >= 120 || text.length >= 80;
  }

  function isProviderCandidate(element) {
    if (!(element instanceof Element) || isInsideChrome(element) || !isVisible(element)) {
      return false;
    }

    const text = cleanNodeText(element);
    if (text.length < 2 || isDateOnlyText(text)) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    return rect.width >= 24 && rect.height >= 12;
  }

  function removeNestedCandidates(nodes) {
    const set = new Set(nodes);
    return nodes.filter((node) => {
      let parent = node.parentElement;
      while (parent) {
        if (set.has(parent)) {
          return false;
        }
        parent = parent.parentElement;
      }
      return true;
    });
  }

  function removeAncestorCandidates(nodes) {
    const set = new Set(nodes);
    return nodes.filter((node) => !Array.from(set).some((other) => other !== node && node.contains(other)));
  }

  function collectCandidates(root) {
    for (const group of CANDIDATE_GROUPS) {
      const candidates = removeNestedCandidates(Array.from(root.querySelectorAll(group.selector)).filter(isCandidate));
      if (candidates.length >= group.min) {
        return candidates;
      }
    }

    const children = Array.from(root.children).filter(isCandidate);
    if (children.length >= 2) {
      return children;
    }

    return isCandidate(root) ? [root] : [];
  }

  function inferRole(element, index) {
    const roleAttributes = [
      element.getAttribute("data-message-author-role"),
      element.getAttribute("data-author"),
      element.getAttribute("data-role")
    ].join(" ").toLowerCase();
    const providerPattern = providers?.productPattern?.() || /\b(assistant|claude|model)\b/i;
    const signature = [
      element.getAttribute("data-testid"),
      element.getAttribute("data-test-id"),
      element.getAttribute("aria-label"),
      classText(element),
      element.querySelector("[data-testid*='role' i]")?.textContent,
      element.querySelector("[aria-label*='Claude' i]")?.getAttribute("aria-label"),
      element.querySelector("[aria-label*='ChatGPT' i]")?.getAttribute("aria-label"),
      element.querySelector("[aria-label*='Gemini' i]")?.getAttribute("aria-label"),
      element.querySelector("[aria-label*='Grok' i]")?.getAttribute("aria-label"),
      element.querySelector("[aria-label*='assistant' i]")?.getAttribute("aria-label"),
      element.querySelector("[aria-label*='user' i]")?.getAttribute("aria-label"),
      element.querySelector("[data-message-author-role='user']") ? "user" : "",
      element.querySelector("[data-message-author-role='assistant']") ? "assistant" : "",
      element.querySelector("user-query") ? "user" : "",
      element.querySelector("model-response") ? "assistant" : ""
    ].join(" ").toLowerCase();

    if (/\b(user|human)\b/.test(roleAttributes) || /\b(font-user-message|user-message|user-query|query-content|query-text|query-container|you said|human-message)\b/.test(signature)) {
      return "user";
    }

    if (/\b(assistant|model|bot)\b/.test(roleAttributes) || /\b(font-claude-message|assistant-message|model-response|message-content|response-content|bot-message|markdown|prose)\b/.test(signature) || providerPattern.test(signature)) {
      return "assistant";
    }

    return index % 2 === 0 ? "user" : "assistant";
  }

  function cleanClone(element) {
    const clone = element.cloneNode(true);
    clone.querySelectorAll(REMOVE_SELECTORS.join(",")).forEach((node) => node.remove());
    clone.querySelectorAll("[hidden]").forEach((node) => node.remove());
    clone.querySelectorAll("[aria-hidden='true']").forEach((node) => {
      if (!isMathElement(node) && !node.closest("math, .katex, .MathJax, [class*='math' i]")) {
        node.remove();
      }
    });
    stripLeadingTranscriptMarkerFromClone(clone);
    return clone;
  }

  function stripLeadingTranscriptMarkerFromClone(clone) {
    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();

    while (node && !node.nodeValue.trim()) {
      node = walker.nextNode();
    }

    if (!node) {
      return;
    }

    node.nodeValue = node.nodeValue.replace(TRANSCRIPT_MARKER_PATTERN, "");
  }

  function isMathElement(element) {
    if (!(element instanceof Element)) {
      return false;
    }

    const tag = element.tagName.toLowerCase();
    const signature = [
      element.tagName,
      classText(element),
      element.getAttribute("data-tex"),
      element.getAttribute("data-latex"),
      element.getAttribute("aria-label")
    ].join(" ").toLowerCase();

    return (
      MATH_TAGS.has(tag) ||
      /\b(math|katex|mathjax|tex|latex)\b/.test(signature) ||
      Boolean(element.getAttribute("data-tex") || element.getAttribute("data-latex")) ||
      (tag === "span" && Boolean(element.querySelector(":scope > math, :scope > .katex-mathml, :scope > annotation[encoding*='tex' i]")))
    );
  }

  function isBlockMath(element) {
    return Boolean(element.closest(".katex-display, [class*='math-display' i], [class*='block-math' i]"));
  }

  function mathText(element) {
    const annotation = element.matches("annotation[encoding*='tex' i]")
      ? element
      : element.querySelector("annotation[encoding*='tex' i]");
    const value = (
      annotation?.textContent ||
      element.getAttribute("data-tex") ||
      element.getAttribute("data-latex") ||
      element.getAttribute("aria-label") ||
      (element.tagName.toLowerCase() === "math" ? element.textContent : "")
    );

    return utils.normalizeWhitespace(value || "");
  }

  function serializeMathNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return utils.escapeHtml(node.textContent);
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const element = node;
    const tag = element.tagName.toLowerCase();
    const children = Array.from(element.childNodes).map(serializeMathNode).join("");

    if (!MATH_TAGS.has(tag)) {
      return children;
    }

    const attrs = [];
    if (tag === "math") {
      const display = element.getAttribute("display");
      if (display === "block" || display === "inline") {
        attrs.push(`display="${display}"`);
      }
    }

    if (tag === "annotation") {
      const encoding = element.getAttribute("encoding");
      if (encoding && /^[\w/+.-]+$/i.test(encoding)) {
        attrs.push(`encoding="${utils.escapeHtml(encoding)}"`);
      }
    }

    return `<${tag}${attrs.length ? ` ${attrs.join(" ")}` : ""}>${children}</${tag}>`;
  }

  function mathHtml(element) {
    const math = element.matches("math") ? element : element.querySelector("math");
    if (math) {
      return serializeMathNode(math);
    }

    const formula = mathText(element);
    return formula ? utils.escapeHtml(formula) : "";
  }

  function safeHref(value) {
    if (!value) {
      return "";
    }

    try {
      const url = new URL(value, window.location.href);
      if (["http:", "https:", "mailto:"].includes(url.protocol)) {
        return url.href;
      }
    } catch (error) {
      return "";
    }

    return "";
  }

  function serializeAllowedAttributes(element) {
    const tag = element.tagName.toLowerCase();
    const attrs = [];

    if (tag === "a") {
      const href = safeHref(element.getAttribute("href"));
      if (href) {
        attrs.push(`href="${utils.escapeHtml(href)}"`);
      }
    }

    if (["td", "th"].includes(tag)) {
      for (const attrName of ["colspan", "rowspan"]) {
        const value = element.getAttribute(attrName);
        if (/^\d+$/.test(value || "")) {
          attrs.push(`${attrName}="${value}"`);
        }
      }
    }

    if (tag === "code" || tag === "pre") {
      const languageClass = Array.from(element.classList).find((item) => /^language-[\w-]+$/.test(item));
      const language = utils.normalizeCodeLanguage(languageClass) ||
        (tag === "pre" || element.closest("pre") ? utils.detectCodeLanguage(element.textContent) : "");
      if (language) {
        attrs.push(`class="language-${utils.escapeHtml(language)}"`);
      }
    }

    if (isMathElement(element)) {
      const mathClass = isBlockMath(element) ? "ace-math-block" : "ace-math-inline";
      attrs.push(`class="${mathClass}"`);
    }

    return attrs.length ? ` ${attrs.join(" ")}` : "";
  }

  function serializeSanitizedNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return utils.escapeHtml(node.textContent);
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const element = node;
    const tag = element.tagName.toLowerCase();

    if (isMathElement(element) && tag !== "semantics" && tag !== "annotation") {
      const renderedMath = mathHtml(element);
      if (renderedMath) {
        return isBlockMath(element)
          ? `<div class="ace-math-block">${renderedMath}</div>`
          : `<span class="ace-math-inline">${renderedMath}</span>`;
      }
    }

    if (tag === "img") {
      const alt = element.getAttribute("alt") || "image";
      return `<figure class="ace-export-omitted-media"><figcaption>[${utils.escapeHtml(alt)} omitted]</figcaption></figure>`;
    }

    const children = Array.from(element.childNodes).map(serializeSanitizedNode).join("");

    if (!ALLOWED_TAGS.has(tag)) {
      return children;
    }

    if (tag === "br" || tag === "hr") {
      return `<${tag}>`;
    }

    return `<${tag}${serializeAllowedAttributes(element)}>${children}</${tag}>`;
  }

  function sanitizedHtml(element) {
    const clone = cleanClone(element);
    return Array.from(clone.childNodes).map(serializeSanitizedNode).join("").trim();
  }

  function languageFromCodeBlock(element) {
    const code = element.matches("code") ? element : element.querySelector("code");
    const languageClass = code ? Array.from(code.classList).find((item) => /^language-[\w-]+$/.test(item)) : "";
    return utils.normalizeCodeLanguage(languageClass) || utils.detectCodeLanguage(element.textContent);
  }

  function markdownText(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }

  function markdownChildren(element) {
    return Array.from(element.childNodes).map(markdownFromNode).join("");
  }

  function markdownInline(element) {
    return markdownChildren(element).replace(/\s+/g, " ").trim();
  }

  function tableToMarkdown(table) {
    const rows = Array.from(table.querySelectorAll("tr")).map((row) => {
      return Array.from(row.querySelectorAll("th,td")).map((cell) => {
        return markdownText(cell.textContent).replace(/\|/g, "\\|");
      });
    }).filter((row) => row.length > 0);

    if (!rows.length) {
      return "";
    }

    const width = Math.max(...rows.map((row) => row.length));
    const normalize = (row) => Array.from({ length: width }, (_, index) => row[index] || "");
    const header = normalize(rows[0]);
    const body = rows.slice(1).map(normalize);
    const separator = header.map(() => "---");

    return [
      `| ${header.join(" | ")} |`,
      `| ${separator.join(" | ")} |`,
      ...body.map((row) => `| ${row.join(" | ")} |`)
    ].join("\n") + "\n\n";
  }

  function markdownFromNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const element = node;
    const tag = element.tagName.toLowerCase();
    const children = () => markdownChildren(element);
    const text = () => markdownText(element.textContent);

    if (isMathElement(element)) {
      const formula = mathText(element);
      if (formula) {
        return isBlockMath(element) ? `$$\n${formula}\n$$\n\n` : `$${formula}$`;
      }
    }

    if (tag === "pre") {
      const language = languageFromCodeBlock(element);
      const code = (element.textContent || "").replace(/\n+$/g, "");
      return `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    }

    if (tag === "code") {
      return `\`${(element.textContent || "").replace(/`/g, "\\`")}\``;
    }

    if (/^h[1-6]$/.test(tag)) {
      const level = Number(tag.slice(1));
      return `${"#".repeat(level)} ${text()}\n\n`;
    }

    if (tag === "p") {
      const content = markdownInline(element);
      return content ? `${content}\n\n` : "";
    }

    if (tag === "br") {
      return "\n";
    }

    if (tag === "hr") {
      return "\n---\n\n";
    }

    if (tag === "blockquote") {
      return children()
        .trim()
        .split("\n")
        .map((line) => `> ${line}`.trimEnd())
        .join("\n") + "\n\n";
    }

    if (tag === "ul" || tag === "ol") {
      const ordered = tag === "ol";
      return Array.from(element.children)
        .filter((child) => child.tagName?.toLowerCase() === "li")
        .map((child, index) => {
          const prefix = ordered ? `${index + 1}. ` : "- ";
          return prefix + markdownInline(child).replace(/\n/g, "\n  ");
        })
        .join("\n") + "\n\n";
    }

    if (tag === "table") {
      return tableToMarkdown(element);
    }

    if (tag === "a") {
      const label = markdownInline(element) || element.getAttribute("href") || "";
      const href = safeHref(element.getAttribute("href"));
      return href && href !== label ? `[${label}](${href})` : label;
    }

    if (["strong", "b"].includes(tag)) {
      return `**${markdownInline(element)}**`;
    }

    if (["em", "i"].includes(tag)) {
      return `_${markdownInline(element)}_`;
    }

    if (["div", "section", "article", "details", "summary", "figure", "figcaption"].includes(tag)) {
      const content = children().trim();
      return content ? `${content}\n\n` : "";
    }

    return children();
  }

  function htmlToMarkdown(element) {
    const clone = cleanClone(element);
    return stripLeadingTranscriptMarker(stripKnownFooter(utils.normalizeWhitespace(markdownFromNode(clone).replace(/\n{3,}/g, "\n\n"))));
  }

  function stripKnownFooter(value) {
    return utils.normalizeWhitespace(String(value ?? "").replace(AI_FOOTER_PATTERN, ""));
  }

  function messageId(role, text, index) {
    let hash = 0;
    const input = `${role}:${index}:${text.slice(0, 250)}`;
    for (let i = 0; i < input.length; i += 1) {
      hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
    }
    return `message-${index}-${Math.abs(hash)}`;
  }

  function extractMessage(element, index, roleOverride = "") {
    const role = roleOverride || inferRole(element, index);
    const text = cleanNodeText(element);
    const markdown = htmlToMarkdown(element) || text;

    const message = {
      id: messageId(role, text, index),
      index,
      role,
      text,
      markdown,
      html: sanitizedHtml(element),
      preview: text.slice(0, 180)
    };

    Object.defineProperty(message, "element", {
      configurable: true,
      enumerable: false,
      value: element
    });

    return message;
  }

  function contentRole(element) {
    if (element.matches(USER_CONTENT_SELECTOR) || element.closest(USER_CONTENT_SELECTOR)) {
      return "user";
    }

    if (element.matches(ASSISTANT_CONTENT_SELECTOR) || element.closest(ASSISTANT_CONTENT_SELECTOR)) {
      return "assistant";
    }

    return "";
  }

  function collectContentEntries(root) {
    const candidates = removeNestedCandidates(Array.from(root.querySelectorAll(ROLE_CONTENT_SELECTOR))
      .filter((element) => isCandidate(element) && !isDateOnlyText(cleanNodeText(element))));

    return candidates.map((element) => ({
      element,
      role: contentRole(element) || inferRole(element, 0),
      source: "content"
    }));
  }

  function collectProviderEntries(root) {
    const selectors = PROVIDER_MESSAGE_SELECTOR_GROUPS[currentProviderId()] || [PROVIDER_MESSAGE_SELECTORS[currentProviderId()]];
    if (!selectors[0]) {
      return [];
    }

    let candidates = [];
    for (const selector of selectors) {
      candidates = removeNestedCandidates(Array.from(root.querySelectorAll(selector))
        .filter(isProviderCandidate));

      if (candidates.length > 1) {
        break;
      }
    }

    return candidates.map((element, index) => {
      const role = contentRole(element) || inferRole(element, index);
      return {
        element: bestContentElement(element, role) || element,
        role,
        source: "provider"
      };
    });
  }

  function hasUserBubbleHint(element) {
    const signature = [
      element.getAttribute("data-testid"),
      element.getAttribute("data-test-id"),
      element.getAttribute("data-message-author-role"),
      element.getAttribute("data-author"),
      element.getAttribute("data-role"),
      element.getAttribute("aria-label"),
      classText(element)
    ].join(" ").toLowerCase();

    return /\b(font-user-message|user-message|human-message|user-query|self-end|items-end|justify-end|ml-auto|text-right)\b/.test(signature);
  }

  function isLikelyUserBubble(element, root) {
    if (!(element instanceof Element) || isInsideChrome(element) || !isVisible(element)) {
      return false;
    }

    if (element.closest(ASSISTANT_CONTENT_SELECTOR) || element.matches(ASSISTANT_CONTENT_SELECTOR) || element.querySelector(ACTION_GROUP_SELECTOR)) {
      return false;
    }

    const text = cleanNodeText(element);
    if (text.length < 2 || text.length > 1200 || isDateOnlyText(text)) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    if (rect.width < 24 || rect.height < 18 || rect.width > Math.max(720, rootRect.width * 0.9)) {
      return false;
    }

    const rightHalf = rect.left > rootRect.left + (rootRect.width * 0.35);
    return hasUserBubbleHint(element) || (rightHalf && text.length <= 600 && !element.querySelector("pre, table, ol, ul"));
  }

  function collectUserBubbleEntries(root) {
    const candidates = removeAncestorCandidates(Array.from(root.querySelectorAll(USER_BUBBLE_HINT_SELECTOR))
      .filter((element) => isLikelyUserBubble(element, root)));

    return candidates.map((element) => ({
      element,
      role: "user",
      source: "user-bubble"
    }));
  }

  function hasAssistantFeedback(group) {
    return Boolean(group.querySelector(ASSISTANT_FEEDBACK_SELECTOR));
  }

  function actionGroupContainer(root, group) {
    let current = group.parentElement;
    let fallback = null;

    while (current && current !== root.parentElement && current !== document.documentElement) {
      if (!current.contains(root) && !root.contains(current)) {
        break;
      }

      const actionCount = current.querySelectorAll(ACTION_GROUP_SELECTOR).length;
      const text = cleanNodeText(current);

      if (text.length > 1 && current !== root) {
        if (actionCount === 1) {
          return current;
        }

        fallback = fallback || current;
      }

      current = current.parentElement;
    }

    return fallback;
  }

  function bestContentElement(container, role) {
    const selector = role === "assistant" ? ASSISTANT_CONTENT_SELECTOR : USER_CONTENT_SELECTOR;
    const candidates = Array.from(container.querySelectorAll(selector))
      .filter((element) => isCandidate(element) && !isDateOnlyText(cleanNodeText(element)))
      .sort((left, right) => cleanNodeText(right).length - cleanNodeText(left).length);

    return candidates[0] || null;
  }

  function collectActionGroupEntries(root) {
    const groups = Array.from(root.querySelectorAll(ACTION_GROUP_SELECTOR));
    const seen = new Set();
    const entries = [];

    for (const group of groups) {
      const container = actionGroupContainer(root, group);
      if (!container || seen.has(container)) {
        continue;
      }

      seen.add(container);
      const role = hasAssistantFeedback(group) ? "assistant" : "user";
      const element = bestContentElement(container, role) || container;
      const text = cleanNodeText(element);

      if (text.length > 0 && !isDateOnlyText(text)) {
        entries.push({
          element,
          role,
          source: "actions"
        });
      }
    }

    return entries;
  }

  function sameText(left, right) {
    const normalize = (value) => utils.normalizeWhitespace(value).toLowerCase();
    const a = normalize(cleanNodeText(left.element));
    const b = normalize(cleanNodeText(right.element));

    if (!a || !b) {
      return false;
    }

    return a === b || a.includes(b) || b.includes(a);
  }

  function mergeEntries(contentEntries, ...extraEntryGroups) {
    const entries = [...contentEntries];

    for (const actionEntry of extraEntryGroups.flat()) {
      const duplicate = entries.some((entry) => (
        entry.element === actionEntry.element ||
        entry.element.contains(actionEntry.element) ||
        actionEntry.element.contains(entry.element) ||
        sameText(entry, actionEntry)
      ));

      if (!duplicate) {
        entries.push(actionEntry);
      }
    }

    return entries.sort((left, right) => {
      if (left.element === right.element) {
        return 0;
      }

      const position = left.element.compareDocumentPosition(right.element);
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
        return -1;
      }

      if (position & Node.DOCUMENT_POSITION_PRECEDING) {
        return 1;
      }

      return 0;
    });
  }

  function collectMessagesByNativeStructure(root) {
    const entries = mergeEntries(collectContentEntries(root), collectProviderEntries(root), collectActionGroupEntries(root), collectUserBubbleEntries(root));

    return entries
      .map((entry, index) => extractMessage(entry.element, index, entry.role))
      .filter((message) => message.text.length > 0 && !isDateOnlyText(message.text));
  }

  function roleFromTranscriptMarker(value) {
    return /^(you|user|human)\s+said/i.test(value) ? "user" : "assistant";
  }

  function transcriptMarkerElements(root) {
    const selector = "h1,h2,h3,h4,h5,h6,[role='heading']";
    return Array.from(root.querySelectorAll(selector))
      .filter((element) => isVisible(element) && TRANSCRIPT_MARKER_PATTERN.test(nodeText(element)));
  }

  function stripTranscriptMarker(container) {
    const marker = Array.from(container.querySelectorAll("h1,h2,h3,h4,h5,h6,[role='heading']"))
      .find((element) => TRANSCRIPT_MARKER_PATTERN.test(nodeText(element)));

    if (!marker) {
      return;
    }

    const remainder = nodeText(marker).replace(TRANSCRIPT_MARKER_PATTERN, "").trim();
    if (!remainder) {
      marker.remove();
      return;
    }

    const paragraph = document.createElement("p");
    paragraph.textContent = remainder;
    marker.replaceWith(paragraph);
  }

  function segmentContainerFromRange(root, marker, nextMarker) {
    const range = document.createRange();
    range.setStartBefore(marker);

    if (nextMarker) {
      range.setEndBefore(nextMarker);
    } else if (root.lastChild) {
      range.setEndAfter(root.lastChild);
    } else {
      range.setEndAfter(marker);
    }

    const container = document.createElement("article");
    container.append(range.cloneContents());
    stripTranscriptMarker(container);
    return container;
  }

  function splitTranscriptByHeadings(root) {
    const markers = transcriptMarkerElements(root);
    if (!markers.length) {
      return [];
    }

    return markers
      .map((marker, index) => {
        const container = segmentContainerFromRange(root, marker, markers[index + 1]);
        const role = roleFromTranscriptMarker(nodeText(marker));
        const text = cleanNodeText(container);
        const markdown = htmlToMarkdown(container) || text;

        return {
          id: messageId(role, text, index),
          index,
          role,
          text,
          markdown,
          html: sanitizedHtml(container),
          preview: text.slice(0, 180)
        };
      })
      .filter((message) => message.text.length > 0);
  }

  function splitTranscriptByMarkdown(root) {
    const markdown = htmlToMarkdown(root);
    const markerPattern = new RegExp(`(?:^|\\n)#{1,6}\\s*(${[
      "You said",
      "User said",
      "Human said",
      "Claude responded",
      "Claude said",
      "ChatGPT responded",
      "ChatGPT said",
      "Gemini responded",
      "Gemini said",
      "Grok responded",
      "Grok said",
      "Assistant responded",
      "Assistant said"
    ].join("|")})\\s*:\\s*`, "gi");
    const markers = [];
    let match;

    while ((match = markerPattern.exec(markdown))) {
      markers.push({
        index: match.index,
        marker: match[1],
        contentStart: markerPattern.lastIndex
      });
    }

    if (!markers.length) {
      return [];
    }

    return markers.map((marker, index) => {
      const next = markers[index + 1];
      const role = roleFromTranscriptMarker(marker.marker);
      const segmentMarkdown = stripKnownFooter(markdown.slice(marker.contentStart, next ? next.index : markdown.length));
      const text = stripKnownFooter(segmentMarkdown
        .replace(/```[\s\S]*?```/g, (block) => block.replace(/```[^\n]*\n?|\n?```/g, " "))
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[#>*_`|-]/g, " "));

      return {
        id: messageId(role, text, index),
        index,
        role,
        text,
        markdown: segmentMarkdown,
        html: `<pre>${utils.escapeHtml(segmentMarkdown)}</pre>`,
        preview: text.slice(0, 180)
      };
    }).filter((message) => message.text.length > 0);
  }

  function looksLikePageShell(messages) {
    if (messages.length !== 1) {
      return false;
    }

    const text = messages[0].text;
    return (
      /New chat|All chats|Projects|Artifacts|Explore|Recent|History/i.test(text) &&
      /You said|Claude responded|ChatGPT said|Gemini said|Grok said|Assistant responded/i.test(text)
    ) || (
      text.length > 2000 &&
      /New chat|History|Settings|Upgrade|Private Chat|Sign in|Log in/i.test(text)
    );
  }

  function isUsableMessage(message) {
    const text = utils.normalizeWhitespace(message.text);
    if (!text || isDateOnlyText(text)) {
      return false;
    }

    if (text.length > 5000 && /New chat|Recent|History|Explore|Settings|Upgrade|Sign in|Log in/i.test(text)) {
      return false;
    }

    if (/^(new chat|search chats|library|settings|upgrade|sign in|log in|try again|regenerate)$/i.test(text)) {
      return false;
    }

    return true;
  }

  function providerFallbackMessages(root) {
    const entries = collectProviderEntries(root);
    return entries
      .map((entry, index) => extractMessage(entry.element, index, entry.role))
      .filter(isUsableMessage);
  }

  function scrape() {
    const root = getConversationRoot();
    let messages = collectMessagesByNativeStructure(root);

    if (!messages.length) {
      const candidates = collectCandidates(root);
      messages = candidates
        .map((candidate, index) => extractMessage(candidate, index))
        .filter(isUsableMessage);
    }

    if (!messages.length || looksLikePageShell(messages)) {
      const providerMessages = providerFallbackMessages(root);
      if (providerMessages.length > messages.length || looksLikePageShell(messages)) {
        messages = providerMessages;
      }
    }

    if (!messages.length || looksLikePageShell(messages)) {
      const splitMessages = splitTranscriptByHeadings(root);
      if (splitMessages.length > messages.length || looksLikePageShell(messages)) {
        messages = splitMessages;
      }
    }

    if (!messages.length || looksLikePageShell(messages)) {
      const splitMessages = splitTranscriptByMarkdown(root);
      if (splitMessages.length > messages.length || looksLikePageShell(messages)) {
        messages = splitMessages;
      }
    }

    return {
      messages: messages.filter(isUsableMessage),
      title: utils.defaultConversationTitle(),
      url: window.location.href,
      provider: providers?.current?.() || null,
      scrapedAt: new Date().toISOString()
    };
  }

  globalScope.ACEChatScraper = {
    scrape
  };

  globalScope.ACEClaudeScraper = {
    scrape
  };
})(globalThis);
