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
  // Handle "all" format by generating feed and adapting to story/reel
  if (config.format === 'all') {
    return generateAllFormats(config);
  }
  const { extractDesignSystem, generateStyleAwarePrompt, generateHeadlineVariations } = await import('./creative-analyzer');
  const { getAdCreatives, extractImageUrl, extractLandingPageUrl, getCampaignAdSets, getAdSetAds } = await import('./meta-api');
  const { scrapeLandingPage } = await import('./landingpage-scraper');
  const { identifyWinningCreatives } = await import('./winning-creatives');
  const { generateImageWithImagen, buildLandingPageAwarePrompt } = await import('./_core/geminiImagen');
  const { renderCreativeWithBannerbear } = await import('./bannerbear');
  const { captureLandingPageScreenshot, analyzeLandingPageVisuals } = await import('./landingpage-screenshot');
  const { analyzeLandingPageForAdCopy } = await import('./landingpage-deep-analyzer');
  
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
    bodyText: null,
    error: undefined,
  };
  
  // Capture screenshot and analyze visuals with Gemini Vision
  let visualDescription = '';
  let deepAnalysis;
  if (landingPageUrl) {
    try {
      console.log(`📸 Capturing landing page screenshot: ${landingPageUrl}`);
      const screenshot = await captureLandingPageScreenshot(landingPageUrl);
      console.log(`🔍 Analyzing visuals with Gemini Vision...`);
      visualDescription = await analyzeLandingPageVisuals(screenshot.base64);
      console.log(`✅ Visual analysis complete: ${visualDescription.substring(0, 100)}...`);
      
      // Deep analysis for better ad copy
      console.log(`🧠 Performing deep landing page analysis...`);
      deepAnalysis = await analyzeLandingPageForAdCopy(landingPageUrl);
      console.log(`✅ Deep analysis complete`);
    } catch (error) {
      console.error(`⚠️ Screenshot analysis failed, falling back to text-only:`, error);
    }
  }
  
  // Generate headline variations with deep analysis
  const baseHeadline = landingPageData.h1 || landingPageData.title || 'Mehr Leads für dein Business';
  const headlines = await generateHeadlineVariations(baseHeadline, landingPageData, config.count, deepAnalysis);
  
  // Generate aspect ratio based on format
  const aspectRatio = FORMAT_SPECS[config.format].aspectRatio as '1:1' | '9:16';
  
  // Generate creatives in parallel
  const creatives = await Promise.all(
    headlines.map(async (headline, index) => {
      try {
        console.log(`🎨 Creative ${index}: Generating with Gemini Imagen`);
        
        // Step 1: Generate background image with Gemini Imagen
        const formatSpec = FORMAT_SPECS[config.format as Exclude<CreativeFormat, 'all'>];
        
        // Build landing-page-aware prompt for Gemini Imagen
        const landingPageContent = visualDescription || `
          Title: ${landingPageData.title || ''}
          Description: ${landingPageData.description || ''}
          H1: ${landingPageData.h1 || ''}
          H2: ${Array.isArray(landingPageData.h2) ? landingPageData.h2.join(', ') : landingPageData.h2 || ''}
          CTA: ${landingPageData.ctaText || ''}
        `.trim();
        
        const imagenPrompt = buildLandingPageAwarePrompt({
          landingPageContent,
          headline: headline.headline,
          designSystem,
          format: config.format as Exclude<CreativeFormat, 'all'>,
          eyebrowText: headline.eyebrow,
          ctaText: headline.cta,
        });
        
        // Generate background image with Gemini Imagen
        // Use winning creative as reference image for style consistency
        const imagenResults = await generateImageWithImagen({
          prompt: imagenPrompt,
          numberOfImages: 1,
          aspectRatio: formatSpec.aspectRatio,
          imageSize: '1K',
          // TODO: Enable reference images after GCS integration
          // referenceImages: imageUrl ? [imageUrl] : [], // Use winning creative as style reference
        });
        
        const generatedImageUrl = imagenResults[0].imageUrl;
        
        if (!generatedImageUrl) {
          throw new Error('SDXL image generation failed');
        }
        console.log(`✅ Background generated, rendering with Bannerbear...`);
        
        // Step 2: Render creative with text overlays using Bannerbear
        const bannerbearResult = await renderCreativeWithBannerbear({
          backgroundImageUrl: generatedImageUrl,
          eyebrowText: headline.eyebrow,
          headlineText: headline.headline,
          ctaText: headline.cta,
          format: config.format as 'feed' | 'story' | 'reel',
          designSystem,
        });
        
        const finalUrl = bannerbearResult.imageUrl;
        console.log(`✅ Bannerbear render complete: ${bannerbearResult.uid}`);
        console.log(`✅ Creative ${index} complete: Gemini background + Bannerbear text overlays`);
        
        // TODO: Save to database when user context is available
        // const { getDb } = await import('./db');
        // const { creatives } = await import('../drizzle/schema');
        // const database = await getDb();
        // if (database) {
        //   await database.insert(creatives).values({
        //     clientId: ctx.user.id,
        //     campaignId: config.campaignId,
        //     imageUrl: finalUrl,
        //     headline: headline.headline,
        //     eyebrowText: headline.eyebrow,
        //     ctaText: headline.cta,
        //     format: config.format as any,
        //     status: 'published',
        //   });
        // }
        
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

/**
 * Generate all formats: Feed once, then adapt to Story/Reel
 * Saves 66% API costs by avoiding 3x separate generation
 */
async function generateAllFormats(
  config: BatchGenerationConfig
): Promise<GeneratedCreative[]> {
  const { adaptFeedToVertical } = await import('./format-adapter');
  const { addTextOverlaySharp } = await import('./text-overlay-sharp');
  const { storagePut } = await import('./storage');
  
  // Step 1: Generate Feed creatives
  const feedConfig = { ...config, format: 'feed' as const };
  const feedCreatives = await generateBatchCreatives(feedConfig);
  
  // Step 2: Adapt each Feed creative to Story and Reel
  const allCreatives: GeneratedCreative[] = [...feedCreatives];
  
  for (const feedCreative of feedCreatives) {
    try {
      // Download Feed creative
      const feedResponse = await fetch(feedCreative.imageUrl);
      const feedBuffer = Buffer.from(await feedResponse.arrayBuffer());
      
      // Adapt to Story
      const storyBuffer = await adaptFeedToVertical({
        feedImageBuffer: feedBuffer,
        targetFormat: 'story',
      });
      
      // Adapt to Reel
      const reelBuffer = await adaptFeedToVertical({
        feedImageBuffer: feedBuffer,
        targetFormat: 'reel',
      });
      
      // Upload Story creative
      const storyKey = feedCreative.imageUrl.replace('feed', 'story').replace('.png', '-story.png');
      const storyResult = await storagePut(storyKey, storyBuffer, 'image/png');
      
      // Upload Reel creative
      const reelKey = feedCreative.imageUrl.replace('feed', 'reel').replace('.png', '-reel.png');
      const reelResult = await storagePut(reelKey, reelBuffer, 'image/png');
      
      allCreatives.push({
        ...feedCreative,
        imageUrl: storyResult.url,
        format: 'story',
      });
      
      allCreatives.push({
        ...feedCreative,
        imageUrl: reelResult.url,
        format: 'reel',
      });
    } catch (error) {
      console.error('Failed to adapt Feed creative:', error);
    }
  }
  
  return allCreatives;
}
