import { existsSync } from "node:fs";
import path from "node:path";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { listCountrySlugs } from "./routes/visa";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// Same-origin in production (Caddy serves API and SPA from one host), so the
// allowlist only needs to cover extra clients such as a native app shell.
const allowedOrigins = (process.env["ALLOWED_ORIGINS"] || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Same-origin requests and non-browser clients send no Origin header.
      if (!origin) {
        callback(null, true);
        return;
      }
      if (process.env["NODE_ENV"] !== "production" || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  }),
);

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const SITE_URL = (process.env["PUBLIC_SITE_URL"] || "https://turkiyetraveloffice.com").replace(
  /\/$/,
  "",
);

/** Generated rather than static so new countries appear without a redeploy. */
app.get("/sitemap.xml", async (_req, res) => {
  try {
    const slugs = await listCountrySlugs();
    const paths = ["", "/faq", "/contact", "/track", "/privacy", "/terms", ...slugs.map((s) => `/${s}`)];
    const body = paths
      .map((p) => `  <url><loc>${SITE_URL}${p}</loc></url>`)
      .join("\n");
    res.type("application/xml").send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
    );
  } catch (err) {
    logger.error({ err }, "sitemap generation failed");
    res.status(500).type("text/plain").send("sitemap unavailable");
  }
});

const staticDir = process.env["STATIC_DIR"];
if (staticDir && existsSync(staticDir)) {
  app.use(
    express.static(staticDir, {
      index: "index.html",
      setHeaders(res, filePath) {
        // Vite fingerprints everything under /assets, so it can be pinned.
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          return;
        }
        // A stale worker would pin an old build forever.
        if (filePath.endsWith("sw.js")) {
          res.setHeader("Cache-Control", "no-cache");
          return;
        }
        if (/\.(?:webp|jpg|jpeg|png|svg|woff2)$/.test(filePath)) {
          res.setHeader("Cache-Control", "public, max-age=604800");
        }
      },
    }),
  );
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }
    if (req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(staticDir, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

export default app;
