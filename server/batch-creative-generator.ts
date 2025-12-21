/**
 * Batch Creative Generator
 * 
 * Generates multiple creative variations in parallel
 */

import type { CreativeFormat } from './text-overlay';
import type { DesignSystem } from './creative-analyzer';
import type { LandingPageData } from './landingpage-scraper';

export interface BatchGenerationConfig {
  campaignId: string;
  format: CreativeFormat;
  count: number;
  userDescription?: string;
}

export interface GeneratedCreative {
  imageUrl: string;
  headline: string;
  eyebrowText?: string;
  ctaText?: string;
  format: CreativeFormat;
}

/**
 * Generate multiple creative variations in parallel
 */
export async function generateBatchCreatives(
  config: BatchGenerationConfig
): Promise<GeneratedCreative[]> {
  const { extractDesignSystem, generateStyleAwarePrompt, generateHeadlineVariations } = await import('./creative-analyzer');
  const { getAdCreatives, extractImageUrl, extractLandingPageUrl, getCampaignAdSets, getAdSetAds } = await import('./meta-api');
  const { scrapeLandingPage } = await import('./landingpage-scraper');
  const { identifyWinningCreatives } = await import('./winning-creatives');
  const { generateImage } = await import('./_core/imageGeneration');
  const { addTextOverlay, FORMAT_SPECS } = await import('./text-overlay');
  const { storagePut } = await import('./storage');
  
  // Get winning creative
  const adSets = await getCampaignAdSets(config.campaignId);
  const allAds = [];
  for (const adSet of adSets) {
    const ads = await getAdSetAds(adSet.id);
    allAds.push(...ads);
  }
  
  const adsWithPerformance = allAds.map(ad => {
    const insights = ad.insights?.data?.[0];
    const spend = parseFloat(insights?.spend || '0');
    const impressions = parseInt(insights?.impressions || '0');
    const outboundClicks = insights?.outbound_clicks?.find(a => a.action_type === 'outbound_click');
    const leads = insights?.actions?.find(a => a.action_type === 'lead');
    
    return {
      id: ad.id,
      name: ad.name,
      roasOrderVolume: 0,
      roasCashCollect: 0,
      costPerLead: leads ? spend / parseInt(leads.value) : 0,
      costPerOutboundClick: outboundClicks ? spend / parseInt(outboundClicks.value) : 0,
      outboundCtr: impressions > 0 ? (parseInt(outboundClicks?.value || '0') / impressions) * 100 : 0,
      cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
      spend,
      leads: leads ? parseInt(leads.value) : 0,
      impressions,
    };
  });
  
  const winners = identifyWinningCreatives(adsWithPerformance, 1);
  if (winners.length === 0) {
    throw new Error('No winning creatives found');
  }
  
  // Get image URL and extract design system
  const creative = await getAdCreatives(winners[0].adId);
  const imageUrl = extractImageUrl(creative);
  
  if (!imageUrl) {
    throw new Error('No image found for winning creative');
  }
  
  const designSystem = await extractDesignSystem(imageUrl);
  
  // Get landing page data
  const landingPageUrl = extractLandingPageUrl(creative);
  const landingPageData = landingPageUrl ? await scrapeLandingPage(landingPageUrl) : {
    url: '',
    title: null,
    description: null,
    h1: null,
    h2: null,
    ctaText: null,
    heroImages: [],
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    keywords: null,
    error: undefined,
  };
  
  // Generate headline variations
  const baseHeadline = landingPageData.h1 || landingPageData.title || 'Mehr Leads für dein Business';
  const headlines = await generateHeadlineVariations(baseHeadline, landingPageData, config.count);
  
  // Generate aspect ratio based on format
  const aspectRatio = FORMAT_SPECS[config.format].aspectRatio as '1:1' | '9:16';
  
  // Generate creatives in parallel
  const creatives = await Promise.all(
    headlines.map(async (headline, index) => {
      try {
        // Generate style-aware prompt
        const prompt = await generateStyleAwarePrompt(
          designSystem,
          landingPageData,
          config.userDescription
        );
        
        // Generate image with FLUX
        const { url: generatedImageUrl } = await generateImage({
          prompt,
          aspectRatio,
        });
        
        if (!generatedImageUrl) {
          throw new Error('Image generation failed');
        }
        
        // Try to add text overlay (optional - skip if canvas not available)
        let finalUrl = generatedImageUrl;
        try {
          const imageBuffer = await addTextOverlay(generatedImageUrl, {
            eyebrowText: headline.eyebrow,
            headlineText: headline.headline,
            ctaText: headline.cta,
            designSystem,
            format: config.format,
          });
          
          // Upload final creative with text overlay to S3
          const randomSuffix = Math.random().toString(36).substring(7);
          const fileKey = `creatives/batch-${config.format}-${index}-${randomSuffix}.png`;
          const result = await storagePut(fileKey, imageBuffer, 'image/png');
          finalUrl = result.url;
          console.log(`✅ Text overlay added to creative ${index}`);
        } catch (overlayError) {
          console.warn(`⚠️  Text overlay skipped for creative ${index} (canvas not available):`, overlayError);
          // Use generated image without text overlay
        }
        
        return {
          imageUrl: finalUrl,
          headline: headline.headline,
          eyebrowText: headline.eyebrow,
          ctaText: headline.cta,
          format: config.format,
        };
      } catch (error) {
        console.error(`Failed to generate creative ${index}:`, error);
        throw error;
      }
    })
  );
  
  return creatives;
}
