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

// ===== Cal.com (marcação do diagnóstico) =====
const CAL_API_KEY = process.env.CAL_API_KEY || "";
const CAL_EVENT_TYPE_ID = Number(process.env.CAL_EVENT_TYPE_ID || 6209959);
const CAL_API_BASE = "https://api.cal.com/v2";

async function calFetch(pathAndQuery, apiVersion, init) {
  const res = await fetch(CAL_API_BASE + pathAndQuery, {
    ...init,
    headers: {
      Authorization: `Bearer ${CAL_API_KEY}`,
      "cal-api-version": apiVersion,
      ...(init && init.headers),
    },
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

// Limitador simples em memória (por IP), para não abrir a porta a spam de
// marcações. Não sobrevive a reinícios do processo — suficiente aqui.
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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function handleGetSlots(req, res, query) {
  const ip = req.socket.remoteAddress || "unknown";
  if (rateLimited(ip, "slots", 60, 10 * 60 * 1000)) {
    return sendJson(res, 429, { error: "Demasiados pedidos. Tente de novo dentro de momentos." });
  }
  if (!CAL_API_KEY) return sendJson(res, 503, { error: "Agendamento indisponível de momento." });

  const start = query.get("start");
  const end = query.get("end");
  const timeZone = query.get("timeZone") || "Europe/Lisbon";
  if (!start || !end || !DATE_RE.test(start) || !DATE_RE.test(end)) {
    return sendJson(res, 400, { error: "Datas inválidas." });
  }
  // Limita a janela consultada a 21 dias, para não abrir a proxy a pedidos arbitrários.
  const spanDays = (new Date(end) - new Date(start)) / 86400000;
  if (!(spanDays >= 0 && spanDays <= 21)) {
    return sendJson(res, 400, { error: "Intervalo de datas inválido." });
  }

  const qs = new URLSearchParams({
    eventTypeId: String(CAL_EVENT_TYPE_ID),
    start,
    end,
    timeZone,
  });
  const result = await calFetch(`/slots?${qs}`, "2024-09-04", { method: "GET" });
  if (!result.ok) return sendJson(res, 502, { error: "Não foi possível obter horários." });
  sendJson(res, 200, result.data);
}

async function handleCreateBooking(req, res) {
  const ip = req.socket.remoteAddress || "unknown";
  if (rateLimited(ip, "book", 5, 30 * 60 * 1000)) {
    return sendJson(res, 429, { error: "Demasiados pedidos de marcação. Tente de novo mais tarde." });
  }
  if (!CAL_API_KEY) return sendJson(res, 503, { error: "Agendamento indisponível de momento." });

  let body;
  try {
    body = await readJsonBody(req, 10 * 1024);
  } catch (e) {
    return sendJson(res, 400, { error: "Pedido inválido." });
  }

  const start = typeof body.start === "string" ? body.start : "";
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : "";
  const email = typeof body.email === "string" ? body.email.trim().slice(0, 200) : "";
  const company = typeof body.company === "string" ? body.company.trim().slice(0, 200) : "";
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 2000) : "";
  const timeZone = typeof body.timeZone === "string" ? body.timeZone.slice(0, 100) : "Europe/Lisbon";

  if (!start || !name || !email || !email.includes("@") || !notes) {
    return sendJson(res, 400, { error: "Preencha todos os campos obrigatórios." });
  }

  const result = await calFetch("/bookings", "2024-08-13", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      start,
      eventTypeId: CAL_EVENT_TYPE_ID,
      attendee: { name, email, timeZone },
      bookingFieldsResponses: { title: company, notes },
    }),
  });

  if (!result.ok) {
    const msg =
      (result.data && result.data.error && result.data.error.message) ||
      "Não foi possível concluir a marcação. O horário pode já não estar disponível.";
    return sendJson(res, 409, { error: msg });
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

  const [rawPath, rawQuery] = req.url.split("?");
  const urlPath = decodeURIComponent(rawPath);
  const query = new URLSearchParams(rawQuery || "");

  // API de agendamento (proxy para o Cal.com — a chave nunca sai do servidor).
  if (urlPath === "/api/slots" && req.method === "GET") {
    return handleGetSlots(req, res, query);
  }
  if (urlPath === "/api/bookings" && req.method === "POST") {
    return handleCreateBooking(req, res);
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
