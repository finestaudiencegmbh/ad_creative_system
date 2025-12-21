/**
 * Batch Creative Generator V2 - 4-Step Workflow
 * 
 * Step 1: Deep Analysis (Landing Page + Winning Ads)
 * Step 2: Text Iterations (Claude)
 * Step 3: Visual Generation (Gemini Imagen)
 * Step 4: Format Adaptation (Safe Zones)
 */

import type { CreativeFormat } from './text-overlay';
import { performDeepAnalysis, extractLandingPageFullText, extractWinningAdsFullText } from './deep-analysis-claude';
import { generateTextIterations } from './text-iterations-claude';
import { generateVisual } from './visual-generation-gemini';
import { addTextOverlaySharp } from './text-overlay-sharp';
import { storagePut } from './storage';
import sharp from 'sharp';

export interface BatchCreativeConfig {
  campaignId: string;
  landingPageUrl: string;
  formats: CreativeFormat[];
  count: number;
}

export interface GeneratedCreative {
  format: CreativeFormat;
  imageUrl: string;
  texts: {
    preHeadline: string;
    headline: string;
    subHeadline?: string;
    cta: string;
  };
}

export async function generateBatchCreativesV2(
  config: BatchCreativeConfig
): Promise<GeneratedCreative[]> {
  console.log(`🚀 Starting 4-step creative generation for campaign ${config.campaignId}`);
  
  // ============================================
  // STEP 1: Deep Analysis
  // ============================================
  console.log(`📊 Step 1: Deep Analysis...`);
  
  const landingPageText = await extractLandingPageFullText(config.landingPageUrl);
  const winningAdsText = await extractWinningAdsFullText(config.campaignId);
  
  const analysis = await performDeepAnalysis(landingPageText, winningAdsText);
  
  console.log(`✅ Step 1 complete:`, {
    coreMessage: analysis.coreMessage,
    tone: analysis.tone,
    targetAudience: analysis.targetAudience,
  });
  
  // ============================================
  // STEP 2: Text Iterations
  // ============================================
  console.log(`✍️ Step 2: Text Iterations...`);
  
  const textIterations = await generateTextIterations(analysis, config.count);
  
  console.log(`✅ Step 2 complete: Generated ${textIterations.length} text variations`);
  
  // ============================================
  // STEP 3: Visual Generation
  // ============================================
  console.log(`🎨 Step 3: Visual Generation...`);
  
  // Generate ONE visual for the first text iteration
  const baseVisualUrl = await generateVisual(textIterations[0], analysis);
  
  console.log(`✅ Step 3 complete: Visual generated at ${baseVisualUrl}`);
  
  // ============================================
  // STEP 4: Format Adaptation
  // ============================================
  console.log(`🔄 Step 4: Format Adaptation...`);
  
  const results: GeneratedCreative[] = [];
  
  // Download base visual
  const visualResponse = await fetch(baseVisualUrl);
  const visualBuffer = Buffer.from(await visualResponse.arrayBuffer());
  
  // For each text iteration
  for (let i = 0; i < textIterations.length; i++) {
    const textIteration = textIterations[i];
    
    // For each format
    for (const format of config.formats) {
      console.log(`  Processing: Iteration ${i + 1}, Format ${format}`);
      
      // Adapt visual to format (resize + crop)
      const adaptedVisual = await adaptVisualToFormat(visualBuffer, format);
      
      // Add text overlays with safe zones
      const finalBuffer = await addTextOverlaySharp({
        imageBuffer: adaptedVisual,
        format,
        eyebrowText: textIteration.preHeadline,
        headlineText: textIteration.headline,
        ctaText: textIteration.cta,
        designSystem: {
          colorPalette: analysis.colorPalette.length > 0 ? analysis.colorPalette : ['#FFFFFF', '#00FF00', '#000000'],
        },
      });
      
      // Upload to S3
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileKey = `creatives/${config.campaignId}/${format}-${i}-${timestamp}-${randomSuffix}.png`;
      
      const { url } = await storagePut(fileKey, finalBuffer, 'image/png');
      
      results.push({
        format,
        imageUrl: url,
        texts: {
          preHeadline: textIteration.preHeadline,
          headline: textIteration.headline,
          subHeadline: textIteration.subHeadline,
          cta: textIteration.cta,
        },
      });
    }
  }
  
  console.log(`✅ Step 4 complete: Generated ${results.length} creatives`);
  
  return results;
}

async function adaptVisualToFormat(
  imageBuffer: Buffer,
  format: CreativeFormat
): Promise<Buffer> {
  const formatSpecs: Record<Exclude<CreativeFormat, 'all'>, { width: number; height: number }> = {
    feed: { width: 1080, height: 1080 },
    story: { width: 1080, height: 1920 },
    reel: { width: 1080, height: 1920 },
  };
  
  if (format === 'all') {
    throw new Error('Format "all" should not reach adaptVisualToFormat');
  }
  
  const spec = formatSpecs[format];
  
  // Resize and crop to format
  const adapted = await sharp(imageBuffer)
    .resize(spec.width, spec.height, {
      fit: 'cover',
      position: 'center',
    })
    .toBuffer();
  
  return adapted;
}
