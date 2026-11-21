import { pgTable, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const visaCountryOverridesTable = pgTable("visa_country_overrides", {
  countryId:         text("country_id").primaryKey(),
  visaSummary:       text("visa_summary"),
  stayRule:          text("stay_rule"),
  insuranceRequired: boolean("insurance_required"),
  adminHtmlNotes:    text("admin_html_notes"),
  aiExtraContext:    text("ai_extra_context"),
  isActive:          boolean("is_active"),
  /** All other admin-editable fields (names, slug, category, precondition,
   *  age bands, airline conditions, mission note, option cards, price
   *  overrides…) stored as one JSON blob to stay schema-flexible. */
  extra:             jsonb("extra"),
  updatedAt:         timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type VisaCountryOverride = typeof visaCountryOverridesTable.$inferSelect;
export type InsertVisaCountryOverride = typeof visaCountryOverridesTable.$inferInsert;
