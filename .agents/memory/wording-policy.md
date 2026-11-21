---
name: No "visa" wording policy
description: Product-wide rule — user-facing UI must never contain "visa"/"e-Visa"; brand is "Turkey Travel Assistant"
---

The owner requires ZERO visible "visa"/"e-Visa"/"Visa Office"/"Visa Assistant" strings in the UI, meta tags, brand, and API paths.

**Why:** Repeated explicit user demand (Aug 2026): brand is "Turkey Travel Assistant"; use "e-Permit" / "entry permit" / "travel authorization" instead. API is `/api/travel/*` (renamed from `/api/visa/*`).

**How to apply:**
- Server sanitizes all public API responses via `depermitDeep`/`depermitText` in the visa routes file (word-bounded regexes; skips internal keys like `category`, `id`, `slug`, `status`). Admin endpoints return raw data on purpose. AI chat: system prompt forbids "visa", SSE stream flushes sanitized text on whitespace boundaries.
- Internal identifiers (`visa_exempt`, `visa_summary`, file/component names) stay unchanged — only user-visible strings matter.
- **Exceptions (Aug 6, 2026, explicit user requests):** (1) top-block title is "Get Your Travel E-Visa" (`title` key in `DEPERMIT_SKIP_KEYS`); (2) "Permit-free entry" renders as "E-visa free entry" everywhere — enforced by a final rule at the END of the depermitText chain (order matters: earlier visa→permit rules would mangle it). Everywhere else the no-"visa" rule still applies.
- When adding new UI or data, never introduce visible "visa" wording; grep the pages before finishing.
- Ask AI is a bottom-sheet drawer (`AskAIDrawer`), not a floating pill; must stay above the 60px bottom nav + safe-area-inset-bottom.
