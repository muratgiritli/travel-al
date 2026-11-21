import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

/** Generic key → JSON value store for admin-editable site settings
 *  (pricing, chat copy, brand, apply-page config, admin credentials). */
export const siteSettingsTable = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SiteSetting = typeof siteSettingsTable.$inferSelect;
export type InsertSiteSetting = typeof siteSettingsTable.$inferInsert;
