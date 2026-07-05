// Alternador de língua PT/EN. Traduções em /i18n/en.json, indexadas por
// página + chave "shared" para nav/footer. O português vive sempre no HTML;
// o original de cada elemento é guardado em memória antes de ser substituído,
// para poder ser restaurado sem duplicar o texto PT num ficheiro à parte.
(function () {
  var STORAGE_KEY = "mjm-lang";
  var JSON_URL = "/i18n/en.json";

  var PAGE_BY_PATH = {
    "/": "index",
    "/index.html": "index",
    "/servicos": "servicos",
    "/servicos.html": "servicos",
    "/casos": "casos",
    "/casos.html": "casos",
    "/como-trabalhamos": "como-trabalhamos",
    "/como-trabalhamos.html": "como-trabalhamos",
    "/sobre": "sobre",
    "/sobre.html": "sobre",
    "/contactos": "contactos",
    "/contactos.html": "contactos",
    "/404.html": "notfound",
  };
  // Uma resposta 404 mantém o URL originalmente pedido na barra de endereço
  // (não redireciona para /404.html), por isso o mapeamento por path não
  // chega a aplicar-se nesse caso — data-i18n-page no <html> tem prioridade.
  var pageOverride = document.documentElement.getAttribute("data-i18n-page");
  var pageKey = pageOverride || PAGE_BY_PATH[window.location.pathname] || "index";

  var translations = null;
  var originals = new WeakMap();

  function lookup(key) {
    if (!translations) return undefined;
    var page = translations[pageKey] || {};
    if (page[key] !== undefined) return page[key];
    var shared = translations.shared || {};
    return shared[key];
  }

  function loadTranslations() {
    if (translations) return Promise.resolve(translations);
    return fetch(JSON_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        translations = data;
        return data;
      });
  }

  function updateToggle(lang) {
    var btn = document.getElementById("lang-toggle");
    if (!btn) return;
    if (lang === "en") {
      btn.textContent = "PT";
      btn.setAttribute("aria-label", "Ver em português");
    } else {
      btn.textContent = "EN";
      btn.setAttribute("aria-label", "View in English");
    }
  }

  function applyLanguage(lang) {
    var elements = document.querySelectorAll("[data-i18n]");
    elements.forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var attr = el.getAttribute("data-i18n-attr");
      if (lang === "en") {
        var value = lookup(key);
        if (value === undefined) return;
        if (!originals.has(el)) {
          originals.set(el, attr ? el.getAttribute(attr) : el.innerHTML);
        }
        if (attr) el.setAttribute(attr, value);
        else el.innerHTML = value;
      } else if (originals.has(el)) {
        var orig = originals.get(el);
        if (attr) el.setAttribute(attr, orig);
        else el.innerHTML = orig;
      }
    });
    document.documentElement.setAttribute("lang", lang === "en" ? "en" : "pt-PT");
    updateToggle(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("lang-toggle");
    var stored = localStorage.getItem(STORAGE_KEY) || "pt";

    loadTranslations().then(function () {
      if (stored === "en") applyLanguage("en");
    });

    if (btn) {
      btn.addEventListener("click", function () {
        var current = document.documentElement.lang === "en" ? "en" : "pt";
        var next = current === "en" ? "pt" : "en";
        if (next === "en") {
          loadTranslations().then(function () { applyLanguage("en"); });
        } else {
          applyLanguage("pt");
        }
      });
    }
  });
})();
