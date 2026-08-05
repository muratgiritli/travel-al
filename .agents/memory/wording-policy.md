---
name: No "visa" wording policy
description: Product-wide rule — user-facing UI must never contain "visa"/"e-Visa"; brand is "Turkey Travel Assistant"
---

The owner requires ZERO visible "visa"/"e-Visa"/"Visa Office"/"Visa Assistant" strings in the UI, meta tags, brand, and API paths.

**Why:** Repeated explicit user demand (Aug 2026): brand is "Turkey Travel Assistant"; use "e-Permit" / "entry permit" / "travel authorization" instead. API is `/api/travel/*` (renamed from `/api/visa/*`).

**How to apply:**
- Server sanitizes all public API responses via `depermitDeep`/`depermitText` in the visa routes file (word-bounded regexes; skips internal keys like `category`, `id`, `slug`, `status`). Admin endpoints return raw data on purpose. AI chat: system prompt forbids "visa", SSE stream flushes sanitized text on whitespace boundaries.
- Internal identifiers (`visa_exempt`, `visa_summary`, file/component names) stay unchanged — only user-visible strings matter.
- When adding new UI or data, never introduce visible "visa" wording; grep the pages before finishing.
- Ask AI is a bottom-sheet drawer (`AskAIDrawer`), not a floating pill; must stay above the 60px bottom nav + safe-area-inset-bottom.
