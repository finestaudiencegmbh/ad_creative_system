import { mysqlTable, int, varchar, text, timestamp, float, json } from "drizzle-orm/mysql-core";

/**
 * Creative Performance Feedback Table
 * 
 * Stores performance data for generated creatives to enable feedback loop optimization.
 * This data is used to improve future creative generation by learning what works.
 */
export const creativePerformanceFeedback = mysqlTable("creative_performance_feedback", {
  id: int("id").autoincrement().primaryKey(),
  
  // Creative identification
  metaCampaignId: varchar("metaCampaignId", { length: 255 }).notNull(),
  metaAdSetId: varchar("metaAdSetId", { length: 255 }),
  metaAdId: varchar("metaAdId", { length: 255 }),
  
  // Creative metadata (what was generated)
  generatedImageUrl: text("generatedImageUrl"),
  headline: text("headline"),
  eyebrow: text("eyebrow"),
  cta: text("cta"),
  format: varchar("format", { length: 50 }), // feed, story, reel
  
  // Design system used
  designSystem: json("designSystem").$type<{
    colorPalette: string[];
    visualStyle: string;
    backgroundStyle: string;
    lighting?: string;
    perspective?: string;
    vibe?: string;
  }>(),
  
  // Prompt used for generation
  imagenPrompt: text("imagenPrompt"),
  referenceImageUrl: text("referenceImageUrl"), // Winning creative used as reference
  
  // Performance metrics
  impressions: int("impressions").default(0),
  outboundClicks: int("outboundClicks").default(0),
  leads: int("leads").default(0),
  spend: float("spend").default(0),
  
  // Calculated metrics
  ctr: float("ctr").default(0), // Click-through rate
  cpl: float("cpl").default(0), // Cost per lead
  cpm: float("cpm").default(0), // Cost per mille
  conversionRate: float("conversionRate").default(0), // Landing page conversion rate
  
  // ROAS (if sales data available)
  roasOrderVolume: float("roasOrderVolume").default(0),
  roasCashCollect: float("roasCashCollect").default(0),
  
  // Timestamps
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  lastUpdatedAt: timestamp("lastUpdatedAt").defaultNow().onUpdateNow().notNull(),
  
  // Performance period
  performanceDateStart: timestamp("performanceDateStart"),
  performanceDateEnd: timestamp("performanceDateEnd"),
});

export type CreativePerformanceFeedback = typeof creativePerformanceFeedback.$inferSelect;
export type InsertCreativePerformanceFeedback = typeof creativePerformanceFeedback.$inferInsert;
