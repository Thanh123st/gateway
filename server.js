import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import { startKeepAlive } from "./keepAlive.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== CONFIG ====================
const NODE_API = "https://expressbackend-80zz.onrender.com";
const JAVA_API = "https://javabackend-s160.onrender.com";

// ==================== Middleware log ====================
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ==================== Helper: proxy request ====================
async function proxyJson(targetUrl, req) {
  const headers = { ...req.headers };
  delete headers.host;
  delete headers["content-length"];
  delete headers["accept-encoding"];

  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: ["GET", "HEAD"].includes(req.method)
      ? undefined
      : JSON.stringify(req.body),
  });

  const respHeaders = {};
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "content-encoding") respHeaders[key] = value;
  });

  let data = null;
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (text) {
    if (contentType.includes("application/json")) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    } else {
      data = text;
    }
  }

  return { status: response.status, headers: respHeaders, data };
}

// ==================== Forward Node backend ====================
app.use(["/api/news", "/api/hospital", "/api/data","/api/category"], async (req, res) => {
  try {
    const result = await proxyJson(`${NODE_API}${req.originalUrl}`, req);
    res.status(result.status).set(result.headers).json(result.data);
  } catch (err) {
    console.error("❌ Node proxy error:", err.message);
    res.status(500).json({ error: "Node proxy failed" });
  }
});

// ==================== Forward Java backend ====================
app.use(async (req, res) => {
  try {
    const result = await proxyJson(`${JAVA_API}${req.originalUrl}`, req);
    res.status(result.status).set(result.headers).json(result.data);
  } catch (err) {
    console.error("❌ Java proxy error:", err.message);
    res.status(500).json({ error: "Java proxy failed" });
  }
});

// ==================== Ping route (for KeepAlive or monitoring) ====================
app.get("/ping", (req, res) => {
  res.json({
    message: "✅ Gateway is alive",
    timestamp: new Date().toISOString(),
    uptime: process.uptime().toFixed(2) + "s",
  });
});

// ==================== Start ====================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Gateway running on http://localhost:${PORT}`);
});

// ==================== Import & Start Keep Alive ====================
const KEEP_ALIVE_TARGETS = {
  NodeAPI: "https://expressbackend-80zz.onrender.com/ping",
  JavaAPI: "https://javabackend-s160.onrender.com/api/auth/ping",
  Gateway: "https://gateway-2v7j.onrender.com/ping",
};

startKeepAlive(KEEP_ALIVE_TARGETS);
