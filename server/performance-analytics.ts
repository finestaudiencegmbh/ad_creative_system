/**
 * Performance Analytics Service
 * 
 * Analyzes creative performance and extracts winning patterns
 */

import { getDb } from './db';
import { creatives, performanceData } from '../drizzle/schema';
import { desc, eq, and, sql } from 'drizzle-orm';

export interface CreativePerformance {
  creativeId: number;
  imageUrl: string;
  headline: string;
  eyebrowText: string | null;
  ctaText: string | null;
  format: string;
  campaignId: string | null;
  
  // Performance metrics
  impressions: number;
  clicks: number;
  ctr: number; // Click-through rate
  spend: number;
  conversions: number;
  cpl: number; // Cost per lead
  roas: number; // Return on ad spend
  
  // Ranking
  performanceScore: number;
}

/**
 * Get top performing creatives
 */
export async function getTopPerformers(limit: number = 10): Promise<CreativePerformance[]> {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db
    .select({
      creativeId: creatives.id,
      imageUrl: creatives.imageUrl,
      headline: creatives.headline,
      eyebrowText: creatives.eyebrowText,
      ctaText: creatives.ctaText,
      format: creatives.format,
      campaignId: creatives.campaignId,
      impressions: sql<number>`COALESCE(${performanceData.impressions}, 0)`,
      clicks: sql<number>`COALESCE(${performanceData.clicks}, 0)`,
      ctr: sql<number>`COALESCE(${performanceData.ctr}, 0)`,
      spend: sql<number>`COALESCE(${performanceData.spend}, 0)`,
      conversions: sql<number>`COALESCE(${performanceData.conversions}, 0)`,
      cpl: sql<number>`COALESCE(${performanceData.costPerLead}, 0)`,
      roas: sql<number>`COALESCE(${performanceData.roas}, 0)`,
    })
    .from(creatives)
    .leftJoin(performanceData, eq(creatives.id, performanceData.creativeId))
    .where(eq(creatives.status, 'published'))
    .orderBy(desc(performanceData.roas))
    .limit(limit);
  
  return results.map((r) => ({
    ...r,
    imageUrl: r.imageUrl || '',
    headline: r.headline || '',
    eyebrowText: r.eyebrowText || null,
    ctaText: r.ctaText || null,
    format: r.format || 'feed',
    campaignId: r.campaignId || null,
    impressions: r.impressions || 0,
    clicks: r.clicks || 0,
    ctr: r.ctr || 0,
    spend: r.spend || 0,
    conversions: r.conversions || 0,
    cpl: r.cpl || 0,
    roas: r.roas || 0,
    performanceScore: calculatePerformanceScore({
      ctr: r.ctr || 0,
      cpl: r.cpl || 0,
      roas: r.roas || 0,
    }),
  }));
}

/**
 * Get low performing creatives
 */
export async function getLowPerformers(limit: number = 10): Promise<CreativePerformance[]> {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db
    .select({
      creativeId: creatives.id,
      imageUrl: creatives.imageUrl,
      headline: creatives.headline,
      eyebrowText: creatives.eyebrowText,
      ctaText: creatives.ctaText,
      format: creatives.format,
      campaignId: creatives.campaignId,
      impressions: sql<number>`COALESCE(${performanceData.impressions}, 0)`,
      clicks: sql<number>`COALESCE(${performanceData.clicks}, 0)`,
      ctr: sql<number>`COALESCE(${performanceData.ctr}, 0)`,
      spend: sql<number>`COALESCE(${performanceData.spend}, 0)`,
      conversions: sql<number>`COALESCE(${performanceData.conversions}, 0)`,
      cpl: sql<number>`COALESCE(${performanceData.costPerLead}, 0)`,
      roas: sql<number>`COALESCE(${performanceData.roas}, 0)`,
    })
    .from(creatives)
    .leftJoin(performanceData, eq(creatives.id, performanceData.creativeId))
    .where(eq(creatives.status, 'published'))
    .orderBy(performanceData.roas) // Ascending for low performers
    .limit(limit);
  
  return results.map((r) => ({
    ...r,
    imageUrl: r.imageUrl || '',
    headline: r.headline || '',
    eyebrowText: r.eyebrowText || null,
    ctaText: r.ctaText || null,
    format: r.format || 'feed',
    campaignId: r.campaignId || null,
    impressions: r.impressions || 0,
    clicks: r.clicks || 0,
    ctr: r.ctr || 0,
    spend: r.spend || 0,
    conversions: r.conversions || 0,
    cpl: r.cpl || 0,
    roas: r.roas || 0,
    performanceScore: calculatePerformanceScore({
      ctr: r.ctr || 0,
      cpl: r.cpl || 0,
      roas: r.roas || 0,
    }),
  }));
}

/**
 * Calculate performance score (0-100)
 */
function calculatePerformanceScore(metrics: {
  ctr: number;
  cpl: number;
  roas: number;
}): number {
  // Weighted score: ROAS (50%), CTR (30%), CPL (20%)
  const roasScore = Math.min(metrics.roas * 10, 100); // ROAS > 10 = 100 points
  const ctrScore = Math.min(metrics.ctr * 100, 100); // CTR > 1% = 100 points
  const cplScore = metrics.cpl > 0 ? Math.max(100 - metrics.cpl, 0) : 0; // Lower CPL = higher score
  
  return Math.round(roasScore * 0.5 + ctrScore * 0.3 + cplScore * 0.2);
}

/**
 * Extract winning patterns from top performers
 */
export async function extractWinningPatterns(): Promise<{
  topHeadlines: string[];
  topEyebrows: string[];
  topCTAs: string[];
  avgCTR: number;
  avgCPL: number;
  avgROAS: number;
}> {
  const topPerformers = await getTopPerformers(20);
  
  return {
    topHeadlines: topPerformers
      .map((p) => p.headline)
      .filter((h) => h)
      .slice(0, 10),
    topEyebrows: topPerformers
      .map((p) => p.eyebrowText)
      .filter((e) => e)
      .slice(0, 10) as string[],
    topCTAs: topPerformers
      .map((p) => p.ctaText)
      .filter((c) => c)
      .slice(0, 10) as string[],
    avgCTR: topPerformers.reduce((sum, p) => sum + p.ctr, 0) / topPerformers.length,
    avgCPL: topPerformers.reduce((sum, p) => sum + p.cpl, 0) / topPerformers.length,
    avgROAS: topPerformers.reduce((sum, p) => sum + p.roas, 0) / topPerformers.length,
  };
}
