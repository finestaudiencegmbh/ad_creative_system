/**
 * Test core creative generation flow without canvas dependency
 */

import { describe, it, expect } from 'vitest';

describe('Creative Generation Flow', () => {
  it('should have generateBatchCreatives procedure in router', async () => {
    const { appRouter } = await import('./routers');
    expect(appRouter.ai.generateBatchCreatives).toBeDefined();
  });

  it('should have all required helper functions', async () => {
    const { extractDesignSystem, generateStyleAwarePrompt, generateHeadlineVariations } = await import('./creative-analyzer');
    expect(extractDesignSystem).toBeDefined();
    expect(generateStyleAwarePrompt).toBeDefined();
    expect(generateHeadlineVariations).toBeDefined();
  });

  it('should have Meta API functions', async () => {
    const { getCampaignAdSets, getAdSetAds, getAdCreatives, extractImageUrl, extractLandingPageUrl } = await import('./meta-api');
    expect(getCampaignAdSets).toBeDefined();
    expect(getAdSetAds).toBeDefined();
    expect(getAdCreatives).toBeDefined();
    expect(extractImageUrl).toBeDefined();
    expect(extractLandingPageUrl).toBeDefined();
  });

  it('should have winning creatives identification', async () => {
    const { identifyWinningCreatives } = await import('./winning-creatives');
    expect(identifyWinningCreatives).toBeDefined();
    
    // Test with sample data
    const sampleAds = [
      { id: '1', name: 'Ad 1', costPerLead: 10, outboundCtr: 2.5, spend: 100, leads: 10, impressions: 1000, roasOrderVolume: 5, roasCashCollect: 4, costPerOutboundClick: 2, cpm: 10 },
      { id: '2', name: 'Ad 2', costPerLead: 15, outboundCtr: 1.5, spend: 150, leads: 10, impressions: 1500, roasOrderVolume: 3, roasCashCollect: 2, costPerOutboundClick: 3, cpm: 15 },
      { id: '3', name: 'Ad 3', costPerLead: 8, outboundCtr: 3.0, spend: 80, leads: 10, impressions: 800, roasOrderVolume: 6, roasCashCollect: 5, costPerOutboundClick: 1.5, cpm: 8 },
    ];
    
    const winners = identifyWinningCreatives(sampleAds, 2);
    expect(winners).toHaveLength(2);
    expect(winners[0].adId).toBe('3'); // Best performer (lowest CPL, highest CTR)
  });

  it('should have landing page scraper', async () => {
    const { scrapeLandingPage } = await import('./landingpage-scraper');
    expect(scrapeLandingPage).toBeDefined();
  });

  it('should have image generation', async () => {
    const { generateImage } = await import('./_core/imageGeneration');
    expect(generateImage).toBeDefined();
  });

  it('should have storage functions', async () => {
    const { storagePut } = await import('./storage');
    expect(storagePut).toBeDefined();
  });
});
