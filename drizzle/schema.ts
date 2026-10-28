import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const storeSettings = mysqlTable("store_settings", {
  id: int("id").primaryKey().default(1),
  storeName: varchar("storeName", { length: 160 }).notNull(),
  city: varchar("city", { length: 120 }).notNull(),
  displayTitle: varchar("displayTitle", { length: 180 }).notNull(),
  displayDate: varchar("displayDate", { length: 80 }).notNull(),
  displayTime: varchar("displayTime", { length: 40 }).notNull(),
  currency: varchar("currency", { length: 32 }).notNull(),
  unit: varchar("unit", { length: 32 }).notNull(),
  note: text("note").notNull(),
  logoUrl: text("logoUrl"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StoreSettings = typeof storeSettings.$inferSelect;
export type InsertStoreSettings = typeof storeSettings.$inferInsert;

export const goldRates = mysqlTable("gold_rates", {
  id: int("id").autoincrement().primaryKey(),
  label: varchar("label", { length: 120 }).notNull(),
  karat: varchar("karat", { length: 32 }).notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  change: decimal("change", { precision: 8, scale: 2 }).notNull().default("0"),
  sortOrder: int("sortOrder").notNull().default(0),
  isVisible: int("isVisible").notNull().default(1),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GoldRate = typeof goldRates.$inferSelect;
export type InsertGoldRate = typeof goldRates.$inferInsert;
