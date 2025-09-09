import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== CONFIG ====================
const NODE_API = "https://expressbackend-aeyt.onrender.com";
const JAVA_API = "https://spring-api-u4ro.onrender.com";

// ==================== Middleware log ====================
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ==================== Helper: proxy request ====================
async function proxyJson(targetUrl, req) {
  // copy headers từ client, loại bỏ host/content-length
  const headers = { ...req.headers };
  delete headers.host;
  delete headers['content-length'];
  delete headers['accept-encoding']; // tránh lỗi decompression

  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
  });

  // forward headers, loại bỏ content-encoding
  const respHeaders = {};
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'content-encoding') respHeaders[key] = value;
  });

  // đọc body an toàn
  let data = null;
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text(); // luôn đọc text trước

  if (text) {
    if (contentType.includes('application/json')) {
      try {
        data = JSON.parse(text);
      } catch (err) {
        // fallback nếu JSON lỗi
        data = text;
      }
    } else {
      // không phải JSON, giữ nguyên text
      data = text;
    }
  } 
  // nếu text rỗng, data = null

  return { status: response.status, headers: respHeaders, data };
}


// ==================== Forward Node backend ====================
app.use(['/api/news', '/api/hospital', '/api/data'], async (req, res) => {
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

// ==================== Default route ====================
app.get("/", (req, res) => {
  res.json({ message: "API Gateway is running 🚀" });
});

// ==================== Start ====================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Gateway running on http://localhost:${PORT}`);
});

// ===================== Keep Alive =====================
const NODE_API_PING = "https://expressbackend-aeyt.onrender.com/ping";
const JAVA_API_PING = "https://spring-api-u4ro.onrender.com/api/auth/ping";
const GATEWAY_API = "https://gateway-2v7j.onrender.com";

setInterval(async () => {
  try {
    await fetch(NODE_API_PING).catch(() => {});
    await fetch(JAVA_API_PING).catch(() => {});
    await fetch(GATEWAY_API).catch(() => {});
    console.log("🔄 Keep-alive ping executed");
  } catch (err) {
    console.error("❌ Keep-alive error:", err.message);
  }
}, 1000 * 60 * 5);
