/**
 * Winning Creatives Analyzer
 * 
 * Identifies top-performing ads based on performance metrics
 * Priority: ROAS → CPL → Cost per Outbound Click → Outbound CTR & CPM
 */

interface AdPerformance {
  id: string;
  name: string;
  // Metrics
  roasOrderVolume: number;
  roasCashCollect: number;
  costPerLead: number;
  costPerOutboundClick: number;
  outboundCtr: number;
  cpm: number;
  // Additional data
  spend: number;
  leads: number;
  impressions: number;
}

interface WinningCreativeScore {
  adId: string;
  adName: string;
  score: number;
  metrics: {
    roasOrderVolume: number;
    roasCashCollect: number;
    costPerLead: number;
    costPerOutboundClick: number;
    outboundCtr: number;
    cpm: number;
  };
  rank: number;
  imageUrl?: string | null;
}

/**
 * Calculate performance score for an ad
 * Higher score = better performance
 * 
 * Scoring logic (weighted priorities):
 * 1. ROAS (40% weight) - Higher is better
 * 2. CPL (30% weight) - Lower is better (inverted)
 * 3. Cost per Outbound Click (15% weight) - Lower is better (inverted)
 * 4. Outbound CTR (10% weight) - Higher is better
 * 5. CPM (5% weight) - Lower is better (inverted)
 */
function calculatePerformanceScore(ad: AdPerformance, allAds: AdPerformance[]): number {
  // Filter out ads with zero spend or no data
  const validAds = allAds.filter(a => a.spend > 0 && a.leads > 0);
  
  if (validAds.length === 0) return 0;

  // Get min/max values for normalization
  const roasValues = validAds.map(a => Math.max(a.roasOrderVolume, a.roasCashCollect));
  const cplValues = validAds.map(a => a.costPerLead).filter(v => v > 0);
  const costPerClickValues = validAds.map(a => a.costPerOutboundClick).filter(v => v > 0);
  const ctrValues = validAds.map(a => a.outboundCtr);
  const cpmValues = validAds.map(a => a.cpm).filter(v => v > 0);

  const maxRoas = Math.max(...roasValues, 1);
  const minCpl = Math.min(...cplValues, Infinity);
  const maxCpl = Math.max(...cplValues, 1);
  const minCostPerClick = Math.min(...costPerClickValues, Infinity);
  const maxCostPerClick = Math.max(...costPerClickValues, 1);
  const maxCtr = Math.max(...ctrValues, 1);
  const minCpm = Math.min(...cpmValues, Infinity);
  const maxCpm = Math.max(...cpmValues, 1);

  // Normalize and calculate weighted score
  const roasScore = (Math.max(ad.roasOrderVolume, ad.roasCashCollect) / maxRoas) * 40;
  
  // For CPL: lower is better, so invert the score
  const cplScore = ad.costPerLead > 0 
    ? ((maxCpl - ad.costPerLead) / (maxCpl - minCpl)) * 30 
    : 0;
  
  // For Cost per Click: lower is better, so invert the score
  const costPerClickScore = ad.costPerOutboundClick > 0
    ? ((maxCostPerClick - ad.costPerOutboundClick) / (maxCostPerClick - minCostPerClick)) * 15
    : 0;
  
  const ctrScore = (ad.outboundCtr / maxCtr) * 10;
  
  // For CPM: lower is better, so invert the score
  const cpmScore = ad.cpm > 0
    ? ((maxCpm - ad.cpm) / (maxCpm - minCpm)) * 5
    : 0;

  return roasScore + cplScore + costPerClickScore + ctrScore + cpmScore;
}

/**
 * Identify winning creatives from a list of ads
 * Returns top N ads sorted by performance score
 */
export function identifyWinningCreatives(
  ads: AdPerformance[],
  topN: number = 5
): WinningCreativeScore[] {
  // Calculate scores for all ads
  const scoredAds = ads.map(ad => ({
    adId: ad.id,
    adName: ad.name,
    score: calculatePerformanceScore(ad, ads),
    metrics: {
      roasOrderVolume: ad.roasOrderVolume,
      roasCashCollect: ad.roasCashCollect,
      costPerLead: ad.costPerLead,
      costPerOutboundClick: ad.costPerOutboundClick,
      outboundCtr: ad.outboundCtr,
      cpm: ad.cpm,
    },
    rank: 0,
  }));

  // Sort by score (descending)
  scoredAds.sort((a, b) => b.score - a.score);

  // Assign ranks
  scoredAds.forEach((ad, index) => {
    ad.rank = index + 1;
  });

  // Return top N
  return scoredAds.slice(0, topN);
}

/**
 * Get performance insights for winning creatives
 */
export function getWinningCreativeInsights(winners: WinningCreativeScore[]): string {
  if (winners.length === 0) {
    return "No winning creatives found. Need more data to analyze performance.";
  }

  const topWinner = winners[0];
  
  const insights: string[] = [];
  
  insights.push(`Top performer: "${topWinner.adName}" (Score: ${topWinner.score.toFixed(1)})`);
  
  if (topWinner.metrics.roasOrderVolume > 2) {
    insights.push(`Strong ROAS of ${topWinner.metrics.roasOrderVolume.toFixed(2)}x indicates high revenue generation.`);
  }
  
  if (topWinner.metrics.costPerLead < 20) {
    insights.push(`Low cost per lead (€${topWinner.metrics.costPerLead.toFixed(2)}) shows efficient lead acquisition.`);
  }
  
  if (topWinner.metrics.outboundCtr > 1.5) {
    insights.push(`High outbound CTR (${topWinner.metrics.outboundCtr.toFixed(2)}%) indicates compelling creative and messaging.`);
  }

  return insights.join(' ');
}
