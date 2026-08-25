// Alternador de língua PT/EN. O inglês vive em páginas estáticas próprias
// (/en, /en/services, ...) geradas por build-en.js — indexáveis pelo Google —
// por isso o link é um <a href> real, presente no HTML devolvido pelo
// servidor (não escrito por JavaScript), para ser descoberto por crawlers
// que não executam JS (GPTBot, ClaudeBot, PerplexityBot, ...). O href, o
// texto e o aria-label já vêm corretos do HTML/build; este script só trata
// do que precisa mesmo de estado do browser.
// A preferência fica em localStorage: quem escolheu EN e volta a entrar por
// um URL PT é reencaminhado para o equivalente /en (crawlers não têm
// localStorage, por isso nunca são redirecionados).
(function () {
  var STORAGE_KEY = "mjm-lang";
  var p = window.location.pathname;
  var isEN = p === "/en" || p.indexOf("/en/") === 0;

  // Os slugs EN estão em inglês, por isso a troca de idioma é uma tradução de
  // slug e não um simples cortar/colar do prefixo "/en". Tem de espelhar
  // EN_SLUGS em build-en.js (e LEGACY_EN_REDIRECTS em server.js).
  var EN_SLUGS = {
    servicos: "services",
    casos: "cases",
    "como-trabalhamos": "how-we-work",
    sobre: "about",
    contactos: "contact",
  };
  var PT_SLUGS = {};
  for (var ptSlug in EN_SLUGS) PT_SLUGS[EN_SLUGS[ptSlug]] = ptSlug;

  function otherPath() {
    var hash = window.location.hash;
    if (isEN) {
      if (p === "/en") return "/" + hash;
      var enSlug = p.slice(4);
      return "/" + (PT_SLUGS[enSlug] || enSlug) + hash;
    }
    if (p === "/") return "/en" + hash;
    var ptSlugNow = p.slice(1);
    return "/en/" + (EN_SLUGS[ptSlugNow] || ptSlugNow) + hash;
  }

  var stored = null;
  try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}

  if (!isEN && stored === "en") {
    window.location.replace(otherPath());
    return;
  }
  if (isEN) {
    try { localStorage.setItem(STORAGE_KEY, "en"); } catch (e) {}
  }

  // O link já navega sozinho (é um <a href> normal); só resta gravar a
  // escolha para a próxima visita, sem interferir na navegação nativa.
  document.addEventListener("DOMContentLoaded", function () {
    var link = document.getElementById("lang-toggle");
    if (!link) return;
    link.addEventListener("click", function () {
      try { localStorage.setItem(STORAGE_KEY, isEN ? "pt" : "en"); } catch (e) {}
    });
  });
})();
