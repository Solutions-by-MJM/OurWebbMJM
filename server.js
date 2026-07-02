// Servidor estático mínimo, sem dependências. Serve a pasta /public.
// O Railway injeta a porta em process.env.PORT.
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "public");
const PORT = process.env.PORT || 3000;

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
  // Normaliza o caminho e impede path traversal.
  const urlPath = decodeURIComponent(req.url.split("?")[0]);
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
