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

// página PT → { chave no en.json, URL PT, ficheiro EN de saída }
const PAGES = [
  { src: "index.html", key: "index", ptPath: "/", out: "en.html" },
  { src: "servicos.html", key: "servicos", ptPath: "/servicos", out: "en/servicos.html" },
  { src: "casos.html", key: "casos", ptPath: "/casos", out: "en/casos.html" },
  { src: "como-trabalhamos.html", key: "como-trabalhamos", ptPath: "/como-trabalhamos", out: "en/como-trabalhamos.html" },
  { src: "sobre.html", key: "sobre", ptPath: "/sobre", out: "en/sobre.html" },
  { src: "contactos.html", key: "contactos", ptPath: "/contactos", out: "en/contactos.html" },
];

const INTERNAL_PATHS = ["servicos", "casos", "como-trabalhamos", "sobre", "contactos"];

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
  // Sem JS, o botão de língua numa página EN deve ler-se como "voltar a PT".
  ['aria-label="View in English">EN</button>', 'aria-label="Ver em português">PT</button>'],
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
  const enUrl = SITE + (page.ptPath === "/" ? "/en" : "/en" + page.ptPath);

  html = translateMarkup(html, page.key);
  html = html.replace('<html lang="pt-PT">', '<html lang="en">');

  // canonical + og:url → URL EN; hreflang logo a seguir ao canonical
  html = html.replace(
    '<link rel="canonical" href="' + ptUrl + '">',
    '<link rel="canonical" href="' + enUrl + '">\n' + hreflangBlock(ptUrl, enUrl)
  );
  html = html.replace(
    '<meta property="og:url" content="' + ptUrl + '">',
    '<meta property="og:url" content="' + enUrl + '">'
  );
  html = html.replace('<meta property="og:locale" content="pt_PT">', '<meta property="og:locale" content="en_US">');

  for (const [from, to] of LITERAL_MAP) html = html.split(from).join(to);
  if (page.key === "como-trabalhamos") html = rebuildFaqSchema(html);

  // links internos → /en/...
  html = html.replace(new RegExp('href="/(' + INTERNAL_PATHS.join("|") + ')([#"])', "g"), 'href="/en/$1$2');
  html = html.replace(/href="\/"/g, 'href="/en"');
  html = html.replace('"urls":["/contactos","/servicos"]', '"urls":["/en/contactos","/en/servicos"]');

  const outPath = path.join(ROOT, page.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html);
  console.log("✓ " + page.out);
}

// hreflang nas páginas PT: verifica (não injeta — as páginas PT são fonte,
// editadas à mão) e avisa se faltar, para o par não ficar coxo.
function checkPtHreflang() {
  for (const page of PAGES) {
    const html = fs.readFileSync(path.join(ROOT, page.src), "utf8");
    if (!html.includes('hreflang="en"')) {
      console.warn("⚠ falta hreflang em " + page.src);
    }
  }
}

PAGES.forEach(buildPage);
checkPtHreflang();
console.log("Páginas EN geradas em public/en*(.html)");
