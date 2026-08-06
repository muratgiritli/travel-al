---
name: Admin DB overrides can undo wording/CTA fixes
description: Country content is deep-merged from JSON data + visa_country_overrides DB rows; fixing JSON/defaults is not enough.
---

The rule: when fixing user-visible wording or CTA links for countries, always check the `visa_country_overrides` table (`extra` jsonb column) — admin edits stored there override the JSON data files and server defaults.

**Why:** After scrubbing "evisa.gov.tr" from data files and defaults, Pakistan still showed it — its `pk` override row carried the old `price_example`, a broken `cta_href: /apply/pk`, and a single empty option card that suppressed the 4 default option cards.

**How to apply:** After any content/wording fix, query `SELECT country_id, extra::text FROM visa_country_overrides WHERE extra::text ILIKE '%<bad string>%'` and clean matching rows. Empty `option_cards: []` in an override makes category defaults apply again. All CTA hrefs must point to real routes (/next, /checkout).
