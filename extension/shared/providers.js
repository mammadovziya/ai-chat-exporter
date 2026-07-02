(function attachAiChatExporterProviders(globalScope) {
  "use strict";

  const PROVIDERS = [
    {
      id: "claude",
      name: "Claude",
      assistantLabel: "Claude",
      shortLabel: "Claude",
      filenamePrefix: "claude-chat",
      hosts: ["claude.ai"],
      nativeAnchorLabels: ["share"],
      productWords: ["claude", "anthropic"],
      transcriptMarkers: ["Claude responded", "Claude said"]
    },
    {
      id: "chatgpt",
      name: "ChatGPT",
      assistantLabel: "ChatGPT",
      shortLabel: "GPT",
      filenamePrefix: "chatgpt-chat",
      hosts: ["chatgpt.com", "chat.openai.com"],
      nativeAnchorLabels: ["share", "share chat", "share conversation"],
      productWords: ["chatgpt", "openai"],
      transcriptMarkers: ["ChatGPT said", "ChatGPT responded"]
    },
    {
      id: "gemini",
      name: "Gemini",
      assistantLabel: "Gemini",
      shortLabel: "Gemini",
      filenamePrefix: "gemini-chat",
      hosts: ["gemini.google.com"],
      nativeAnchorLabels: ["upgrade", "share and export", "share & export", "share"],
      productWords: ["gemini", "google"],
      transcriptMarkers: ["Gemini said", "Gemini responded"]
    },
    {
      id: "grok",
      name: "Grok",
      assistantLabel: "Grok",
      shortLabel: "Grok",
      filenamePrefix: "grok-chat",
      hosts: ["grok.com"],
      nativeAnchorLabels: ["share", "share chat", "share conversation", "share this chat", "copy link"],
      productWords: ["grok", "xai", "x.ai"],
      transcriptMarkers: ["Grok said", "Grok responded"]
    }
  ];

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function hostMatches(hostname, host) {
    return hostname === host || hostname.endsWith(`.${host}`);
  }

  function providerForHostname(hostname = globalScope.location?.hostname || "") {
    const normalized = String(hostname).toLowerCase();
    return PROVIDERS.find((provider) => provider.hosts.some((host) => hostMatches(normalized, host))) || null;
  }

  function current() {
    return providerForHostname();
  }

  function isSupportedUrl(url) {
    try {
      return Boolean(providerForHostname(new URL(url).hostname));
    } catch (error) {
      return false;
    }
  }

  function allHosts() {
    return PROVIDERS.flatMap((provider) => provider.hosts);
  }

  function productPattern() {
    return new RegExp(`\\b(${PROVIDERS.flatMap((provider) => provider.productWords).map(escapeRegExp).join("|")}|assistant|model)\\b`, "i");
  }

  function transcriptMarkerPattern(prefix = "") {
    const markers = [
      "You said",
      "User said",
      "Human said",
      "Assistant said",
      "Assistant responded",
      ...PROVIDERS.flatMap((provider) => provider.transcriptMarkers)
    ].map(escapeRegExp);

    return new RegExp(`${prefix}(${markers.join("|")})\\s*:\\s*`, "i");
  }

  function removeTitleBrand(value) {
    const provider = current();
    const names = provider ? [provider.name, ...provider.productWords] : PROVIDERS.flatMap((item) => [item.name, ...item.productWords]);
    const escaped = names.map(escapeRegExp).join("|");
    return String(value ?? "")
      .replace(new RegExp(`\\s*(-|\\|)\\s*(${escaped})\\s*$`, "i"), "")
      .trim();
  }

  globalScope.ACEProviders = {
    PROVIDERS,
    allHosts,
    current,
    isSupportedUrl,
    productPattern,
    providerForHostname,
    removeTitleBrand,
    transcriptMarkerPattern
  };
})(globalThis);
