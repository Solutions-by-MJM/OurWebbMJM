// Servidor estático mínimo, sem dependências. Serve a pasta /public.
// O Railway injeta a porta em process.env.PORT.
const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.join(__dirname, "public");
const PORT = process.env.PORT || 3000;

// Carrega .env manualmente (sem dependências). Nunca sobrepõe variáveis já
// definidas no ambiente (Railway define as suas diretamente).
(function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
})();

// ===== Email (para formulário de contacto) =====
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const CONTACT_EMAIL = "geral@solutionsbymjm.pt";

// Atrás do proxy do Railway, req.socket.remoteAddress é o IP do proxy (igual
// para todos os visitantes), o que tornaria o rate limit global. O IP real do
// cliente é acrescentado pelo proxy ao fim do X-Forwarded-For; usamos a última
// entrada (a que o proxy de confiança adicionou) para não ser falsificável por
// um X-Forwarded-For enviado pelo cliente. Sem proxy, cai no remoteAddress.
function clientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.trim()) {
    const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return req.socket.remoteAddress || "unknown";
}

// Limitador simples em memória (por IP), para não abrir a porta a spam de
// mensagens. Não sobrevive a reinícios do processo — suficiente aqui.
const rateBuckets = new Map();
function rateLimited(ip, key, max, windowMs) {
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  const bucket = rateBuckets.get(bucketKey) || [];
  const recent = bucket.filter((t) => now - t < windowMs);
  recent.push(now);
  rateBuckets.set(bucketKey, recent);
  return recent.length > max;
}

// Limpa periodicamente os buckets sem atividade recente. Sem isto, o Map
// cresce sem limite ao longo da vida do processo (um IP que passa uma vez
// fica lá para sempre).
const RATE_BUCKET_MAX_AGE = 60 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of rateBuckets) {
    const recent = timestamps.filter((t) => now - t < RATE_BUCKET_MAX_AGE);
    if (recent.length === 0) rateBuckets.delete(key);
    else rateBuckets.set(key, recent);
  }
}, 30 * 60 * 1000).unref();

function readJsonBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {});
      } catch (e) {
        reject(new Error("invalid json"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(json);
}

const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

async function sendEmail(to, subject, html) {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY não configurada — email não foi enviado");
    return { ok: true };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "MJM Solutions <noreply@solutionsbymjm.pt>",
      to,
      subject,
      html,
    }),
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, data };
}

async function handleContactForm(req, res) {
  const ip = clientIp(req);
  if (rateLimited(ip, "contact", 5, 60 * 60 * 1000)) {
    return sendJson(res, 429, { error: "Demasiados pedidos. Tente de novo mais tarde." });
  }

  let body;
  try {
    body = await readJsonBody(req, 10 * 1024);
  } catch (e) {
    return sendJson(res, 400, { error: "Pedido inválido." });
  }

  // Honeypot: campo escondido via CSS que só bots preenchem. Devolve sucesso
  // "falso" para não lhes dar sinal de que foram apanhados.
  if (typeof body.website === "string" && body.website.trim()) {
    return sendJson(res, 200, { ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : "";
  const email = typeof body.email === "string" ? body.email.trim().slice(0, 200) : "";
  const company = typeof body.company === "string" ? body.company.trim().slice(0, 200) : "";
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 2000) : "";

  if (!name || name.length < 2 || !email || !notes) {
    return sendJson(res, 400, { error: "Preencha todos os campos obrigatórios." });
  }
  // Validação de email a sério (algo@dominio.tld), não apenas "tem um @".
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendJson(res, 400, { error: "Indique um endereço de email válido." });
  }
  if (notes.length < 10) {
    return sendJson(res, 400, { error: "Descreva o problema com um pouco mais de detalhe." });
  }

  // Todos os campos vêm do visitante — nunca inserir sem escapar no HTML do email.
  const emailHtml = `
    <h2>Nova mensagem de ${escapeHtml(name)}</h2>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    ${company ? `<p><strong>Empresa:</strong> ${escapeHtml(company)}</p>` : ""}
    <p><strong>Mensagem:</strong></p>
    <p>${escapeHtml(notes).replace(/\n/g, "<br>")}</p>
  `;

  // O assunto vai como campo JSON para a API da Resend (não construímos headers
  // SMTP à mão), por isso não há injeção de headers aqui. Ainda assim, removemos
  // quebras de linha do nome por defesa em profundidade, caso o envio mude.
  const subject = `Nova mensagem de ${name}`.replace(/[\r\n]/g, " ");
  const result = await sendEmail(CONTACT_EMAIL, subject, emailHtml);
  if (!result.ok) {
    return sendJson(res, 502, { error: "Não foi possível enviar a mensagem." });
  }
  sendJson(res, 200, { ok: true });
}

// Content-Security-Policy: fontes agora auto-alojadas (same-origin), por isso
// já não é preciso permitir os domínios do Google Fonts. 'unsafe-inline' em
// style-src continua a ser necessário por causa dos atributos style inline e SVGs.
//
// Google Analytics 4: o script gtag.js só é carregado depois de o visitante
// aceitar no banner de consentimento (ver consent.js), mas os domínios têm de
// estar sempre autorizados na CSP para que esse carregamento seja possível.
// Autorizá-los aqui não provoca qualquer ligação por si só — só o consentimento
// injeta o script. Wildcards seguindo a recomendação da Google (os subdomínios
// exatos podem mudar).
const CSP = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "script-src 'self' 'inline-speculation-rules' https://*.googletagmanager.com",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
  "img-src 'self' data: https://*.google-analytics.com https://*.googletagmanager.com",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "form-action 'self' mailto:",
].join("; ");

const SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), camera=(), microphone=(), interest-cohort=()",
  "Content-Security-Policy": CSP,
};

// A apresentação corporativa é um ficheiro autónomo (bundle exportado) que se
// desempacota via um script inline e ficheiros blob/data: — precisa de uma
// CSP mais permissiva do que o resto do site, que não corre scripts inline.
const PRESENTATION_PATHS = new Set(["/apresentacao", "/apresentacao.html"]);
const PRESENTATION_CSP = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "script-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
].join("; ");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".pdf": "application/pdf",
};

// Tipos baseados em texto que vale a pena comprimir on-the-fly.
const COMPRESSIBLE = new Set([".html", ".css", ".js", ".json", ".svg", ".xml", ".txt"]);

const server = http.createServer((req, res) => {
  // Headers de segurança em todas as respostas.
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);

  const [rawPath] = req.url.split("?");
  const urlPath = decodeURIComponent(rawPath);

  if (PRESENTATION_PATHS.has(urlPath)) {
    res.setHeader("Content-Security-Policy", PRESENTATION_CSP);
  }

  // API de contacto (formulário de contacto simples).
  if (urlPath === "/api/contact" && req.method === "POST") {
    return handleContactForm(req, res);
  }

  // SEO: um URL limpo com barra final (ex. /servicos/) é uma variante do
  // mesmo conteúdo de /servicos — sem este redirect ficava um 404 em vez de
  // resolver, o que parte qualquer link ou partilha que inclua essa barra.
  // 301 para a versão canónica (sem barra) em vez de servir os dois URLs.
  if (urlPath !== "/" && urlPath.endsWith("/")) {
    const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    res.writeHead(301, { Location: urlPath.slice(0, -1) + query });
    return res.end();
  }

  // Normaliza o caminho e impede path traversal.
  let filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  if (urlPath.endsWith("/")) filePath = path.join(filePath, "index.html");

  function serve(file) {
    const ext = path.extname(file).toLowerCase();
    const headers = { "Content-Type": MIME[ext] || "application/octet-stream" };

    // Cache-Control:
    //  - Recursos versionados por query (?v=) e fontes têm nomes estáveis → cache
    //    longo e imutável (uma mudança traz um URL novo / ficheiro novo).
    //  - HTML e CSS/JS sem versão revalidam sempre, para publicar mudanças de imediato.
    //  - Imagens e outros estáticos: cache moderado.
    const hasVersion = /[?&]v=/.test(req.url);
    if (hasVersion || ext === ".woff2") {
      headers["Cache-Control"] = "public, max-age=31536000, immutable";
    } else if (ext === ".html" || ext === ".css" || ext === ".js") {
      headers["Cache-Control"] = "no-cache";
    } else {
      headers["Cache-Control"] = "public, max-age=604800";
    }

    // O conteúdo visível é sempre servido em PT (o toggle EN corre no
    // cliente, depois do carregamento) — declarar isto ajuda a desambiguar
    // o idioma para motores de busca, alinhado com <html lang="pt-PT">.
    if (ext === ".html") {
      headers["Content-Language"] = "pt-PT";
    }

    // Abrir no browser em vez de forçar download.
    if (ext === ".pdf") {
      headers["Content-Disposition"] = "inline";
      // É um material de vendas para partilha direta, não uma página feita
      // para ranquear — evita que excertos de slides apareçam nos resultados
      // de pesquisa a competir com as páginas reais do site.
      headers["X-Robots-Tag"] = "noindex";
    }

    // Compressão para tipos de texto (o resto — imagens, fontes, PDF — já vem
    // comprimido). Escolhe brotli se o cliente o aceitar, senão gzip.
    const accept = req.headers["accept-encoding"] || "";
    let encoder = null;
    if (COMPRESSIBLE.has(ext)) {
      if (/\bbr\b/.test(accept)) { headers["Content-Encoding"] = "br"; encoder = zlib.createBrotliCompress(); }
      else if (/\bgzip\b/.test(accept)) { headers["Content-Encoding"] = "gzip"; encoder = zlib.createGzip(); }
      if (encoder) headers["Vary"] = "Accept-Encoding";
    }

    res.writeHead(200, headers);
    const readStream = fs.createReadStream(file);
    if (encoder) readStream.pipe(encoder).pipe(res);
    else readStream.pipe(res);
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) return serve(filePath);
    // URL limpo: /servicos → servicos.html
    const htmlPath = filePath + ".html";
    fs.stat(htmlPath, (e2, s2) => {
      if (!e2 && s2.isFile()) return serve(htmlPath);
      // 404 → serve 404.html se existir, senão texto simples.
      const notFound = path.join(ROOT, "404.html");
      fs.readFile(notFound, (e3, data) => {
        if (e3) {
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          return res.end("404 — Página não encontrada");
        }
        res.writeHead(404, { "Content-Type": MIME[".html"] });
        res.end(data);
      });
    });
  });
});

server.listen(PORT, () => {
  console.log(`MJM Solutions a correr em http://0.0.0.0:${PORT}`);
});
