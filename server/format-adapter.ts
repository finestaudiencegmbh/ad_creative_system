/**
 * Format Adapter
 * 
 * Converts Feed (1:1) creatives to Story/Reel (9:16) formats
 * by resizing and repositioning with safe zones
 */

import { FORMAT_SPECS, type CreativeFormat, addTextOverlay } from './text-overlay';
import type { DesignSystem } from './creative-analyzer';

// Canvas is optional - gracefully handle if not available
let createCanvas: any;
let loadImage: any;

try {
  const canvas = require('canvas');
  createCanvas = canvas.createCanvas;
  loadImage = canvas.loadImage;
} catch (error) {
  console.warn('⚠️  Canvas module not available - format adaptation will be skipped');
}

export interface FormatAdaptationConfig {
  sourceImageUrl: string;
  targetFormat: 'story' | 'reel';
  textElements: {
    eyebrow?: string;
    headline: string;
    cta?: string;
  };
  designSystem: DesignSystem;
}

/**
 * Adapt Feed creative to Story/Reel format
 * 
 * Strategy:
 * 1. Load Feed image (1080x1080)
 * 2. Create new canvas with target dimensions (1080x1920)
 * 3. Fill background with blurred/extended version of Feed image
 * 4. Center the Feed image in the safe zone
 * 5. Add text overlays respecting Story/Reel safe zones
 */
export async function adaptFeedToVertical(
  config: FormatAdaptationConfig
): Promise<Buffer> {
  if (!createCanvas || !loadImage) {
    throw new Error('Canvas module not available - cannot adapt formats');
  }

  try {
    const { sourceImageUrl, targetFormat, textElements, designSystem } = config;
    
    // Load source Feed image
    const feedImage = await loadImage(sourceImageUrl);
    
    // Get target format specs
    const targetSpec = FORMAT_SPECS[targetFormat];
    
    // Create canvas with target dimensions
    const canvas = createCanvas(targetSpec.width, targetSpec.height);
    const ctx = canvas.getContext('2d');
    
    // Step 1: Create blurred background
    // Draw the Feed image scaled to fill entire vertical canvas
    ctx.filter = 'blur(40px) brightness(0.5)';
    ctx.drawImage(feedImage, 0, 0, targetSpec.width, targetSpec.height);
    ctx.filter = 'none';
    
    // Step 2: Calculate safe zone for Feed image placement
    const safeZoneTop = targetSpec.height * (targetSpec.safeZones.top / 100);
    const safeZoneBottom = targetSpec.height * (targetSpec.safeZones.bottom / 100);
    const availableHeight = targetSpec.height - safeZoneTop - safeZoneBottom;
    
    // Center the Feed image in the safe zone
    const feedImageSize = Math.min(targetSpec.width * 0.9, availableHeight * 0.6);
    const feedImageX = (targetSpec.width - feedImageSize) / 2;
    const feedImageY = safeZoneTop + (availableHeight - feedImageSize) / 2;
    
    // Draw Feed image centered in safe zone
    ctx.drawImage(feedImage, feedImageX, feedImageY, feedImageSize, feedImageSize);
    
    // Step 3: Add gradient overlays for better text contrast
    // Top gradient
    const topGradient = ctx.createLinearGradient(0, 0, 0, safeZoneTop + 100);
    topGradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    topGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = topGradient;
    ctx.fillRect(0, 0, targetSpec.width, safeZoneTop + 100);
    
    // Bottom gradient
    const bottomGradient = ctx.createLinearGradient(
      0,
      targetSpec.height - safeZoneBottom - 100,
      0,
      targetSpec.height
    );
    bottomGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    bottomGradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    ctx.fillStyle = bottomGradient;
    ctx.fillRect(0, targetSpec.height - safeZoneBottom - 100, targetSpec.width, safeZoneBottom + 100);
    
    // Return as buffer (text overlays will be added separately)
    return canvas.toBuffer('image/png');
  } catch (error) {
    console.error('Format adaptation error:', error);
    throw new Error(`Failed to adapt to ${config.targetFormat} format`);
  }
}

/**
 * Adapt Feed creative to all vertical formats
 */
export async function adaptFeedToAllFormats(
  feedImageUrl: string,
  textElements: {
    eyebrow?: string;
    headline: string;
    cta?: string;
  },
  designSystem: DesignSystem
): Promise<{
  story: Buffer;
  reel: Buffer;
}> {
  const [storyBuffer, reelBuffer] = await Promise.all([
    adaptFeedToVertical({
      sourceImageUrl: feedImageUrl,
      targetFormat: 'story',
      textElements,
      designSystem,
    }),
    adaptFeedToVertical({
      sourceImageUrl: feedImageUrl,
      targetFormat: 'reel',
      textElements,
      designSystem,
    }),
  ]);

  return {
    story: storyBuffer,
    reel: reelBuffer,
  };
}
