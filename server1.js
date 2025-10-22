import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";

const app = express();

// ==================== CORS ====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== CONFIG ====================
const NODE_API = "https://expressbackend-jvvv.onrender.com";
const JAVA_API = "https://spring-api-u4ro.onrender.com";

// ==================== Middleware log ====================
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ==================== Helper: attach body for POST/PUT ====================
function attachBody(proxyReq, req) {
    // Forward Authorization nếu có
    if (req.headers.authorization) {
      proxyReq.setHeader("Authorization", req.headers.authorization);
    }
  
    // Forward JSON body
    if (req.body && Object.keys(req.body).length) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader("Content-Type", "application/json");
      proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  }
  

// ==================== Forward Node backend ====================
app.use(
  ["/api/news", "/api/hospital", "/api/data"],
  createProxyMiddleware({
    target: NODE_API,
    changeOrigin: true,
    secure: false, // bỏ qua SSL nếu self-signed
    pathRewrite: (path) => path,
    onProxyReq: attachBody,
    logLevel: "debug",
    proxyTimeout: 30000, // 30s timeout
  })
);

// ==================== Forward Java backend ====================
// Các route còn lại
app.use(
  createProxyMiddleware({
    target: JAVA_API,
    changeOrigin: true,
    secure: false,
    pathRewrite: (path) => path,
    onProxyReq: attachBody,
    logLevel: "debug",
    proxyTimeout: 30000,
  })
);

// ==================== Handle preflight OPTIONS ====================
app.options("*", cors());

// ==================== Default route ====================
app.get("/", (req, res) => {
  res.json({ message: "API Gateway (http-proxy-middleware) is running 🚀" });
});

// ==================== Start server ====================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Gateway running on http://localhost:${PORT}`);
});
