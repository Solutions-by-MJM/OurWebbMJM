// Gera as páginas estáticas em inglês (public/en.html + public/en/*.html) a
// partir do HTML português + public/i18n/en.json, para que o site EN seja
// indexável pelo Google (URLs próprios /en/... com hreflang), em vez de um
// toggle JS que os crawlers não veem.
//
// Correr sempre que o HTML PT ou o en.json mudarem:  npm run build:en
//
// O que faz por página:
//   1. aplica as traduções (data-i18n → innerHTML, data-i18n-attr → atributo)
//   2. lang="en", canonical/og:url → /en/..., og:locale → en_US, hreflang
//   3. traduz JSON-LD (breadcrumbs, serviços, FAQ regenerada do en.json)
//   4. reescreve links internos para /en/... (nav, footer, CTAs, speculationrules)

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "public");
const SITE = "https://solutionsbymjm.pt";
const translations = JSON.parse(fs.readFileSync(path.join(ROOT, "i18n", "en.json"), "utf8"));

// Slugs em inglês para as páginas EN. Um URL inglês (/en/services) descreve a
// página a quem pesquisa em inglês e reforça a relevância do termo; um slug
// português (/en/servicos) desperdiça esse sinal. Os URLs antigos continuam a
// funcionar via 301 no server.js — ver REDIRECTS lá.
const EN_SLUGS = {
  servicos: "services",
  casos: "cases",
  "como-trabalhamos": "how-we-work",
  sobre: "about",
  contactos: "contact",
};

// página PT → { chave no en.json, URL PT, URL EN, ficheiro EN de saída }
const PAGES = [
  { src: "index.html", key: "index", ptPath: "/", enPath: "/en", out: "en.html" },
  { src: "servicos.html", key: "servicos", ptPath: "/servicos", enPath: "/en/services", out: "en/services.html" },
  { src: "casos.html", key: "casos", ptPath: "/casos", enPath: "/en/cases", out: "en/cases.html" },
  { src: "como-trabalhamos.html", key: "como-trabalhamos", ptPath: "/como-trabalhamos", enPath: "/en/how-we-work", out: "en/how-we-work.html" },
  { src: "sobre.html", key: "sobre", ptPath: "/sobre", enPath: "/en/about", out: "en/about.html" },
  { src: "contactos.html", key: "contactos", ptPath: "/contactos", enPath: "/en/contact", out: "en/contact.html" },
  // Sub-páginas de /servicos — uma por serviço, extraídas do que era uma
  // única página com âncoras. Ver SERVICE_SUBSLUGS abaixo para o mapeamento
  // de slug PT → EN usado nos links internos e no JSON-LD.
  { src: "servicos/software-a-medida.html", key: "servicos-software", ptPath: "/servicos/software-a-medida", enPath: "/en/services/tailored-software", out: "en/services/tailored-software.html" },
  { src: "servicos/automacao-de-processos.html", key: "servicos-automacao", ptPath: "/servicos/automacao-de-processos", enPath: "/en/services/process-automation", out: "en/services/process-automation.html" },
  { src: "servicos/integracoes-de-sistemas.html", key: "servicos-integracoes", ptPath: "/servicos/integracoes-de-sistemas", enPath: "/en/services/systems-integration", out: "en/services/systems-integration.html" },
  { src: "servicos/ia-aplicada.html", key: "servicos-ia", ptPath: "/servicos/ia-aplicada", enPath: "/en/services/applied-ai", out: "en/services/applied-ai.html" },
];

const INTERNAL_PATHS = Object.keys(EN_SLUGS);

// Slugs PT → EN das 4 sub-páginas de /servicos. Precisam de um mapa próprio
// porque INTERNAL_PATHS/EN_SLUGS só sabem traduzir o slug de topo
// (/servicos → /en/services); um link como /servicos/software-a-medida tem
// um segundo segmento que também é português e tem de ser traduzido — ver
// os dois pontos de uso abaixo (rewriteJsonLdUrls e o rewrite de links
// internos em buildPage).
const SERVICE_SUBSLUGS = {
  "software-a-medida": "tailored-software",
  "automacao-de-processos": "process-automation",
  "integracoes-de-sistemas": "systems-integration",
  "ia-aplicada": "applied-ai",
};

// Strings PT fora do alcance do data-i18n (JSON-LD, aria, og:image:alt).
const LITERAL_MAP = [
  ['"Início"', '"Home"'],
  ['"name": "Serviços"', '"name": "Services"'],
  ['"name": "Casos"', '"name": "Cases"'],
  ['"name": "Como trabalhamos"', '"name": "How we work"'],
  ['"name": "Sobre"', '"name": "About"'],
  ['"name": "Contactos"', '"name": "Contact"'],
  ['"item": "https://solutionsbymjm.pt/"', '"item": "https://solutionsbymjm.pt/en"'],
  ['"url": "https://solutionsbymjm.pt/"', '"url": "https://solutionsbymjm.pt/en"'],
  ['"inLanguage": "pt-PT"', '"inLanguage": "en"'],
  [
    '"description": "Software à medida, automação e IA aplicada para PMEs de serviços em Portugal."',
    '"description": "Tailored software, automation and applied AI for service SMEs in Portugal."',
  ],
  ['"name": "Plataformas de raiz"', '"name": "Platforms built from scratch"'],
  [
    '"description": "Software à medida construído de raiz para o processo de cada negócio."',
    '"description": "Tailored software built from scratch around each business\'s process."',
  ],
  ['"name": "Menos trabalho manual"', '"name": "Less manual work"'],
  [
    '"description": "Automação de tarefas repetitivas e de processos administrativos."',
    '"description": "Automation of repetitive tasks and administrative processes."',
  ],
  ['"name": "Ligar o que já usa"', '"name": "Connecting what you already use"'],
  [
    '"description": "Integrações entre as ferramentas e sistemas que a empresa já utiliza."',
    '"description": "Integrations between the tools and systems the company already uses."',
  ],
  ['"name": "IA em tarefas reais"', '"name": "AI for real tasks"'],
  [
    '"description": "Inteligência artificial aplicada a tarefas concretas do dia a dia."',
    '"description": "Artificial intelligence applied to concrete day-to-day tasks."',
  ],
  [
    'content="MJM Solutions — software à medida, automação e IA aplicada"',
    'content="MJM Solutions — tailored software, automation and applied AI"',
  ],
  // Schema de /sobre (equipa) e /casos. As aspas fazem parte do padrão de
  // propósito: ancoram a substituição ao JSON-LD e evitam apanhar texto
  // visível — que a esta altura já foi traduzido pelo translateMarkup.
  ['"jobTitle": "Gestão & Finanças"', '"jobTitle": "Management & Finance"'],
  ['"jobTitle": "Engenharia & Produto"', '"jobTitle": "Engineering & Product"'],
  ['"jobTitle": "Engenharia"', '"jobTitle": "Engineering"'],
  ['"Gestão financeira"', '"Financial management"'],
  ['"Desenvolvimento de software"', '"Software development"'],
  ['"Integrações"', '"Integrations"'],
  ['"Gestão de produto"', '"Product management"'],
  ['"Automação"', '"Automation"'],
  ['"IA aplicada"', '"Applied AI"'],
  ['"Arquitetura técnica"', '"Technical architecture"'],
  ['"name": "Faturas e documentos que se tratam sozinhos"', '"name": "Invoices and documents that handle themselves"'],
  ['"name": "Triagem de mensagens em piloto automático"', '"name": "Message triage on autopilot"'],
  ['"name": "Respostas ao cliente a qualquer hora"', '"name": "Answers for customers, any time"'],
  ['"name": "Do desperdício à previsão"', '"name": "From waste to forecasting"'],
  ['"name": "A informação certa, sem a procurar"', '"name": "The right information, without the search"'],
  ['"name": "Reconciliação que se faz sozinha"', '"name": "Reconciliation that runs itself"'],
  ['aria-label="Abrir menu"', 'aria-label="Open menu"'],
  [
    'alt="Plataforma de raiz — diagrama de fluxo com inputs e outputs"',
    'alt="Platform built from scratch — flow diagram with inputs and outputs"',
  ],
  [
    'alt="Leitura automática de faturas por IA — extração de dados"',
    'alt="Automatic AI invoice reading — data extraction"',
  ],
  ['<label for="bk-website">Não preencher este campo</label>', '<label for="bk-website">Do not fill in this field</label>'],
  // Sem JS, o link de língua numa página EN deve ler-se como "voltar a PT".
  ['aria-label="View in English">EN</a>', 'aria-label="Ver em português">PT</a>'],
];

const VOID_TAGS = new Set(["meta", "img", "input", "link", "br", "hr", "source"]);

function lookup(pageKey, key) {
  const page = translations[pageKey] || {};
  if (page[key] !== undefined) return page[key];
  return (translations.shared || {})[key];
}

// Substitui conteúdos/atributos marcados com data-i18n sem parser de DOM:
// para cada marcador, localiza a tag de abertura e a de fecho correspondente
// (contando aninhamento da mesma tag) e injeta a tradução.
function translateMarkup(html, pageKey) {
  let out = "";
  let cursor = 0;
  const re = /data-i18n="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const key = m[1];
    const value = lookup(pageKey, key);
    if (value === undefined) continue;

    const tagStart = html.lastIndexOf("<", m.index);
    const tagEnd = html.indexOf(">", m.index);
    const openTag = html.slice(tagStart, tagEnd + 1);
    const tagName = /^<([a-zA-Z0-9]+)/.exec(openTag)[1].toLowerCase();
    const attrMatch = /data-i18n-attr="([^"]+)"/.exec(openTag);

    if (attrMatch) {
      const attr = attrMatch[1];
      const newTag = openTag.replace(new RegExp(attr + '="[^"]*"'), attr + '="' + value + '"');
      out += html.slice(cursor, tagStart) + newTag;
      cursor = tagEnd + 1;
      re.lastIndex = cursor;
      continue;
    }
    if (VOID_TAGS.has(tagName)) continue;

    // encontra o fecho correspondente, tolerando tags iguais aninhadas
    let depth = 1;
    let pos = tagEnd + 1;
    const openRe = new RegExp("<" + tagName + "(?=[\\s>])", "g");
    const closeStr = "</" + tagName + ">";
    while (depth > 0) {
      const nextClose = html.indexOf(closeStr, pos);
      if (nextClose === -1) throw new Error("Tag sem fecho: " + tagName + " (" + key + ")");
      openRe.lastIndex = pos;
      const nextOpen = openRe.exec(html);
      if (nextOpen && nextOpen.index < nextClose) {
        depth++;
        pos = nextOpen.index + 1;
      } else {
        depth--;
        pos = nextClose + closeStr.length;
        if (depth === 0) {
          out += html.slice(cursor, tagEnd + 1) + value + closeStr;
          cursor = pos;
          re.lastIndex = cursor;
        }
      }
    }
  }
  return out + html.slice(cursor);
}

function stripTags(s) {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/\s+\+\s*$/, "")
    .trim();
}

// Regenera o bloco FAQPage a partir das perguntas EN do en.json.
function rebuildFaqSchema(html) {
  const faq = translations["como-trabalhamos"];
  const entries = [];
  for (let i = 1; faq["faq.q" + i]; i++) {
    entries.push({
      "@type": "Question",
      name: stripTags(faq["faq.q" + i]),
      acceptedAnswer: { "@type": "Answer", text: stripTags(faq["faq.a" + i]) },
    });
  }
  const block = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: entries };
  // (?:(?!<\/script>)...) impede o match de atravessar blocos <script>
  // vizinhos — senão engolia o BreadcrumbList que vem antes da FAQ.
  return html.replace(
    /<script type="application\/ld\+json">(?:(?!<\/script>)[\s\S])*?"@type": "FAQPage"[\s\S]*?<\/script>/,
    '<script type="application/ld+json">\n' + JSON.stringify(block, null, 2) + "\n</script>"
  );
}

// Dentro dos blocos JSON-LD há URLs absolutos do próprio site (breadcrumbs,
// url de cada serviço, @id). Numa página EN esses URLs têm de apontar para a
// versão inglesa, senão o schema contradiz o canonical da própria página.
// Limitado aos blocos ld+json de propósito: aplicado ao documento inteiro
// partiria o href pt-PT do hreflang, que tem de continuar a apontar para PT.
function rewriteJsonLdUrls(html) {
  return html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (block, body) => {
    let out = body;
    // Sub-páginas de /servicos primeiro, com o URL completo (prefixo +
    // sub-slug) — se corresse depois do loop do EN_SLUGS abaixo, o prefixo
    // já estaria traduzido para /en/services e o padrão deixava de bater
    // certo, ficando o sub-slug PT esquecido (ex. /en/services/software-a-medida).
    for (const [pt, en] of Object.entries(SERVICE_SUBSLUGS)) {
      out = out.split(SITE + "/servicos/" + pt).join(SITE + "/en/services/" + en);
    }
    for (const [pt, en] of Object.entries(EN_SLUGS)) {
      out = out.split(SITE + "/" + pt).join(SITE + "/en/" + en);
    }
    out = out.split('"' + SITE + '/"').join('"' + SITE + '/en"');
    // Nota: os @id de entidade (ex. ".../#organization") ficam propositadamente
    // por reescrever — a empresa é a mesma entidade nas duas línguas e o @id
    // estável é o que permite ao Google reconciliá-la entre páginas.
    return '<script type="application/ld+json">' + out + "</script>";
  });
}

function hreflangBlock(ptUrl, enUrl) {
  return (
    '<link rel="alternate" hreflang="pt-PT" href="' + ptUrl + '">\n' +
    '<link rel="alternate" hreflang="en" href="' + enUrl + '">\n' +
    '<link rel="alternate" hreflang="x-default" href="' + ptUrl + '">'
  );
}

function buildPage(page) {
  let html = fs.readFileSync(path.join(ROOT, page.src), "utf8");
  const ptUrl = SITE + page.ptPath;
  const enUrl = SITE + page.enPath;

  html = translateMarkup(html, page.key);
  html = html.replace('<html lang="pt-PT">', '<html lang="en">');

  // A página PT já traz o seu próprio bloco hreflang. Sem o remover primeiro,
  // a página EN ficava com dois blocos (6 tags em vez de 3): sinais duplicados
  // que o Google pode simplesmente ignorar, deixando o par PT/EN sem ligação.
  html = html.replace(/[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*">\n?/g, "");
  // Mesmo problema no og:locale:alternate da página PT (que aponta para en_US):
  // na página EN o alternate correto é pt_PT, injetado mais abaixo.
  html = html.replace(/[ \t]*<meta property="og:locale:alternate" content="[^"]*">\n?/g, "");

  // canonical + og:url → URL EN; hreflang logo a seguir ao canonical
  html = html.replace(
    '<link rel="canonical" href="' + ptUrl + '">',
    '<link rel="canonical" href="' + enUrl + '">\n' + hreflangBlock(ptUrl, enUrl)
  );
  html = html.replace(
    '<meta property="og:url" content="' + ptUrl + '">',
    '<meta property="og:url" content="' + enUrl + '">'
  );
  // og:locale:alternate diz às redes sociais que existe uma versão no outro
  // idioma — o par recíproco do hreflang, no vocabulário do Open Graph.
  html = html.replace(
    '<meta property="og:locale" content="pt_PT">',
    '<meta property="og:locale" content="en_US">\n<meta property="og:locale:alternate" content="pt_PT">'
  );

  for (const [from, to] of LITERAL_MAP) html = html.split(from).join(to);
  html = rewriteJsonLdUrls(html);
  if (page.key === "como-trabalhamos") html = rebuildFaqSchema(html);

  // Sub-páginas de /servicos primeiro (mesma razão de ordem que em
  // rewriteJsonLdUrls): href="/servicos/software-a-medida" tem "/" a seguir
  // ao slug de topo, não "#" nem fecho de aspas — o padrão genérico logo
  // abaixo não o reconhece, por isso o sub-slug precisa do seu próprio passo.
  html = html.replace(
    new RegExp('href="/servicos/(' + Object.keys(SERVICE_SUBSLUGS).join("|") + ')([#"])', "g"),
    (m, sub, tail) => 'href="/en/services/' + SERVICE_SUBSLUGS[sub] + tail
  );

  // links internos → /en/<slug-inglês>
  html = html.replace(
    new RegExp('href="/(' + INTERNAL_PATHS.join("|") + ')([#"])', "g"),
    (m, slug, tail) => 'href="/en/' + EN_SLUGS[slug] + tail
  );
  html = html.replace(/href="\/"/g, 'href="/en"');
  html = html.replace('"urls":["/contactos","/servicos"]', '"urls":["/en/contact","/en/services"]');

  // O link de língua na página PT aponta para a versão EN (href real, para
  // crawlers sem JS o descobrirem — ver i18n.js). Na página EN gerada, o
  // mesmo link tem de apontar de volta para a PT — ao contrário de todos os
  // outros links internos acima, por isso corre depois e por si só, para não
  // ser reescrito outra vez por essas regras genéricas.
  html = html.replace(
    /(<a id="lang-toggle"[^>]*\bhref=")[^"]*(")/,
    '$1' + page.ptPath + '$2'
  );

  const outPath = path.join(ROOT, page.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html);
  console.log("✓ " + page.out);
}

// hreflang nas páginas PT: verifica (não injeta — as páginas PT são fonte,
// editadas à mão) e avisa se faltar ou apontar para o URL EN errado, para o
// par não ficar coxo. Um hreflang que não é recíproco é ignorado pelo Google.
function checkPtHreflang() {
  for (const page of PAGES) {
    const html = fs.readFileSync(path.join(ROOT, page.src), "utf8");
    const expected = '<link rel="alternate" hreflang="en" href="' + SITE + page.enPath + '">';
    if (!html.includes(expected)) {
      console.warn("⚠ " + page.src + ": falta ou está desatualizado o hreflang en → " + page.enPath);
    }
  }
}

// Slugs EN antigos (português). Ficheiros gerados por versões anteriores deste
// script continuariam a ser servidos e a competir com os novos como conteúdo
// duplicado — apagamos em vez de deixar apodrecer no disco.
function removeLegacyEnPages() {
  for (const slug of Object.keys(EN_SLUGS)) {
    const stale = path.join(ROOT, "en", slug + ".html");
    if (fs.existsSync(stale)) {
      fs.unlinkSync(stale);
      console.log("✗ removido (slug antigo): en/" + slug + ".html");
    }
  }
}

// Sitemap gerado a partir de PAGES, para não voltar a ficar desatualizado à
// mão. Inclui os alternates hreflang por URL (recomendação da Google para
// sites multilingues) e usa a data de modificação real do ficheiro-fonte.
// changefreq/priority ficam de fora: a Google ignora-os há anos.
function buildSitemap() {
  const entries = [];
  for (const page of PAGES) {
    const mtime = fs.statSync(path.join(ROOT, page.src)).mtime.toISOString().slice(0, 10);
    const ptUrl = SITE + page.ptPath;
    const enUrl = SITE + page.enPath;
    for (const loc of [ptUrl, enUrl]) {
      entries.push(
        "  <url>\n" +
          "    <loc>" + loc + "</loc>\n" +
          '    <xhtml:link rel="alternate" hreflang="pt-PT" href="' + ptUrl + '"/>\n' +
          '    <xhtml:link rel="alternate" hreflang="en" href="' + enUrl + '"/>\n' +
          '    <xhtml:link rel="alternate" hreflang="x-default" href="' + ptUrl + '"/>\n' +
          "    <lastmod>" + mtime + "</lastmod>\n" +
          "  </url>"
      );
    }
  }
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    entries.join("\n") +
    "\n</urlset>\n";
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), xml);
  console.log("✓ sitemap.xml (" + entries.length + " URLs)");
}

removeLegacyEnPages();
PAGES.forEach(buildPage);
buildSitemap();
checkPtHreflang();
console.log("Páginas EN geradas em public/en*(.html)");
