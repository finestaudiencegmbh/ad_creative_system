import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal } from "drizzle-orm/mysql-core";

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

/**
 * Clients table - Multi-Tenant structure
 * Each client represents a customer using the ad creative system
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  companyName: varchar("companyName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Onboarding data table - Stores all client-specific configuration
 */
export const onboardingData = mysqlTable("onboarding_data", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
  landingPageUrl: text("landingPageUrl"),
  communicationGoal: text("communicationGoal"),
  conversionGoal: text("conversionGoal"),
  targetAudienceDescription: text("targetAudienceDescription"),
  brandVoiceDescription: text("brandVoiceDescription"),
  metaAdAccountId: varchar("metaAdAccountId", { length: 255 }),
  metaAccessToken: text("metaAccessToken"), // Encrypted in production
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OnboardingData = typeof onboardingData.$inferSelect;
export type InsertOnboardingData = typeof onboardingData.$inferInsert;

/**
 * Brand assets table - Stores logos, colors, fonts, images per client
 */
export const brandAssets = mysqlTable("brand_assets", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
  assetType: mysqlEnum("assetType", ["logo", "image", "font", "color"]).notNull(),
  name: varchar("name", { length: 255 }),
  value: text("value").notNull(), // URL for images/logos, hex code for colors, font name for fonts
  metadata: json("metadata").$type<Record<string, unknown>>(), // Additional metadata (e.g., file size, dimensions)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BrandAsset = typeof brandAssets.$inferSelect;
export type InsertBrandAsset = typeof brandAssets.$inferInsert;

/**
 * Creatives table - Stores all generated ad creatives
 */
export const creatives = mysqlTable("creatives", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }),
  fabricJsonData: json("fabricJsonData").$type<Record<string, unknown>>(), // Fabric.js canvas JSON
  previewImageUrl: text("previewImageUrl"), // URL to rendered image in S3
  format: mysqlEnum("format", ["feed", "story"]).notNull(),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  metaAdId: varchar("metaAdId", { length: 255 }), // Meta Ad ID for performance tracking
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Creative = typeof creatives.$inferSelect;
export type InsertCreative = typeof creatives.$inferInsert;

/**
 * Performance data table - Stores Meta API performance metrics
 */
export const performanceData = mysqlTable("performance_data", {
  id: int("id").autoincrement().primaryKey(),
  creativeId: int("creativeId").references(() => creatives.id, { onDelete: "cascade" }),
  metaAdId: varchar("metaAdId", { length: 255 }),
  metaCampaignId: varchar("metaCampaignId", { length: 255 }),
  campaignName: varchar("campaignName", { length: 255 }),
  date: timestamp("date").notNull(),
  impressions: int("impressions").default(0),
  spend: decimal("spend", { precision: 10, scale: 2 }).default("0"),
  conversions: int("conversions").default(0),
  clicks: int("clicks").default(0),
  reach: int("reach").default(0),
  ctr: decimal("ctr", { precision: 5, scale: 2 }), // Click-through rate
  cpc: decimal("cpc", { precision: 10, scale: 2 }), // Cost per click
  cpm: decimal("cpm", { precision: 10, scale: 2 }), // Cost per mille
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PerformanceData = typeof performanceData.$inferSelect;
export type InsertPerformanceData = typeof performanceData.$inferInsert;

/**
 * Projects table - Dummy projects for testing and organization
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["active", "paused", "completed"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Sales table - Tracks order value, cash collected, and completion date
 * Can be linked to campaigns, ad sets, or individual ads for ROAS calculation
 */
export const sales = mysqlTable("sales", {
  id: int("id").autoincrement().primaryKey(),
  // Link to Meta entities (at least one must be set)
  metaCampaignId: varchar("metaCampaignId", { length: 255 }),
  metaAdSetId: varchar("metaAdSetId", { length: 255 }),
  metaAdId: varchar("metaAdId", { length: 255 }),
  // Sales data
  orderValue: decimal("orderValue", { precision: 10, scale: 2 }).notNull(), // Generierter Auftragswert
  cashCollect: decimal("cashCollect", { precision: 10, scale: 2 }).notNull(), // Tatsächlich eingegangenes Geld
  completionDate: timestamp("completionDate").notNull(), // Datum Abschluss
  // Optional metadata
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Sale = typeof sales.$inferSelect;
export type InsertSale = typeof sales.$inferInsert;
