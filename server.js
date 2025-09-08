import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import fetch from "node-fetch"; // nhớ cài: npm install node-fetch

const app = express();

// ===================== Middleware log =====================
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ===================== Proxy cho NodeJS =====================
app.use(
  ["/api/news", "/api/hospital"],
  createProxyMiddleware({
    target: "https://expressbackend-jvvv.onrender.com", // link NodeJS
    changeOrigin: true,
    pathRewrite: { "^/api": "/api" }
  })
);

// ===================== Proxy mặc định cho Java =====================
app.use(
  "/api",
  createProxyMiddleware({
    target: "https://spring-api-u4ro.onrender.com", // link Java
    changeOrigin: true,
    pathRewrite: { "^/api": "/api" }
  })
);

// ===================== Check Gateway =====================
app.get("/", (req, res) => {
  res.json({ message: "API Gateway is running 🚀" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ API Gateway running on http://localhost:${PORT}`);
});

// ===================== Keep Alive =====================
const NODE_API = "https://expressbackend-jvvv.onrender.com";
const JAVA_API = "https://spring-api-u4ro.onrender.com";
const GATEWAY_API = `http://localhost:${PORT}`;

setInterval(async () => {
  try {
    // Ping NodeJS
    await fetch(NODE_API + "/api/news").catch(() => {});
    // Ping Java
    await fetch(JAVA_API + "/api/auth").catch(() => {});
    // Ping chính Gateway
    await fetch(GATEWAY_API).catch(() => {});
    console.log("🔄 Keep-alive ping executed");
  } catch (err) {
    console.error("❌ Keep-alive error:", err.message);
  }
}, 1000 * 60 * 5); // mỗi 5 phút ping 1 lần
