---
name: Admin DB overrides
description: How visa_country_overrides interacts with seed JSON data — pitfalls after wording/CTA fixes and null-column clobbering.
---

# Admin DB overrides (visa_country_overrides)

- The `extra` jsonb column deep-merges over the seed JSON country data. After any wording/CTA fix in JSON files, check DB overrides — they can reintroduce banned wording or broken CTAs.
- **Null scalar columns must never be spread over seed data.** The override loader must omit keys whose DB value is NULL; an override object with `visa_summary: undefined` spread via `{ ...seed, ...override }` clobbers the seed value. This bug hid Germany's stay info when a row with only `is_active` existed. Fixed in `loadDbOverrides` — keep the "only include non-null keys" pattern if that code is touched.
- **Why:** inserting a row for one field (e.g. publish toggle) leaves all other columns NULL — very common.
- Publishing: `is_active=false` hides a country from the public picker AND the public detail endpoint returns 404 (admin routes still see it). Admin UI labels this "Published".
- Top-block content (badges/title/requirements card) is admin-editable via `extra` keys: badge_country_label, top_title, top_subtitle, support_line, requirements_title (years stripped server-side), passport_validity_text, max_stay_text, insurance_label.
