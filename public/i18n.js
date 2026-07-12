// Alternador de língua PT/EN. O inglês vive em páginas estáticas próprias
// (/en, /en/servicos, ...) geradas por build-en.js — indexáveis pelo Google —
// por isso o botão navega entre URLs em vez de traduzir no cliente.
// A preferência fica em localStorage: quem escolheu EN e volta a entrar por
// um URL PT é reencaminhado para o equivalente /en (crawlers não têm
// localStorage, por isso nunca são redirecionados).
(function () {
  var STORAGE_KEY = "mjm-lang";
  var p = window.location.pathname;
  var isEN = p === "/en" || p.indexOf("/en/") === 0;

  function otherPath() {
    if (isEN) {
      var stripped = p === "/en" ? "/" : p.slice(3);
      return stripped + window.location.hash;
    }
    return (p === "/" ? "/en" : "/en" + p) + window.location.hash;
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

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("lang-toggle");
    if (!btn) return;
    btn.textContent = isEN ? "PT" : "EN";
    btn.setAttribute("aria-label", isEN ? "Ver em português" : "View in English");
    btn.addEventListener("click", function () {
      try { localStorage.setItem(STORAGE_KEY, isEN ? "pt" : "en"); } catch (e) {}
      window.location.href = otherPath();
    });
  });
})();
