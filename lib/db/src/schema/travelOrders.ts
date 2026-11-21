import { pgTable, text, integer, numeric, jsonb, timestamp, index } from "drizzle-orm/pg-core";

/**
 * One row per application.
 *
 * Orders previously lived in a single JSON array inside site_settings, so two
 * concurrent submissions could overwrite each other. Row-level writes remove
 * that race and make the admin list searchable.
 */
export const travelOrdersTable = pgTable(
  "travel_orders",
  {
    id: text("id").primaryKey(),
    trackingCode: text("tracking_code").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    type: text("type").notNull(),
    status: text("status").notNull(),
    statusHistory: jsonb("status_history").notNull().default([]),
    /** Stored as numeric so money never round-trips through a float. */
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
    currency: text("currency").notNull().default("USD"),
    email: text("email").notNull(),
    phone: text("phone"),
    customerName: text("customer_name"),
    country: text("country"),
    optionId: text("option_id"),
    optionTitle: text("option_title"),
    optionIndex: integer("option_index"),
    summary: text("summary"),
    payload: jsonb("payload").notNull().default({}),
    payment: jsonb("payment"),
    adminNote: text("admin_note"),
  },
  (table) => [
    index("travel_orders_created_at_idx").on(table.createdAt),
    index("travel_orders_status_idx").on(table.status),
    index("travel_orders_email_idx").on(table.email),
  ],
);

export type TravelOrderRow = typeof travelOrdersTable.$inferSelect;
export type InsertTravelOrderRow = typeof travelOrdersTable.$inferInsert;
