/**
 * Tests for Creative Generator procedures
 */

import { describe, it, expect } from 'vitest';
import { scrapeLandingPage, getBestDescription, getBestTitle } from './landingpage-scraper';
import { identifyWinningCreatives } from './winning-creatives';

describe('Landing Page Scraper', () => {
  it('should scrape a landing page and extract metadata', async () => {
    // Test with a public website
    const result = await scrapeLandingPage('https://example.com');
    
    expect(result).toBeDefined();
    expect(result.url).toBe('https://example.com');
    
    // Should have at least a title
    expect(result.title).toBeDefined();
  }, { timeout: 10000 });

  it('should handle invalid URLs gracefully', async () => {
    const result = await scrapeLandingPage('invalid-url');
    
    expect(result).toBeDefined();
    expect(result.error).toBeDefined();
  });

  it('should extract best description from scraped data', () => {
    const mockData = {
      url: 'https://test.com',
      title: 'Test Title',
      description: 'Meta Description',
      ogTitle: 'OG Title',
      ogDescription: 'OG Description',
      ogImage: null,
      keywords: null,
      h1: 'H1 Heading',
    };

    const bestDescription = getBestDescription(mockData);
    
    // Should prioritize OG Description
    expect(bestDescription).toBe('OG Description');
  });

  it('should extract best title from scraped data', () => {
    const mockData = {
      url: 'https://test.com',
      title: 'Test Title',
      description: null,
      ogTitle: 'OG Title',
      ogDescription: null,
      ogImage: null,
      keywords: null,
      h1: 'H1 Heading',
    };

    const bestTitle = getBestTitle(mockData);
    
    // Should prioritize OG Title
    expect(bestTitle).toBe('OG Title');
  });
});

describe('Winning Creatives Analyzer', () => {
  it('should identify winning creatives based on performance', () => {
    const mockAds = [
      {
        id: '1',
        name: 'Ad 1 - High ROAS',
        roasOrderVolume: 5.0,
        roasCashCollect: 2.5,
        costPerLead: 10.0,
        costPerOutboundClick: 2.0,
        outboundCtr: 2.5,
        cpm: 50.0,
        spend: 100,
        leads: 10,
        impressions: 2000,
      },
      {
        id: '2',
        name: 'Ad 2 - Low CPL',
        roasOrderVolume: 3.0,
        roasCashCollect: 1.5,
        costPerLead: 5.0,
        costPerOutboundClick: 1.5,
        outboundCtr: 3.0,
        cpm: 40.0,
        spend: 100,
        leads: 20,
        impressions: 2500,
      },
      {
        id: '3',
        name: 'Ad 3 - Poor Performance',
        roasOrderVolume: 1.0,
        roasCashCollect: 0.5,
        costPerLead: 30.0,
        costPerOutboundClick: 5.0,
        outboundCtr: 1.0,
        cpm: 80.0,
        spend: 100,
        leads: 3,
        impressions: 1250,
      },
    ];

    const winners = identifyWinningCreatives(mockAds, 2);

    expect(winners).toBeDefined();
    expect(winners.length).toBe(2);
    
    // First winner should have rank 1
    expect(winners[0].rank).toBe(1);
    
    // Winners should be sorted by score (descending)
    expect(winners[0].score).toBeGreaterThan(winners[1].score);
    
    // Ad 3 (poor performance) should not be in top 2
    expect(winners.find(w => w.adId === '3')).toBeUndefined();
  });

  it('should handle empty ad list', () => {
    const winners = identifyWinningCreatives([], 5);
    
    expect(winners).toBeDefined();
    expect(winners.length).toBe(0);
  });

  it('should return correct number of winners when requested count exceeds available ads', () => {
    const mockAds = [
      {
        id: '1',
        name: 'Ad 1',
        roasOrderVolume: 3.0,
        roasCashCollect: 1.5,
        costPerLead: 10.0,
        costPerOutboundClick: 2.0,
        outboundCtr: 2.0,
        cpm: 50.0,
        spend: 100,
        leads: 10,
        impressions: 2000,
      },
    ];

    const winners = identifyWinningCreatives(mockAds, 5);
    
    expect(winners.length).toBe(1);
  });
});
