import { existsSync } from "node:fs";
import path from "node:path";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { getCountrySeo, listCountrySlugs } from "./routes/visa";
import { countryBodyHtml, PageRenderer } from "./lib/renderPage";
import { findOrderForTracking, updateOrderStatus } from "./lib/ordersStore";
import { verifyWebhook } from "./lib/stripe";
import { logger } from "./lib/logger";
import { captureException } from "./lib/sentry";

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
/**
 * Stripe signs the exact bytes it sent, so this route needs the raw body and
 * must be mounted before the JSON parser rewrites it.
 */
app.post(
  "/api/travel/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const event = await verifyWebhook(
      req.body as Buffer,
      req.headers["stripe-signature"] as string | undefined,
    );
    if (!event) {
      res.status(400).json({ error: "Invalid signature" });
      return;
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = (event.data as { object?: Record<string, unknown> })?.object || {};
        const code = String(session["client_reference_id"] || "");
        const email = String(session["customer_email"] || "");
        const order = code && email ? await findOrderForTracking(code, email) : null;
        if (order) {
          await updateOrderStatus(order.id, "paid", "Paid via Stripe Checkout");
          logger.info({ trackingCode: order.tracking_code }, "order marked paid");
        } else {
          logger.warn({ code }, "Stripe webhook referenced an unknown order");
        }
      }
      res.json({ received: true });
    } catch (err) {
      logger.error({ err }, "Stripe webhook handling failed");
      void captureException(err, { kind: "stripe-webhook" });
      res.status(500).json({ error: "Webhook handling failed" });
    }
  },
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use("/api", router);

const SITE_URL = (process.env["PUBLIC_SITE_URL"] || "https://turkiyetraveloffice.com").replace(
  /\/$/,
  "",
);

/** Generated rather than static so new countries appear without a redeploy. */
app.get("/sitemap.xml", async (_req, res) => {
  try {
    const slugs = await listCountrySlugs();
    const paths = [
      "",
      "/faq",
      "/contact",
      "/track",
      "/privacy",
      "/terms",
      "/refunds",
      "/distance-sales",
      ...slugs.map((s) => `/${s}`),
    ];
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
  const renderer = new PageRenderer(staticDir);

  // Paths the SPA owns that must never be treated as a country slug.
  const RESERVED_PATHS = new Set([
    "/",
    "/faq",
    "/contact",
    "/track",
    "/privacy",
    "/terms",
    "/refunds",
    "/distance-sales",
    "/checkout",
    "/next",
    "/admin",
  ]);

  const STATIC_PAGE_SEO: Record<string, { title: string; description: string }> = {
    "/faq": {
      title: "Türkiye travel FAQ — entry, insurance and eSIM",
      description:
        "Answers about Türkiye entry requirements, travel insurance and eSIM packages.",
    },
    "/contact": {
      title: "Contact Türkiye Travel Office",
      description: "Get in touch about a Türkiye entry application, insurance or eSIM.",
    },
    "/track": {
      title: "Track your Türkiye travel application",
      description: "Check the status of your application with your reference number and email.",
    },
    "/privacy": {
      title: "Privacy policy — Türkiye Travel Office",
      description: "How Türkiye Travel Office collects and uses personal information.",
    },
    "/terms": {
      title: "Terms of use — Türkiye Travel Office",
      description: "Terms that apply when you use Türkiye Travel Office.",
    },
    "/refunds": {
      title: "Cancellation and refunds — Türkiye Travel Office",
      description: "Cancellation and refund policy for applications and add-on services.",
    },
    "/distance-sales": {
      title: "Distance sales agreement — Türkiye Travel Office",
      description: "Distance sales information required for online purchases from Türkiye.",
    },
  };

  app.use(async (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }
    if (req.path.startsWith("/api")) {
      next();
      return;
    }

    const send = (html: string) => {
      res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
      res.type("html").send(html);
    };

    try {
      const slugMatch = /^\/([a-z0-9-]{2,60})\/?$/i.exec(req.path);
      if (slugMatch && !RESERVED_PATHS.has(req.path.replace(/\/$/, "") || "/")) {
        const seo = await getCountrySeo(slugMatch[1]);
        if (seo) {
          send(
            renderer.render(
              {
                title: seo.title,
                description: seo.description,
                canonicalPath: `/${seo.slug}`,
                bodyHtml: countryBodyHtml({
                  name: seo.name,
                  title: seo.title,
                  paragraphs: seo.paragraphs,
                }),
                jsonLd: {
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: [
                    {
                      "@type": "Question",
                      name: seo.title,
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: seo.paragraphs.join(" "),
                      },
                    },
                  ],
                },
              },
              SITE_URL,
            ),
          );
          return;
        }
      }

      const pagePath = req.path.replace(/\/$/, "") || "/";
      const staticSeo = STATIC_PAGE_SEO[pagePath];
      send(
        renderer.render(
          {
            title:
              staticSeo?.title
              || "Türkiye Entry Guide — entry requirements, travel insurance and eSIM",
            description:
              staticSeo?.description
              || "Check your Türkiye entry requirements by passport country, then arrange travel insurance and an eSIM in one place.",
            canonicalPath: pagePath,
            jsonLd:
              pagePath === "/"
                ? {
                    "@context": "https://schema.org",
                    "@type": "TravelAgency",
                    name: "Türkiye Travel Office",
                    url: SITE_URL,
                    areaServed: "TR",
                  }
                : undefined,
          },
          SITE_URL,
        ),
      );
    } catch (err) {
      logger.error({ err, path: req.path }, "page render failed");
      void captureException(err, { kind: "page-render", path: req.path });
      res.sendFile(path.join(staticDir, "index.html"), (sendErr) => {
        if (sendErr) next(sendErr);
      });
    }
  });
}

export default app;
