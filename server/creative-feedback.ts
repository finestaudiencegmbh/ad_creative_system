/**
 * Creative Performance Feedback Service
 * 
 * Tracks generated creative performance and provides insights for optimization.
 */

import { getDb } from "./db";
import { creativePerformanceFeedback, type InsertCreativePerformanceFeedback } from "../drizzle/schema";
import { eq, desc, and, gte } from "drizzle-orm";

/**
 * Save creative generation data for future feedback
 */
export async function saveCreativeGeneration(data: {
  metaCampaignId: string;
  metaAdSetId?: string;
  metaAdId?: string;
  generatedImageUrl: string;
  headline: string;
  eyebrow: string;
  cta: string;
  format: string;
  designSystem: any;
  imagenPrompt: string;
  referenceImageUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.insert(creativePerformanceFeedback).values({
    ...data,
    generatedAt: new Date(),
  });
}

/**
 * Update creative performance metrics from Meta API
 */
export async function updateCreativePerformance(data: {
  metaAdId: string;
  impressions: number;
  outboundClicks: number;
  leads: number;
  spend: number;
  ctr: number;
  cpl: number;
  cpm: number;
  conversionRate: number;
  roasOrderVolume?: number;
  roasCashCollect?: number;
  performanceDateStart: Date;
  performanceDateEnd: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const existing = await db
    .select()
    .from(creativePerformanceFeedback)
    .where(eq(creativePerformanceFeedback.metaAdId, data.metaAdId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(creativePerformanceFeedback)
      .set({
        impressions: data.impressions,
        outboundClicks: data.outboundClicks,
        leads: data.leads,
        spend: data.spend,
        ctr: data.ctr,
        cpl: data.cpl,
        cpm: data.cpm,
        conversionRate: data.conversionRate,
        roasOrderVolume: data.roasOrderVolume || 0,
        roasCashCollect: data.roasCashCollect || 0,
        performanceDateStart: data.performanceDateStart,
        performanceDateEnd: data.performanceDateEnd,
        lastUpdatedAt: new Date(),
      })
      .where(eq(creativePerformanceFeedback.id, existing[0].id));
  }
}

/**
 * Get top performing creatives for learning
 */
export async function getTopPerformingCreatives(limit: number = 10) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return await db
    .select()
    .from(creativePerformanceFeedback)
    .where(gte(creativePerformanceFeedback.leads, 1)) // Only creatives with at least 1 lead
    .orderBy(
      desc(creativePerformanceFeedback.roasCashCollect),
      desc(creativePerformanceFeedback.conversionRate),
      desc(creativePerformanceFeedback.ctr)
    )
    .limit(limit);
}

/**
 * Analyze performance patterns to improve future generations
 */
export async function analyzePerformancePatterns() {
  const topCreatives = await getTopPerformingCreatives(20);

  if (topCreatives.length === 0) {
    return null;
  }

  // Extract patterns from top performers
  const patterns = {
    // Color patterns
    mostUsedColors: extractMostUsedColors(topCreatives),
    
    // Visual style patterns
    mostSuccessfulStyles: extractMostSuccessfulStyles(topCreatives),
    
    // Lighting patterns
    bestLighting: extractBestLighting(topCreatives),
    
    // Perspective patterns
    bestPerspective: extractBestPerspective(topCreatives),
    
    // Vibe patterns
    bestVibe: extractBestVibe(topCreatives),
    
    // Average performance metrics
    avgCtr: topCreatives.reduce((sum: number, c: any) => sum + (c.ctr || 0), 0) / topCreatives.length,
    avgCpl: topCreatives.reduce((sum: number, c: any) => sum + (c.cpl || 0), 0) / topCreatives.length,
    avgConversionRate: topCreatives.reduce((sum: number, c: any) => sum + (c.conversionRate || 0), 0) / topCreatives.length,
  };

  return patterns;
}

/**
 * Helper: Extract most used colors from top performers
 */
function extractMostUsedColors(creatives: any[]) {
  const colorCounts: Record<string, number> = {};
  
  for (const creative of creatives) {
    if (creative.designSystem?.colorPalette) {
      for (const color of creative.designSystem.colorPalette) {
        colorCounts[color] = (colorCounts[color] || 0) + 1;
      }
    }
  }
  
  return Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([color]) => color);
}

/**
 * Helper: Extract most successful visual styles
 */
function extractMostSuccessfulStyles(creatives: any[]) {
  const styleCounts: Record<string, number> = {};
  
  for (const creative of creatives) {
    if (creative.designSystem?.visualStyle) {
      const style = creative.designSystem.visualStyle;
      styleCounts[style] = (styleCounts[style] || 0) + 1;
    }
  }
  
  return Object.entries(styleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([style]) => style);
}

/**
 * Helper: Extract best lighting patterns
 */
function extractBestLighting(creatives: any[]) {
  const lightingCounts: Record<string, number> = {};
  
  for (const creative of creatives) {
    if (creative.designSystem?.lighting) {
      const lighting = creative.designSystem.lighting;
      lightingCounts[lighting] = (lightingCounts[lighting] || 0) + 1;
    }
  }
  
  return Object.entries(lightingCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([lighting]) => lighting);
}

/**
 * Helper: Extract best perspective patterns
 */
function extractBestPerspective(creatives: any[]) {
  const perspectiveCounts: Record<string, number> = {};
  
  for (const creative of creatives) {
    if (creative.designSystem?.perspective) {
      const perspective = creative.designSystem.perspective;
      perspectiveCounts[perspective] = (perspectiveCounts[perspective] || 0) + 1;
    }
  }
  
  return Object.entries(perspectiveCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([perspective]) => perspective);
}

/**
 * Helper: Extract best vibe patterns
 */
function extractBestVibe(creatives: any[]) {
  const vibeCounts: Record<string, number> = {};
  
  for (const creative of creatives) {
    if (creative.designSystem?.vibe) {
      const vibe = creative.designSystem.vibe;
      vibeCounts[vibe] = (vibeCounts[vibe] || 0) + 1;
    }
  }
  
  return Object.entries(vibeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([vibe]) => vibe);
}
