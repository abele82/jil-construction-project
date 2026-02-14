const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, "data");
const INQUIRIES_FILE = path.join(DATA_DIR, "inquiries.json");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
};

const pageRoutes = new Map([
  ["/", "index.html"],
  ["/index.html", "index.html"],
  ["/landing", "landing.html"],
  ["/landing.html", "landing.html"],
  ["/about", "about.html"],
  ["/about.html", "about.html"],
  ["/services", "services.html"],
  ["/services.html", "services.html"],
  ["/projects", "projects.html"],
  ["/projects.html", "projects.html"],
  ["/contact", "contact.html"],
  ["/contact.html", "contact.html"],
]);

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": MIME_TYPES[".json"] });
  res.end(JSON.stringify(payload));
}

function readInquiries() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(INQUIRIES_FILE)) {
      fs.writeFileSync(INQUIRIES_FILE, "[]", "utf8");
      return [];
    }
    const content = fs.readFileSync(INQUIRIES_FILE, "utf8");
    return JSON.parse(content || "[]");
  } catch (_error) {
    return [];
  }
}

function saveInquiry(data) {
  const existing = readInquiries();
  existing.push(data);
  fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(existing, null, 2), "utf8");
}

function serveStaticFile(reqPath, res) {
  let requestedPath = reqPath;
  if (pageRoutes.has(reqPath)) {
    requestedPath = `/${pageRoutes.get(reqPath)}`;
  }

  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT_DIR, safePath);

  if (!filePath.startsWith(ROOT_DIR)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        sendJson(res, 404, { error: "Not Found" });
        return;
      }
      sendJson(res, 500, { error: "Server Error" });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
}

function handleContactPost(req, res) {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > 1e6) {
      req.socket.destroy();
    }
  });

  req.on("end", () => {
    try {
      const payload = JSON.parse(body || "{}");
      const name = String(payload.name || "").trim();
      const email = String(payload.email || "").trim();
      const project = String(payload.project || "").trim();
      const message = String(payload.message || "").trim();

      if (!name || !email || !project || !message) {
        sendJson(res, 400, { error: "All fields are required." });
        return;
      }

      const inquiry = {
        id: Date.now(),
        name,
        email,
        project,
        message,
        receivedAt: new Date().toISOString(),
      };

      saveInquiry(inquiry);
      sendJson(res, 200, { message: "Inquiry received." });
    } catch (_error) {
      sendJson(res, 400, { error: "Invalid JSON payload." });
    }
  });
}

const server = http.createServer((req, res) => {
  const reqPath = req.url.split("?")[0];

  if (req.method === "GET" && reqPath === "/health") {
    sendJson(res, 200, { status: "ok" });
    return;
  }

  if (req.method === "POST" && reqPath === "/api/contact") {
    handleContactPost(req, res);
    return;
  }

  if (req.method === "GET") {
    serveStaticFile(reqPath, res);
    return;
  }

  sendJson(res, 405, { error: "Method not allowed." });
});

server.listen(PORT, () => {
  console.log(`JIL Construction site running at http://localhost:${PORT}`);
});
