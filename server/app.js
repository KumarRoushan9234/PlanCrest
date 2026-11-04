import "./config/env.js";
import "./models/index.js"; // register every model so populate() works from any route
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { readdirSync } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";
import { isProduction } from "./config/env.js";
import { corsOptions, verifyOrigin, apiLimiter } from "./middlewares/security.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Behind a reverse proxy (Render, Railway, Nginx) so rate limiting sees real IPs
app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors(corsOptions));
app.use(
  express.json({
    limit: "2mb",
    // Keep the raw payload so webhook signatures can be verified
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(cookieParser());
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(isProduction ? "combined" : "dev"));
}
app.use("/api", apiLimiter, verifyOrigin);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Route files mount under /api, except those with their own prefix
const ROUTE_PREFIXES = {
  "chat.js": "/api/chat",
  "uploads.js": "/api/uploads",
  "ai.js": "/api/ai",
};

const routesDir = path.join(__dirname, "routes");
for (const routeFile of readdirSync(routesDir).filter((f) => f.endsWith(".js"))) {
  const route = await import(pathToFileURL(path.join(routesDir, routeFile)).href);
  app.use(ROUTE_PREFIXES[routeFile] || "/api", route.default);
}

app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    return res
      .status(401)
      .json({ error: "No authorization token was found", code: "UNAUTHORIZED" });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ error: "Invalid ID" });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON body" });
  }
  console.error(err);
  res.status(err.status || 500).json({
    error: isProduction ? "Internal server error" : err.message,
  });
});

export default app;
