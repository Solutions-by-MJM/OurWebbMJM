// Banner de consentimento de cookies + carregamento condicional do Google
// Analytics 4 (RGPD).
//
// Abordagem "hard block": o gtag.js NÃO é carregado enquanto o visitante não
// aceitar explicitamente. Sem decisão → nenhum script, nenhum cookie, nenhum
// pedido à Google. Isto mantém o site sem rasto por omissão, alinhado com as
// promessas de RGPD do resto do site.
//
// A decisão fica guardada em localStorage["mjm-consent"] = "granted" | "denied"
// e pode ser alterada a qualquer momento pelo link "Cookies" no rodapé.
(function () {
  "use strict";

  // ─── CONFIGURAÇÃO ───────────────────────────────────────────────────────
  // Substituir pelo Measurement ID real da propriedade GA4 (formato G-XXXXXXXXXX).
  // Enquanto for o valor de exemplo abaixo, o banner funciona mas o GA4 não é
  // carregado (evita pedidos a um ID inexistente).
  var GA4_ID = "G-6BF8W7SB2N";

  var CONSENT_KEY = "mjm-consent";
  var LANG_KEY = "mjm-lang";

  function ga4Configured() {
    return /^G-[A-Z0-9]{6,}$/.test(GA4_ID) && GA4_ID !== "G-XXXXXXXXXX";
  }

  // ─── TEXTOS (PT por omissão, EN quando o site está em inglês) ────────────
  var STRINGS = {
    pt: {
      msg: "Usamos analítica para perceber como o site é usado. Só a ativamos com o seu consentimento.",
      accept: "Aceitar",
      reject: "Rejeitar",
      more: "Saber mais",
      reopen: "Cookies",
      aria: "Consentimento de cookies",
    },
    en: {
      msg: "We use analytics to understand how the site is used. We only enable it with your consent.",
      accept: "Accept",
      reject: "Reject",
      more: "Learn more",
      reopen: "Cookies",
      aria: "Cookie consent",
    },
  };

  function currentLang() {
    // O idioma vem do próprio documento: as páginas /en/... são estáticas
    // com lang="en", por isso funciona mesmo sem localStorage (ex. modo
    // privado) e no primeiro acesso direto a um URL inglês vindo do Google.
    return document.documentElement.lang === "en" ? "en" : "pt";
  }
  function t() {
    return STRINGS[currentLang()];
  }

  // ─── GOOGLE ANALYTICS 4 (só depois do consentimento) ─────────────────────
  function loadGA4() {
    if (window.__ga4Loaded) return;
    window.__ga4Loaded = true;
    if (!ga4Configured()) {
      // ID ainda por preencher — não faz sentido pedir o script.
      console.info("[consent] GA4 autorizado, mas GA4_ID ainda é o valor de exemplo em consent.js.");
      return;
    }
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    // anonymize_ip: reduz os dados pessoais recolhidos (boa prática RGPD).
    window.gtag("config", GA4_ID, { anonymize_ip: true });
  }

  // ─── ESTILOS (injetados; style-src permite inline) ───────────────────────
  function injectStyles() {
    if (document.getElementById("mjm-consent-styles")) return;
    var css =
      "#mjm-consent{position:fixed;left:clamp(16px,4vw,32px);bottom:clamp(16px,4vw,32px);z-index:2147483000;" +
      "max-width:400px;background:#20211A;color:#F4F2EF;border:1px solid #33352F;" +
      "padding:22px 22px 20px;box-shadow:0 8px 40px rgba(0,0,0,.45);" +
      "font-family:'Public Sans',system-ui,sans-serif;font-size:14px;line-height:1.55;" +
      "transform:translateY(8px);opacity:0;transition:opacity .25s ease,transform .25s ease}" +
      "#mjm-consent.show{transform:translateY(0);opacity:1}" +
      "#mjm-consent p{margin:0 0 16px;color:#CFCBC4}" +
      "#mjm-consent a.more{color:#D98A4E;text-decoration:underline;text-underline-offset:2px}" +
      "#mjm-consent .row{display:flex;gap:10px;flex-wrap:wrap}" +
      "#mjm-consent button{font:inherit;font-weight:600;cursor:pointer;border:1px solid #33352F;" +
      "padding:10px 20px;background:transparent;color:#F4F2EF;transition:background .15s,border-color .15s}" +
      "#mjm-consent button:hover{border-color:#8A857B}" +
      "#mjm-consent button.accept{background:#B26530;border-color:#B26530;color:#F4F2EF}" +
      "#mjm-consent button.accept:hover{background:#D98A4E;border-color:#D98A4E}" +
      "#mjm-consent button:focus-visible{outline:2px solid #D98A4E;outline-offset:2px}" +
      ".mjm-consent-reopen{cursor:pointer;background:none;border:none;padding:0;font:inherit;" +
      "color:inherit;text-decoration:underline;text-underline-offset:2px}" +
      "@media(prefers-reduced-motion:reduce){#mjm-consent{transition:none}}";
    var style = document.createElement("style");
    style.id = "mjm-consent-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ─── BANNER ──────────────────────────────────────────────────────────────
  var bannerEl = null;

  function decide(value) {
    localStorage.setItem(CONSENT_KEY, value);
    if (value === "granted") loadGA4();
    hideBanner();
  }

  function renderBanner() {
    var s = t();
    if (!bannerEl) {
      bannerEl = document.createElement("div");
      bannerEl.id = "mjm-consent";
      bannerEl.setAttribute("role", "dialog");
      bannerEl.setAttribute("aria-live", "polite");
      document.body.appendChild(bannerEl);
    }
    bannerEl.setAttribute("aria-label", s.aria);
    bannerEl.innerHTML =
      '<p>' + s.msg + ' <a class="more" href="/como-trabalhamos#garantias">' + s.more + "</a></p>" +
      '<div class="row">' +
      '<button type="button" class="accept">' + s.accept + "</button>" +
      '<button type="button" class="reject">' + s.reject + "</button>" +
      "</div>";
    bannerEl.querySelector(".accept").addEventListener("click", function () { decide("granted"); });
    bannerEl.querySelector(".reject").addEventListener("click", function () { decide("denied"); });
  }

  function showBanner() {
    injectStyles();
    renderBanner();
    // força reflow antes de animar a entrada
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { bannerEl.classList.add("show"); });
    });
  }

  function hideBanner() {
    if (!bannerEl) return;
    bannerEl.classList.remove("show");
    var el = bannerEl;
    setTimeout(function () { if (el && el.parentNode) el.parentNode.removeChild(el); bannerEl = null; }, 260);
  }

  // Link de reabertura no rodapé (permite retirar/alterar o consentimento).
  function injectReopenLink() {
    var fine = document.querySelector(".footer-fine");
    if (!fine || fine.querySelector(".mjm-consent-reopen")) return;
    // Os estilos vivem em injectStyles(), que de outro modo só corria ao abrir
    // o banner. Sem isto, quem já decidiu (banner não abre no arranque) via o
    // botão "Cookies" sem estilo até o clicar uma vez. Idempotente.
    injectStyles();
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mjm-consent-reopen";
    btn.textContent = t().reopen;
    btn.addEventListener("click", function () {
      // Reabrir o banner permite mudar de ideias; a decisão anterior deixa de
      // valer até nova escolha.
      localStorage.removeItem(CONSENT_KEY);
      showBanner();
    });
    fine.appendChild(btn);
  }

  // Re-renderiza os textos quando o visitante troca de língua no toggle.
  function watchLangToggle() {
    var toggle = document.getElementById("lang-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", function () {
      // O i18n.js troca a língua no mesmo clique; adiamos para ler o novo estado.
      setTimeout(function () {
        if (bannerEl) renderBanner();
        var reopen = document.querySelector(".mjm-consent-reopen");
        if (reopen) reopen.textContent = t().reopen;
      }, 0);
    });
  }

  // ─── ARRANQUE ─────────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", function () {
    injectReopenLink();
    watchLangToggle();
    var decision = localStorage.getItem(CONSENT_KEY);
    if (decision === "granted") {
      loadGA4();
    } else if (decision === "denied") {
      // respeitar a recusa — não fazer nada
    } else {
      showBanner();
    }
  });
})();
