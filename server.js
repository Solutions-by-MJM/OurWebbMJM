// Servidor estático mínimo, sem dependências. Serve a pasta /public.
// O Railway injeta a porta em process.env.PORT.
const http = require("http");
const fs = require("fs");
const path = require("path");

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
  const ip = req.socket.remoteAddress || "unknown";
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

  if (!name || !email || !email.includes("@") || !notes) {
    return sendJson(res, 400, { error: "Preencha todos os campos obrigatórios." });
  }

  // Todos os campos vêm do visitante — nunca inserir sem escapar no HTML do email.
  const emailHtml = `
    <h2>Nova mensagem de ${escapeHtml(name)}</h2>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    ${company ? `<p><strong>Empresa:</strong> ${escapeHtml(company)}</p>` : ""}
    <p><strong>Mensagem:</strong></p>
    <p>${escapeHtml(notes).replace(/\n/g, "<br>")}</p>
  `;

  const result = await sendEmail(CONTACT_EMAIL, `Nova mensagem de ${name}`, emailHtml);
  if (!result.ok) {
    return sendJson(res, 502, { error: "Não foi possível enviar a mensagem." });
  }
  sendJson(res, 200, { ok: true });
}

// Content-Security-Policy: permite Google Fonts (folha + ficheiros de fonte),
// estilos inline (usados em atributos style e SVGs) e o pequeno script do
// formulário de contactos. 'unsafe-inline' é necessário por causa desses inlines.
const CSP = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "script-src 'self'",
  "img-src 'self' data:",
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
};

const server = http.createServer((req, res) => {
  // Headers de segurança em todas as respostas.
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);

  const [rawPath] = req.url.split("?");
  const urlPath = decodeURIComponent(rawPath);

  // API de contacto (formulário de contacto simples).
  if (urlPath === "/api/contact" && req.method === "POST") {
    return handleContactForm(req, res);
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
    // HTML/CSS/JS mudam com frequência: forçar revalidação para não servir versões em cache.
    if (ext === ".html" || ext === ".css" || ext === ".js") {
      headers["Cache-Control"] = "no-cache";
    } else {
      headers["Cache-Control"] = "public, max-age=86400";
    }
    res.writeHead(200, headers);
    fs.createReadStream(file).pipe(res);
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
