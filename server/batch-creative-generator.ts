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
  manualLandingPage?: string;
  adSetId?: string;
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
  const { enhancePromptWithGemini } = await import('./_core/geminiImageGeneration');
  const { generateSDXLTextImage } = await import('./_core/sdxlTextImage');
  const { addTextOverlaySharp } = await import('./text-overlay-sharp');
  
  // Map format to dimensions
  const FORMAT_SPECS = {
    feed: { aspectRatio: '1:1' as const, width: 1080, height: 1080 },
    story: { aspectRatio: '9:16' as const, width: 1080, height: 1920 },
    reel: { aspectRatio: '9:16' as const, width: 1080, height: 1920 },
  };
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
        const basePrompt = await generateStyleAwarePrompt(
          designSystem,
          landingPageData,
          config.userDescription
        );
        
        // Enhance prompt with Gemini for better visual quality (background only, no text)
        const enhancedPrompt = await enhancePromptWithGemini(
          basePrompt + ' Create a professional advertising background without any text. The text will be added separately as an overlay.',
          {
            eyebrowText: headline.eyebrow,
            headlineText: headline.headline,
            ctaText: headline.cta,
            aspectRatio,
          }
        );
        
        console.log(`🎨 Creative ${index}: Using Gemini-enhanced prompt with SDXL`);
        
        // Step 1: Generate background image with SDXL (NO text in prompt)
        const formatSpec = FORMAT_SPECS[config.format];
        
        // Remove text instructions from prompt - SDXL should only generate background
        const backgroundPrompt = enhancedPrompt.replace(/text overlay.*$/gi, '').replace(/Text elements.*$/gi, '');
        
        const generatedImageUrl = await generateSDXLTextImage({
          prompt: backgroundPrompt + ' professional advertising background, no text, clean composition, space for text overlay',
          textElements: {
            eyebrow: headline.eyebrow,
            headline: headline.headline,
            cta: headline.cta,
          },
          width: formatSpec.width,
          height: formatSpec.height,
        });
        
        if (!generatedImageUrl) {
          throw new Error('SDXL image generation failed');
        }
        
        console.log(`✅ Background generated, adding text overlays...`);
        
        // Step 2: Download generated image
        const imageResponse = await fetch(generatedImageUrl);
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        
        // Step 3: Add text overlays using Sharp + SVG
        const imageWithText = await addTextOverlaySharp({
          imageBuffer,
          eyebrowText: headline.eyebrow,
          headlineText: headline.headline,
          ctaText: headline.cta,
          format: config.format,
        });
        
        // Step 3: Upload final creative to S3
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileKey = `creatives/batch-${config.format}-${index}-${randomSuffix}.png`;
        const result = await storagePut(fileKey, imageWithText, 'image/png');
        const finalUrl = result.url;
        console.log(`✅ Creative ${index} complete: SDXL background + Canvas text overlays`);
        
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
