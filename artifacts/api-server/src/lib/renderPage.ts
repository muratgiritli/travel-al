import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Injects per-page metadata into the built index.html before serving it.
 *
 * The app is a client-rendered SPA, so every URL used to return byte-identical
 * markup. Crawlers therefore saw ~200 duplicate country URLs and folded them
 * into the homepage. Rewriting the head (and adding a crawlable summary) gives
 * each country page its own title, description and content.
 */

export interface PageMeta {
  title: string;
  description: string;
  canonicalPath: string;
  /** Rendered inside a <noscript>-free block that the SPA replaces on mount. */
  bodyHtml?: string;
  jsonLd?: unknown;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export class PageRenderer {
  private template: string;

  constructor(staticDir: string) {
    this.template = readFileSync(path.join(staticDir, "index.html"), "utf8");
  }

  render(meta: PageMeta, siteUrl: string): string {
    const base = siteUrl.replace(/\/$/, "");
    const canonical = `${base}${meta.canonicalPath}`;
    const title = escapeHtml(meta.title);
    const description = escapeAttr(meta.description);

    let html = this.template
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
      .replace(
        /<meta name="description" content="[^"]*" \/>/,
        `<meta name="description" content="${description}" />`,
      )
      .replace(
        /<meta property="og:title" content="[^"]*" \/>/,
        `<meta property="og:title" content="${escapeAttr(meta.title)}" />`,
      )
      .replace(
        /<meta property="og:description" content="[^"]*" \/>/,
        `<meta property="og:description" content="${description}" />`,
      )
      .replace(
        /<meta property="og:url" content="[^"]*" \/>/,
        `<meta property="og:url" content="${escapeAttr(canonical)}" />`,
      )
      .replace(
        /<meta name="twitter:title" content="[^"]*" \/>/,
        `<meta name="twitter:title" content="${escapeAttr(meta.title)}" />`,
      )
      .replace(
        /<meta name="twitter:description" content="[^"]*" \/>/,
        `<meta name="twitter:description" content="${description}" />`,
      )
      .replace(
        /<link rel="canonical" href="[^"]*" \/>/,
        `<link rel="canonical" href="${escapeAttr(canonical)}" />`,
      );

    if (meta.jsonLd) {
      const json = JSON.stringify(meta.jsonLd).replace(/</g, "\\u003c");
      html = html.replace(
        "</head>",
        `    <script type="application/ld+json">${json}</script>\n  </head>`,
      );
    }

    if (meta.bodyHtml) {
      // React replaces #root on mount, so this content is for crawlers and for
      // the moment before hydration; it is never shown alongside the app.
      html = html.replace('<div id="root"></div>', `<div id="root">${meta.bodyHtml}</div>`);
    }

    return html;
  }
}

export function countryBodyHtml(params: {
  name: string;
  title: string;
  paragraphs: string[];
}): string {
  const items = params.paragraphs
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("");
  return (
    `<main style="max-width:680px;margin:0 auto;padding:32px 20px;font-family:Inter,system-ui,sans-serif">` +
    `<h1>${escapeHtml(params.title)}</h1>${items}` +
    `<p><a href="/">Check your entry requirements and apply</a></p>` +
    `</main>`
  );
}
